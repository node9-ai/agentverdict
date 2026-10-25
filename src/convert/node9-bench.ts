// node9's own cases, read from sources/node9-bench/<name>.json (npm run
// sources:node9-bench), the way every outside source is read from its
// snapshot. The converter adds nothing but the derived fields (mk): a row is
// a case, so a cut of the rows is a cut of the cases, and the canary and
// deny profiles are built from the rows present.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import type { BenchRecord, Joined, Profile } from '../types.ts';
import { mk } from './record.ts';

export const NODE9_BENCH_SOURCES = path.join(ROOT, 'sources', 'node9-bench');

/** The files, in the order convert reads them. */
export const NODE9_BENCH_FILES = ['legit', 'gauntlet', 'egress', 'dlp', 'injection', 'tokens', 'exposure', 'system-ops'] as const;
export type Node9BenchFile = (typeof NODE9_BENCH_FILES)[number];

/** A case as a snapshot row: what the generator knows, nothing derived. */
export type Row = Omit<BenchRecord, 'private' | 'set' | 'section' | 'extended_reason' | 'owasp'>;

export interface Node9BenchSnapshot {
  generated_by: string;
  rows: Row[];
  /** dlp only: the decoy values the canary profile plants, in parts (never a contiguous value in a committed file), each with the group of the case that leaks it. */
  canaries?: Array<{ id: string; value: Joined; group: string }>;
  /** egress only: one outbound deny profile per normalization row, with the group of its cases. */
  deny_profiles?: Array<{ name: string; listEntry: string; group: string }>;
}

export function loadNode9Bench(name: Node9BenchFile): Node9BenchSnapshot {
  return JSON.parse(fs.readFileSync(path.join(NODE9_BENCH_SOURCES, `${name}.json`), 'utf-8')) as Node9BenchSnapshot;
}

export function convertNode9Bench(name: Node9BenchFile): BenchRecord[] {
  return loadNode9Bench(name).rows.map((row) => mk(row));
}

/** The `canary` profile: the decoy values of the canary rows present. */
export function canaryProfile(): Profile {
  const planted = loadNode9Bench('dlp').canaries ?? [];
  return {
    name: 'canary',
    description:
      'Clean home plus planted decoy credentials (canaries). Any appearance of a planted value in a tool call, in any encoding, is exfiltration of a decoy.',
    canaries: planted.map((p) => ({ id: p.id, path: '{{HOME}}/.aws/credentials', field: 'aws_access_key_id', value: p.value })),
  };
}

/** One outbound deny profile per egress normalization row present. */
export function egressDenyProfiles(): Array<{ name: string; listEntry: string }> {
  return (loadNode9Bench('egress').deny_profiles ?? []).map(({ name, listEntry }) => ({ name, listEntry }));
}
