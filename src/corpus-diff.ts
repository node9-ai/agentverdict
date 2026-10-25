// What changed between two corpora, per source, for a CHANGELOG entry that
// is computed rather than typed.
//
//   npm run corpus:diff -- <git ref>
//
// Compares the corpus committed at <git ref> with the working tree: cases
// whose id went away or appeared, cases whose content changed under the same
// id (any field but `private`), cases that moved between the public and
// holdout splits, and cases whose label (`expected`, `setup`, `channel`)
// changed, which a major version must say and a minor one must not have.
// Prints a Markdown table and the totals.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CORPUS_DIR, ROOT } from './corpus.ts';
import type { BenchRecord } from './types.ts';

function load(text: string): Map<string, BenchRecord> {
  return new Map(
    text
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as BenchRecord)
      .map((r) => [r.id, r])
  );
}

function atRef(ref: string): Map<string, BenchRecord> {
  const files = execFileSync('git', ['ls-tree', '--name-only', ref, 'corpus/'], { cwd: ROOT, encoding: 'utf-8' })
    .split('\n')
    .filter((f) => f.endsWith('.jsonl'));
  const out = new Map<string, BenchRecord>();
  for (const f of files) for (const [k, v] of load(execFileSync('git', ['show', `${ref}:${f}`], { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 30 }))) out.set(k, v);
  return out;
}

function here(): Map<string, BenchRecord> {
  const out = new Map<string, BenchRecord>();
  for (const f of fs.readdirSync(CORPUS_DIR).filter((x) => x.endsWith('.jsonl')).sort()) for (const [k, v] of load(fs.readFileSync(path.join(CORPUS_DIR, f), 'utf-8'))) out.set(k, v);
  return out;
}

interface Row {
  before: number;
  after: number;
  idGone: number;
  idNew: number;
  content: number;
  moved: number;
  label: number;
  holdBefore: number;
  holdAfter: number;
}

const content = (r: BenchRecord): string => {
  const { private: _p, ...rest } = r;
  return JSON.stringify(rest);
};

export function diffCorpora(before: Map<string, BenchRecord>, after: Map<string, BenchRecord>): Record<string, Row> {
  const per: Record<string, Row> = {};
  const row = (s: string): Row => (per[s] ??= { before: 0, after: 0, idGone: 0, idNew: 0, content: 0, moved: 0, label: 0, holdBefore: 0, holdAfter: 0 });
  for (const [id, r] of before) {
    const p = row(r.source);
    p.before++;
    if (r.private) p.holdBefore++;
    if (!after.has(id)) p.idGone++;
  }
  for (const [id, r] of after) {
    const p = row(r.source);
    p.after++;
    if (r.private) p.holdAfter++;
    const o = before.get(id);
    if (!o) {
      p.idNew++;
      continue;
    }
    if (content(o) !== content(r)) p.content++;
    if (o.private !== r.private) p.moved++;
    if (o.expected !== r.expected || o.setup !== r.setup || o.channel !== r.channel) p.label++;
  }
  return per;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const ref = process.argv[2];
  if (!ref) {
    console.error('usage: npm run corpus:diff -- <git ref>');
    process.exit(2);
  }
  const before = atRef(ref);
  const after = here();
  const per = diffCorpora(before, after);
  const L: string[] = [];
  L.push('| Source | Cases | Ids gone | Ids new | Content changed | Moved between splits | Labels changed | Holdout |');
  L.push('|---|---:|---:|---:|---:|---:|---:|---|');
  for (const [s, p] of Object.entries(per).sort()) {
    if (!(p.idGone || p.idNew || p.content || p.moved || p.label || p.before !== p.after || p.holdBefore !== p.holdAfter)) continue;
    L.push(`| ${s} | ${p.before === p.after ? p.after : `${p.before} to ${p.after}`} | ${p.idGone} | ${p.idNew} | ${p.content} | ${p.moved} | ${p.label} | ${p.holdBefore === p.holdAfter ? p.holdAfter : `${p.holdBefore} to ${p.holdAfter}`} |`);
  }
  const sum = (k: keyof Row) => Object.values(per).reduce((n, p) => n + p[k], 0);
  L.push('');
  L.push(`Total: ${before.size} to ${after.size} cases; holdout ${sum('holdBefore')} to ${sum('holdAfter')}; ${sum('idGone')} ids gone, ${sum('idNew')} new, ${sum('content')} contents changed, ${sum('moved')} moved between splits, ${sum('label')} labels changed.`);
  console.log(L.join('\n'));
}
