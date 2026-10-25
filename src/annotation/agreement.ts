// Agreement figures and the decision rules of the blind check
// (annotation/PROTOCOL.md), computed from two answer files and the corpus.
//
//   npm run annotate:agreement -- annotation/sample-<v>.json annotation/answers-<founder>.json annotation/answers-<outside>.json [--out FILE]
//
// The second answers file is the outside annotator's: the promotion rule
// (3) and the mapped-rule check (4) read that one. Output: overall and per
// source, Cohen's kappa on stop-or-allow and on the three tiers, between the
// annotators and between each and the label; the contested cases (rule 1,
// ids only); the low-agreement cases (rule 2); and each vendor source's
// promotion verdict (rule 3).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadCorpus } from '../corpus.ts';
import { cohenKappa } from '../stats.ts';
import { labelsOf } from '../suites.ts';
import type { BenchRecord, Verdict } from '../types.ts';
import type { Sample } from './sample.ts';

export interface Answers {
  annotator: string;
  corpus_version: string;
  answers: Record<string, Verdict>;
}

export const PROMOTION = { minAgreement: 0.9, minKappa: 0.6 };
export const REVISIT_KAPPA = 0.6;

const stop = (v: Verdict) => (v === 'allow' ? 'allow' : 'stop');

export interface SourceFigures {
  source: string;
  labels: string;
  n: number;
  /** Agreement rate on stop-or-allow. */
  rate: { ab: number; aLabel: number; bLabel: number };
  kappaStop: { ab: number | null; aLabel: number | null; bLabel: number | null };
  kappaTier: { ab: number | null; aLabel: number | null; bLabel: number | null };
  contested: string[];
  lowAgreement: string[];
  /** For a vendor source: whether rule 3 promotes it. */
  promoted?: boolean;
  /** For a mapped source: whether rule 4 asks for a revisit. */
  revisit?: boolean;
}

export function agreement(sample: Sample, a: Answers, b: Answers, corpus: BenchRecord[]): { overall: SourceFigures; sources: SourceFigures[] } {
  const byId = new Map(corpus.map((r) => [r.id, r]));
  const ids = sample.cases.filter((id) => a.answers[id] && b.answers[id]);
  const figures = (source: string, list: string[]): SourceFigures => {
    const A = list.map((id) => a.answers[id]);
    const B = list.map((id) => b.answers[id]);
    const L = list.map((id) => byId.get(id)!.expected);
    const rate = (x: Verdict[], y: Verdict[]) => (list.length === 0 ? 0 : x.filter((v, i) => stop(v) === stop(y[i])).length / list.length);
    const contested = list.filter((id, i) => stop(A[i]) === stop(B[i]) && stop(A[i]) !== stop(L[i]));
    const lowAgreement = list.filter((id, i) => stop(A[i]) !== stop(B[i]));
    const labels = source === 'all' ? 'mixed' : (labelsOf(source) ?? 'unknown');
    const f: SourceFigures = {
      source,
      labels,
      n: list.length,
      rate: { ab: rate(A, B), aLabel: rate(A, L), bLabel: rate(B, L) },
      kappaStop: { ab: cohenKappa(A.map(stop), B.map(stop)), aLabel: cohenKappa(A.map(stop), L.map(stop)), bLabel: cohenKappa(B.map(stop), L.map(stop)) },
      kappaTier: { ab: cohenKappa(A, B), aLabel: cohenKappa(A, L), bLabel: cohenKappa(B, L) },
      contested,
      lowAgreement,
    };
    // Kappa is undefined when the source's sampled labels are all one class
    // (a benign-only source); the agreement rate alone decides then.
    const kB = f.kappaStop.bLabel;
    if (source !== 'all' && labels !== 'outside') f.promoted = f.rate.bLabel >= PROMOTION.minAgreement && (kB === null || kB >= PROMOTION.minKappa);
    if (source !== 'all' && labels === 'outside') f.revisit = kB === null ? f.rate.bLabel < PROMOTION.minAgreement : kB < REVISIT_KAPPA;
    return f;
  };
  const sources = [...new Set(ids.map((id) => byId.get(id)!.source))].sort();
  return { overall: figures('all', ids), sources: sources.map((s) => figures(s, ids.filter((id) => byId.get(id)!.source === s))) };
}

const k = (x: number | null) => (x === null ? 'n/a' : x.toFixed(2));
const pct = (x: number) => `${(100 * x).toFixed(0)}%`;

export function renderAgreement(sample: Sample, a: Answers, b: Answers, res: { overall: SourceFigures; sources: SourceFigures[] }): string {
  const L: string[] = [];
  L.push(`# Blind label check: agreement (corpus ${sample.corpus_version})`, '');
  L.push(`- Sample: ${sample.cases.length} cases; answered by both: ${res.overall.n}`);
  L.push(`- A: ${a.annotator}; B (outside): ${b.annotator}`, '');
  L.push('| Source | Labels | n | A=B | A=label | B=label | kappa A,B (stop) | kappa A,label | kappa B,label | kappa A,B (tier) | contested | low agreement | rule 3 / 4 |');
  L.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|');
  const row = (f: SourceFigures) => {
    const verdict = f.promoted !== undefined ? (f.promoted ? 'promote' : 'stays vendor') : f.revisit !== undefined ? (f.revisit ? 'revisit mapping' : 'mapping holds') : '';
    L.push(
      `| ${f.source} | ${f.labels} | ${f.n} | ${pct(f.rate.ab)} | ${pct(f.rate.aLabel)} | ${pct(f.rate.bLabel)} | ${k(f.kappaStop.ab)} | ${k(f.kappaStop.aLabel)} | ${k(f.kappaStop.bLabel)} | ${k(f.kappaTier.ab)} | ${f.contested.length} | ${f.lowAgreement.length} | ${verdict} |`
    );
  };
  row(res.overall);
  for (const f of res.sources) row(f);
  L.push('', `Rules (annotation/PROTOCOL.md): a case is contested when both annotators agree and differ from the label; a vendor source is promoted when B agrees with the label on at least ${pct(PROMOTION.minAgreement)} of its cases and kappa(B, label) is at least ${PROMOTION.minKappa}; a mapped rule is revisited when kappa(B, label) is below ${REVISIT_KAPPA}.`, '');
  const contested = res.sources.flatMap((f) => f.contested.map((id) => `- \`${id}\` (${f.source})`));
  if (contested.length > 0) L.push('## Contested labels (to the dispute procedure)', '', ...contested, '');
  const low = res.sources.flatMap((f) => f.lowAgreement.map((id) => `- \`${id}\` (${f.source})`));
  if (low.length > 0) L.push('## Low agreement (the label stands)', '', ...low, '');
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' } } });
  if (positionals.length !== 3) {
    console.error('usage: npm run annotate:agreement -- <sample.json> <answers-A.json> <answers-B-outside.json> [--out FILE]');
    process.exit(2);
  }
  const [sample, a, b] = positionals.map((p) => JSON.parse(fs.readFileSync(p, 'utf-8')));
  const md = renderAgreement(sample as Sample, a as Answers, b as Answers, agreement(sample as Sample, a as Answers, b as Answers, loadCorpus()));
  if (values.out) fs.writeFileSync(values.out, md + '\n');
  console.log(md);
}
