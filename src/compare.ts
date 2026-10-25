// Case-by-case comparison of two runs, and the release gate built on it.
//
//   npm run compare -- <base> <head> [--strict-tier] [--json FILE]
//
// <base> and <head> are result directories (holding cases.jsonl), given as a
// path or relative to results/ ("node9-gate/2.27.0" picks that version's
// newest corpus directory). Only cases present in both runs are compared.
//
// A case is right when the tool stopped it (review or block) exactly when its
// label says it should be stopped. Buckets:
//   regressed     right in base, wrong (or error) in head
//   fixed         wrong (or error) in base, right in head
//   tier          right in both and stopped in both, but review/block moved
//   still wrong   wrong in both
// Cases marked volatile in the corpus, and cases whose label changed between
// the two corpus versions, are listed apart and never fail the gate.
//
// The fixed and regressed counts also feed an exact McNemar test (src/stats.ts),
// so a reader sees whether the net change is more than chance.
//
// Exit code 1 when a non-volatile case regressed (or, with --strict-tier, its
// tier moved away from the label).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, readJsonl } from './corpus.ts';
import { score, type Score } from './score.ts';
import { CHANNELS, type CaseResult } from './types.ts';
import { labelsOf, suiteOf, suiteTitle } from './suites.ts';
import { formatP, mcnemar } from './stats.ts';

type Actual = CaseResult['actual'];
const stopped = (v: Actual | CaseResult['expected']) => v === 'review' || v === 'block';
const decided = (v: Actual) => v === 'allow' || v === 'review' || v === 'block';
const right = (r: CaseResult) => decided(r.actual) && stopped(r.actual) === stopped(r.expected);

export interface Change {
  id: string;
  channel: string;
  expected: string;
  base: Actual;
  head: Actual;
  detail?: string;
}

export interface CompareReport {
  base: { dir: string; tool: string; corpus: string };
  head: { dir: string; tool: string; corpus: string };
  shared: number;
  onlyBase: number;
  onlyHead: number;
  regressed: Change[];
  fixed: Change[];
  tierWorse: Change[];
  tierBetter: Change[];
  stillWrong: Change[];
  /** Volatile cases that moved away from the label (wrong now, or tier away from it). */
  volatileWorse: Change[];
  /** Volatile cases that moved to the label. */
  volatileBetter: Change[];
  relabelled: Change[];
  reachChanged: Change[];
  /** Exact McNemar p-value on the stable cases: fixed against regressed. */
  pairedP: number;
  metrics: Record<string, { base: Score; head: Score }>;
  /** The same metrics per suite (origin of the cases). */
  suiteMetrics: Record<string, { base: Score; head: Score }>;
  /** The same metrics over cases labelled by outside sources only (the comparison score). */
  comparisonMetrics?: { base: Score; head: Score };
  /** The same metrics over the official set's headline section (outside labels in the official set). */
  headlineMetrics?: { base: Score; head: Score };
  pass: boolean;
}

interface Run {
  dir: string;
  tool: string;
  corpus: string;
  cases: CaseResult[];
}

/** Resolve "node9-gate/2.27.0" or "node9-gate/2.27.0/corpus-1.1.0" or a path to a run directory. */
export function resolveRun(spec: string): string {
  const candidates = [spec, path.join(ROOT, 'results', spec)];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'cases.jsonl'))) return path.resolve(c);
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      const corpora = fs
        .readdirSync(c)
        .filter((d) => /^corpus-\d+\.\d+\.\d+/.test(d) && fs.existsSync(path.join(c, d, 'cases.jsonl')))
        .sort((a, b) => semverCmp(a.slice(7), b.slice(7)));
      if (corpora.length > 0) return path.resolve(c, corpora[corpora.length - 1]);
    }
  }
  throw new Error(`no run found for ${spec}`);
}

