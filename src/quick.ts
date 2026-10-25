// The quick set: a small, fixed slice of the corpus for runs between changes
// (minutes, not hours). The full corpus stays the measure for a release.
//
// Rule, fixed before measuring:
//   - the official set only (src/scope/): the quick set is the benchmark in
//     small, so an excluded case never enters it;
//   - public split only (private false): the holdout is never used while
//     developing;
//   - every stratum (source x expected verdict) contributes, so no source and
//     no kind of case drops out;
//   - from each stratum, the first QUICK_SHARE of its public cases (at least
//     QUICK_MIN, or all of them when fewer) in sha256(SALT:id) order.
// It is a pure function of the corpus, so the same corpus gives the same set
// on any machine, and a case joins or leaves only when the corpus changes.

import { createHash } from 'node:crypto';
import type { BenchRecord } from './types.ts';

export const QUICK_SHARE = 0.1;
export const QUICK_MIN = 5;
const SALT = 'node9-bench/quick/v1';

const rank = (id: string) => createHash('sha256').update(`${SALT}:${id}`).digest('hex');

export function quickSet(records: BenchRecord[]): Set<string> {
  const strata = new Map<string, BenchRecord[]>();
  for (const r of records) {
    if (r.private || r.set !== 'official') continue;
    const k = `${r.source}\u0000${r.expected}`;
    const list = strata.get(k);
    if (list) list.push(r);
    else strata.set(k, [r]);
  }
  const out = new Set<string>();
  for (const list of strata.values()) {
    const take = Math.min(list.length, Math.max(QUICK_MIN, Math.ceil(list.length * QUICK_SHARE)));
    for (const r of [...list].sort((a, b) => rank(a.id).localeCompare(rank(b.id))).slice(0, take)) out.add(r.id);
  }
  return out;
}
