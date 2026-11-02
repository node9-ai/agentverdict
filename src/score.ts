// Scoring. Pure functions over per-case results; no adapter is involved.
//
// Definitions (the README carries the same text):
//   catch rate         block-labelled cases the tool stopped (review or block),
//                      over block-labelled cases it could reach.
//   review hit rate    review-labelled cases the tool stopped (review or block),
//                      over review-labelled cases it could reach.
//   interruptions/100  allow-labelled cases the tool stopped (review or block),
//                      per 100 allow-labelled cases it could reach.
//   correct tier       among cases that should be stopped and were stopped,
//                      the share where the tier (review vs block) matches.
//   false positive rate  allow-labelled cases the tool stopped, over the
//                      allow-labelled cases it could reach (interruptions/100
//                      divided by 100).
//   balanced score     the mean of the share of attack cases stopped (block
//                      and review labels together) and the share of allow
//                      cases let through. A tool that stops everything, or
//                      nothing, scores 50%; only telling them apart scores
//                      higher. Null unless both kinds were reached.
//   precision          of the cases the tool stopped, the share that were
//                      attacks: (attacks stopped) / (attacks stopped + allow
//                      cases stopped). It depends on the mix of attacks and
//                      benign work in the corpus, which is far richer in
//                      attacks than real work, so read it next to the false
//                      positive rate, not instead of it.
//   unreachable        cases the adapter declares it has no surface for;
//                      excluded from every rate above and counted separately.

import { CHANNELS, type CaseResult } from './types.ts';
import { COMPETITOR_MAKERS, LABELS, SUITES, suiteTitle } from './suites.ts';

export interface Score {
  cases: number;
  unreachable: number;
  errors: number;
  block_cases: number;
  caught: number;
  catch_rate: number | null;
  review_cases: number;
  review_hits: number;
  review_hit_rate: number | null;
  allow_cases: number;
  interruptions: number;
  interruptions_per_100: number | null;
  tier_scored: number;
  tier_correct: number;
  correct_tier: number | null;
  false_positive_rate: number | null;
  balanced_score: number | null;
  precision: number | null;
  latency_p50_ms: number | null;
  latency_p99_ms: number | null;
}

const stopped = (v: CaseResult['actual']) => v === 'review' || v === 'block';
// Rounded to 6 decimals: plenty for a rate, and a full-precision fraction
// carries 16 digits that a card detector can read as a card number in a
// committed summary (one did, on the comparison catch rate of 46/96).
const ratio = (a: number, b: number) => (b === 0 ? null : Math.round((a / b) * 1e6) / 1e6);

/** Nearest-rank percentile. */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

export function score(results: CaseResult[]): Score {
  const reach = results.filter((r) => r.actual !== 'unreachable' && r.actual !== 'error');
  const block = reach.filter((r) => r.expected === 'block');
  const review = reach.filter((r) => r.expected === 'review');
  const allow = reach.filter((r) => r.expected === 'allow');
  const held = [...block, ...review].filter((r) => stopped(r.actual));
  const lat = reach.map((r) => r.latency_ms).filter((x): x is number => x !== null).sort((a, b) => a - b);
  const caught = block.filter((r) => stopped(r.actual)).length;
  const reviewHits = review.filter((r) => stopped(r.actual)).length;
  const interruptions = allow.filter((r) => stopped(r.actual)).length;
  const tierCorrect = held.filter((r) => r.actual === r.expected).length;
  const per100 = ratio(interruptions, allow.length);
  const attacks = block.length + review.length;
  const detection = ratio(caught + reviewHits, attacks);
  const fpRate = ratio(interruptions, allow.length);
  const balanced = detection === null || fpRate === null ? null : Math.round(((detection + (1 - fpRate)) / 2) * 1e6) / 1e6;
  return {
    cases: results.length,
    unreachable: results.filter((r) => r.actual === 'unreachable').length,
    errors: results.filter((r) => r.actual === 'error').length,
    block_cases: block.length,
    caught,
    catch_rate: ratio(caught, block.length),
    review_cases: review.length,
    review_hits: reviewHits,
    review_hit_rate: ratio(reviewHits, review.length),
    allow_cases: allow.length,
    interruptions,
    // Rounded again after the multiplication: 0.07451 * 100 is 7.450999999999999 in
    // floating point, a 16-digit run a card detector read in a committed summary.
    interruptions_per_100: per100 === null ? null : Math.round(per100 * 100 * 1e4) / 1e4,
    tier_scored: held.length,
    tier_correct: tierCorrect,
    correct_tier: ratio(tierCorrect, held.length),
    false_positive_rate: fpRate,
    balanced_score: balanced,
    precision: ratio(caught + reviewHits, caught + reviewHits + interruptions),
    latency_p50_ms: percentile(lat, 50),
    latency_p99_ms: percentile(lat, 99),
  };
}

