// Source: sources/notinject/snapshot.json (refresh with npm run sources:notinject),
// NotInject (Li et al., MIT) at one pinned dataset revision.
//
// 339 benign prompts, each built around words injection detectors tend to
// flag. NotInject was written as prompts to a model; here each one is text an
// agent reads from a tool, which is where node9 judges text: a fetched web
// page, a GitHub issue body, or a local notes file, rotated in a fixed order
// so every carrier sees every subset. The right response to all of them is
// to let the result through (allow); a flag is an interruption.
//
// The cases run under `injection-optin`, like the AgentDojo cases: they
// measure the over-defense of injection detection, which a default install
// does not attempt.

import fs from 'node:fs';
import path from 'node:path';
import { claudeOutput, claudePost } from './payload.ts';
import { mk, slot, slug } from './record.ts';
import { ROOT } from '../corpus.ts';
import { protect, reveal } from '../hygiene.ts';
import type { BenchRecord, Joined, Template } from '../types.ts';

const SNAPSHOT = 'sources/notinject/snapshot.json';

interface Snapshot {
  dataset: string;
  revision: string;
  splits: Record<string, Array<{ index: number; prompt: string | Joined; words: string[]; category: string }>>;
}

export type Carrier = { id: string; tool: string; input: Template; output: (text: Template) => Template };

/** The three tool results a NotInject text arrives in, used in turn; shared with the combination (notinject-seq.ts). */
export const CARRIERS: Carrier[] = [
  {
    id: 'web',
    tool: 'WebFetch',
    input: claudePost('WebFetch', { url: 'https://forum.example.com/t/question', prompt: 'Summarise this page' }),
    output: (t) => claudeOutput.webFetch('https://forum.example.com/t/question', t),
  },
  {
    id: 'issue',
    tool: 'mcp__github__get_issue',
    input: claudePost('mcp__github__get_issue', { owner: 'acme', repo: 'web', issue_number: 87 }),
    output: (t) => claudeOutput.mcpText({ $join: ['Issue #87 opened by a contributor\n\n', ...(typeof t === 'string' ? [t] : (t as Joined).$join)] }),
  },
  {
    id: 'file',
    tool: 'Bash',
    input: claudePost('Bash', { command: 'cat docs/NOTES.md' }),
    output: (t) => claudeOutput.bash(t),
  },
];

export interface NotInjectRow {
  split: string;
  index: number;
  carrier: Carrier;
  /** The text, protected for a committed file. */
  text: Template;
  category: string;
  words: string[];
  ref: string;
}

/** Every NotInject text with the carrier it arrives in, chosen by the row's own split and index, the same in both converters. */
export function notInjectRows(): NotInjectRow[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const rev = snap.revision.slice(0, 7);
  const out: NotInjectRow[] = [];
  for (const split of Object.keys(snap.splits).sort()) {
    for (const row of snap.splits[split]) {
      out.push({
        split,
        index: row.index,
        carrier: CARRIERS[slot(`notinject:${split}:${row.index}`, CARRIERS.length)],
        text: protect(reveal(row.prompt)),
        category: row.category,
        words: row.words,
        ref: `${snap.dataset}@${rev} (${split} row ${row.index}; trigger words: ${row.words.join(', ')})`,
      });
    }
  }
  return out;
}

export function convertNotInject(): BenchRecord[] {
  return notInjectRows().map(({ split, index, carrier: c, text, category, ref }) =>
    mk({
      id: `notinject.${slug(split.replace(/^NotInject_/, ''))}.${String(index).padStart(3, '0')}.${c.id}`,
      channel: 'injection',
      tool: c.tool,
      stage: 'post',
      input: c.input,
      output: c.output(text),
      setup: 'injection-optin',
      expected: 'allow',
      why: 'benign_text_with_trigger_words',
      family: `notinject_${slug(category).replace(/-/g, '_')}`,
      group: `notinject.${split}.${index}`,
      source: 'notinject',
      source_ref: ref,
      license: 'MIT',
    })
  );
}
