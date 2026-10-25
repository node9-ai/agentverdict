// Refreshes sources/notinject/: the NotInject rows the converter builds cases
// from. Network access happens only here; conversion stays offline.
//
//   npm run sources:notinject
//
// NotInject (Li et al., "InjecGuard: Benchmarking and Mitigating Over-defense
// in Prompt Injection Guardrail Models", MIT) is 339 benign prompts, each
// built around one, two or three words that prompt-injection detectors tend
// to flag ("ignore", "bypass", "override" ...). It measures over-defense.
// Rows are read through the Hugging Face datasets-server API at the dataset
// revision recorded below; nothing is downloaded as an archive. The licence
// comes from the authors' code repository (the dataset card declares MIT).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const DATASET = 'leolee99/NotInject';
const SPLITS = ['NotInject_one', 'NotInject_two', 'NotInject_three'] as const;
const OUT = path.join(ROOT, 'sources', 'notinject');

interface Row {
  prompt: string;
  word_list: string[];
  category: string;
}

async function json(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

const meta = (await json(`https://huggingface.co/api/datasets/${DATASET}`)) as { sha: string; cardData?: { license?: string } };
const splits: Record<string, Array<{ index: number; prompt: string | { $join: string[] }; words: string[]; category: string }>> = {};
for (const split of SPLITS) {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = (await json(
      `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=default&split=${split}&offset=${offset}&length=100`
    )) as { rows: Array<{ row: Row }>; num_rows_total: number };
    rows.push(...page.rows.map((r) => r.row));
    if (rows.length >= page.num_rows_total || page.rows.length === 0) break;
  }
  splits[split] = rows.map((r, index) => ({ index, prompt: protect(r.prompt), words: r.word_list, category: r.category }));
}

const licence = Buffer.from(
  execFileSync('gh', ['api', 'repos/leolee99/PIGuard/license', '--jq', '.content'], { encoding: 'utf-8' }),
  'base64'
).toString('utf-8');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), licence);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      dataset: DATASET,
      revision: meta.sha,
      license: `${meta.cardData?.license ?? 'unknown'} (dataset card); licence text from github.com/leolee99/PIGuard, next to this file`,
      fetched_at: new Date().toISOString(),
      splits,
    },
    null,
    2
  ) + '\n'
);
for (const s of SPLITS) console.log(`${s}: ${splits[s].length} rows`);
