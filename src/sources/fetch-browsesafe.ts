// Refreshes sources/browsesafe/: the web pages the converter builds cases
// from. Network access happens only here; conversion stays offline.
//
//   npm run sources:browsesafe
//
// BrowseSafe-Bench (Perplexity, MIT) is 14,719 HTML pages, each labelled by
// whether it carries a prompt injection aimed at a browsing agent ("yes") or
// not ("no"), close to balanced. Only the test split (3,680 pages) is read,
// through the Hugging Face datasets-server rows API at the revision below; no
// archive is downloaded.
//
// Sample, fixed before measuring: rows are visited in the order of a salted
// hash of their index, and the first PER_LABEL pages of each label are kept.
// Pages are kept whole (median 46 KB), which is why the sample is small.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const DATASET = 'perplexity-ai/browsesafe-bench';
const REVISION = 'b506fb5bc7fd4472c8738055a67a0ef6406afdc9';
const SPLIT = 'test';
const PER_LABEL = 300;
const SALT = 'node9-bench:browsesafe:v1';
const OUT = path.join(ROOT, 'sources', 'browsesafe');

async function json(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    // 429 (rate limit) and 5xx are retried with a growing pause.
    if (attempt >= 6 || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
}

const meta = (await json(`https://huggingface.co/api/datasets/${DATASET}`)) as { sha: string };
if (meta.sha !== REVISION) console.log(`note: the dataset is now at ${meta.sha}; the pinned revision is ${REVISION}`);
const total = (
  (await json(`https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(DATASET)}`)) as {
    size: { splits: Array<{ split: string; num_rows: number }> };
  }
).size.splits.find((s) => s.split === SPLIT)!.num_rows;

const rank = (i: number) => createHash('sha256').update(`${SALT}:${i}`).digest('hex');
const order = Array.from({ length: total }, (_, i) => i).sort((a, b) => (rank(a) < rank(b) ? -1 : 1));

const kept: Record<'yes' | 'no', Array<{ index: number; content: string | { $join: string[] } }>> = { yes: [], no: [] };
let visited = 0;
for (const index of order) {
  if (kept.yes.length >= PER_LABEL && kept.no.length >= PER_LABEL) break;
  const page = (await json(
    `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=default&split=${SPLIT}&offset=${index}&length=1`
  )) as { rows: Array<{ row: { content: string; label: string } }> };
  visited++;
  await new Promise((r) => setTimeout(r, 1000));
  const row = page.rows[0]?.row;
  if (!row) throw new Error(`browsesafe: no row at ${index}`);
  if (row.label !== 'yes' && row.label !== 'no') throw new Error(`browsesafe: label "${row.label}" at ${index}`);
  if (kept[row.label].length < PER_LABEL) kept[row.label].push({ index, content: protect(row.content) });
}

const licence = await fetch(`https://huggingface.co/datasets/${DATASET}/resolve/${REVISION}/LICENSE`);
if (!licence.ok) throw new Error(`${licence.status} for LICENSE`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), await licence.text());
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      dataset: DATASET,
      revision: REVISION,
      split: SPLIT,
      license: 'MIT (LICENSE next to this file)',
      sample: `first ${PER_LABEL} pages per label in sha256("${SALT}:<index>") order`,
      fetched_at: new Date().toISOString(),
      pages: [...kept.yes.map((p) => ({ ...p, label: 'yes' })), ...kept.no.map((p) => ({ ...p, label: 'no' }))].sort((a, b) => a.index - b.index),
    },
    null,
    1
  ) + '\n'
);
console.log(`visited ${visited} of ${total} rows; kept ${kept.yes.length} yes, ${kept.no.length} no`);
