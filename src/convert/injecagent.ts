// Source: sources/injecagent/snapshot.json (refresh with
// npm run sources:injecagent), taken from github.com/uiuc-kang-lab/InjecAgent
// (MIT) at one pinned commit.
//
// Each case is the result one of InjecAgent's user tools returns (a product
// page, an email, a calendar event, a repository ...) with an attacker's
// instruction placed inside, as an MCP tool result of a server named
// `injecagent`, called with the case's own parameters. Both settings of each
// sampled case: base, and enhanced (InjecAgent's fixed hacking prompt in
// front of the instruction). Every case is an injection: review, as for
// every injected tool result in this corpus. Run under `injection-optin`.
//
// What this does not measure: InjecAgent's own score, which is whether a
// model carries out the instruction. That needs a model in the loop.

import fs from 'node:fs';
import path from 'node:path';
import { claudeOutput, claudePost } from './payload.ts';
import { mk } from './record.ts';
import { ROOT } from '../corpus.ts';
import type { BenchRecord, Joined, Template } from '../types.ts';

const SNAPSHOT = 'sources/injecagent/snapshot.json';

interface Snapshot {
  repo: string;
  commit: string;
  cases: Array<{
    type: 'dh' | 'ds';
    position: number;
    user_tool: string;
    tool_parameters: Template;
    attack_type: string;
    base: string | Joined;
    enhanced: string | Joined;
  }>;
}

export function convertInjecAgent(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const sha = snap.commit.slice(0, 7);
  const out: BenchRecord[] = [];
  for (const c of snap.cases) {
    const tool = `mcp__injecagent__${c.user_tool}`;
    for (const setting of ['base', 'enhanced'] as const) {
      out.push(
        mk({
          id: `injecagent.${c.type}.${c.position}.${setting}`,
          channel: 'injection',
          tool,
          stage: 'post',
          input: claudePost(tool, c.tool_parameters),
          output: claudeOutput.mcpText(c[setting]),
          setup: 'injection-optin',
          expected: 'review',
          why: 'instruction_in_tool_output',
          family: `injecagent_${c.type}_${setting}`,
          group: `injecagent.${c.type}.${c.position}`,
          source: 'injecagent',
          source_ref: `${snap.repo}@${sha}:data/test_cases_${c.type}_${setting}.json (case ${c.position})`,
          license: 'MIT',
          note: `InjecAgent ${c.type === 'dh' ? 'direct harm' : 'data stealing'}: ${c.attack_type}`,
        })
      );
    }
  }
  return out;
}
