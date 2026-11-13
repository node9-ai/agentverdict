// Page data for the benchmark's web page (schema 1, the page brief's section
// 2): numbers from the published runs in results/, words and links from
// site/page.json. Counts only; no held-out case appears, since results/
// holds the public split case by case and the holdout as summary numbers.
//
//   npm run page-data -- --node9 <version> [--out site/benchmark.json]
//     [--page site/page.json] [--corpus-root <checkout>] [--results <dir>]
//
// The board holds node9 at its default level (Standard); node9's levels go in
// node9_levels, each only when it was measured at the board's version (a
// level measured on an older release is left out, never shown under the new
// version). Other tools come from page.json's "tools": a tool whose result is
// published joins the board with its setup, our notes and its maker's
// statement as written; a tool whose maker is still reviewing its result is
// named in "review" with no number.
//
// --corpus-root reads the corpus from another checkout, for a board that
// stays on an earlier corpus version than this repository pins; the runs are
// then read from results/<adapter>/<version>/corpus-<that version>.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, readCorpusVersion, readJsonl } from './corpus.ts';
import { score, type Score, type Summary } from './score.ts';
import { SUITES } from './suites.ts';
import type { CaseResult } from './types.ts';

export interface Counts { attacks_stopped: number; attacks: number; benign_stopped: number; benign: number; balanced: number | null; precision: number | null }
type Pair = { attacks: [number, number]; benign: [number, number] };

/** A Score as the page shows it. */
export function counts(s: Score): Counts {
  return { attacks_stopped: s.caught + s.review_hits, attacks: s.block_cases + s.review_cases, benign_stopped: s.interruptions, benign: s.allow_cases, balanced: s.balanced_score, precision: s.precision };
}
const pair = (rs: CaseResult[]): Pair => { const c = counts(score(rs)); return { attacks: [c.attacks_stopped, c.attacks], benign: [c.benign_stopped, c.benign] }; };
const headline = (r: CaseResult) => r.set === 'official' && r.section === 'headline';

/** Where a suite's cases come from (the README's credits); node9's generated suites have none. */
const ORIGIN: Record<string, Array<[string, string]>> = {
  'node9-tests': [['node9-proxy', 'https://github.com/node9-ai/node9-proxy']],
  'agent-egress-bench': [['agent-egress-bench', 'https://github.com/luckyPipewrench/agent-egress-bench']],
  'notinject-seq': [['NotInject', 'https://huggingface.co/datasets/leolee99/NotInject']],
  'agentic-security-benchmark': [['agentic-security-benchmark', 'https://github.com/gitayg/agentic-security-benchmark']],
  'agentdojo-seq': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'agentdojo-agents': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'dangerous-actions': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  packages: [['OpenSSF malicious-packages', 'https://github.com/ossf/malicious-packages']],
  'osv-other-ecosystems': [['OpenSSF malicious-packages', 'https://github.com/ossf/malicious-packages']],
  'datadog-packages': [['DataDog', 'https://github.com/DataDog/malicious-software-packages-dataset']],
  typomind: [['typomind', 'https://github.com/ldklab/typomind-release']],
  'popular-packages': [['top-pypi-packages', 'https://github.com/hugovk/top-pypi-packages'], ['npm download counts', 'https://github.com/npm/registry/blob/main/docs/download-counts.md']],
  'nemotron-pii': [['Nemotron-PII', 'https://huggingface.co/datasets/nvidia/Nemotron-PII']],
  'gretel-pii-finance': [['Gretel', 'https://huggingface.co/datasets/gretelai/synthetic_pii_finance_multilingual']],
  openpii: [['OpenPII 1M', 'https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1m']],
  creddata: [['CredData', 'https://github.com/Samsung/CredData']],
  'redcode-exec': [['RedCode', 'https://github.com/AI-secure/RedCode']],
  'nl2sh-alfa': [['NL2SH-ALFA', 'https://huggingface.co/datasets/westenfelder/NL2SH-ALFA']],
  'benign-scripts': [['MBPP', 'https://huggingface.co/datasets/google-research-datasets/mbpp'], ['Exercism Bash', 'https://github.com/exercism/bash']],
  'agent-guard-bench': [['agent-guard-bench', 'https://github.com/CASEY-OS/agent-guard-bench']],
};

