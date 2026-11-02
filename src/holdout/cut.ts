// Cuts the holdout out of sources/: writes a copy of every snapshot with the
// rows of held-out groups removed (src/holdout/sections.ts says which rows
// belong to which group), and, beside it, the removed rows alone with their
// original positions and the metadata the public copy drops (HeldSnapshot),
// so the two copies merged (merge.ts) give the original back.
//
//   npm run holdout:cut -- <public dir> <holdout dir> [<sources dir>]
//
// <sources dir> defaults to this checkout's sources/; holdout:sync passes a
// full build's.
// The public copy is what the public repository carries under sources/; the
// holdout copy is what the private repository carries. Neither is read by
// this checkout: convert reads sources/ as before. The cut is checked by
// npm run holdout:check, which rebuilds the corpus from the public copy
// without the salt and compares it with the public cases of this one.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { isHoldout } from '../split.ts';
import { COPIED_WHOLE, DROPPED_KEYS, SECTIONS } from './sections.ts';

type Json = Record<string, unknown>;

export const SOURCES = path.join(ROOT, 'sources');

/** Every (object, key) pair that `list` names inside `root`, with the path keys walked. */
function lists(root: Json, list: string): Array<{ parent: Json; key: string; keys: string[] }> {
  const out: Array<{ parent: Json; key: string; keys: string[] }> = [];
  const walk = (node: Json, parts: string[], keys: string[]): void => {
    const [head, ...rest] = parts;
    if (rest.length === 0) {
      for (const k of head === '*' ? Object.keys(node) : [head]) {
        if (Array.isArray(node[k])) out.push({ parent: node, key: k, keys: [...keys, k] });
      }
      return;
    }
    if (head === '*') {
      for (const k of Object.keys(node)) walk(node[k] as Json, rest, [...keys, k]);
    } else if (node[head] !== undefined) walk(node[head] as Json, rest, [...keys, head]);
  };
  walk(root, list.split('.'), []);
  return out;
}

export interface CutReport {
  files: number;
  kept: number;
  removed: number;
  perFile: Record<string, { kept: number; removed: number }>;
}

/**
 * The holdout half of a snapshot: the removed rows, each with its index in
 * the original list, keyed by the list's path; the metadata keys the public
 * half drops; and CredData's full repository list. merge.ts puts them back,
 * so public + holdout gives the original snapshot exactly.
 */
export interface HeldSnapshot {
  rows: Record<string, Array<{ at: number; row: Json }>>;
  dropped: Json;
  repos?: Json[];
}

/** Splits one parsed snapshot into its public and holdout halves. */
export function cutSnapshot(
  file: string,
  snap: Json,
  isHeld: (group: string) => boolean = isHoldout
): { pub: Json; held: HeldSnapshot; kept: number; removed: number } {
  const pub = structuredClone(snap);
  const held: HeldSnapshot = { rows: {}, dropped: {} };
  let kept = 0;
  let removed = 0;
  for (const section of SECTIONS.filter((s) => s.file === file)) {
    for (const { parent, key, keys } of lists(pub, section.list)) {
      const rows = parent[key] as Json[];
      const stay: Json[] = [];
      const go: Array<{ at: number; row: Json }> = [];
      rows.forEach((r, at) => (isHeld(section.group(r, keys)) ? go.push({ at, row: r }) : stay.push(r)));
      parent[key] = stay;
      kept += stay.length;
      removed += go.length;
      if (go.length > 0) held.rows[keys.join('.')] = go;
    }
  }
  for (const k of DROPPED_KEYS[file] ?? []) {
    if (k in pub) {
      held.dropped[k] = pub[k];
      delete pub[k];
    }
  }
  if (file === 'creddata/snapshot.json') {
    // The repository list: only repositories with a line left in the copy.
    const used = new Set([...(pub.block as Json[]), ...(pub.allow as Json[])].map((l) => l.repo));
    held.repos = snap.repos as Json[];
    pub.repos = (snap.repos as Json[]).filter((r) => used.has(r.repo));
  }
  return { pub, held, kept, removed };
}

export function cutSources(publicDir: string, holdoutDir: string, sourcesDir: string = SOURCES): CutReport {
  const report: CutReport = { files: 0, kept: 0, removed: 0, perFile: {} };
  const rowFiles = new Set(SECTIONS.map((s) => s.file));
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(sourcesDir, abs);
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      const out = path.join(publicDir, rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (rowFiles.has(rel)) {
        const text = fs.readFileSync(abs, 'utf-8');
        const indent = /^\{\n {2}"/.test(text) ? 2 : /^\{\n "/.test(text) ? 1 : 2;
        const { pub, held, kept, removed } = cutSnapshot(rel, JSON.parse(text) as Json);
        fs.writeFileSync(out, JSON.stringify(pub, null, indent) + '\n');
        if (Object.keys(held.rows).length > 0 || Object.keys(held.dropped).length > 0 || held.repos) {
          const heldOut = path.join(holdoutDir, rel);
          fs.mkdirSync(path.dirname(heldOut), { recursive: true });
          fs.writeFileSync(heldOut, JSON.stringify(held, null, 1) + '\n');
        }
        report.files++;
        report.kept += kept;
        report.removed += removed;
        report.perFile[rel] = { kept, removed };
      } else if (COPIED_WHOLE.includes(e.name) || rel.startsWith('node9/')) {
        // Licences, notices and the pinned node9-proxy fixtures (public upstream).
        fs.copyFileSync(abs, out);
      } else {
        throw new Error(`sources/${rel}: not a row file and not listed in COPIED_WHOLE (src/holdout/sections.ts)`);
      }
    }
  };
  walk(sourcesDir);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const [publicDir, holdoutDir, sourcesDir] = process.argv.slice(2);
  if (!publicDir || !holdoutDir) {
    console.error('usage: npm run holdout:cut -- <public dir> <holdout dir> [<sources dir>]');
    process.exit(2);
  }
  const rep = cutSources(path.resolve(publicDir), path.resolve(holdoutDir), sourcesDir ? path.resolve(sourcesDir) : SOURCES);
  for (const [f, c] of Object.entries(rep.perFile)) console.log(`${f.padEnd(40)} kept ${String(c.kept).padStart(5)}  removed ${String(c.removed).padStart(4)}`);
  console.log(`${rep.files} row files; ${rep.kept} rows kept, ${rep.removed} removed`);
}
