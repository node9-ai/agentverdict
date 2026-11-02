// The held-out draw of corpus 7.0.0, shared by the fetch scripts of the
// sources that sample a large pool (design: holdout-root-fix-design.md,
// node9 docs). Each script, run with `--held-extra` in a full build:
//
//   1. reads its snapshot as it stands in the build (every row already
//      taken, public and held out), never refetching the public sample;
//   2. builds the pool of rows the sample did not take;
//   3. draws HELD_EXTRA rows from it in secret (selection-salt.ts), per label
//      in the counts below, and appends them to the snapshot's lists;
//   4. records what it did under `held_extra` (removed from the public copy
//      by the cut, DROPPED_KEYS in src/holdout/sections.ts) and writes the
//      new rows' groups to `<holdout dir>/extra-groups/<source>.json`, which
//      holdout:sync folds into held-groups.json.
//
// A second run refuses: `held_extra` is already there.

import fs from 'node:fs';
import path from 'node:path';
import { HOLDOUT_DIR } from '../split.ts';
import { selectionSalt } from './selection-salt.ts';

/**
 * Rows to draw per source and label: the source's held-out cases on corpus
 * 6.1.1, so the new holdout keeps the shape of the old one. Labels are the
 * snapshot's own (BrowseSafe yes/no, agent-guard-bench stop/allow, the PII
 * sets block/allow, InjecAgent base cases per attack type, each with its
 * enhanced twin, CredData counted as cases).
 */
export const HELD_EXTRA = {
  'agent-guard-bench': { stop: 61, allow: 63 },
  browsesafe: { yes: 66, no: 40 },
  'nemotron-pii': { block: 47, allow: 60 },
  'gretel-pii-finance': { block: 71, allow: 61 },
  openpii: { block: 59, allow: 56 },
  injecagent: { dh: 12, ds: 11 },
  'datadog-packages': { npm: 5, pypi: 7 },
  typomind: { npm: 5, PyPI: 2, RubyGems: 6 },
  // Six of the eight other ecosystems were taken whole by the sample; the
  // draw comes from the two with records left, in proportion to their size.
  'osv-other-ecosystems': { rubygems: 16, nuget: 8 },
  creddata: { T: 232, F: 445 },
} as const;

/** The pool must hold at least this many rows per row drawn (design decision 3). */
export const POOL_FACTOR = 5;

export function wantsHeldExtra(argv: string[] = process.argv): boolean {
  return argv.includes('--held-extra');
}

export function checkPool(source: string, label: string, pool: number, drawn: number): void {
  if (pool < POOL_FACTOR * drawn) throw new Error(`${source} ${label}: a pool of ${pool} is under ${POOL_FACTOR} times the ${drawn} rows to draw`);
}

export interface HeldExtraRecord {
  rule: string;
  drawn: Record<string, number>;
  pool: Record<string, number>;
  /** CredData: the copyright notices of the repositories the held-out lines come from (they stay out of the public REPOSITORY-NOTICES.md). */
  notices?: string[];
  /** CredData: the repositories the held-out lines come from (they stay out of the public REPOSITORY-NOTICES.md). */
  repositories?: string[];
}

/** Writes the snapshot with its new rows and `held_extra`, and the new groups for holdout:sync. */
export function writeHeldExtra(source: string, snapshotFile: string, snap: Record<string, unknown>, record: HeldExtraRecord, groups: string[]): void {
  if ('held_extra' in snap) throw new Error(`${snapshotFile}: held_extra is already there; restore the snapshot before drawing again`);
  if (new Set(groups).size !== groups.length) throw new Error(`${source}: the new rows' groups repeat`);
  snap.held_extra = record;
  // Keep the file's own indentation (src/holdout/cut.ts writes the public copy with it).
  const text = fs.readFileSync(snapshotFile, 'utf-8');
  const indent = /^\{\n {2}"/.test(text) ? 2 : /^\{\n "/.test(text) ? 1 : 2;
  fs.writeFileSync(snapshotFile, JSON.stringify(snap, null, indent) + '\n');
  const dir = path.join(HOLDOUT_DIR, 'extra-groups');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${source}.json`), JSON.stringify([...groups].sort(), null, 1) + '\n');
}

export { selectionSalt };
