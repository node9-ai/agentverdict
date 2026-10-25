// One call, one case. Two cases are the same case when a tool would see the
// same thing: the same channel, tool, stage, setup profile, tool input, tool
// output and prior calls, ignoring only the indentation of each line (the same
// line indented differently in two places of a file is one test). Whitespace
// inside a line is kept, because a detector may care about it (a card number
// with a double space between its groups is its own test), and so is letter
// case: `hostname -I` and `hostname -i` are different commands.
//
// Of a set of copies, the case whose labels were written outside node9 is
// kept, so a duplicate never moves a case out of the comparison score; then
// a public copy over a holdout one, so removing the holdout rows from the
// sources never brings a shadowed public copy back; among equals, the first
// in convert order. Copies with different expected verdicts are never
// resolved here: they are a label conflict, and the converter and validate
// both stop on them.

import { labelsOf } from './suites.ts';
import type { BenchRecord } from './types.ts';

function canonical(v: unknown): unknown {
  if (typeof v === 'string') return v.split('\n').map((l) => l.trim()).join('\n');
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    // A value stored as {"$join": [...]} parts is the same text as the plain string.
    if (Array.isArray(o.$join) && Object.keys(o).length === 1) return canonical(o.$join.join(''));
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, canonical(o[k])])
    );
  }
  return v;
}

/** The identity of the call a case presents to a tool. */
export function callKey(r: BenchRecord): string {
  const input = r.input as Record<string, unknown>;
  return JSON.stringify(
    canonical([r.channel, r.tool, r.stage, r.setup, input?.tool_input ?? null, r.output ?? null, r.prior ?? null])
  );
}

export interface DuplicateSet {
  kept: BenchRecord;
  dropped: BenchRecord[];
  /** True when the copies disagree on the expected verdict. */
  conflict: boolean;
}

export function findDuplicates(records: BenchRecord[]): DuplicateSet[] {
  const byKey = new Map<string, BenchRecord[]>();
  for (const r of records) {
    const k = callKey(r);
    const list = byKey.get(k);
    if (list) list.push(r);
    else byKey.set(k, [r]);
  }
  const sets: DuplicateSet[] = [];
  for (const copies of byKey.values()) {
    if (copies.length < 2) continue;
    const kept =
      copies.find((r) => labelsOf(r.source) === 'outside' && !r.private) ??
      copies.find((r) => labelsOf(r.source) === 'outside') ??
      copies.find((r) => !r.private) ??
      copies[0];
    sets.push({
      kept,
      dropped: copies.filter((r) => r !== kept),
      conflict: new Set(copies.map((r) => r.expected)).size > 1,
    });
  }
  return sets;
}

/** The records with every duplicate removed; throws on a label conflict. */
export function dropDuplicates(records: BenchRecord[]): { records: BenchRecord[]; sets: DuplicateSet[] } {
  const sets = findDuplicates(records);
  const conflicts = sets.filter((s) => s.conflict);
  if (conflicts.length > 0) {
    const ids = conflicts.map((s) => [s.kept, ...s.dropped].map((r) => `${r.id}=${r.expected}`).join(' '));
    throw new Error(`label conflict between copies of one call:\n  ${ids.join('\n  ')}`);
  }
  const drop = new Set(sets.flatMap((s) => s.dropped));
  return { records: records.filter((r) => !drop.has(r)), sets };
}
