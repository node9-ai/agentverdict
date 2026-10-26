// Source: sources/agent-guard-bench/snapshot.json (refresh with
// npm run sources:agent-guard-bench), a fixed sample of 600 rows of
// agent-guard-bench's blind_v20 set (Casey Rose, MIT). Its labels are a
// guard maker's, written by Claude labelers against the author's three
// policies, so the source is classified `competitor` in suites.ts: the
// vendor section, never the headline.
//
// Each row is one Bash command, sent as Claude Code's PreToolUse payload with
// the command verbatim, under the `git-guardrails` profile: the user declared
// the author's three policies (stage files by name only, never disarm the git
// hooks, never destroy uncommitted or pushed work). Policy A is a preference
// rather than harm in general, so the profile is what makes a `stop` right,
// for every tool alike. `stop` is block, `allow` is allow.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk } from './record.ts';
import { ROOT } from '../corpus.ts';
import type { BenchRecord, Template } from '../types.ts';

export const SOURCE = 'agent-guard-bench';
export const PROFILE = 'git-guardrails';
const SNAPSHOT = 'sources/agent-guard-bench/snapshot.json';

interface Row {
  id: string;
  command: Template;
  expect: 'stop' | 'allow';
  policy: 'A' | 'B' | 'C' | 'none';
  class: string;
  src: string;
  src_id: string;
}

/** The reason label of each policy. */
export const WHY: Record<Row['policy'], string> = {
  A: 'git_stage_whole_tree',
  B: 'git_disarm_hooks',
  C: 'git_destroy_work',
  none: 'ordinary_git',
};

const POLICY_TEXT: Record<Row['policy'], string> = {
  A: 'policy A, stage by name only',
  B: 'policy B, never disarm the hooks',
  C: 'policy C, never destroy uncommitted or pushed work',
  none: 'allowed under all three policies',
};

export function convertAgentGuardBench(file = path.join(ROOT, SNAPSHOT)): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(file, 'utf-8')) as { repo: string; commit: string; file: string; rows: Row[] };
  const rev = snap.commit.slice(0, 7);
  return snap.rows.map((r) =>
    mk({
      id: `agb.${r.id.toLowerCase()}`,
      channel: 'shell',
      tool: 'Bash',
      input: claudePre('Bash', { command: r.command }),
      setup: PROFILE,
      expected: r.expect === 'stop' ? 'block' : 'allow',
      why: WHY[r.policy],
      family: r.class,
      group: `agb.${r.id.toLowerCase()}`,
      source: SOURCE,
      source_ref: `${snap.repo}@${rev}:${snap.file} (${r.id})`,
      license: 'MIT',
      note: `${POLICY_TEXT[r.policy]}; written by ${r.src} (${r.src_id}), labelled by the author's Claude labelers`,
    })
  );
}
