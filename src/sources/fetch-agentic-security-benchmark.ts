// Refreshes sources/agentic-security-benchmark/: the cases of Itay Glick's
// agentic-security-benchmark (MoorAI, Apache-2.0) that are tool calls an
// agent makes, at one pinned commit. Network access happens only here;
// conversion stays offline.
//
//   npm run sources:agentic-security-benchmark
//
// The corpora are written by hand to the AMTSO Guidelines for Testing of
// Agentic Security Products v1.0 (2 September 2026). The author ships a
// security product and grades it on these files, so the labels are
// classified `competitor` in suites.ts.
//
// The selection rule, fixed before any tool was measured on these cases
// (design 6.1.0, sections 3 and 4):
//   kept      every record of vector 4 (outbound action): each is a resolved
//             Claude Code tool call, or a chain of them; and the records of
//             vector 5 (memory, context, cross-agent) whose harness is
//             `steps`: an ordered list of writes and reads an agent makes.
//   left out  vector 5 records of the `text`, `events` and `session`
//             harnesses (content or event logs for the author's product, not
//             tool calls), and every other corpus (prompt text).
// Placeholders such as {{CRED_FILE}} stay as written; the converter resolves
// them (src/convert/agentic-security-benchmark.ts).

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import type { Joined } from '../types.ts';

const REPO = 'gitayg/agentic-security-benchmark';
const COMMIT = 'cbb38949dea26972311e27f6c93cc555399b4657';
const V4 = 'corpora/vector4-outbound-action.json';
const V5 = 'corpora/vector5-memory-crossagent.json';
const OUT = path.join(ROOT, 'sources', 'agentic-security-benchmark');

type Json = string | number | boolean | null | Joined | Json[] | { [k: string]: Json };

/** Every string leaf through protect(), so no credential-shaped value is written contiguously. */
function protectDeep(x: unknown): Json {
  if (typeof x === 'string') return protect(x);
  if (Array.isArray(x)) return x.map(protectDeep);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, protectDeep(v)]));
  return x as Json;
}

async function get(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.text();
}

const raw = (p: string) => get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${p}`);
const v4 = JSON.parse(await raw(V4)) as { attacks: Record<string, any>[]; benign: Record<string, any>[] };
const v5 = JSON.parse(await raw(V5)) as { attacks: Record<string, any>[]; benign: Record<string, any>[] };

const pickFields = (r: Record<string, any>, keys: string[]) => Object.fromEntries(keys.filter((k) => r[k] !== undefined).map((k) => [k, r[k]]));

const v4Rows = [...v4.attacks, ...v4.benign].map((r) => {
  if (typeof r.shouldDetect !== 'boolean') throw new Error(`${r.id}: no shouldDetect`);
  if (!r.action === !r.actions) throw new Error(`${r.id}: needs exactly one of action and actions`);
  return protectDeep(pickFields(r, ['id', 'family', 'subTechnique', 'shouldDetect', 'hard_negative', 'consumeAction', 'amtso', 'validity', 'action', 'actions']));
});
const v5Rows = [...v5.attacks, ...v5.benign]
  .filter((r) => r.harness === 'steps')
  .map((r) => {
    if (typeof r.shouldDetect !== 'boolean') throw new Error(`${r.id}: no shouldDetect`);
    return protectDeep(pickFields(r, ['id', 'family', 'subTechnique', 'shouldDetect', 'hard_negative', 'consumeStep', 'amtso', 'validity', 'steps']));
  });

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), await raw('LICENSE'));
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  (await raw('NOTICE')).trimEnd() +
    '\n\n---\n' +
    'Records in snapshot.json are from agentic-security-benchmark by Itay Glick,\n' +
    `https://github.com/${REPO}, commit ${COMMIT}, files ${V4} and ${V5},\n` +
    'licensed under the Apache License 2.0 (LICENSE next to this file). Changes: a\n' +
    'subset of records and fields (src/sources/fetch-agentic-security-benchmark.ts),\n' +
    'credential-shaped strings stored split into parts; records otherwise unchanged.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    { repo: REPO, commit: COMMIT, license: 'Apache-2.0', fetched_at: new Date().toISOString(), vector4: { file: V4, rows: v4Rows }, vector5: { file: V5, rows: v5Rows } },
    null,
    2
  ) + '\n'
);
console.log(`at ${COMMIT.slice(0, 12)}: vector 4 kept ${v4Rows.length}; vector 5 kept ${v5Rows.length} of ${v5.attacks.length + v5.benign.length} (steps harness)`);
