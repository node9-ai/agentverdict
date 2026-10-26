// The OWASP Top 10 for Agentic Applications (published 2025-12-09) risk each
// case's harm falls under, so results can be read per risk (node9Firewall#320
// section 0.7, the benchmark's OWASP category). One written rule: the case's
// source when the source decides it, otherwise its channel. The benign side
// of a risk (the ordinary work a guard must not stop) carries the same risk
// as the attacks it is the control for. AgentVerdict's mapping, stated as
// such; a case's label is never touched by it.
//
// Risks with no case yet (ASI06 memory and context poisoning, ASI07
// inter-agent communication, ASI08 cascading failures, ASI10 rogue agents)
// are listed so a report shows them as "no cases yet" instead of leaving
// them out.

import type { BenchRecord, Channel } from '../types.ts';

export const ASI = {
  ASI01: 'Agent Goal Hijack',
  ASI02: 'Tool Misuse and Exploitation',
  ASI03: 'Identity and Privilege Abuse',
  ASI04: 'Agentic Supply Chain Vulnerabilities',
  ASI05: 'Unexpected Code Execution',
  ASI06: 'Memory and Context Poisoning',
  ASI07: 'Insecure Inter-Agent Communication',
  ASI08: 'Cascading Failures',
  ASI09: 'Human-Agent Trust Exploitation',
  ASI10: 'Rogue Agents',
} as const;

export type AsiId = keyof typeof ASI;

export function isAsiId(v: unknown): v is AsiId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(ASI, v);
}

/** By channel: secrets leaving or used (ASI03), data sent out or harm done through a tool (ASI02), packages (ASI04), instructions in content the agent read (ASI01). */
const BY_CHANNEL: Record<Channel, AsiId> = {
  secrets: 'ASI03',
  pii: 'ASI02',
  egress: 'ASI02',
  shell: 'ASI02',
  package: 'ASI04',
  injection: 'ASI01',
  mcp: 'ASI02',
};

/** RedCode scenarios that run code from outside or open a shell: unexpected code execution. */
const REDCODE_CODE_EXECUTION = new Set(['redcode_untrusted_installation', 'redcode_eval_injection', 'redcode_create_a_reverse_shell']);

/** Sources whose cases are an action after outside content: the hijack is the risk. */
const AFTER_CONTENT = new Set(['agentdojo-seq', 'agentdojo-calls', 'node9-bench-exposure']);

export function owaspOf(r: BenchRecord): AsiId {
  // Actions a person must approve, and the ordinary ones beside them: the
  // human-in-the-loop control.
  if (r.source === 'dangerous-actions') return 'ASI09';
  if (r.source === 'redcode-exec' && REDCODE_CODE_EXECUTION.has(r.family)) return 'ASI05';
  // Ordinary programs run whole: the control for code execution.
  if (r.source === 'benign-scripts') return 'ASI05';
  if (AFTER_CONTENT.has(r.source)) return 'ASI01';
  return BY_CHANNEL[r.channel];
}
