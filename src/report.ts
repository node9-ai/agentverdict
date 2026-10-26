// Several runs side by side, per source, in two tables by who wrote the labels.
//
//   npm run report -- <run> [<run> ...] [--set official|extended|all]
//                     [--split public|holdout] [--ci] [--owasp] [--out FILE]
//
// --owasp adds a table per OWASP Agentic Top 10 risk after the headline
// score; without it the agreed report is unchanged.
//
// Each <run> is a result directory, given as a path or relative to results/
// ("node9-gate/2.33.2" picks that version's newest corpus directory, as in
// compare). The report has three parts:
//   1. the headline score of each run: the official set, outside labels
//      only, all channels (the comparison score);
//   2. per source, the headline section (outside labels): attacks stopped and
//      benign cases stopped, as counts ("stopped/cases") so a reader sees the
//      size of each source;
//   3. per source, the vendor section (labels written by node9's team or by a
//      competitor): the regression track and each side's own suite, with
//      equal weight in its own section, never in the headline.
//
// --set chooses the set (src/scope/): official (the default, parts 1 to 3),
// extended (the excluded cases, outside labels, then per reason code and
// source, so the excluded numbers stay visible), or all (every case, in the
// shape the report had before sets existed). A run's cases get their set
// from the current corpus by id when the run was written before sets
// existed; a case whose id the current corpus no longer has is in no set.
//
// --split keeps one side of the holdout split (src/split.ts), read from the
// `private` flag every result row carries: public = private false, holdout =
// private true. Without it the report covers every case.
//
// --ci adds a Wilson 95% interval to every rate and count (src/stats.ts), and,
// with two runs or more, an exact McNemar test of each run against the first
// on the outside-labelled cases both measured. Without it the output is the
// agreed report, unchanged.
//
// Counts use the cases a run could reach: unreachable and errored cases are
// left out of the denominator and shown as "not measured". A run that has no
// case of a source at all (an older corpus) shows "not run". Scoring is
// score() from score.ts, the same as summaries and compare.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { readJsonl } from './corpus.ts';
import { score } from './score.ts';
import type { CaseResult } from './types.ts';
import { SUITES, suiteTitle, type LabelOrigin } from './suites.ts';
import { originsFromCorpus, resolveRun, withOrigins } from './compare.ts';
import { EXTENDED_REASONS, isExtendedReason } from './scope/reasons.ts';
import { ASI } from './scope/owasp.ts';
import { formatInterval, formatP, mcnemar, wilson } from './stats.ts';

export interface ReportRun {
  /** Column heading, e.g. "node9-gate 2.33.2". */
  label: string;
  corpus: string;
  cases: CaseResult[];
}

type Labels = LabelOrigin | 'unknown';
const LABEL_TEXT: Record<Labels, string> = {
  outside: 'outside source',
  node9: "node9's team",
  competitor: 'competitor',
  unknown: 'unknown',
};

/**
 * The fixed rows, in a fixed reading order: by area, with short names.
 * A row is a suite plus who wrote its labels (the packages suite holds both
 * outside OSV records and node9's everyday installs). A suite or label origin
 * not listed here is appended after these, under its suites.ts title, so a new
 * source shows up without a change to this list.
 */
