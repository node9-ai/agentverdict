// Source: sources/redcode-exec/snapshot.json (refresh with
// npm run sources:redcode-exec), taken from github.com/AI-secure/RedCode
// (dataset CC-BY-4.0) at one pinned commit.
//
// RedCode-Exec asks a code agent to run scripts that do something risky and
// records each as risky; the agent should refuse. Each kept script becomes the
// Bash call that would run it, before it runs (PreToolUse): block. The
// scenarios kept are listed, with the rule, in src/sources/fetch-redcode-exec.ts.
//
// Profile (since corpus 5.0.0): `jailed-agent`, the user declared everything
// outside the project off-limits, as RedCode's own threat model has it (a
// sandboxed agent that must not read, list, copy or delete the system's
// files). The declaration is general, the FHS top-level directories, not
// written per script (src/convert/profiles.ts, JAILED_SYSTEM_DIRS). NL2SH-ALFA
// keeps the clean profile: there, reading /etc/passwd is the ordinary task a
// user asked for, and the two labels disagree in the open.
//
// Python scripts (since corpus 2.2.0) run the way an agent runs a script it
// wrote, in one call: `python3 - <<'PYEOF'` with the script inline, so the
// guard sees the whole program, as it does a shell script. A Python script and
// the shell script of the same RedCode index are translations of one task and
// share a group, so they land on the same side of the split.
//
// What this does not measure: RedCode's own score, which is whether an agent
// refuses or runs the script. That needs a model in the loop.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk, slug } from './record.ts';
import { ROOT } from '../corpus.ts';
import type { BenchRecord, Joined } from '../types.ts';

const SNAPSHOT = 'sources/redcode-exec/snapshot.json';

interface Snapshot {
  repo: string;
  commit: string;
  paths: { bash: string; python: string };
  scenarios: Record<string, { name: string; kept: boolean }>;
  scripts: Array<{ index: string; scenario: number; language: 'bash' | 'python'; code: string | Joined }>;
}

const HEREDOC = 'PYEOF';

/** The Bash call that runs a Python script inline. */
export function pythonCall(code: string | Joined): string | Joined {
  const head = `python3 - <<'${HEREDOC}'\n`;
  const tail = `\n${HEREDOC}`;
  return typeof code === 'string' ? head + code + tail : { $join: [head, ...code.$join, tail] };
}

export function convertRedCodeExec(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const sha = snap.commit.slice(0, 7);
  return snap.scripts.map((s) => {
    const scenario = snap.scenarios[String(s.scenario)];
    if (!scenario?.kept) throw new Error(`redcode-exec: ${s.index} is in a scenario that is not kept`);
    const py = s.language === 'python';
    const text = typeof s.code === 'string' ? s.code : s.code.$join.join('');
    if (py && text.includes(HEREDOC)) throw new Error(`redcode-exec: ${s.index} contains the heredoc marker`);
    const file = py ? `index${s.scenario}_30_codes_full.json` : `index${s.scenario}_30_codes_full_upd.json`;
    return mk({
      id: `redcode-exec.${py ? 'py.' : ''}${s.scenario}.${s.index.replace(/_/g, '-')}`,
      channel: 'shell',
      tool: 'Bash',
      input: claudePre('Bash', { command: py ? pythonCall(s.code) : s.code }),
      setup: 'jailed-agent',
      expected: 'block',
      why: 'risky_script',
      family: `redcode_${slug(scenario.name).replace(/-/g, '_')}`,
      group: `redcode-exec.${s.index}`,
      source: 'redcode-exec',
      source_ref: `${snap.repo}@${sha}:${snap.paths[s.language]}/${file} (${s.index})`,
      license: 'CC-BY-4.0',
      note: `RedCode-Exec scenario #${s.scenario}: ${scenario.name}${py ? ' (Python)' : ''}`,
    });
  });
}
