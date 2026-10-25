// Holdout assignment by group. A case's side of the split is a pure function
// of its `group`, so every case of one scenario lands on the same side, a new
// case joins its scenario's side automatically, and the split never moves
// between runs or machines.
//
// The salt is not in the code. It is read from `<holdout dir>/salt`, where
// the holdout directory is `$BENCH_HOLDOUT_DIR` or `holdout/` beside src/.
// The public repository has no holdout directory: there every case is public
// (`isHoldout` is false for every group), and nothing in the public tree can
// say which groups are held out. The salt was chosen before any tool was run
// against the corpus; changing it re-draws the holdout.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOLDOUT_PERCENT = 20;

/**
 * Groups that are never held out: cases built from AgentDojo's task table
 * alone (the tasks are a public lookup table, shared with the vector cases
 * and published upstream), so they carry no secret worth keeping. The split
 * protects which vector carries which action in which setting, not the tasks.
 */
export const NO_HOLDOUT_PREFIXES = ['agentdojo-calls.', 'dangerous-actions.'];

export const HOLDOUT_DIR = process.env.BENCH_HOLDOUT_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'holdout');

const SALT_FILE = path.join(HOLDOUT_DIR, 'salt');

const salt: string | null = fs.existsSync(SALT_FILE) ? fs.readFileSync(SALT_FILE, 'utf-8').trim() : null;

/** True when this checkout holds the holdout (its salt is present). */
export function hasHoldout(): boolean {
  return salt !== null;
}

export function isHoldout(group: string): boolean {
  if (salt === null) return false;
  if (NO_HOLDOUT_PREFIXES.some((p) => group.startsWith(p))) return false;
  const h = createHash('sha256').update(`${salt}:${group}`).digest();
  return h.readUInt32BE(0) % 100 < HOLDOUT_PERCENT;
}