const ROWS: { suite: string; labels: Labels; name: string; area: string }[] = [
  { suite: 'creddata', labels: 'outside', name: 'CredData (Samsung)', area: 'secrets' },
  { suite: 'redcode-exec', labels: 'outside', name: 'RedCode-Exec', area: 'shell' },
  { suite: 'nl2sh-alfa', labels: 'outside', name: 'NL2SH-ALFA (ordinary commands)', area: 'shell' },
  { suite: 'benign-scripts', labels: 'outside', name: 'Benign scripts (MBPP Python, Exercism Bash)', area: 'shell' },
  { suite: 'agentdojo', labels: 'outside', name: 'AgentDojo, templates (injection in a tool result)', area: 'injection' },
  { suite: 'injecagent', labels: 'outside', name: 'InjecAgent', area: 'injection' },
  { suite: 'browsesafe', labels: 'outside', name: 'BrowseSafe-Bench (web pages)', area: 'injection' },
  { suite: 'notinject', labels: 'outside', name: 'NotInject (benign text, trigger words)', area: 'injection' },
  { suite: 'agentdojo-seq', labels: 'outside', name: 'AgentDojo, the action after a poisoned result', area: 'injection' },
  { suite: 'notinject-seq', labels: 'outside', name: 'NotInject, an ordinary action after benign text', area: 'injection' },
  { suite: 'agentdojo-calls', labels: 'outside', name: 'AgentDojo, the action alone', area: 'mcp' },
  { suite: 'packages', labels: 'outside', name: 'OSV, npm and PyPI', area: 'packages, volatile' },
  { suite: 'datadog-packages', labels: 'outside', name: 'DataDog, npm and PyPI', area: 'packages, volatile' },
  { suite: 'typomind', labels: 'outside', name: 'typomind (typosquats)', area: 'packages, volatile' },
  { suite: 'osv-other-ecosystems', labels: 'outside', name: 'OSV, other ecosystems', area: 'packages, volatile' },
  { suite: 'popular-packages', labels: 'outside', name: 'Most downloaded packages (npm, PyPI)', area: 'packages, volatile' },
  { suite: 'nemotron-pii', labels: 'outside', name: 'Nemotron-PII', area: 'pii' },
  { suite: 'gretel-pii-finance', labels: 'outside', name: 'Gretel, financial documents', area: 'pii' },
  { suite: 'openpii', labels: 'outside', name: 'OpenPII', area: 'pii' },
  { suite: 'pii-trace', labels: 'outside', name: 'PII-TRACE', area: 'pii' },
  { suite: 'exposure', labels: 'node9', name: 'Actions after reading outside content', area: 'injection' },
  { suite: 'dangerous-actions', labels: 'node9', name: 'Dangerous actions (category rule)', area: 'mcp' },
  { suite: 'node9-tests', labels: 'node9', name: "node9's own tests", area: 'all' },
  { suite: 'github-tokens', labels: 'node9', name: 'GitHub tokens', area: 'secrets' },
  { suite: 'packages', labels: 'node9', name: 'Everyday installs', area: 'packages' },
  { suite: 'everyday-installs-more', labels: 'node9', name: 'Everyday installs, other ecosystems', area: 'packages' },
  { suite: 'system-ops', labels: 'node9', name: 'System directory operations', area: 'shell' },
  { suite: 'agent-egress-bench', labels: 'competitor', name: "agent-egress-bench (pipelock's benchmark)", area: 'egress, mcp' },
];

/**
 * A row's attack or benign side with fewer measured cases than this is
 * marked "small" and shown with its Wilson 95% interval even without --ci:
 * a rate on a few dozen cases is read with its width (WP7 of the three-sets
 * plan).
 */
export const SMALL_MIN = 100;

const stopped = (v: CaseResult['actual']) => v === 'review' || v === 'block';
const measured = (r: CaseResult) => r.actual !== 'unreachable' && r.actual !== 'error';
const isAttack = (r: CaseResult) => r.expected === 'review' || r.expected === 'block';
const pct = (a: number, b: number) => (b === 0 ? 'n/a' : `${((a / b) * 100).toFixed(1)}%`);
const ci = (a: number, b: number) => (b === 0 ? '' : `; ${formatInterval(wilson(a, b))}`);
const rowKey = (r: CaseResult) => `${r.suite ?? 'unassigned'}\u0000${r.labels ?? 'unknown'}`;

/** "stopped/cases", "-" when the source has no case of that kind, plus what was not measured. */
function cell(rows: CaseResult[] | undefined, attacks: boolean, withCi = false): string {
  if (!rows) return 'not run';
  const kind = rows.filter((r) => isAttack(r) === attacks);
  if (kind.length === 0) return '-';
  const reach = kind.filter(measured);
  const missing = kind.length - reach.length;
  const hits = reach.filter((r) => stopped(r.actual)).length;
  const interval = () => formatInterval(wilson(hits, reach.length));
  const counted =
    reach.length === 0
      ? 'not measured'
      : `${hits}/${reach.length}` + (withCi ? ` (${interval()})` : reach.length < SMALL_MIN ? ` (small: ${interval()})` : '');
  return missing > 0 && reach.length > 0 ? `${counted} (${missing} not measured)` : counted;
}

const FIXED = new Map(ROWS.map((r, i) => [`${r.suite}\u0000${r.labels}`, i]));

