// Refreshes sources/benign-scripts/: ordinary programs from two outside
// sources, the benign counterpart of RedCode-Exec in the same form (a whole
// script in one call), so the inline-code rule pays its false-positive cost
// and the shell sources stop differing by form. Network access happens only
// here; conversion stays offline.
//
//   npm run sources:benign-scripts
//
// Python: MBPP (Google, "Program Synthesis with Large Language Models",
// Austin et al. 2021; CC BY 4.0), the test split of the full configuration,
// every row: the reference solution followed by its test assertions, which
// is the program a developer runs to check it. Read through the Hugging Face
// datasets-server rows API at the pinned revision.
//
// Bash: the Exercism Bash track (github.com/exercism/bash, MIT), the example
// solution of every practice exercise (exercises/practice/<slug>/.meta/
// example.sh) at the pinned commit: short, complete scripts a learner would
// run. Nothing is sampled: both sources are used whole, by rule.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const MBPP = 'google-research-datasets/mbpp';
const MBPP_REVISION = '4bb6404fdc6cacfda99d4ac4205087b89d32030c';
const MBPP_CONFIG = 'full';
const MBPP_SPLIT = 'test';
const EXERCISM = 'exercism/bash';
const EXERCISM_COMMIT = '9567ba5df7ad89981131f8beded771e23b0cdef2';
const OUT = path.join(ROOT, 'sources', 'benign-scripts');
const PAGE = 100;

const UA = { 'user-agent': 'node9-bench (https://github.com/node9-ai/node9-bench)' };
async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return (await res.json()) as T;
}
async function text(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return await res.text();
}
const gh = (args: string[]) => execFileSync('gh', ['api', ...args], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });

interface MbppRow {
  task_id: number;
  text: string;
  code: string;
  test_list: string[];
  test_setup_code: string;
}

async function mbpp(): Promise<Array<{ task_id: number; code: unknown; tests: unknown; setup: unknown; task: unknown }>> {
  const meta = await json<{ sha: string }>(`https://huggingface.co/api/datasets/${MBPP}`);
  if (meta.sha !== MBPP_REVISION) console.log(`note: ${MBPP} is now at ${meta.sha}; the pinned revision is ${MBPP_REVISION}`);
  const size = await json<{ size: { splits: Array<{ config: string; split: string; num_rows: number }> } }>(
    `https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(MBPP)}`
  );
  const total = size.size.splits.find((s) => s.config === MBPP_CONFIG && s.split === MBPP_SPLIT)!.num_rows;
  const rows: MbppRow[] = [];
  for (let offset = 0; offset < total; offset += PAGE) {
    const page = await json<{ rows: Array<{ row: MbppRow }> }>(
      `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(MBPP)}&config=${MBPP_CONFIG}&split=${MBPP_SPLIT}&offset=${offset}&length=${PAGE}`
    );
    rows.push(...page.rows.map((r) => r.row));
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (rows.length !== total) throw new Error(`mbpp: read ${rows.length} of ${total} rows`);
  return rows
    .sort((a, b) => a.task_id - b.task_id)
    .map((r) => ({ task_id: r.task_id, task: protect(r.text), code: protect(r.code), tests: r.test_list.map(protect), setup: protect(r.test_setup_code ?? '') }));
}

async function exercism(): Promise<{ license: string; scripts: Array<{ slug: string; script: unknown }> }> {
  const entries = JSON.parse(gh([`repos/${EXERCISM}/contents/exercises/practice?ref=${EXERCISM_COMMIT}`])) as Array<{ name: string; type: string }>;
  const scripts: Array<{ slug: string; script: unknown }> = [];
  for (const e of entries.filter((x) => x.type === 'dir').sort((a, b) => a.name.localeCompare(b.name))) {
    const res = await fetch(`https://raw.githubusercontent.com/${EXERCISM}/${EXERCISM_COMMIT}/exercises/practice/${e.name}/.meta/example.sh`, { headers: UA });
    if (res.status === 404) {
      console.log(`  ${e.name}: no .meta/example.sh, left out`);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} for ${e.name}`);
    scripts.push({ slug: e.name, script: protect(await res.text()) });
  }
  const license = await text(`https://raw.githubusercontent.com/${EXERCISM}/${EXERCISM_COMMIT}/LICENSE`);
  return { license, scripts };
}

const py = await mbpp();
const sh = await exercism();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), sh.license);
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  'Python programs in snapshot.json are from MBPP (Mostly Basic Python Problems),\n' +
    'https://huggingface.co/datasets/google-research-datasets/mbpp, by Google Research\n' +
    '(Austin et al., "Program Synthesis with Large Language Models", 2021), licensed\n' +
    'under the Creative Commons Attribution 4.0 International License\n' +
    '(https://creativecommons.org/licenses/by/4.0/).\n' +
    'Changes: the test split of the full configuration, every row; each reference\n' +
    'solution is followed by its test assertions in one script.\n' +
    '\n' +
    'Bash scripts in snapshot.json are the example solutions of the Exercism Bash\n' +
    'track, https://github.com/exercism/bash, licensed under the MIT License\n' +
    '(LICENSE next to this file). Changes: none to the scripts.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      python: { dataset: MBPP, revision: MBPP_REVISION, config: MBPP_CONFIG, split: MBPP_SPLIT, license: 'CC-BY-4.0 (NOTICE next to this file)', rule: 'every row of the split', rows: py },
      bash: { repo: EXERCISM, commit: EXERCISM_COMMIT, license: 'MIT (LICENSE next to this file)', rule: 'the .meta/example.sh of every practice exercise', scripts: sh.scripts },
      fetched_at: new Date().toISOString(),
    },
    null,
    1
  ) + '\n'
);
console.log(`python ${py.length} programs, bash ${sh.scripts.length} scripts`);
