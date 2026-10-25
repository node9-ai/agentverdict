// Source: sources/agent-egress-bench/snapshot.json (refresh with
// npm run sources:agent-egress-bench), pipelock's agent-egress-bench
// (Apache-2.0) at one pinned commit. Its labels are a competitor's, so the
// source is classified `competitor` in suites.ts and kept out of the neutral
// comparison score.
//
// Each wire-level case becomes the hook payload an agent would send for it:
//   mcp_tool_call      PreToolUse of mcp__aeb__<tool> with the call's arguments
//   mcp_tool_sequence  the earlier calls as `prior`, the last call as the case
//   mcp_tool_result    PostToolUse of mcp__aeb__tool; the case's result content
//                      is the tool output (the benchmark names no tool for it,
//                      so a neutral name is used that no tool treats specially)
//   url                PreToolUse of WebFetch for the URL (every case is a GET)
//   response_content   PostToolUse of WebFetch, the response body as its result
// Tool-output cases run under `injection-optin`, as AgentDojo's do: the
// profile switches on a scanner some tools ship off by default.

import fs from 'node:fs';
import path from 'node:path';
import { claudePost, claudePre } from './payload.ts';
import { mk } from './record.ts';
import { ROOT } from '../corpus.ts';
import type { BenchRecord, Channel, PriorCall, Template, Verdict } from '../types.ts';

const SNAPSHOT = 'sources/agent-egress-bench/snapshot.json';
const SERVER = 'aeb';

interface Case {
  id: string;
  path: string;
  category: string;
  title: Template;
  input_type: string;
  transport: string;
  expected_verdict: 'block' | 'allow' | 'warn';
  why_expected: Template;
  payload: Record<string, any>;
}

const CHANNEL: Record<string, Channel> = {
  shell_obfuscation: 'shell',
  mcp_input: 'mcp',
  mcp_chain: 'mcp',
  mcp_tool: 'mcp',
  crypto_financial: 'pii',
  encoding_evasion: 'secrets',
  url: 'secrets',
  hostname_exfiltration: 'secrets',
  ssrf_bypass: 'egress',
  response_fetch: 'injection',
};

function channelOf(c: Case): Channel {
  if (CHANNEL[c.category]) return CHANNEL[c.category];
  // The false-positive suite spans surfaces; its channel follows the input.
  if (c.input_type === 'response_content' || c.input_type === 'mcp_tool_result') return 'injection';
  if (c.input_type === 'url') return 'egress';
  return 'mcp';
}

const toolName = (name: string) => `mcp__${SERVER}__${name.replace(/[^A-Za-z0-9_-]/g, '_')}`;
const VERDICT: Record<Case['expected_verdict'], Verdict> = { block: 'block', allow: 'allow', warn: 'review' };
const PROMPT = 'Summarize this page.';

export function convertAgentEgressBench(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as { repo: string; commit: string; cases: Case[] };
  const rev = snap.commit.slice(0, 7);
  const out: BenchRecord[] = [];
  for (const c of snap.cases) {
    const base = {
      id: `aeb.${c.id}`,
      channel: channelOf(c),
      expected: VERDICT[c.expected_verdict],
      why: typeof c.why_expected === 'string' && c.why_expected ? c.why_expected : c.category,
      family: c.category,
      group: `aeb.${c.id}`,
      source: 'agent-egress-bench',
      source_ref: `${snap.repo}@${rev}:${c.path}`,
      license: 'Apache-2.0',
      note: `${c.input_type} over ${c.transport}`,
    };
    const calls = ((c.payload.jsonrpc_messages ?? []) as Array<Record<string, any>>).filter((m) => m.method === 'tools/call');
    if (c.input_type === 'mcp_tool_call' || c.input_type === 'mcp_tool_sequence') {
      if (calls.length === 0) throw new Error(`${c.id}: no tools/call message`);
      const last = calls[calls.length - 1];
      const prior: PriorCall[] = calls.slice(0, -1).map((m) => ({ stage: 'pre', input: claudePre(toolName(m.params.name), m.params.arguments ?? {}) }));
      out.push(
        mk({
          ...base,
          tool: toolName(last.params.name),
          input: claudePre(toolName(last.params.name), last.params.arguments ?? {}),
          ...(prior.length ? { prior } : {}),
          setup: 'clean',
        })
      );
    } else if (c.input_type === 'mcp_tool_result') {
      const result = (c.payload.jsonrpc_messages ?? []).find((m: Record<string, any>) => m.result)?.result;
      if (!result?.content) throw new Error(`${c.id}: no result content`);
      out.push(mk({ ...base, tool: toolName('tool'), stage: 'post', input: claudePost(toolName('tool'), {}), output: result.content, setup: 'injection-optin' }));
    } else if (c.input_type === 'url') {
      out.push(mk({ ...base, tool: 'WebFetch', input: claudePre('WebFetch', { url: c.payload.url, prompt: PROMPT }), setup: 'clean' }));
    } else if (c.input_type === 'response_content') {
      const output: Template = { bytes: 2048, code: 200, codeText: 'OK', durationMs: 412, result: c.payload.response_body, url: c.payload.url };
      out.push(mk({ ...base, tool: 'WebFetch', stage: 'post', input: claudePost('WebFetch', { url: c.payload.url, prompt: PROMPT }), output, setup: 'injection-optin' }));
    } else {
      throw new Error(`${c.id}: input type ${c.input_type} is not converted`);
    }
  }
  return out;
}
