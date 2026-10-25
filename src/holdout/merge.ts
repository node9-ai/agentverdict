// Puts the holdout back: merges the holdout half of each snapshot (cut.ts,
// HeldSnapshot) into its public half, every removed row at its original
// index, the dropped metadata restored, so the result equals the snapshot
// before the cut. Used to assemble a full checkout from the public
// repository and the holdout repository (build.ts).

import fs from 'node:fs';
import path from 'node:path';
import type { HeldSnapshot } from './cut.ts';

type Json = Record<string, unknown>;

export function mergeSnapshot(pub: Json, held: HeldSnapshot): Json {
  const out = structuredClone(pub);
  for (const [listPath, rows] of Object.entries(held.rows)) {
    const keys = listPath.split('.');
    let node = out;
    for (const k of keys.slice(0, -1)) node = node[k] as Json;
    const last = keys[keys.length - 1];
    const kept = (node[last] as Json[] | undefined) ?? [];
    const total = kept.length + rows.length;
    const merged: Json[] = new Array(total);
    for (const { at, row } of rows) {
      if (at >= total || merged[at] !== undefined) throw new Error(`merge: ${listPath} index ${at} out of range or taken`);
      merged[at] = row;
    }
    let i = 0;
    for (let at = 0; at < total; at++) if (merged[at] === undefined) merged[at] = kept[i++];
    node[last] = merged;
  }
  for (const [k, v] of Object.entries(held.dropped)) out[k] = v;
  if (held.repos) out.repos = held.repos;
  return out;
}

/**
 * Writes the merged sources tree: every file of the public tree, with each
 * snapshot that has a holdout half merged. A holdout file with no public
 * counterpart is an error (the cut never creates one).
 */
export function mergeSources(publicDir: string, holdoutDir: string, outDir: string): number {
  let merged = 0;
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(publicDir, abs);
      const out = path.join(outDir, rel);
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const heldFile = path.join(holdoutDir, rel);
      if (!fs.existsSync(heldFile)) {
        fs.copyFileSync(abs, out);
        continue;
      }
      const text = fs.readFileSync(abs, 'utf-8');
      const indent = /^\{\n {2}"/.test(text) ? 2 : /^\{\n "/.test(text) ? 1 : 2;
      const full = mergeSnapshot(JSON.parse(text) as Json, JSON.parse(fs.readFileSync(heldFile, 'utf-8')) as HeldSnapshot);
      fs.writeFileSync(out, JSON.stringify(full, null, indent) + '\n');
      merged++;
    }
  };
  walk(publicDir);
  const orphan = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) orphan(abs);
      else if (!fs.existsSync(path.join(publicDir, path.relative(holdoutDir, abs)))) throw new Error(`merge: ${abs} has no public counterpart`);
    }
  };
  orphan(holdoutDir);
  return merged;
}
