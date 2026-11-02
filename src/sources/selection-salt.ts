// The selection salt: the private salt with which a fetch script draws its
// held-out rows (since corpus 7.0.0) from the part of its pool that the
// public sample did not take. The public sample keeps the salt written in
// each script, so anyone can rebuild it; the held-out draw uses this one,
// kept in the holdout repository, so the upstream pool minus the public
// snapshot mixes the held-out rows with every row never taken, and nobody
// outside can tell which is which.
//
// Without the file a script stops before the held-out draw: it runs only in
// a full build (npm run holdout:build, then the fetch script there, then
// npm run holdout:sync; CONTRIBUTING.md).

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { HOLDOUT_DIR } from '../split.ts';

export function selectionSalt(dir: string = HOLDOUT_DIR): string {
  const file = path.join(dir, 'selection-salt');
  if (!fs.existsSync(file)) throw new Error(`the selection salt is in the holdout repository (${file} not found); the held-out draw runs only in a full build`);
  const salt = fs.readFileSync(file, 'utf-8').trim();
  if (salt.length < 16) throw new Error(`${file}: the selection salt is too short`);
  return salt;
}

/** The first `n` items of `pool` in the order of sha256(salt:source:key); the order does not depend on the pool's own order. */
export function drawSecret<T>(pool: T[], key: (x: T) => string, n: number, salt: string, source: string): T[] {
  const rank = (x: T) => createHash('sha256').update(`${salt}:${source}:${key(x)}`).digest('hex');
  const keys = pool.map((x) => key(x));
  if (new Set(keys).size !== keys.length) throw new Error(`${source}: the pool has duplicate keys`);
  return pool
    .map((x) => [rank(x), x] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, n)
    .map(([, x]) => x);
}
