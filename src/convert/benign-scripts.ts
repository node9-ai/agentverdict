// Source: sources/benign-scripts/snapshot.json (refresh with
// npm run sources:benign-scripts): ordinary programs from two outside
// sources, the benign counterpart of RedCode-Exec in the same form, so the
// inline-code rule pays its false-positive cost and the shell sources stop
// differing by form (a review found that nearly every RedCode case was a
// multi-line script and no benign case was).
//
//   Python  MBPP (Google, CC BY 4.0), the test split: the reference solution
//           followed by its test assertions, run inline exactly like
//           RedCode's Python (`python3 - <<'PYEOF'`).
//   Bash    the Exercism Bash track's example solutions (MIT), run as the
//           script they are, like RedCode's Bash.
//
// Label: allow, AgentVerdict's mapping by provenance (a reference solution to a
// programming exercise is ordinary work; neither source labels safety).
// Profile: `jailed-agent`, the same as RedCode-Exec, so the jail's cost on
// ordinary scripts is measured where its protection is.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk } from './record.ts';
import { pythonCall } from './redcode-exec.ts';
import { ROOT } from '../corpus.ts';
import { protect, reveal } from '../hygiene.ts';
import type { BenchRecord, Joined } from '../types.ts';

const SNAPSHOT = 'sources/benign-scripts/snapshot.json';
export const SOURCE = 'benign-scripts';

type Text = string | Joined;
interface Snapshot {
  python: { dataset: string; revision: string; config: string; split: string; rows: Array<{ task_id: number; code: Text; tests: Text[]; setup: Text }> };
  bash: { repo: string; commit: string; scripts: Array<{ slug: string; script: Text }> };
}

export function convertBenignScripts(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const out: BenchRecord[] = [];
  const rev = snap.python.revision.slice(0, 7);
  for (const r of snap.python.rows) {
    const setup = reveal(r.setup).trim();
    const program = [setup, reveal(r.code).trimEnd(), ...r.tests.map(reveal)].filter(Boolean).join('\n');
    if (program.includes('PYEOF')) throw new Error(`benign-scripts: MBPP ${r.task_id} contains the heredoc marker`);
    out.push(
      mk({
        id: `${SOURCE}.py.mbpp-${r.task_id}`,
        channel: 'shell',
        tool: 'Bash',
        input: claudePre('Bash', { command: pythonCall(protect(program)) }),
        setup: 'jailed-agent',
        expected: 'allow',
        why: 'ordinary_script',
        family: 'benign_script_python',
        group: `${SOURCE}.py.${r.task_id}`,
        source: SOURCE,
        source_ref: `${snap.python.dataset}@${rev}:${snap.python.config}/${snap.python.split} (task_id ${r.task_id}; code followed by test_list)`,
        license: 'CC-BY-4.0',
      })
    );
  }
  const sha = snap.bash.commit.slice(0, 7);
  for (const s of snap.bash.scripts) {
    out.push(
      mk({
        id: `${SOURCE}.sh.${s.slug}`,
        channel: 'shell',
        tool: 'Bash',
        input: claudePre('Bash', { command: s.script }),
        setup: 'jailed-agent',
        expected: 'allow',
        why: 'ordinary_script',
        family: 'benign_script_bash',
        group: `${SOURCE}.sh.${s.slug}`,
        source: SOURCE,
        source_ref: `${snap.bash.repo}@${sha}:exercises/practice/${s.slug}/.meta/example.sh`,
        license: 'MIT',
      })
    );
  }
  return out;
}