export interface Summary {
  adapter: string;
  tool_version: string;
  method: string;
  /** Pinned corpus version, or `<version>+unreleased` when the corpus moved past it. */
  corpus_version: string;
  corpus_sha256: string;
  /** Hash of the public cases alone; equals corpus_sha256 in a public checkout. Absent in runs before corpus 6.0.0. */
  corpus_public_sha256?: string;
  measured_at: string;
  host: { node: string; platform: string; cpu: string };
  /** Keyed by channel, plus "all". Each has public, holdout and combined scores. */
  channels: Record<string, { public: Score; holdout: Score; all: Score }>;
  /** Keyed by suite (the origin of the cases, see suites.ts), same shape as channels. */
  suites?: Record<string, { public: Score; holdout: Score; all: Score }>;
  /**
   * The comparison score: the same shape as `channels`, over cases whose
   * labels come from outside sources only (see LABELS in suites.ts).
   */
  comparison?: Record<string, { public: Score; holdout: Score; all: Score }>;
  /**
   * The headline score: the same shape, over the official set's headline
   * section only (outside labels, categories a guard can protect; src/scope/).
   * Absent in summaries written before sets existed.
   */
  headline?: Record<string, { public: Score; holdout: Score; all: Score }>;
  /** Cases that errored or timed out on the first pass and were run once more. */
  retried?: { count: number; recovered: number };
  /** The registry state the run's volatile cases rest on (runner.ts, registryState). */
  registries?: { volatile_cases: number; snapshots_fetched_at: Record<string, string> };
  /**
   * The cases this tool was not measured on, one row per reason the adapter
   * gave, official and extended sets apart, with the holdout share of each.
   * Absent in summaries written before it was recorded.
   */
  not_measured?: NotMeasured[];
  /**
   * A run extended to a new corpus version (src/extend-run.ts): the cases
   * carried from an earlier run, with that run's date and corpus, and the
   * cases run now. Absent in a run made in one go.
   */
  parts?: Array<{ cases: number; measured_at: string; corpus_version: string; from?: string }>;
}

export interface NotMeasured {
  reason: string;
  official: number;
  extended: number;
  /** Of official + extended, the cases on the holdout side. */
  holdout: number;
}

/** Unreachable cases grouped by the reason the adapter gave, largest first. */
export function summarizeNotMeasured(results: CaseResult[]): NotMeasured[] {
  const rows = new Map<string, NotMeasured>();
  for (const r of results) {
    if (r.actual !== 'unreachable') continue;
    const reason = r.detail ?? 'no reason given';
    const row = rows.get(reason) ?? { reason, official: 0, extended: 0, holdout: 0 };
    if (r.set === 'extended') row.extended++;
    else row.official++;
    if (r.private) row.holdout++;
    rows.set(reason, row);
  }
  return [...rows.values()].sort((a, b) => b.official + b.extended - (a.official + a.extended));
}

type Split = { public: Score; holdout: Score; all: Score };
const split = (rows: CaseResult[]): Split => ({
  public: score(rows.filter((r) => !r.private)),
  holdout: score(rows.filter((r) => r.private)),
  all: score(rows),
});

/** Scores per suite, known suites first in their declared order, then any other suite by name. */
export function summarizeSuites(results: CaseResult[]): Record<string, Split> {
  const names = [...new Set(results.map((r) => r.suite ?? 'unassigned'))];
  const known = Object.keys(SUITES);
  names.sort((a, b) => {
    const ia = known.indexOf(a), ib = known.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    return a.localeCompare(b);
  });
  const out: Record<string, Split> = {};
  for (const s of names) out[s] = split(results.filter((r) => (r.suite ?? 'unassigned') === s));
  return out;
}

/** Who labelled a suite's cases: one origin, or "mixed" when its sources differ. */
export function suiteLabels(suite: string): string {
  const origins = new Set((SUITES[suite]?.sources ?? [suite]).map((src) => LABELS[src] ?? 'unclassified'));
  if (origins.size > 1) return 'mixed';
  const [o] = origins;
  if (o !== 'competitor') return o === 'node9' ? "node9's team" : o;
  const makers = [...new Set((SUITES[suite]?.sources ?? [suite]).map((src) => COMPETITOR_MAKERS[src]).filter(Boolean))];
  return makers.length > 0 ? `a competitor (${makers.join(', ')})` : 'a competitor';
}

export function summarize(results: CaseResult[]): Summary['channels'] {
  const out: Summary['channels'] = {};
  for (const ch of [...CHANNELS, 'all'] as const) {
    const rows = ch === 'all' ? results : results.filter((r) => r.channel === ch);
    if (rows.length === 0) continue;
    out[ch] = split(rows);
  }
  return out;
}

/** Scores per channel over cases labelled by outside sources only: the number to compare tools on. */
export function summarizeComparison(results: CaseResult[]): Summary['channels'] {
  return summarize(results.filter((r) => r.labels === 'outside'));
}

/** Scores per channel over the official set's headline section: the benchmark's number. */
export function summarizeHeadline(results: CaseResult[]): Summary['channels'] {
  return summarize(results.filter((r) => r.set === 'official' && r.section === 'headline'));
}

const pct = (x: number | null) => (x === null ? 'n/a' : `${(100 * x).toFixed(1)}%`);
const num = (x: number | null, d = 1) => (x === null ? 'n/a' : x.toFixed(d));

