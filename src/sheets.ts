// The tables the founder's spreadsheets show, computed from the corpus so no
// number in them is typed by hand: one row per source (who wrote the labels,
// the label rule, licence, upstream, cases by verdict and split, set
// membership) and one row per source of the quick set.
//
//   npm run sheets [-- <run> ...] [--out docs/sheets] [--json]
//
// Writes docs/sheets/sources-<version>.csv and docs/sheets/quick-<version>.csv
// (committed, so the spreadsheet can be checked against the corpus); with
// runs (as in report), also results-<version>.csv: per source, each run's
// attacks and benign cases stopped, public and holdout apart. --json prints
// the same rows for a push to the spreadsheet.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, readCorpusVersion, readJsonl } from './corpus.ts';
import { quickSet } from './quick.ts';
import { labelRuleOf, labelsOf } from './suites.ts';
import { resolveRun } from './compare.ts';
import type { BenchRecord, CaseResult } from './types.ts';

const count = (rows: BenchRecord[], f: (r: BenchRecord) => boolean) => rows.filter(f).length;
const uniq = (xs: string[]) => [...new Set(xs)].sort().join('; ');

export const SOURCE_COLUMNS = [
  'source', 'channels', 'labels by', 'label rule', 'licence', 'upstream', 'cases', 'block', 'review', 'allow', 'holdout',
  'headline', 'vendor', 'extended', 'extended reason', 'profiles',
] as const;

export function sourceRows(records: BenchRecord[]): Array<Record<(typeof SOURCE_COLUMNS)[number], string | number>> {
  const sources = [...new Set(records.map((r) => r.source))].sort();
  return sources.map((source) => {
    const rows = records.filter((r) => r.source === source);
    const rule = labelRuleOf(source);
    return {
      source,
      channels: uniq(rows.map((r) => r.channel)),
      'labels by': labelsOf(source) ?? 'unknown',
      'label rule': rule ? (rule.rule === 'source' ? "the source's own" : 'mapped by AgentVerdict') : 'AgentVerdict',
      licence: uniq(rows.map((r) => r.license)),
      // The part of the source reference before the first space or colon: the repository or dataset and its pinned revision.
      upstream: uniq(rows.map((r) => r.source_ref.split(/[ :]/)[0])),
      cases: rows.length,
      block: count(rows, (r) => r.expected === 'block'),
      review: count(rows, (r) => r.expected === 'review'),
      allow: count(rows, (r) => r.expected === 'allow'),
      holdout: count(rows, (r) => r.private),
      headline: count(rows, (r) => r.section === 'headline'),
      vendor: count(rows, (r) => r.section === 'vendor'),
      extended: count(rows, (r) => r.set === 'extended'),
      'extended reason': uniq(rows.map((r) => r.extended_reason ?? '').filter(Boolean)),
      profiles: uniq(rows.map((r) => r.setup)),
    };
  });
}

export const QUICK_COLUMNS = ['source', 'channels', 'quick attacks', 'quick benign', 'quick total', 'official public cases', 'share', 'in the headline'] as const;

export function quickRows(records: BenchRecord[]): Array<Record<(typeof QUICK_COLUMNS)[number], string | number>> {
  const quick = quickSet(records);
  const sources = [...new Set(records.filter((r) => quick.has(r.id)).map((r) => r.source))].sort();
  return sources.map((source) => {
    const rows = records.filter((r) => r.source === source);
    const q = rows.filter((r) => quick.has(r.id));
    const pub = count(rows, (r) => !r.private && r.set === 'official');
    return {
      source,
      channels: uniq(rows.map((r) => r.channel)),
      'quick attacks': count(q, (r) => r.expected !== 'allow'),
      'quick benign': count(q, (r) => r.expected === 'allow'),
      'quick total': q.length,
      'official public cases': pub,
      share: pub === 0 ? '' : `${Math.round((100 * q.length) / pub)}%`,
      'in the headline': rows.some((r) => r.section === 'headline') ? 'yes' : 'no',
    };
  });
}

