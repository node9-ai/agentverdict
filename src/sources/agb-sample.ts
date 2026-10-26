// The fixed sample of agent-guard-bench's blind_v20 set (design 6.1.0,
// section 2), apart from the fetch so a test can check it: 100 `stop` rows
// per policy and 300 `allow` rows, each spread over the source's classes in
// proportion to their size (largest remainder, ties by class name), rows
// inside a class taken in the order of sha256("agb:" + id), a row skipped when
// its command text is already in the sample. The result depends on the rows
// alone, never on their order in the file.

import { createHash } from 'node:crypto';

export const STOP_PER_POLICY = 100;
export const ALLOW = 300;

export interface AgbRow {
  id: string;
  command: string;
  expect: 'stop' | 'allow';
  policy: 'A' | 'B' | 'C' | 'none';
  class: string;
  src: string;
  src_id: string;
}

const order = (id: string) => createHash('sha256').update(`agb:${id}`).digest('hex');

/** Splits n over the classes in proportion to their size, largest remainder first (ties by class name). */
export function allocate(sizes: Map<string, number>, n: number): Map<string, number> {
  const total = [...sizes.values()].reduce((s, x) => s + x, 0);
  const shares = [...sizes.entries()].map(([c, size]) => ({ c, exact: (n * size) / total }));
  const out = new Map(shares.map((s) => [s.c, Math.floor(s.exact)]));
  let left = n - [...out.values()].reduce((s, x) => s + x, 0);
  const frac = (x: number) => x - Math.floor(x);
  for (const s of [...shares].sort((a, b) => frac(b.exact) - frac(a.exact) || a.c.localeCompare(b.c))) {
    if (left === 0) break;
    out.set(s.c, out.get(s.c)! + 1);
    left--;
  }
  return out;
}

export function sampleRows(rows: AgbRow[], stopPerPolicy = STOP_PER_POLICY, allow = ALLOW): AgbRow[] {
  const taken = new Set<string>();
  const picked: AgbRow[] = [];
  const pick = (pool: AgbRow[], n: number) => {
    const byClass = new Map<string, AgbRow[]>();
    for (const r of pool) byClass.set(r.class, [...(byClass.get(r.class) ?? []), r]);
    const sizes = new Map([...byClass.entries()].map(([c, rs]) => [c, rs.length]));
    for (const [c, k] of [...allocate(sizes, n).entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      let got = 0;
      for (const r of [...byClass.get(c)!].sort((a, b) => order(a.id).localeCompare(order(b.id)))) {
        if (got === k) break;
        if (taken.has(r.command)) continue;
        taken.add(r.command);
        picked.push(r);
        got++;
      }
      if (got < k) throw new Error(`class ${c}: ${got} distinct commands, ${k} wanted`);
    }
  };
  for (const p of ['A', 'B', 'C'] as const) pick(rows.filter((r) => r.policy === p), stopPerPolicy);
  pick(rows.filter((r) => r.expect === 'allow'), allow);
  return picked.sort((a, b) => a.id.localeCompare(b.id));
}