export interface Run { summary: Summary; cases: CaseResult[] }
export function readRun(dir: string): Run {
  return { summary: JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as Summary, cases: readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')) };
}

/** A tool other than node9, as site/page.json describes it. */
export interface ToolText {
  key: string;
  adapter: string;
  version: string;
  tool: string;
  /** The tool's name in a table column, when two rows share a tool (a mode of the same tool). */
  column?: string;
  maker: string;
  setup: string;
  status: 'published' | 'review';
  published_on?: string | null;
  notes?: string[];
  statement?: { by: string; date: string; text: string };
}

/** The run behind each published tool; a published tool without one is an error, never a blank row. */
export function toolRuns(tools: ToolText[], corpusVersion: string, read: (adapter: string, version: string) => Run | undefined): Map<string, Run> {
  const out = new Map<string, Run>();
  for (const t of tools.filter((t) => t.status === 'published')) {
    const run = read(t.adapter, t.version);
    if (!run) throw new Error(`${t.tool} ${t.version} is marked published but results/${t.adapter}/${t.version}/corpus-${corpusVersion} has no run`);
    const s = run.summary as any;
    if (s.corpus_version !== corpusVersion) throw new Error(`${t.tool}: run made on corpus ${s.corpus_version}, the board is on ${corpusVersion}`);
    if (s.tool_version !== t.version) throw new Error(`${t.tool}: run made with ${s.tool_version}, page.json says ${t.version}`);
    out.set(t.key, run);
  }
  return out;
}

export function pageData(version: string, corpusVersion: string, runs: { soft?: Run; standard: Run; strict?: Run }, texts: any, corpusInfo: { public_cases: number; sources: number; public_sha256: string }, others: Map<string, Run> = new Map()) {
  const KEY = 'node9-standard';
  const std = runs.standard;
  const official = (run: Run) => run.cases.filter((r) => !r.private && r.set === 'official');
  const pub = official(std);
  const suites = [...new Set(pub.map((r) => r.suite as string))];
  const tools: ToolText[] = texts.tools ?? [];
  const published = tools.filter((t) => t.status === 'published' && others.has(t.key));
  // Every board row's public cases, node9 first, then the published tools.
  const byKey: Array<[string, CaseResult[]]> = [[KEY, pub], ...published.map((t): [string, CaseResult[]] => [t.key, official(others.get(t.key)!)])];
  const each = (pick: (r: CaseResult) => boolean) => Object.fromEntries(byKey.map(([k, rs]) => [k, pair(rs.filter(pick))]));
  return {
    schema: 1,
    mock: false,
    generated_at: new Date().toISOString(),
    corpus: { version: corpusVersion, public_sha256: corpusInfo.public_sha256, public_cases: corpusInfo.public_cases, holdout_cases: (std.summary.channels.all as any).holdout.cases as number, sources: corpusInfo.sources },
    board: [
      { key: KEY, tool: 'node9', column: 'node9', maker: 'node9', version, setup: 'default (Standard)', mock: false, measured_at: String(std.summary.measured_at).slice(0, 10),
        public: counts(std.summary.headline!.all.public as Score), holdout: counts(std.summary.headline!.all.holdout as Score), notes: [] as string[], statement: null as ToolText['statement'] | null },
      ...published.map((t) => {
        const s = others.get(t.key)!.summary;
        return { key: t.key, tool: t.tool, column: t.column ?? t.tool, maker: t.maker, version: t.version, setup: t.setup, mock: false, measured_at: String(s.measured_at).slice(0, 10),
          public: counts(s.headline!.all.public as Score), holdout: s.headline!.all.holdout ? counts(s.headline!.all.holdout as Score) : null, notes: t.notes ?? [], statement: t.statement ?? null };
      }),
    ],
    board_notes: (texts.board_notes ?? []) as string[],
    node9_levels: (['Soft', 'Standard', 'Strict'] as const).flatMap((level) => {
      const r = runs[level.toLowerCase() as 'soft' | 'standard' | 'strict'];
      return r ? [{ level, version, public: counts(r.summary.headline!.all.public as Score), holdout: counts(r.summary.headline!.all.holdout as Score) }] : [];
    }),
    areas: texts.areas,
    sources: suites.map((s) => {
      const rs = pub.filter((r) => r.suite === s);
      return { suite: s, title: SUITES[s]?.title ?? s, section: rs[0].section, cases: rs.length, origin: (ORIGIN[s] ?? []).map(([name, url]) => ({ name, url })), runs: each((r) => r.suite === s) };
    }),
    owasp: texts.owasp.map((o: any) => {
      const rs = pub.filter((r) => r.owasp === o.id);
      const h = rs.filter(headline), v = rs.filter((r) => r.section === 'vendor');
      return { ...o, cases: rs.length, headline: h.length ? each((r) => r.owasp === o.id && headline(r)) : null, vendor: v.length ? each((r) => r.owasp === o.id && r.section === 'vendor') : null };
    }),
    review: tools.filter((t) => !published.includes(t)).map((t) => ({ tool: t.tool, maker: t.maker, version: t.version, published_on: t.published_on ?? null })),
    links: texts.links,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values } = parseArgs({ options: { node9: { type: 'string' }, out: { type: 'string' }, page: { type: 'string' }, 'corpus-root': { type: 'string' }, results: { type: 'string' } } });
  if (!values.node9) throw new Error('usage: npm run page-data -- --node9 <version> [--out site/benchmark.json] [--page site/page.json] [--corpus-root <checkout>] [--results <dir>]');
  const corpusRoot = path.resolve(values['corpus-root'] ?? ROOT);
  const resultsRoot = path.resolve(values.results ?? path.join(ROOT, 'results'));
  const cv = readCorpusVersion(path.join(corpusRoot, 'corpus-version.json'));
  const dir = (adapter: string, v: string) => path.join(resultsRoot, adapter, v, `corpus-${cv.version}`);
  const maybe = (adapter: string, v = values.node9 as string) => (fs.existsSync(path.join(dir(adapter, v), 'summary.json')) ? readRun(dir(adapter, v)) : undefined);
  const runs = { soft: maybe('node9-gate-soft'), standard: readRun(dir('node9-gate', values.node9)), strict: maybe('node9-gate-strict') };
  const publicCorpus = loadCorpus(path.join(corpusRoot, 'corpus')).filter((r) => !r.private);
  const texts = JSON.parse(fs.readFileSync(path.resolve(values.page ?? path.join(ROOT, 'site', 'page.json')), 'utf-8'));
  const others = toolRuns(texts.tools ?? [], cv.version, (adapter, v) => maybe(adapter, v));
  const data = pageData(values.node9, cv.version, runs, texts, { public_cases: publicCorpus.length, sources: new Set(publicCorpus.map((r) => r.source)).size, public_sha256: (cv as any).public_sha256 }, others);
  const out = values.out ?? path.join(ROOT, 'site', 'benchmark.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log(`node9 ${values.node9}${others.size ? ` and ${[...others.keys()].join(', ')}` : ''} on corpus ${cv.version} -> ${path.relative(ROOT, out) || out}`);
}
