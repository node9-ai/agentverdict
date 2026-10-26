// Corpus checks, run before every commit that touches corpus/ or profiles/.
//
//   1. Structure: required fields, known enums, unique ids, profiles exist,
//      the private flag agrees with the group's hash.
//   2. Hygiene: no committed line carries a contiguous credential- or
//      card-shaped value. Every raw line of corpus/ and profiles/ is run
//      through the pinned engine's own detectors; a hit means a value escaped
//      the {"$join": [...]} convention.
//   3. Materialisation: every record assembles, and no {{...}} placeholder
//      survives it.
//   4. Versioning: the corpus hash equals the one pinned in
//      corpus-version.json, so no change ships without a version decision.
//      With the holdout present (holdout/salt) both pinned hashes are
//      checked; without it, every case must be public and the public hash
//      is checked.
//   5. Label origin: every source says who wrote its labels (LABELS in
//      suites.ts), so none reaches the comparison score by default, and every
//      outside source says whether its labels are its own or AgentVerdict's
//      mapping (LABEL_RULES).
//   6. One call, one case: no two cases present the same call (src/dedupe.ts),
//      and no copies of one call carry different labels.
//   7. Sets: every case's set, section and reason are what the rules in
//      src/scope/ give it, so no case moves between sets by hand.

import fs from 'node:fs';
import path from 'node:path';
import { sensitive } from './hygiene.ts';
import { CORPUS_DIR, PROFILES_DIR, ROOT, checkRecords, corpusHash, loadCorpus, loadProfiles, publicCorpusHash, readCorpusVersion } from './corpus.ts';
import { hasHoldout } from './split.ts';
import { materialize } from './template.ts';
import { labelRuleOf, labelsOf } from './suites.ts';
import { findDuplicates } from './dedupe.ts';
import { scopeProblems } from './scope/rules.ts';

const problems: string[] = [];
const records = loadCorpus();
const profiles = loadProfiles();
problems.push(...checkRecords(records, profiles));

// Config snapshots, committed results and fetched sources are scanned too: a
// tool's reason string, a snapshot or an advisory text could carry a value
// back into the repository.
const scanned: string[] = [];
const walk = (dir: string): void => {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    // annotation/page/ is generated with case content and git-ignored; it is never committed.
    if (f.isDirectory() && p === path.join(ROOT, 'annotation', 'page')) continue;
    if (f.isDirectory()) walk(p);
    else if (/\.(jsonl?|md|html)$/.test(f.name)) scanned.push(p);
  }
};
for (const d of [CORPUS_DIR, PROFILES_DIR, ...['configs', 'results', 'sources', 'viewer', 'annotation'].map((x) => path.join(ROOT, x))]) walk(d);
{
  for (const file of scanned.sort()) {
    const f = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    lines.forEach((line, i) => {
      const hit = sensitive(line);
      if (hit) problems.push(`${f}:${i + 1}: contiguous ${hit}`);
    });
  }
}

const env = { home: '/tmp/bench-home', cwd: '/tmp/bench-home/project' };
for (const r of records) {
  // The payload and prior calls are built here, so any {{NAME}} left in them
  // is a converter's mistake. A tool's output holds outside content as is (a
  // templated web page can carry {{TITLE}}), so there only this corpus's own
  // placeholders, or a near miss of one, count.
  const built = JSON.stringify([materialize(r.input, env), materialize(r.prior as never, env)]);
  const output = JSON.stringify(materialize(r.output, env));
  if (/\{\{[A-Z]+\}\}/.test(built) || /\{\{(HOME|CWD)[A-Z]*\}\}/.test(output))
    problems.push(`case ${r.id}: placeholder survives materialisation`);
}

for (const src of new Set(records.map((r) => r.source))) {
  if (!labelsOf(src)) problems.push(`source ${src}: no label origin in LABELS (src/suites.ts); mark it outside, node9 or competitor`);
  if (labelsOf(src) === 'outside' && !labelRuleOf(src))
    problems.push(`source ${src}: no entry in LABEL_RULES (src/suites.ts); say whether its labels are the source's own or AgentVerdict's mapping`);
}

for (const d of findDuplicates(records)) {
  const ids = [d.kept, ...d.dropped].map((r) => (d.conflict ? `${r.id}=${r.expected}` : r.id)).join(', ');
  problems.push(`${d.conflict ? 'label conflict' : 'duplicate call'}: ${ids}`);
}

for (const r of records) problems.push(...scopeProblems(r));

const pinned = readCorpusVersion();
const moved =
  `corpus or profiles changed since v${pinned.version}: choose the next version by the rules in README (Versioning) ` +
  'and run npm run corpus:lock -- <version>';
if (hasHoldout()) {
  if (corpusHash() !== pinned.sha256) problems.push(moved);
  if (publicCorpusHash() !== pinned.public_sha256) problems.push(`public cases changed since v${pinned.version}: ${moved}`);
} else {
  const held = records.filter((r) => r.private).length;
  if (held > 0) problems.push(`${held} case(s) are private, but this checkout has no holdout (no holdout/salt): a public checkout holds public cases only`);
  if (publicCorpusHash() !== pinned.public_sha256) problems.push(moved);
}

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  console.error(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: ${records.length} cases, ${profiles.size} profiles`);
