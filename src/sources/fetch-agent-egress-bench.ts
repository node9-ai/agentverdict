// Refreshes sources/agent-egress-bench/: the cases of pipelock's
// agent-egress-bench that an agent hook or an MCP proxy can see, at one pinned
// commit. Network access happens only here; conversion stays offline.
//
//   npm run sources:agent-egress-bench
//
// agent-egress-bench (luckyPipewrench, Apache-2.0) is pipelock's public
// benchmark: 270 wire-level cases with expected verdicts. Its labels are
// written by a competitor, so they are classified `competitor` in suites.ts:
// reported as their own row, kept out of the neutral comparison score.
//
// The selection rule, fixed before any tool was measured on these cases:
//   kept      MCP tool calls, MCP tool results and MCP call sequences (stdio
//             or HTTP transport: the transport is a wire detail a hook does
//             not see), and fetches of a URL and the content they return
//             (fetch proxy), which an agent performs as WebFetch.
//   left out  MCP tool definitions and initialize responses (no Claude Code
//             hook sees tools/list), HTTP headers, request bodies and URLs
//             through a forward proxy, WebSocket frames, A2A messages and
//             TLS-intercepted responses: none of them is a tool call.
// Verdicts map block -> block, allow -> allow, warn -> review.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import type { Joined } from '../types.ts';

const REPO = 'luckyPipewrench/agent-egress-bench';
const COMMIT = '192b12a062fa71b46834e7126f7d6b057de4a7d0';
const OUT = path.join(ROOT, 'sources', 'agent-egress-bench');

const KEEP: Array<{ input_type: string; transports: string[] }> = [
  { input_type: 'mcp_tool_call', transports: ['mcp_stdio', 'mcp_http'] },
  { input_type: 'mcp_tool_result', transports: ['mcp_stdio', 'mcp_http'] },
  { input_type: 'mcp_tool_sequence', transports: ['mcp_stdio', 'mcp_http'] },
  { input_type: 'url', transports: ['fetch_proxy'] },
  { input_type: 'response_content', transports: ['fetch_proxy'] },
];

type Json = string | number | boolean | null | Joined | Json[] | { [k: string]: Json };

/** Every string leaf through protect(), so no credential-shaped value is written contiguously. */
function protectDeep(x: unknown): Json {
  if (typeof x === 'string') return protect(x);
  if (Array.isArray(x)) return x.map(protectDeep);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, protectDeep(v)]));
  return x as Json;
}

async function get(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.text();
}

const tree = JSON.parse(await get(`https://api.github.com/repos/${REPO}/git/trees/${COMMIT}?recursive=1`)) as {
  tree: Array<{ path: string; type: string }>;
};
const files = tree.tree.filter((t) => t.type === 'blob' && t.path.startsWith('cases/') && t.path.endsWith('.json')).map((t) => t.path).sort();

const kept: unknown[] = [];
const leftOut: Record<string, number> = {};
let seen = 0;
for (const p of files) {
  const c = JSON.parse(await get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${p}`)) as Record<string, any>;
  if (!c.id || !c.input_type) continue; // manifests and multi-file drift parts
  seen++;
  const ok = KEEP.some((k) => k.input_type === c.input_type && k.transports.includes(c.transport));
  if (!ok) {
    const key = `${c.input_type}/${c.transport}`;
    leftOut[key] = (leftOut[key] ?? 0) + 1;
    continue;
  }
  if (!['block', 'allow', 'warn'].includes(c.expected_verdict)) throw new Error(`${c.id}: unknown verdict ${c.expected_verdict}`);
  kept.push(
    protectDeep({
      id: c.id,
      path: p,
      category: c.category,
      title: c.title,
      input_type: c.input_type,
      transport: c.transport,
      expected_verdict: c.expected_verdict,
      why_expected: c.why_expected ?? '',
      payload: c.payload,
    })
  );
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), await get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/LICENSE`));
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  'Cases in snapshot.json are from agent-egress-bench by luckyPipewrench (pipelock),\n' +
    `https://github.com/${REPO}, commit ${COMMIT}, licensed under the Apache License 2.0\n` +
    '(LICENSE next to this file). Changes: a subset of cases, credential-shaped strings\n' +
    'stored split into parts; payloads otherwise unchanged.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify({ repo: REPO, commit: COMMIT, license: 'Apache-2.0', fetched_at: new Date().toISOString(), kept: kept.length, left_out: leftOut, cases: kept }, null, 2) + '\n'
);
console.log(`read ${seen} cases at ${COMMIT.slice(0, 12)}: kept ${kept.length}; left out ${JSON.stringify(leftOut)}`);
