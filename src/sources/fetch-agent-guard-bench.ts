// Refreshes sources/agent-guard-bench/: a fixed sample of 600 rows of
// agent-guard-bench's blind_v20 set, at one pinned commit. Network access
// happens only here; conversion stays offline.
//
//   npm run sources:agent-guard-bench
//
// agent-guard-bench (Casey Rose, MIT) measures one failure class: a coding
// agent stages a whole worktree, disarms the git hooks, or destroys work that
// cannot be got back. blind_v20 holds 3,300 Bash commands written by nine
// outside AI models and labelled `stop` or `allow` by three Claude labelers
// against the author's three written policies (A, B, C), ties broken by three
// other models. The author builds a guard and measures it on this set, so the
// labels are classified `competitor` in suites.ts.
//
// The sample, fixed before any tool was measured on it: src/sources/agb-sample.ts.
//
//   npm run sources:agent-guard-bench -- --held-extra   (full build only)
//
// draws the held-out rows of corpus 7.0.0 in secret from the rows the sample
// did not take (src/sources/held-extra.ts) and leaves the sample untouched.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import { ALLOW, STOP_PER_POLICY, sampleRows, type AgbRow } from './agb-sample.ts';
import { drawSecret } from './selection-salt.ts';
import { HELD_EXTRA, checkPool, selectionSalt, wantsHeldExtra, writeHeldExtra } from './held-extra.ts';

const REPO = 'CASEY-OS/agent-guard-bench';
const COMMIT = '166e7ee6100990e4c59999b5601bc24319f683f3';
const FILE = 'docs/evidence/blind_v20/blind_v20_set.jsonl';
const OUT = path.join(ROOT, 'sources', 'agent-guard-bench');

async function get(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.text();
}

const rows = (await get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${FILE}`))
  .split('\n')
  .filter((l) => l.trim() !== '')
  .map((l) => JSON.parse(l) as AgbRow);
for (const r of rows) {
  if (!['stop', 'allow'].includes(r.expect)) throw new Error(`${r.id}: unknown label ${r.expect}`);
  if ((r.expect === 'stop') !== ['A', 'B', 'C'].includes(r.policy)) throw new Error(`${r.id}: label ${r.expect} with policy ${r.policy}`);
}

const toRow = (r: AgbRow) => ({ id: r.id, command: protect(r.command), expect: r.expect, policy: r.policy, class: r.class, src: r.src, src_id: r.src_id });

if (wantsHeldExtra()) {
  // The held-out draw: rows the sample did not take, by id or by command text.
  const salt = selectionSalt();
  const file = path.join(OUT, 'snapshot.json');
  const snap = JSON.parse(fs.readFileSync(file, 'utf-8')) as { rows: Array<{ id: string; command: unknown }> };
  const takenIds = new Set(snap.rows.map((r) => r.id));
  const takenCommands = new Set(rows.filter((r) => takenIds.has(r.id)).map((r) => r.command));
  const added: AgbRow[] = [];
  const pool: Record<string, number> = {};
  for (const label of ['stop', 'allow'] as const) {
    const free = rows.filter((r) => r.expect === label && !takenIds.has(r.id) && !takenCommands.has(r.command));
    pool[label] = free.length;
    checkPool('agent-guard-bench', label, free.length, HELD_EXTRA['agent-guard-bench'][label]);
    let got = 0;
    for (const r of drawSecret(free, (x) => x.id, free.length, salt, 'agent-guard-bench')) {
      if (got === HELD_EXTRA['agent-guard-bench'][label]) break;
      if (takenCommands.has(r.command)) continue;
      takenCommands.add(r.command);
      added.push(r);
      got++;
    }
    if (got < HELD_EXTRA['agent-guard-bench'][label]) throw new Error(`agent-guard-bench ${label}: ${got} distinct commands left, ${HELD_EXTRA['agent-guard-bench'][label]} wanted`);
  }
  snap.rows.push(...added.map(toRow));
  writeHeldExtra(
    'agent-guard-bench',
    file,
    snap,
    { rule: 'rows the sample did not take (by id or command text), per label, in sha256(selection salt:agent-guard-bench:id) order', drawn: { ...HELD_EXTRA['agent-guard-bench'] }, pool },
    added.map((r) => `agb.${r.id.toLowerCase()}`)
  );
  console.log(`held-out draw: ${added.length} rows (pool: ${pool.stop} stop, ${pool.allow} allow)`);
  process.exit(0);
}

const picked = sampleRows(rows);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), await get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/LICENSE`));
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  'Rows in snapshot.json are from agent-guard-bench by Casey Rose,\n' +
    `https://github.com/${REPO}, commit ${COMMIT}, file ${FILE},\n` +
    'licensed under the MIT License (LICENSE next to this file). Changes: a fixed\n' +
    'sample of 600 of the 3,300 rows (src/sources/fetch-agent-guard-bench.ts),\n' +
    'credential-shaped strings stored split into parts; rows otherwise unchanged.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      repo: REPO,
      commit: COMMIT,
      file: FILE,
      license: 'MIT',
      fetched_at: new Date().toISOString(),
      sample: `${STOP_PER_POLICY} stop rows per policy and ${ALLOW} allow rows of ${rows.length}, by class in proportion, in sha256("agb:" + id) order, one row per command`,
      rows: picked.map(toRow),
    },
    null,
    2
  ) + '\n'
);
console.log(`read ${rows.length} rows at ${COMMIT.slice(0, 12)}: kept ${picked.length} (${picked.filter((r) => r.expect === 'stop').length} stop, ${picked.filter((r) => r.expect === 'allow').length} allow)`);
