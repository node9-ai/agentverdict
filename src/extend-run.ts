// Extends a finished run to a newer corpus version without running again the
// cases it already answered (design: holdout root fix, section 6). Corpus
// 7.0.0 keeps every 6.1.1 case and only adds new held-out ones; a tool whose
// version and adapter are unchanged gives the same answer on the same call,
// so its 6.1.1 answers are carried and only the new cases run.
//
//   npm run extend-run -- --from <run dir> --previous-corpus <corpus dir> --adapter <name> [--out <dir>]
//
// <run dir>          the earlier run (cases.jsonl, summary.json), both splits
// <corpus dir>       the corpus that run was measured on (its corpus/*.jsonl,
//                    holdout included), kept aside before the sync
//
// Refuses: another adapter or tool version than the earlier run; a carried
// case whose record differs from the one measured in anything but `private`
// (the side of the split, which 7.0.0 moves). The summary says which cases
// were carried, from which run and date, and which ran now (`parts`).

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, loadProfiles, readJsonl } from './corpus.ts';
import { toMarkdown, type Summary } from './score.ts';
import { buildSummary, makeAdapter, resultBase, resultsDir, retryTransient, runCases, writeResults } from './runner.ts';
import type { Adapter } from './adapter.ts';
import type { BenchRecord, CaseResult, Profile } from './types.ts';

/** A record as measured, with the side of the split left out. */
const sansSide = (r: BenchRecord) => JSON.stringify({ ...r, private: undefined });

export interface Plan {
  /** Carried results, rebuilt on the current record (its side of the split, set, section). */
  carried: Map<string, CaseResult>;
  /** Cases with no earlier answer. */
  toRun: BenchRecord[];
}

/** Which cases carry an earlier answer and which must run; throws on a case that changed. */
export function planExtension(
  adapter: Pick<Adapter, 'name' | 'toolVersion'>,
  records: BenchRecord[],
  previousRecords: Map<string, BenchRecord>,
  previousResults: Map<string, CaseResult>
): Plan {
  const carried = new Map<string, CaseResult>();
  const toRun: BenchRecord[] = [];
  const changed: string[] = [];
  for (const r of records) {
    const before = previousRecords.get(r.id);
    const answer = previousResults.get(r.id);
    if (!before || !answer) {
      toRun.push(r);
      continue;
    }
    if (answer.adapter !== adapter.name || answer.tool_version !== adapter.toolVersion) {
      throw new Error(`${r.id}: the earlier answer is from ${answer.adapter} ${answer.tool_version}, not ${adapter.name} ${adapter.toolVersion}`);
    }
    if (sansSide(before) !== sansSide(r)) {
      changed.push(r.id);
      continue;
    }
    carried.set(r.id, {
      ...resultBase(adapter, r),
      actual: answer.actual,
      latency_ms: answer.latency_ms,
      ...(answer.detail !== undefined ? { detail: answer.detail } : {}),
      ...(answer.transient !== undefined ? { transient: answer.transient } : {}),
    });
  }
  if (changed.length > 0) throw new Error(`${changed.length} case(s) changed since the earlier run, so their answers cannot be carried: ${changed.slice(0, 5).join(', ')}`);
  return { carried, toRun };
}

/** Runs the cases with no earlier answer and merges them with the carried ones, in corpus order. */
export async function extendRun(
  adapter: Adapter,
  records: BenchRecord[],
  plan: Plan,
  profiles: Map<string, Profile>,
  onProgress?: (done: number, total: number) => void
): Promise<{ results: CaseResult[]; retried: { count: number; recovered: number } }> {
  const fresh = await runCases(adapter, plan.toRun, profiles, onProgress);
  const retried = await retryTransient(adapter, fresh, plan.toRun, profiles);
  const byId = new Map(fresh.map((r) => [r.id, r]));
  const results = records.map((r) => plan.carried.get(r.id) ?? byId.get(r.id)).filter((r): r is CaseResult => r !== undefined);
  if (results.length !== records.length) throw new Error(`${records.length - results.length} case(s) have no result`);
  return { results, retried };
}

async function main(): Promise<void> {
  const { values: opt } = parseArgs({
    options: { from: { type: 'string' }, 'previous-corpus': { type: 'string' }, adapter: { type: 'string' }, out: { type: 'string' } },
  });
  if (!opt.from || !opt['previous-corpus'] || !opt.adapter) throw new Error('usage: npm run extend-run -- --from <run dir> --previous-corpus <corpus dir> --adapter <name> [--out <dir>]');
  const previousSummary = JSON.parse(fs.readFileSync(path.join(opt.from, 'summary.json'), 'utf-8')) as Summary;
  const previousResults = new Map(readJsonl<CaseResult>(path.join(opt.from, 'cases.jsonl')).map((r) => [r.id, r]));
  const previousRecords = new Map<string, BenchRecord>();
  for (const f of fs.readdirSync(opt['previous-corpus']).filter((x) => x.endsWith('.jsonl'))) {
    for (const r of readJsonl<BenchRecord>(path.join(opt['previous-corpus'], f))) previousRecords.set(r.id, r);
  }
  const adapter = await makeAdapter(opt.adapter, 'npm');
  if (previousSummary.adapter !== adapter.name || previousSummary.tool_version !== adapter.toolVersion) {
    throw new Error(`the earlier run is ${previousSummary.adapter} ${previousSummary.tool_version}; this adapter is ${adapter.name} ${adapter.toolVersion}`);
  }
  const records = loadCorpus();
  const plan = planExtension(adapter, records, previousRecords, previousResults);
  process.stderr.write(`  ${plan.carried.size} case(s) carried from ${previousSummary.corpus_version}, ${plan.toRun.length} to run\n`);
  const { results, retried } = await extendRun(adapter, records, plan, loadProfiles(), (done, total) => {
    if (done % 50 === 0) process.stderr.write(`  ${done}/${total}\n`);
  });
  const summary = buildSummary(adapter, results, retried, records);
  summary.parts = [
    { cases: plan.carried.size, measured_at: previousSummary.measured_at, corpus_version: previousSummary.corpus_version, from: path.relative(ROOT, path.resolve(opt.from)) },
    { cases: plan.toRun.length, measured_at: summary.measured_at, corpus_version: summary.corpus_version },
  ];
  const out = opt.out ?? resultsDir(summary, false);
  writeResults(out, results, summary);
  console.log(toMarkdown(summary));
  console.log(`${plan.carried.size} carried + ${plan.toRun.length} run -> ${path.relative(ROOT, out)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
