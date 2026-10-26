// Copies one run from the full build (holdout:build) into this repository's
// results/, with the public cases only.
//
//   npm run holdout:results -- <run dir in the build>
//
// The run directory is the one `npm run bench` wrote in the build, for
// example ../agentverdict-holdout/build/results/node9-gate/
// 2.39.0/corpus-6.0.0. It lands at the same path under results/ here.
//
// What is copied: summary.json and summary.md (aggregate numbers; the
// holdout appears as numbers only), and cases.jsonl cut to the cases whose
// `private` is false. Nothing else: the reports that list cases by id
// (holdout.md, extended-holdout.md, gap lists) stay in the build. Refused:
// a run made on another corpus version than the one pinned here, and any
// copied text file that still carries the id of a holdout case.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readCorpusVersion } from '../corpus.ts';

interface Line {
  id: string;
  private: boolean;
}

export function copyRun(runDir: string): { to: string; kept: number; held: number } {
  const summary = JSON.parse(fs.readFileSync(path.join(runDir, 'summary.json'), 'utf-8')) as { adapter: string; tool_version: string; corpus_version: string };
  const pinned = readCorpusVersion().version;
  if (summary.corpus_version !== pinned) throw new Error(`${runDir}: made on corpus ${summary.corpus_version}, this repository pins ${pinned}`);
  const lines = fs
    .readFileSync(path.join(runDir, 'cases.jsonl'), 'utf-8')
    .split('\n')
    .filter((l) => l.trim() !== '');
  const heldIds = new Set<string>();
  const kept: string[] = [];
  for (const l of lines) {
    const r = JSON.parse(l) as Line;
    if (r.private) heldIds.add(r.id);
    else kept.push(l);
  }
  const to = path.join(ROOT, 'results', summary.adapter, summary.tool_version, path.basename(runDir));
  const texts: Record<string, string> = {
    'summary.json': fs.readFileSync(path.join(runDir, 'summary.json'), 'utf-8'),
    'cases.jsonl': kept.join('\n') + '\n',
  };
  if (fs.existsSync(path.join(runDir, 'summary.md'))) texts['summary.md'] = fs.readFileSync(path.join(runDir, 'summary.md'), 'utf-8');
  for (const [name, text] of Object.entries(texts)) {
    for (const tok of text.match(/[a-z0-9][a-z0-9.-]{6,}[a-z0-9]/g) ?? []) {
      if (heldIds.has(tok)) throw new Error(`${name} would carry the holdout case ${tok}; nothing copied`);
    }
  }
  fs.mkdirSync(to, { recursive: true });
  for (const [name, text] of Object.entries(texts)) fs.writeFileSync(path.join(to, name), text);
  return { to: path.relative(ROOT, to), kept: kept.length, held: heldIds.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const runDir = process.argv[2];
  if (!runDir) {
    console.error('usage: npm run holdout:results -- <run dir in the build>');
    process.exit(2);
  }
  const { to, kept, held } = copyRun(path.resolve(runDir));
  console.log(`${to}: ${kept} public case result(s) copied, ${held} holdout result(s) left in the build`);
}