export function semverCmp(a: string, b: string): number {
  const pa = a.split(/[.+-]/).slice(0, 3).map(Number);
  const pb = b.split(/[.+-]/).slice(0, 3).map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

function loadRun(dir: string): Run {
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as { tool_version: string; corpus_version: string };
  return { dir, tool: summary.tool_version, corpus: summary.corpus_version, cases: readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')) };
}

export function compareRuns(base: Run, head: Run, volatileIds: Set<string>, strictTier = false): CompareReport {
  const b = new Map(base.cases.map((r) => [r.id, r]));
  const h = new Map(head.cases.map((r) => [r.id, r]));
  const ids = [...b.keys()].filter((id) => h.has(id)).sort();
  const rep: CompareReport = {
    base: { dir: path.relative(ROOT, base.dir), tool: base.tool, corpus: base.corpus },
    head: { dir: path.relative(ROOT, head.dir), tool: head.tool, corpus: head.corpus },
    shared: ids.length,
    onlyBase: b.size - ids.length,
    onlyHead: h.size - ids.length,
    regressed: [],
    fixed: [],
    tierWorse: [],
    tierBetter: [],
    stillWrong: [],
    volatileWorse: [],
    volatileBetter: [],
    relabelled: [],
    reachChanged: [],
    pairedP: 1,
    metrics: {},
    suiteMetrics: {},
    pass: true,
  };

  for (const id of ids) {
    const x = b.get(id)!;
    const y = h.get(id)!;
    const c: Change = { id, channel: y.channel, expected: y.expected, base: x.actual, head: y.actual, detail: y.detail };
    if (x.expected !== y.expected) {
      if (x.actual !== y.actual) rep.relabelled.push(c);
      continue;
    }
    if ((x.actual === 'unreachable') !== (y.actual === 'unreachable')) {
      rep.reachChanged.push(c);
      continue;
    }
    if (x.actual === 'unreachable') continue;
    const vol = volatileIds.has(id);
    const [rx, ry] = [right(x), right(y)];
    if (rx && !ry) (vol ? rep.volatileWorse : rep.regressed).push(c);
    else if (!rx && ry) (vol ? rep.volatileBetter : rep.fixed).push(c);
    else if (!rx && !ry) rep.stillWrong.push(c);
    else if (stopped(x.actual) && x.actual !== y.actual) {
      // Right in both, stopped in both: only the tier moved.
      if (x.actual === x.expected) (vol ? rep.volatileWorse : rep.tierWorse).push(c);
      else if (y.actual === y.expected) (vol ? rep.volatileBetter : rep.tierBetter).push(c);
    }
  }

  // Metrics on the shared, same-label cases only, so both columns score the same set.
  const sameLabel = new Set(ids.filter((id) => b.get(id)!.expected === h.get(id)!.expected));
  for (const ch of [...CHANNELS, 'all'] as const) {
    const pick = (m: Map<string, CaseResult>) => [...sameLabel].map((id) => m.get(id)!).filter((r) => ch === 'all' || r.channel === ch);
    const xs = pick(b);
    if (xs.length === 0) continue;
    rep.metrics[ch] = { base: score(xs), head: score(pick(h)) };
  }
  const suites = [...new Set([...sameLabel].map((id) => h.get(id)!.suite ?? 'unassigned'))];
  for (const s of suites) {
    const pick = (m: Map<string, CaseResult>) => [...sameLabel].map((id) => m.get(id)!).filter((r) => (h.get(r.id)!.suite ?? 'unassigned') === s);
    rep.suiteMetrics[s] = { base: score(pick(b)), head: score(pick(h)) };
  }
  const outside = (m: Map<string, CaseResult>) => [...sameLabel].map((id) => m.get(id)!).filter((r) => h.get(r.id)!.labels === 'outside');
  if (outside(b).length > 0) rep.comparisonMetrics = { base: score(outside(b)), head: score(outside(h)) };
  const headline = (m: Map<string, CaseResult>) => [...sameLabel].map((id) => m.get(id)!).filter((r) => h.get(r.id)!.set === 'official' && h.get(r.id)!.section === 'headline');
  if (headline(b).length > 0) rep.headlineMetrics = { base: score(headline(b)), head: score(headline(h)) };
  rep.pairedP = mcnemar(rep.fixed.length, rep.regressed.length);
  rep.pass = rep.regressed.length === 0 && (!strictTier || rep.tierWorse.length === 0);
  return rep;
}

const pct = (x: number | null) => (x === null ? 'n/a' : `${(100 * x).toFixed(1)}%`);
const num = (x: number | null) => (x === null ? 'n/a' : x.toFixed(1));
const arrow = (a: string, b: string) => (a === b ? a : `${a} → ${b}`);

export function renderMarkdown(r: CompareReport): string {
  const L: string[] = [];
  L.push(`# ${r.base.tool} → ${r.head.tool}`);
  L.push('');
  L.push(`- Base: \`${r.base.dir}\` (corpus v${r.base.corpus})`);
  L.push(`- Head: \`${r.head.dir}\` (corpus v${r.head.corpus})`);
  L.push(`- Compared: ${r.shared} shared cases` + (r.onlyBase || r.onlyHead ? ` (${r.onlyBase} only in base, ${r.onlyHead} only in head, not compared)` : ''));
  L.push(`- Paired test (exact McNemar, stable cases): ${r.fixed.length} fixed, ${r.regressed.length} regressed, ${formatP(r.pairedP)}`);
  L.push('');
  L.push(r.pass ? `**PASS**: no regression on a stable case.` : `**FAIL**: ${r.regressed.length} regression(s)${r.tierWorse.length ? `, ${r.tierWorse.length} tier change(s) away from the label` : ''}.`);
  L.push('');
  L.push('| Channel | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | p50 ms |');
  L.push('|---|---:|---:|---:|---:|---:|');
  for (const [ch, m] of Object.entries(r.metrics)) {
    L.push(
      `| ${ch} | ${arrow(pct(m.base.catch_rate), pct(m.head.catch_rate))} | ${arrow(pct(m.base.review_hit_rate), pct(m.head.review_hit_rate))} | ${arrow(num(m.base.interruptions_per_100), num(m.head.interruptions_per_100))} | ${arrow(pct(m.base.correct_tier), pct(m.head.correct_tier))} | ${arrow(num(m.base.latency_p50_ms), num(m.head.latency_p50_ms))} |`
    );
  }
  if (r.headlineMetrics) {
    const m = r.headlineMetrics;
    L.push(
      `| headline (official set, outside labels) | ${arrow(pct(m.base.catch_rate), pct(m.head.catch_rate))} | ${arrow(pct(m.base.review_hit_rate), pct(m.head.review_hit_rate))} | ${arrow(num(m.base.interruptions_per_100), num(m.head.interruptions_per_100))} | ${arrow(pct(m.base.correct_tier), pct(m.head.correct_tier))} | ${arrow(num(m.base.latency_p50_ms), num(m.head.latency_p50_ms))} |`
    );
  }
  if (r.comparisonMetrics) {
    const m = r.comparisonMetrics;
    L.push(
      `| comparison score (outside labels, every set) | ${arrow(pct(m.base.catch_rate), pct(m.head.catch_rate))} | ${arrow(pct(m.base.review_hit_rate), pct(m.head.review_hit_rate))} | ${arrow(num(m.base.interruptions_per_100), num(m.head.interruptions_per_100))} | ${arrow(pct(m.base.correct_tier), pct(m.head.correct_tier))} | ${arrow(num(m.base.latency_p50_ms), num(m.head.latency_p50_ms))} |`
    );
  }
  if (Object.keys(r.suiteMetrics).length > 1) {
    L.push('');
    L.push('| Source | Cases | Catch rate (block) | Interruptions / 100 allow | Correct tier |');
    L.push('|---|---:|---:|---:|---:|');
    for (const [s, m] of Object.entries(r.suiteMetrics)) {
      L.push(`| ${suiteTitle(s)} | ${m.head.cases} | ${arrow(pct(m.base.catch_rate), pct(m.head.catch_rate))} | ${arrow(num(m.base.interruptions_per_100), num(m.head.interruptions_per_100))} | ${arrow(pct(m.base.correct_tier), pct(m.head.correct_tier))} |`);
    }
  }
  const section = (title: string, xs: Change[], note?: string) => {
    if (xs.length === 0) return;
    L.push('');
    L.push(`## ${title} (${xs.length})`);
    if (note) L.push('', note);
    L.push('');
    for (const c of xs) L.push(`- \`${c.id}\` expected ${c.expected}: ${c.base} → ${c.head}${c.detail ? ` — ${c.detail.replace(/\s+/g, ' ').slice(0, 120)}` : ''}`);
  };
  section('Regressed', r.regressed, 'Right in base, wrong in head. These fail the gate.');
  section('Tier moved away from the label', r.tierWorse);
  section('Fixed', r.fixed);
  section('Tier moved to the label', r.tierBetter);
  const volNote = 'Volatile cases depend on advisory data, registries or the date at run time; they never fail the gate, but a case here deserves a look.';
  section('Volatile, moved away from the label', r.volatileWorse, volNote);
  section('Volatile, moved to the label', r.volatileBetter);
  section('Label changed between corpus versions', r.relabelled);
  section('Reachability changed', r.reachChanged);
  L.push('');
  L.push(`Still wrong in both: ${r.stillWrong.length} case(s).`);
  return L.join('\n');
}

export function volatileIdsFromCorpus(): Set<string> {
  return new Set(loadCorpus().filter((r) => r.volatile).map((r) => r.id));
}

export interface CaseOrigin {
  suite: string;
  labels?: CaseResult['labels'];
  set?: CaseResult['set'];
  section?: CaseResult['section'];
  extended_reason?: string;
  owasp?: string;
}

/**
 * Suite, label origin and set of every corpus case by id. Results written
 * before one of them was recorded get it from here, so an older run is
 * reported by the current corpus's sets (its ids are immutable).
 */
export function originsFromCorpus(): Map<string, CaseOrigin> {
  return new Map(
    loadCorpus().map((r) => [
      r.id,
      { suite: suiteOf(r.source), labels: labelsOf(r.source), set: r.set, section: r.section, extended_reason: r.extended_reason, owasp: r.owasp },
    ])
  );
}

export function withOrigins(cases: CaseResult[], origins: Map<string, CaseOrigin>): CaseResult[] {
  return cases.map((r) => {
    const o = origins.get(r.id);
    const out: CaseResult = { ...r, suite: r.suite ?? o?.suite ?? 'unassigned' };
    const labels = r.labels ?? o?.labels;
    if (labels) out.labels = labels;
    if (r.set === undefined && o?.set !== undefined) {
      out.set = o.set;
      if (o.section !== undefined) out.section = o.section;
      if (o.extended_reason !== undefined) out.extended_reason = o.extended_reason;
    }
    if (r.owasp === undefined && o?.owasp !== undefined) out.owasp = o.owasp;
    return out;
  });
}

export function compareDirs(baseDir: string, headDir: string, strictTier = false): CompareReport {
  const origins = originsFromCorpus();
  const [base, head] = [loadRun(baseDir), loadRun(headDir)].map((run) => ({ ...run, cases: withOrigins(run.cases, origins) }));
  return compareRuns(base, head, volatileIdsFromCorpus(), strictTier);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { 'strict-tier': { type: 'boolean', default: false }, json: { type: 'string' } },
  });
  if (positionals.length !== 2) {
    console.error('usage: npm run compare -- <base> <head> [--strict-tier] [--json FILE]');
    process.exit(2);
  }
  const rep = compareDirs(resolveRun(positionals[0]), resolveRun(positionals[1]), values['strict-tier']);
  if (values.json) fs.writeFileSync(values.json, JSON.stringify(rep, null, 2) + '\n');
  console.log(renderMarkdown(rep));
  process.exit(rep.pass ? 0 : 1);
}
