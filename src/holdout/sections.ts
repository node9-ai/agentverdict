// Where every case comes from: the snapshot sections under sources/, and the
// group of each row. This is the knowledge the holdout cut needs (src/holdout/
// cut.ts): a row whose group is held out is removed, and because no case
// depends on another row being present (the 6.0.0 rule, CHANGELOG), what is
// left converts to exactly the public cases. The cut-invariance check
// (npm run holdout:check) proves that against the converters, so a formula
// here that drifts from its converter fails the check instead of leaking.
//
// Metadata that counts or lists rows (offsets, kept, left_out, counts) is
// recomputed or dropped by the cut; lookup tables the cases share (AgentDojo's
// tasks, templates and goals, calls.json whole; CredData's repository list) stay whole, except
// that a CredData repository with no line left is dropped from the list.

import { slug } from '../convert/record.ts';

type Json = Record<string, unknown>;

/** One list of rows inside a snapshot file, and the group of each row. */
export interface Section {
  /** Path under sources/. */
  file: string;
  /** Path of the list inside the JSON, dot-separated; `*` walks every key of an object. */
  list: string;
  group: (row: Json, pathKeys: string[]) => string;
}

const ecoSlug = (e: string) => slug(e.replace('VSCode:https://open-vsx.org', 'open-vsx'));
const str = (v: unknown) => String(v);

export const SECTIONS: Section[] = [
  { file: 'agentdojo/snapshot.json', list: 'suites.*.vectors', group: (r, k) => `agentdojo.${k[1]}.${str(r.id)}` },
  { file: 'notinject/snapshot.json', list: 'splits.*', group: (r, k) => `notinject.${k[1]}.${str(r.index)}` },
  { file: 'injecagent/snapshot.json', list: 'cases', group: (r) => `injecagent.${str(r.type)}.${str(r.position)}` },
  { file: 'browsesafe/snapshot.json', list: 'pages', group: (r) => `browsesafe.${str(r.index)}` },
  { file: 'nemotron-pii/snapshot.json', list: 'block', group: (r) => `nemotron-pii.${str(r.uid)}` },
  { file: 'nemotron-pii/snapshot.json', list: 'allow', group: (r) => `nemotron-pii.${str(r.uid)}` },
  ...['gretel-pii-finance', 'openpii', 'pii-trace'].flatMap((set): Section[] => [
    { file: `${set}/snapshot.json`, list: 'block', group: (r) => `${set}.${str(r.uid)}` },
    { file: `${set}/snapshot.json`, list: 'allow', group: (r) => `${set}.${str(r.uid)}` },
  ]),
  { file: 'creddata/snapshot.json', list: 'block', group: (r) => `creddata.${str(r.repo)}.${str(r.file_id)}` },
  { file: 'creddata/snapshot.json', list: 'allow', group: (r) => `creddata.${str(r.repo)}.${str(r.file_id)}` },
  { file: 'redcode-exec/snapshot.json', list: 'scripts', group: (r) => `redcode-exec.${str(r.index)}` },
  { file: 'nl2sh-alfa/snapshot.json', list: 'rows', group: (r) => `nl2sh-alfa.${str(r.index)}` },
  { file: 'benign-scripts/snapshot.json', list: 'python.rows', group: (r) => `benign-scripts.py.${str(r.task_id)}` },
  { file: 'benign-scripts/snapshot.json', list: 'bash.scripts', group: (r) => `benign-scripts.sh.${str(r.slug)}` },
  { file: 'agent-egress-bench/snapshot.json', list: 'cases', group: (r) => `aeb.${str(r.id)}` },
  ...['malicious', 'typosquats', 'compromised', 'benign'].map(
    (list): Section => ({ file: 'packages.json', list, group: (r) => `package.${str(r.ecosystem).toLowerCase()}.${slug(str(r.name))}` })
  ),
  { file: 'osv-other-ecosystems/snapshot.json', list: 'records', group: (r) => `osv-other-ecosystems.${ecoSlug(str(r.ecosystem))}.${slug(str(r.name))}` },
  { file: 'datadog-packages/snapshot.json', list: 'packages', group: (r) => `datadog-packages.${ecoSlug(str(r.ecosystem))}.${slug(str(r.name))}` },
  { file: 'typomind/snapshot.json', list: 'typosquats', group: (r) => `typomind.${ecoSlug(str(r.ecosystem))}.${slug(str(r.name))}` },
  { file: 'packages-benign-more/snapshot.json', list: 'packages', group: (r) => `package-more.${ecoSlug(str(r.ecosystem))}.${slug(str(r.name))}` },
  { file: 'popular-packages/snapshot.json', list: 'packages', group: (r) => `popular-packages.${str(r.ecosystem).toLowerCase()}.${slug(str(r.name))}` },
  ...['legit', 'gauntlet', 'egress', 'dlp', 'injection', 'tokens', 'exposure', 'system-ops'].map(
    (name): Section => ({ file: `node9-bench/${name}.json`, list: 'rows', group: (r) => str(r.group) })
  ),
  { file: 'node9-bench/dlp.json', list: 'canaries', group: (r) => str(r.group) },
  { file: 'node9-bench/egress.json', list: 'deny_profiles', group: (r) => str(r.group) },
];

/**
 * Keys that count or list rows and would betray a cut; removed from the
 * public copy of the file (none is read by a converter).
 */
export const DROPPED_KEYS: Record<string, string[]> = {
  'nemotron-pii/snapshot.json': ['offsets'],
  'gretel-pii-finance/snapshot.json': ['offsets'],
  'openpii/snapshot.json': ['offsets'],
  'pii-trace/snapshot.json': ['offsets'],
  'agent-egress-bench/snapshot.json': ['kept', 'left_out'],
  'injecagent/snapshot.json': ['sample'],
  'osv-other-ecosystems/snapshot.json': ['counts'],
  'datadog-packages/snapshot.json': ['counts'],
  'typomind/snapshot.json': ['counts'],
  'packages.json': ['compromised_dropped', 'typosquats_dropped'],
};

/** Files under sources/ that are not row data and are copied whole. */
export const COPIED_WHOLE = ['LICENSE', 'NOTICE', 'REPOSITORY-NOTICES.md', 'repositories.tsv', 'value-spans.json', 'readable.json', 'pin.json', 'calls.json'];
