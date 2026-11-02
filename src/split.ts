// Holdout assignment by group. A case is held out when its `group` is listed
// in `<holdout dir>/held-groups.json`; every case of one scenario shares its
// group, so near-copies never fall on both sides, and the split never moves
// between runs or machines.
//
// The list is not in the code. The holdout directory is `$BENCH_HOLDOUT_DIR`
// or `holdout/` beside src/; it also holds the salt (`salt`), whose presence
// marks a full build. The public repository has no holdout directory: there
// every case is public (`isHoldout` is false for every group), and nothing in
// the public tree can say which groups are held out.
//
// Until corpus 7.0.0 a group was held out by a hash of the group with the
// salt (20%). That drew the split well but could not hide the rows: a public
// fetch script reproduces its whole sample, so the public snapshot minus that
// sample was the holdout. Since 7.0.0 the held-out rows are drawn in secret
// (src/sources/selection-salt.ts) and listed here by group; `hashHeld` keeps
// the old rule for the private generators, which use it to choose which of
// their new groups to list.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The share of its new groups a private generator holds out (`hashHeld`). */
export const HOLDOUT_PERCENT = 20;

export const HOLDOUT_DIR = process.env.BENCH_HOLDOUT_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'holdout');

const SALT_FILE = path.join(HOLDOUT_DIR, 'salt');
export const HELD_GROUPS_FILE = path.join(HOLDOUT_DIR, 'held-groups.json');

const salt: string | null = fs.existsSync(SALT_FILE) ? fs.readFileSync(SALT_FILE, 'utf-8').trim() : null;

/** The held-out groups listed in `<dir>/held-groups.json`, or null when the file is absent. */
export function loadHeldGroups(dir: string): Set<string> | null {
  const file = path.join(dir, 'held-groups.json');
  if (!fs.existsSync(file)) return null;
  const list = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown;
  if (!Array.isArray(list) || !list.every((g) => typeof g === 'string')) throw new Error(`${file}: expected a JSON array of group names`);
  return new Set(list as string[]);
}

const held: Set<string> | null = salt === null ? null : loadHeldGroups(HOLDOUT_DIR);
if (salt !== null && held === null) throw new Error(`${HELD_GROUPS_FILE} not found: the holdout directory has its salt but no list of held-out groups`);

/** True when this checkout holds the holdout (its salt is present). */
export function hasHoldout(): boolean {
  return salt !== null;
}

export function isHoldout(group: string): boolean {
  return held !== null && held.has(group);
}

/** The pre-7.0.0 rule, kept for the private generators: a hash of the group with the salt, HOLDOUT_PERCENT of groups. */
export function hashHeld(group: string): boolean {
  if (salt === null) throw new Error('hashHeld needs the holdout salt');
  const h = createHash('sha256').update(`${salt}:${group}`).digest();
  return h.readUInt32BE(0) % 100 < HOLDOUT_PERCENT;
}
