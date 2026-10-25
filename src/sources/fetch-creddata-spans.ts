// Writes sources/creddata/value-spans.json: for every T (block) line in
// sources/creddata/snapshot.json, where in the line CredData's meta says the
// credential value sits (ValueStart, ValueEnd) and its PredefinedPattern.
// Positions only, never a value. The annotation rules use them to look at
// the value CredData labelled, not at the rest of the line. CredData counts
// ValueStart in the first line and ValueEnd in the last line of a row; for a
// row over several lines (a PEM key) the end is turned into an offset in the
// joined text.
//
//   npm run sources:creddata-spans
//
// Reads CredData's meta CSVs at the pinned commit from
// external/creddata/meta/ (git-ignored; fetch them again with
// `git -C external/creddata/CredData checkout 0b1940e -- meta`, or from
// https://github.com/Samsung/CredData/tree/0b1940e171725ad8937311120b191602608a4801/meta).

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { reveal } from '../hygiene.ts';
import type { Joined } from '../types.ts';

const DIR = path.join(ROOT, 'sources', 'creddata');
const META = path.join(ROOT, 'external', 'creddata', 'meta');

export interface Span {
  start: number;
  end: number;
  pattern: string;
}

/** A minimal CSV reader for CredData's meta files (no quoted commas in the columns used here). */
function rows(file: string): Record<string, string>[] {
  const [head, ...lines] = fs.readFileSync(file, 'utf-8').trim().split('\n');
  const cols = head.split(',');
  return lines.map((l) => {
    const v = l.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? '']));
  });
}

/** Where the last line of a text starts. */
export function lastLineOffset(text: string): number {
  return text.lastIndexOf('\n') + 1;
}

function main(): void {
  const snap = JSON.parse(fs.readFileSync(path.join(DIR, 'snapshot.json'), 'utf-8')) as {
    block: { id: number | string; repo: string; content: string | Joined }[];
  };
  const want = new Map(snap.block.map((b) => [String(b.id), b.repo]));
  const content = new Map(snap.block.map((b) => [String(b.id), reveal(b.content)]));
  const spans: Record<string, Span | null> = {};
  for (const repo of new Set(want.values())) {
    for (const r of rows(path.join(META, `${repo}.csv`))) {
      if (!want.has(r.Id)) continue;
      const start = Number(r.ValueStart);
      const endInLastLine = Number(r.ValueEnd);
      if (r.ValueStart === '' || r.ValueEnd === '' || start < 0 || endInLastLine < 0) {
        spans[r.Id] = null;
        continue;
      }
      spans[r.Id] = { start, end: lastLineOffset(content.get(r.Id) ?? '') + endInLastLine, pattern: r.PredefinedPattern };
    }
  }
  const missing = [...want.keys()].filter((id) => !(id in spans));
  if (missing.length > 0) throw new Error(`no meta row for ${missing.length} ids: ${missing.slice(0, 5).join(', ')}`);
  const sorted = Object.fromEntries(Object.entries(spans).sort(([a], [b]) => Number(a) - Number(b)));
  fs.writeFileSync(path.join(DIR, 'value-spans.json'), JSON.stringify({ revision: '0b1940e171725ad8937311120b191602608a4801', spans: sorted }, null, 1) + '\n');
  console.log(`${Object.keys(sorted).length} spans (${Object.values(sorted).filter((s) => s === null).length} without a value position)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
