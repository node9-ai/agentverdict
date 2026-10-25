// Source: sources/nl2sh-alfa/snapshot.json (refresh with
// npm run sources:nl2sh-alfa), taken from huggingface.co/datasets/
// westenfelder/NL2SH-ALFA (MIT) at one pinned revision.
//
// The test split pairs an English task with a bash command that does it, and
// an equivalent second command, checked by hand by the authors. Each command
// becomes the Bash call that would run it, before it runs (PreToolUse), under
// a fresh install: allow. The second command is a variant of the first, in
// the same group. It measures interruptions on ordinary shell work.
//
// The rows carry no safety label; they are benign because of where they come
// from (users asking for ordinary tasks), so the allow label is node9-bench's
// reading of the source (LABEL_RULES in src/suites.ts). Every row is kept.
// Until corpus 2.1.0 the rows that delete, change permissions, stop processes
// or touch an account file were left out (39 of 300): that made the benign
// side easier than real work, since a guard that stopped every rm or chmod
// paid no false positive for it. They are kept now, and where another source
// labels a similar action risky (RedCode-Exec reading /etc/group), the two
// labels are left to disagree in the open.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk } from './record.ts';
import { ROOT } from '../corpus.ts';
import { reveal } from '../hygiene.ts';
import type { BenchRecord, Joined } from '../types.ts';

const SNAPSHOT = 'sources/nl2sh-alfa/snapshot.json';

interface Snapshot {
  dataset: string;
  revision: string;
  rows: Array<{ index: number; nl: string | Joined; bash: string | Joined; bash2: string | Joined; difficulty: number }>;
}

export function convertNl2shAlfa(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const rev = snap.revision.slice(0, 7);
  const out: BenchRecord[] = [];
  for (const r of snap.rows) {
    const commands = [reveal(r.bash), reveal(r.bash2)];
    const base = {
      channel: 'shell' as const,
      tool: 'Bash',
      setup: 'clean',
      expected: 'allow' as const,
      why: 'ordinary_shell_task',
      family: `nl2sh_difficulty_${r.difficulty}`,
      group: `nl2sh-alfa.${r.index}`,
      source: 'nl2sh-alfa',
      source_ref: `${snap.dataset}@${rev}:test.csv (row ${r.index})`,
      license: 'MIT',
      note: reveal(r.nl),
    };
    const id = `nl2sh-alfa.${r.index}`;
    out.push(mk({ ...base, id, input: claudePre('Bash', { command: r.bash }) }));
    if (commands[1].trim() !== commands[0].trim())
      out.push(mk({ ...base, id: `${id}.alt`, input: claudePre('Bash', { command: r.bash2 }), variant_of: id }));
  }
  return out;
}
