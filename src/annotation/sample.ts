// The sample for the blind label check (annotation/PROTOCOL.md): a fixed,
// seeded draw from the current corpus, recorded as ids only.
//
//   npm run annotate:sample [-- --size 200 --out annotation/sample-<version>.json]
//
// Rule: official set, public split; the sources whose expected verdict
// AgentVerdict wrote or mapped (LABEL_RULES mapped, or LABELS node9 or
// competitor); strata by source and expected verdict; at least MIN per
// stratum with cases, the rest in proportion to stratum size by largest
// remainder; within a stratum the first cases in sha256(SALT:id) order. A
// pure function of the corpus, so the same corpus gives the same sample.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, corpusHash, loadCorpus, readCorpusVersion } from '../corpus.ts';
import { labelRuleOf, labelsOf } from '../suites.ts';
import type { BenchRecord } from '../types.ts';

export const SALT = 'node9-bench/annotation/v1';
export const DEFAULT_SIZE = 200;
export const MIN_PER_STRATUM = 3;

const rank = (id: string) => createHash('sha256').update(`${SALT}:${id}`).digest('hex');

/** Whether the source's expected verdicts were written or mapped by this benchmark. */
export function labelsWrittenHere(source: string): boolean {
  return labelsOf(source) !== 'outside' || labelRuleOf(source)?.rule === 'mapped';
}

export interface Sample {
  corpus_version: string;
  corpus_sha256: string;
  salt: string;
  size: number;
  rule: string;
  strata: Array<{ source: string; expected: string; population: number; drawn: number }>;
  /** Case ids in the order the page shows them. */
  cases: string[];
}

export function drawSample(records: BenchRecord[], size = DEFAULT_SIZE): Omit<Sample, 'corpus_version' | 'corpus_sha256'> {
  const strata = new Map<string, BenchRecord[]>();
  for (const r of records) {
    if (r.private || r.set !== 'official' || !labelsWrittenHere(r.source)) continue;
    const k = `${r.source}\u0000${r.expected}`;
    const list = strata.get(k);
    if (list) list.push(r);
    else strata.set(k, [r]);
  }
  const keys = [...strata.keys()].sort();
  const total = keys.reduce((n, k) => n + strata.get(k)!.length, 0);
  if (total === 0) throw new Error('annotation: no case to sample');
  // Allocation: the minimum to every stratum, the rest proportional by largest remainder, capped by the stratum's size.
  const alloc = new Map(keys.map((k) => [k, Math.min(MIN_PER_STRATUM, strata.get(k)!.length)]));
  let rest = size - [...alloc.values()].reduce((a, b) => a + b, 0);
  if (rest < 0) throw new Error(`annotation: ${size} is fewer than the minimum per stratum allows (${size - rest})`);
  const room = (k: string) => strata.get(k)!.length - alloc.get(k)!;
  const shares = keys.map((k) => ({ k, exact: (rest * strata.get(k)!.length) / total }));
  for (const s of shares) {
    const give = Math.min(Math.floor(s.exact), room(s.k));
    alloc.set(s.k, alloc.get(s.k)! + give);
    rest -= give;
  }
  for (const s of shares.sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.k.localeCompare(b.k))) {
    if (rest === 0) break;
    if (room(s.k) > 0) {
      alloc.set(s.k, alloc.get(s.k)! + 1);
      rest--;
    }
  }
  const cases: string[] = [];
  const out: Sample['strata'] = [];
  for (const k of keys) {
    const list = [...strata.get(k)!].sort((a, b) => rank(a.id).localeCompare(rank(b.id)));
    const drawn = list.slice(0, alloc.get(k)!);
    const [source, expected] = k.split('\u0000');
    out.push({ source, expected, population: list.length, drawn: drawn.length });
    cases.push(...drawn.map((r) => r.id));
  }
  // The page order: by the same hash, so the sources are interleaved and the annotator cannot read the source from the order.
  cases.sort((a, b) => rank(a).localeCompare(rank(b)));
  return {
    salt: SALT,
    size: cases.length,
    rule: `official set, public split, sources whose labels AgentVerdict wrote or mapped; strata source x expected, at least ${MIN_PER_STRATUM} each, the rest proportional; first in sha256("${SALT}:<id>") order`,
    strata: out,
    cases,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values } = parseArgs({ options: { size: { type: 'string', default: String(DEFAULT_SIZE) }, out: { type: 'string' } } });
  const version = readCorpusVersion();
  if (corpusHash() !== version.sha256) throw new Error('the corpus is not pinned; lock it first');
  const sample: Sample = { corpus_version: version.version, corpus_sha256: version.sha256, ...drawSample(loadCorpus(), Number(values.size)) };
  const out = values.out ?? path.join(ROOT, 'annotation', `sample-${version.version}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(sample, null, 2) + '\n');
  console.log(`${sample.size} cases in ${sample.strata.length} strata -> ${path.relative(ROOT, out)}`);
  for (const s of sample.strata) console.log(`  ${s.source.padEnd(32)} ${s.expected.padEnd(7)} ${String(s.drawn).padStart(3)} of ${s.population}`);
}