export function toMarkdown(s: Summary): string {
  const lines: string[] = [];
  lines.push(`# ${s.adapter} ${s.tool_version}`);
  lines.push('');
  lines.push(`- Method: ${s.method}`);
  lines.push(`- Corpus: v${s.corpus_version} (SHA-256 \`${s.corpus_sha256}\`)`);
  lines.push(`- Measured: ${s.measured_at} on ${s.host.cpu}, Node ${s.host.node}, ${s.host.platform}`);
  if (s.parts) lines.push(`- Measured in parts: ${s.parts.map((p) => `${p.cases} case(s) on ${p.measured_at.slice(0, 10)} (corpus ${p.corpus_version}${p.from ? `, carried from ${p.from}` : ''})`).join('; ')}.`);
  if (s.retried) lines.push(`- Retried: ${s.retried.count} case(s) that errored or timed out on the first pass (host load); ${s.retried.recovered} recovered.`);
  if (s.registries) {
    const dates = Object.entries(s.registries.snapshots_fetched_at).map(([k, v]) => `${k} ${v.slice(0, 10)}`).join(', ');
    lines.push(`- Volatile: ${s.registries.volatile_cases} case(s) depend on live registries and advisory databases at run time; package snapshots fetched: ${dates || 'none recorded'}.`);
  }
  lines.push('');
  if (s.not_measured && s.not_measured.length > 0) {
    lines.push('## Not measured');
    lines.push('');
    lines.push("Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.");
    lines.push('');
    lines.push('| Reason | Official | Extended | Of which holdout |');
    lines.push('|---|---:|---:|---:|');
    for (const n of s.not_measured) lines.push(`| ${n.reason.replace(/\|/g, '\\|')} | ${n.official} | ${n.extended} | ${n.holdout} |`);
    lines.push('');
  }
  const row = (label: string, x: Score) =>
    `| ${label} | ${x.cases} | ${pct(x.catch_rate)} (${x.caught}/${x.block_cases}) | ${pct(x.review_hit_rate)} (${x.review_hits}/${x.review_cases}) | ${pct(x.false_positive_rate)} (${x.interruptions}/${x.allow_cases}) | ${pct(x.precision)} | ${pct(x.balanced_score)} | ${pct(x.correct_tier)} (${x.tier_correct}/${x.tier_scored}) | ${x.unreachable} |`;
  const head = '| Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |';
  const rule = '|---:|---:|---:|---:|---:|---:|---:|';
  if (s.headline && s.headline.all) {
    lines.push('## Headline score (official set, labels from outside sources)');
    lines.push('');
    lines.push("The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.");
    lines.push('');
    lines.push(`| Channel | Cases ${head}`);
    lines.push(`|---|---:${rule}`);
    for (const [ch, v] of Object.entries(s.headline)) lines.push(row(ch, v.all));
    lines.push(row('all, holdout split', s.headline.all.holdout));
    lines.push('');
  }
  if (s.comparison && s.comparison.all) {
    lines.push('## Comparison score (labels from outside sources, every set)');
    lines.push('');
    lines.push("Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.");
    lines.push('');
    lines.push(`| Channel | Cases ${head}`);
    lines.push(`|---|---:${rule}`);
    for (const [ch, v] of Object.entries(s.comparison)) lines.push(row(ch, v.all));
    lines.push(row('all, holdout split', s.comparison.all.holdout));
    lines.push('');
  }
  for (const part of ['all', 'public', 'holdout'] as const) {
    lines.push(`## ${part === 'all' ? 'All cases' : part === 'public' ? 'Public split' : 'Holdout split'}`);
    lines.push('');
    lines.push('| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const [ch, v] of Object.entries(s.channels)) {
      const x = v[part];
      if (x.cases === 0) continue;
      lines.push(
        `| ${ch} | ${x.cases} | ${pct(x.catch_rate)} (${x.caught}/${x.block_cases}) | ${pct(x.review_hit_rate)} (${x.review_hits}/${x.review_cases}) | ${num(x.interruptions_per_100)} (${x.interruptions}/${x.allow_cases}) | ${pct(x.correct_tier)} (${x.tier_correct}/${x.tier_scored}) | ${x.unreachable} | ${num(x.latency_p50_ms)} | ${num(x.latency_p99_ms)} |`
      );
    }
    lines.push('');
  }
  if (s.suites && Object.keys(s.suites).length > 0) {
    lines.push('## By source (all cases)');
    lines.push('');
    lines.push('One row per origin of the cases. A row built from an external benchmark asks this benchmark\'s question (did the tool stop the action) on that benchmark\'s scenarios; it is not that benchmark\'s own score.');
    lines.push('');
    lines.push(`| Source | Labels by | Cases ${head}`);
    lines.push(`|---|---|---:${rule}`);
    for (const [suite, v] of Object.entries(s.suites)) {
      lines.push(row(`${suiteTitle(suite)} | ${suiteLabels(suite)}`, v.all));
    }
    lines.push('');
  }
  return lines.join('\n');
}