/** Row order: the fixed rows first, in ROWS order, then any other suite in suites.ts order. */
function orderedKeys(runs: ReportRun[]): string[] {
  const keys = new Set(runs.flatMap((run) => run.cases.map(rowKey)));
  const order = Object.keys(SUITES);
  const rank = (k: string) => {
    const fixed = FIXED.get(k);
    if (fixed !== undefined) return fixed;
    const i = order.indexOf(k.split('\u0000')[0]);
    return ROWS.length + (i === -1 ? order.length : i);
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function rowName(k: string): { name: string; area: string } {
  const fixed = FIXED.get(k);
  if (fixed !== undefined) return ROWS[fixed];
  return { name: suiteTitle(k.split('\u0000')[0]), area: '' };
}

export type Split = 'public' | 'holdout';
export type SetFilter = 'official' | 'extended' | 'all';

/** One side of the holdout split, or every case when `split` is undefined. */
export function splitCases(cases: CaseResult[], split?: Split): CaseResult[] {
  if (split === undefined) return cases;
  return cases.filter((r) => r.private === (split === 'holdout'));
}

/** The cases of one set; `all` keeps every case, set or not. */
export function setCases(cases: CaseResult[], set: SetFilter): CaseResult[] {
  if (set === 'all') return cases;
  return cases.filter((r) => r.set === set);
}

const REASON_ORDER = Object.keys(EXTENDED_REASONS);

/** The extended set per reason code and source: where the excluded numbers are. */
function extendedTables(runs: ReportRun[], heads: string[], withCi: boolean): string[] {
  const L: string[] = [];
  const keyOf = (r: CaseResult) => `${r.extended_reason ?? '?'}\u0000${r.suite ?? 'unassigned'}`;
  const grouped = runs.map((run) => {
    const m = new Map<string, CaseResult[]>();
    for (const r of run.cases) {
      const k = keyOf(r);
      const list = m.get(k);
      if (list) list.push(r);
      else m.set(k, [r]);
    }
    return m;
  });
  const keys = [...new Set(runs.flatMap((run) => run.cases.map(keyOf)))].sort((a, b) => {
    const [ra, sa] = a.split('\u0000');
    const [rb, sb] = b.split('\u0000');
    return REASON_ORDER.indexOf(ra) - REASON_ORDER.indexOf(rb) || sa.localeCompare(sb);
  });
  L.push('## Per reason and source', '', 'Each row is one reason a category is out of the official set (definitions below) and one source. Attacks: attacks stopped out of the attacks measured. Benign: legitimate actions stopped by mistake.', '');
  L.push(`| Reason | Source | ${heads.map((h) => `Attacks: ${h}`).join(' | ')} | ${heads.map((h) => `Benign: ${h}`).join(' | ')} |`);
  L.push(`|---|---|${heads.map(() => '---:|').join('')}${heads.map(() => '---:|').join('')}`);
  for (const k of keys) {
    const [reason, suite] = k.split('\u0000');
    const att = grouped.map((g) => cell(g.get(k), true, withCi));
    const ben = grouped.map((g) => cell(g.get(k), false, withCi));
    L.push(`| \`${reason}\` | ${suiteTitle(suite)} | ${att.join(' | ')} | ${ben.join(' | ')} |`);
  }
  L.push('', '## Reasons', '');
  for (const code of REASON_ORDER) {
    if (!keys.some((k) => k.startsWith(`${code}\u0000`))) continue;
    if (isExtendedReason(code)) L.push(`- \`${code}\`: ${EXTENDED_REASONS[code].definition}`);
  }
  L.push('');
  return L;
}

/**
 * Cases per OWASP Agentic Top 10 risk (src/scope/owasp.ts), in two column
 * groups by who wrote the labels: the headline section (outside labels) and
 * the vendor section (node9's team or a competitor), so a risk measured only
 * by a party's own suite still shows its cases, apart from the headline.
 * Every risk is listed: "no cases yet" where the corpus has none, "none"
 * where only the other section has cases.
 */
export function owaspTable(runs: ReportRun[], withCi = false): string[] {
  const L: string[] = [];
  const heads = runs.map((r) => r.label);
  const groups = [
    { name: 'headline', pick: (r: CaseResult) => r.labels === 'outside' },
    { name: 'vendor', pick: (r: CaseResult) => r.labels !== undefined && r.labels !== 'outside' },
  ];
  L.push('## By OWASP Agentic Top 10 risk', '');
  L.push("The risk each case falls under, by the written rule in src/scope/owasp.ts (AgentVerdict's mapping). Headline: outside labels. Vendor: labels written by one of the parties. Attacks: attacks stopped out of the attacks measured. Benign: legitimate actions stopped by mistake.", '');
  const cols = groups.flatMap((g) => [...heads.map((h) => `${g.name} attacks: ${h}`), ...heads.map((h) => `${g.name} benign: ${h}`)]);
  L.push(`| Risk | Name | ${cols.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' | ')} |`);
  L.push(`|---|---|${cols.map(() => '---:|').join('')}`);
  for (const [id, name] of Object.entries(ASI)) {
    const inRisk = runs.map((run) => run.cases.filter((r) => r.owasp === id));
    if (inRisk.every((rows) => rows.length === 0)) {
      L.push(`| ${id} | ${name} | ${cols.map(() => 'no cases yet').join(' | ')} |`);
      continue;
    }
    const cells = groups.flatMap((g) => {
      const per = inRisk.map((rows) => rows.filter(g.pick));
      if (per.every((rows) => rows.length === 0)) return [...heads, ...heads].map(() => 'none');
      return [...per.map((rows) => cell(rows, true, withCi)), ...per.map((rows) => cell(rows, false, withCi))];
    });
    L.push(`| ${id} | ${name} | ${cells.join(' | ')} |`);
  }
  L.push('');
  return L;
}

export function buildReport(input: ReportRun[], split?: Split, opts: { ci?: boolean; set?: SetFilter; owasp?: boolean } = {}): string {
  const withCi = opts.ci === true;
  const set: SetFilter = opts.set ?? 'official';
  const runs = input.map((run) => ({ ...run, cases: setCases(splitCases(run.cases, split), set) }));
  const L: string[] = [];
  const grouped = runs.map((run) => {
    const m = new Map<string, CaseResult[]>();
    for (const r of run.cases) {
      const k = rowKey(r);
      const list = m.get(k);
      if (list) list.push(r);
      else m.set(k, [r]);
    }
    return m;
  });
  const heads = runs.map((r) => r.label);

  const scopeText = set === 'all' ? '' : `${set} set`;
  const splitText = split ? `${split} split only` : '';
  const qualifier = [scopeText, splitText].filter(Boolean).join(', ');
  L.push(qualifier ? `# Side-by-side report, ${qualifier}` : '# Side-by-side report', '');
  L.push(...runs.map((r) => `- ${r.label}: corpus ${r.corpus}`), '');

  L.push(
    set === 'official'
      ? '## Headline score (official set, outside labels, all channels)'
      : set === 'extended'
        ? '## Extended set (outside labels, all channels): the excluded cases'
        : '## Comparison score (outside labels, all channels)',
    ''
  );
  L.push('| Run | Attacks stopped | False positives | Precision | Balanced score |');
  L.push('|---|---:|---:|---:|---:|');
  for (const run of runs) {
    const s = score(run.cases.filter((r) => r.labels === 'outside'));
    const att = s.caught + s.review_hits;
    const attCases = s.block_cases + s.review_cases;
    const prec = att + s.interruptions === 0 ? 'n/a' : pct(att, att + s.interruptions);
    const bal = s.balanced_score === null ? 'n/a' : `${(s.balanced_score * 100).toFixed(1)}%`;
    L.push(
      withCi
        ? `| ${run.label} | ${pct(att, attCases)} (${att}/${attCases}${ci(att, attCases)}) | ${pct(s.interruptions, s.allow_cases)} (${s.interruptions}/${s.allow_cases}${ci(s.interruptions, s.allow_cases)}) | ${prec} | ${bal} |`
        : `| ${run.label} | ${pct(att, attCases)} (${att}/${attCases}) | ${pct(s.interruptions, s.allow_cases)} (${s.interruptions}/${s.allow_cases}) | ${prec} | ${bal} |`
    );
  }
  L.push('');
  if (withCi) {
    L.push('Intervals: Wilson 95%.', '');
    if (runs.length > 1) {
      L.push(`## Paired test against ${runs[0].label} (outside labels)`, '');
      L.push(
        'Exact McNemar test on the cases both runs measured. A case is right when the run stopped it exactly when its label says to. Only cases where one run is right and the other wrong count.',
        ''
      );
      L.push('| Run | Cases | Right only in this run | Right only in the first | p |');
      L.push('|---|---:|---:|---:|---:|');
      const right = (r: CaseResult) => measured(r) && stopped(r.actual) === isAttack(r);
      const first = new Map(runs[0].cases.filter((r) => r.labels === 'outside' && measured(r)).map((r) => [r.id, r]));
      for (const run of runs.slice(1)) {
        let n = 0;
        let onlyThis = 0;
        let onlyFirst = 0;
        for (const r of run.cases) {
          const f = first.get(r.id);
          if (!f || !measured(r)) continue;
          n++;
          if (right(r) && !right(f)) onlyThis++;
          else if (!right(r) && right(f)) onlyFirst++;
        }
        L.push(`| ${run.label} | ${n} | ${onlyThis} | ${onlyFirst} | ${formatP(mcnemar(onlyThis, onlyFirst))} |`);
      }
      L.push('');
    }
  }

  const table = (title: string, intro: string, keep: (labels: Labels) => boolean, withLabels: boolean) => {
    const keys = orderedKeys(runs).filter((k) => keep(k.split('\u0000')[1] as Labels));
    if (keys.length === 0) return;
    L.push(`## ${title}`, '', intro, '');
    const lead = withLabels ? '| Source | Labels by |' : '| Source | Area |';
    L.push(`${lead} ${heads.map((h) => `Attacks: ${h}`).join(' | ')} | ${heads.map((h) => `Benign: ${h}`).join(' | ')} |`);
    L.push(`|---|---|${heads.map(() => '---:|').join('')}${heads.map(() => '---:|').join('')}`);
    for (const k of keys) {
      const labels = k.split('\u0000')[1] as Labels;
      const { name, area } = rowName(k);
      const att = grouped.map((g) => cell(g.get(k), true, withCi));
      const ben = grouped.map((g) => cell(g.get(k), false, withCi));
      const lead2 = withLabels ? `| ${name} | ${LABEL_TEXT[labels]} |` : `| ${name} | ${area} |`;
      L.push(`${lead2} ${att.join(' | ')} | ${ben.join(' | ')} |`);
    }
    L.push('');
  };

  if (opts.owasp) L.push(...owaspTable(runs, withCi));
  if (set === 'extended') {
    L.push(...extendedTables(runs, heads, withCi));
    return L.join('\n');
  }
  table(
    set === 'official' ? 'Per source: headline section (outside labels)' : 'Per source: outside labels',
    `Labels written by a party other than node9 or the competitor: the cases the headline score is computed on. Attacks: attacks stopped out of the attacks measured (higher is better). Benign: legitimate actions stopped by mistake (lower is better). A side with fewer than ${SMALL_MIN} measured cases is marked small and shown with its Wilson 95% interval. Rows marked volatile depend on live registries and advisory databases at run time.`,
    (l) => l === 'outside',
    false
  );
  table(
    set === 'official' ? 'Per source: vendor section (labels written by one of the parties)' : 'Per source: labels written by one of the parties',
    "node9's own tests (the regression track) and a competitor's own suite. Each side's definitions, with equal weight in this section, never in the headline.",
    (l) => l !== 'outside',
    true
  );
  return L.join('\n');
}

function loadReportRun(dir: string, origins: ReturnType<typeof originsFromCorpus>): ReportRun {
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as {
    adapter: string;
    tool_version: string;
    corpus_version: string;
  };
  return {
    label: `${summary.adapter} ${summary.tool_version}`,
    corpus: summary.corpus_version,
    cases: withOrigins(readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')), origins),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { out: { type: 'string' }, split: { type: 'string' }, ci: { type: 'boolean' }, set: { type: 'string', default: 'official' }, owasp: { type: 'boolean' } },
  });
  const split = values.split;
  const set = values.set;
  if (
    positionals.length === 0 ||
    (split !== undefined && split !== 'public' && split !== 'holdout') ||
    (set !== 'official' && set !== 'extended' && set !== 'all')
  ) {
    console.error('usage: npm run report -- <run> [<run> ...] [--set official|extended|all] [--split public|holdout] [--ci] [--owasp] [--out FILE]');
    process.exit(2);
  }
  const origins = originsFromCorpus();
  const md = buildReport(
    positionals.map((spec) => loadReportRun(resolveRun(spec), origins)),
    split as Split | undefined,
    { ci: values.ci === true, set: set as SetFilter, owasp: values.owasp === true }
  );
  if (values.out) fs.writeFileSync(values.out, md + '\n');
  console.log(md);
}
