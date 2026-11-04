// Page data for the benchmark's web page (schema 1, the page brief's section
// 2): numbers from the published runs in results/, words and links from
// site/page.json. Counts only; no held-out case appears, since results/
// holds the public split case by case and the holdout as summary numbers.
//
//   npm run page-data -- --node9 <version> [--out site/benchmark.json]
//
// The board holds node9 at its default level (Standard); node9's three levels
// go in node9_levels; tools whose makers are reviewing their result are named
// in site/page.json's "review" with no number.

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

interface Run { summary: Summary; cases: CaseResult[] }
function readRun(dir: string): Run {
  return { summary: JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as Summary, cases: readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')) };
}

export function pageData(version: string, corpusVersion: string, runs: { soft: Run; standard: Run; strict: Run }, texts: any, corpusInfo: { public_cases: number; sources: number; public_sha256: string }) {
  const KEY = 'node9-standard';
  const std = runs.standard;
  const pub = std.cases.filter((r) => !r.private && r.set === 'official');
  const suites = [...new Set(pub.map((r) => r.suite as string))];
  return {
    schema: 1,
    mock: false,
    generated_at: new Date().toISOString(),
    corpus: { version: corpusVersion, public_sha256: corpusInfo.public_sha256, public_cases: corpusInfo.public_cases, holdout_cases: (std.summary.channels.all as any).holdout.cases as number, sources: corpusInfo.sources },
    board: [{ key: KEY, tool: 'node9', maker: 'node9', version, setup: 'default (Standard)', mock: false, measured_at: String(std.summary.measured_at).slice(0, 10),
      public: counts(std.summary.headline!.all.public as Score), holdout: counts(std.summary.headline!.all.holdout as Score) }],
    node9_levels: (['Soft', 'Standard', 'Strict'] as const).map((level) => {
      const r = runs[level.toLowerCase() as 'soft' | 'standard' | 'strict'];
      return { level, version, public: counts(r.summary.headline!.all.public as Score), holdout: counts(r.summary.headline!.all.holdout as Score) };
    }),
    areas: texts.areas,
    sources: suites.map((s) => {
      const rs = pub.filter((r) => r.suite === s);
      return { suite: s, title: SUITES[s]?.title ?? s, section: rs[0].section, cases: rs.length, origin: (ORIGIN[s] ?? []).map(([name, url]) => ({ name, url })), runs: { [KEY]: pair(rs) } };
    }),
    owasp: texts.owasp.map((o: any) => {
      const rs = pub.filter((r) => r.owasp === o.id);
      const h = rs.filter(headline), v = rs.filter((r) => r.section === 'vendor');
      return { ...o, cases: rs.length, headline: h.length ? { [KEY]: pair(h) } : null, vendor: v.length ? { [KEY]: pair(v) } : null };
    }),
    review: texts.review,
    links: texts.links,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values } = parseArgs({ options: { node9: { type: 'string' }, out: { type: 'string' } } });
  if (!values.node9) throw new Error('usage: npm run page-data -- --node9 <version> [--out site/benchmark.json]');
  const cv = readCorpusVersion();
  const dir = (adapter: string) => path.join(ROOT, 'results', adapter, values.node9 as string, `corpus-${cv.version}`);
  const runs = { soft: readRun(dir('node9-gate-soft')), standard: readRun(dir('node9-gate')), strict: readRun(dir('node9-gate-strict')) };
  const publicCorpus = loadCorpus().filter((r) => !r.private);
  const texts = JSON.parse(fs.readFileSync(path.join(ROOT, 'site', 'page.json'), 'utf-8'));
  const data = pageData(values.node9, cv.version, runs, texts, { public_cases: publicCorpus.length, sources: new Set(publicCorpus.map((r) => r.source)).size, public_sha256: (cv as any).public_sha256 });
  const out = values.out ?? path.join(ROOT, 'site', 'benchmark.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log(`node9 ${values.node9} on corpus ${cv.version} -> ${path.relative(ROOT, out)}`);
}
