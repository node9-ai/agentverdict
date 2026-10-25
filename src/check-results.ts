// Checks a results directory before it is scored or published: the file a
// vendor submits with a pull request, or one of our own runs.
//
//   npm run check-results -- <dir> [--split public|all] [--set official|all]
//
// <dir> holds cases.jsonl and summary.json, as `npm run bench` writes them.
// Problems that make the results unusable (exit 1):
//   - a line that is not JSON, or a case id twice;
//   - an id the corpus does not have, or an expected verdict that is not the
//     corpus's (the results were made against other labels);
//   - a verdict other than allow, review, block, unreachable or error;
//   - a case of the checked split and set missing from the file;
//   - summary.json missing, or neither of its corpus hashes pinned here: the
//     full hash (a run with the holdout present) or the public hash (a
//     vendor's run on the public repository), so the results were made on
//     another corpus version.
// Reported but allowed: errors and unreachable cases (they are counted as
// not measured), holdout cases in a public submission (they are ignored,
// never scored from the submission).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadCorpus, readCorpusVersion } from './corpus.ts';
import type { BenchRecord, CaseResult } from './types.ts';

const ACTUALS = new Set(['allow', 'review', 'block', 'unreachable', 'error']);

export interface CheckOptions {
  split: 'public' | 'all';
  set: 'official' | 'all';
}

export interface CheckReport {
  problems: string[];
  notes: string[];
  counts: { cases: number; expected: number; errors: number; unreachable: number; ignoredHoldout: number };
}

export interface SubmittedSummary {
  corpus_sha256?: string;
  corpus_public_sha256?: string;
  corpus_version?: string;
}

export function checkResults(lines: string[], summary: SubmittedSummary | null, corpus: BenchRecord[], pinned: { version: string; sha256: string; public_sha256?: string }, opts: CheckOptions): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const byId = new Map(corpus.map((r) => [r.id, r]));
  const wanted = corpus.filter((r) => (opts.split === 'all' || !r.private) && (opts.set === 'all' || r.set === 'official'));
  const seen = new Set<string>();
  let errors = 0;
  let unreachable = 0;
  let ignoredHoldout = 0;
  lines.forEach((line, i) => {
    if (line.trim() === '') return;
    let r: CaseResult;
    try {
      r = JSON.parse(line) as CaseResult;
    } catch {
      problems.push(`cases.jsonl:${i + 1}: not JSON`);
      return;
    }
    if (seen.has(r.id)) problems.push(`cases.jsonl:${i + 1}: ${r.id} appears twice`);
    seen.add(r.id);
    const rec = byId.get(r.id);
    if (!rec) {
      problems.push(`cases.jsonl:${i + 1}: ${r.id} is not a case of corpus ${pinned.version}`);
      return;
    }
    if (r.expected !== rec.expected) problems.push(`cases.jsonl:${i + 1}: ${r.id} expected ${r.expected}, the corpus says ${rec.expected}`);
    if (!ACTUALS.has(r.actual)) problems.push(`cases.jsonl:${i + 1}: ${r.id} verdict ${String(r.actual)} is not one of ${[...ACTUALS].join(', ')}`);
    if (r.actual === 'error') errors++;
    if (r.actual === 'unreachable') unreachable++;
    if (opts.split === 'public' && rec.private) ignoredHoldout++;
  });
  const missing = wanted.filter((r) => !seen.has(r.id));
  if (missing.length > 0) problems.push(`${missing.length} case(s) of the checked split and set are missing, for example ${missing.slice(0, 3).map((r) => r.id).join(', ')}`);
  if (!summary) problems.push('summary.json is missing');
  else if (summary.corpus_sha256 !== pinned.sha256 && (summary.corpus_public_sha256 === undefined || summary.corpus_public_sha256 !== pinned.public_sha256))
    problems.push(`made on corpus ${summary.corpus_version ?? '?'} (${String(summary.corpus_sha256).slice(0, 12)}), not on the pinned ${pinned.version} (${pinned.sha256.slice(0, 12)}, public ${(pinned.public_sha256 ?? '').slice(0, 12)})`);
  if (errors > 0) notes.push(`${errors} case(s) errored: counted as not measured`);
  if (unreachable > 0) notes.push(`${unreachable} case(s) unreachable: counted as not measured`);
  if (ignoredHoldout > 0) notes.push(`${ignoredHoldout} holdout case(s) in a public check: ignored, the holdout is scored only by our own run`);
  return { problems, notes, counts: { cases: seen.size, expected: wanted.length, errors, unreachable, ignoredHoldout } };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { split: { type: 'string', default: 'public' }, set: { type: 'string', default: 'official' } } });
  if (positionals.length !== 1 || !['public', 'all'].includes(values.split!) || !['official', 'all'].includes(values.set!)) {
    console.error('usage: npm run check-results -- <dir> [--split public|all] [--set official|all]');
    process.exit(2);
  }
  const dir = positionals[0];
  const casesFile = path.join(dir, 'cases.jsonl');
  if (!fs.existsSync(casesFile)) {
    console.error(`${casesFile} not found`);
    process.exit(1);
  }
  const summaryFile = path.join(dir, 'summary.json');
  const summary = fs.existsSync(summaryFile) ? (JSON.parse(fs.readFileSync(summaryFile, 'utf-8')) as SubmittedSummary) : null;
  const rep = checkResults(fs.readFileSync(casesFile, 'utf-8').split('\n'), summary, loadCorpus(), readCorpusVersion(), values as CheckOptions);
  for (const p of rep.problems) console.error(`problem: ${p}`);
  for (const n of rep.notes) console.log(`note: ${n}`);
  console.log(`${rep.counts.cases} result(s); ${rep.counts.expected} case(s) expected in the checked split and set; ${rep.problems.length} problem(s)`);
  process.exit(rep.problems.length > 0 ? 1 : 0);
}