export interface SheetRun {
  label: string;
  cases: CaseResult[];
}

/**
 * One row per source and set, then for each run and each split, attacks
 * stopped over attacks measured and benign cases stopped over benign cases
 * measured ("x/y"; "-" when the source has none; unreachable and errored
 * cases are not measured). The same counting as the report's cells.
 */
export function resultRows(records: BenchRecord[], runs: SheetRun[]): { columns: string[]; rows: Array<Array<string | number>> } {
  const splits = [['public', false], ['holdout', true]] as const;
  const columns = ['source', 'set', 'labels by'];
  for (const run of runs) for (const [split] of splits) columns.push(`${run.label}, ${split}: attacks stopped`, `${run.label}, ${split}: benign stopped`);
  // One row per source and set, so a source split between the official and
  // the extended set (CredData, the PII sources) never mixes the two.
  const setOf = (r: BenchRecord) => (r.set === 'official' ? `official ${r.section}` : `extended (${r.extended_reason})`);
  const groups = new Map<string, BenchRecord[]>();
  for (const r of records) {
    const k = `${r.source}\u0000${setOf(r)}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const results = runs.map((run) => new Map(run.cases.map((c) => [c.id, c])));
  const stopped = (v: CaseResult['actual']) => v === 'review' || v === 'block';
  const rows: Array<Array<string | number>> = [];
  for (const key of [...groups.keys()].sort()) {
    const recs = groups.get(key)!;
    const [source, set] = key.split('\u0000');
    const row: Array<string | number> = [source, set, labelsOf(source) ?? 'unknown'];
    for (const res of results)
      for (const [, held] of splits)
        for (const attacks of [true, false]) {
          const kind = recs.filter((r) => r.private === held && (r.expected !== 'allow') === attacks);
          const measured = kind.map((r) => res.get(r.id)).filter((c): c is CaseResult => c !== undefined && c.actual !== 'unreachable' && c.actual !== 'error');
          row.push(kind.length === 0 ? '-' : measured.length === 0 ? 'not measured' : `${measured.filter((c) => stopped(c.actual)).length}/${measured.length}`);
        }
    rows.push(row);
  }
  return { columns, rows };
}

const csv = (columns: readonly string[], rows: Array<Record<string, string | number>>) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n') + '\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' }, json: { type: 'boolean', default: false } } });
  const version = readCorpusVersion().version;
  const records = loadCorpus();
  const s = sourceRows(records);
  const q = quickRows(records);
  const dir = values.out ?? path.join(ROOT, 'docs', 'sheets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `sources-${version}.csv`), csv(SOURCE_COLUMNS, s));
  fs.writeFileSync(path.join(dir, `quick-${version}.csv`), csv(QUICK_COLUMNS, q));
  // Runs given as arguments (as in report: node9-gate/2.35.0 ...) add a results table.
  const runs: SheetRun[] = positionals.map((spec) => {
    const dir = resolveRun(spec);
    const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as { adapter: string; tool_version: string; corpus_version: string };
    if (summary.corpus_version !== version) throw new Error(`${spec} was measured on corpus ${summary.corpus_version}, not ${version}`);
    return { label: `${summary.adapter} ${summary.tool_version}`, cases: readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')) };
  });
  const res = runs.length > 0 ? resultRows(records, runs) : undefined;
  if (res) fs.writeFileSync(path.join(dir, `results-${version}.csv`), [res.columns.join(','), ...res.rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n') + '\n');
  if (values.json) console.log(JSON.stringify({ version, sources: s.map((r) => SOURCE_COLUMNS.map((c) => r[c])), quick: q.map((r) => QUICK_COLUMNS.map((c) => r[c])), ...(res ? { results: [res.columns, ...res.rows] } : {}) }));
  else console.log(`${s.length} source rows, ${q.length} quick-set rows -> ${path.relative(ROOT, dir)}/`);
}
