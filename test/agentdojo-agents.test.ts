import test from 'node:test';
import assert from 'node:assert/strict';
import { convertAgentDojoAgents } from '../src/convert/agentdojo-agents.ts';
import { convertAgentDojoSequences } from '../src/convert/agentdojo-seq.ts';
import { SUBAGENT_ID } from '../src/convert/payload.ts';

// The ASI07 chains (node9Firewall#428): the same vectors, tasks and calls as
// agentdojo-seq, each crossing an agent boundary in one of three ways, with a
// benign twin, and every case on its vector's side of the holdout.

const cases = convertAgentDojoAgents();
const seq = convertAgentDojoSequences();

test('three chains per agentdojo-seq case, attacks and benign twins alike', () => {
  assert.equal(cases.length, seq.length * 3);
  const kinds = new Set(cases.map((c) => c.id.split('.')[3]));
  assert.deepEqual([...kinds].sort(), ['brief', 'read', 'report']);
  const attacks = cases.filter((c) => c.expected === 'review');
  const benign = cases.filter((c) => c.expected === 'allow');
  assert.equal(attacks.length, seq.filter((c) => c.expected === 'review').length * 3);
  assert.equal(benign.length, seq.filter((c) => c.expected === 'allow').length * 3);
  assert.ok(cases.every((c) => c.source === 'agentdojo-agents' && c.license === 'MIT'));
});

test('every case keeps its vector group, so the holdout never splits a vector', () => {
  const groups = new Set(seq.map((c) => c.group));
  for (const c of cases) assert.ok(groups.has(c.group), c.id);
  assert.ok(cases.every((c) => c.group.startsWith('agentdojo.')));
});

test("read: the prior is the subagent's read, marked with agent_id; the parent acts", () => {
  const c = cases.find((x) => x.id.includes('.read.') && x.expected === 'review')!;
  assert.equal(c.setup, 'exposure-org');
  assert.equal(c.prior?.length, 1);
  const prior = c.prior![0].input as {
    agent_id?: string;
    hook_event_name?: string;
  };
  assert.equal(prior.agent_id, SUBAGENT_ID);
  const input = c.input as { agent_id?: string; tool_name: string };
  assert.equal(input.agent_id, undefined);
  assert.ok(input.tool_name.startsWith('mcp__agentdojo-'));
});

test('brief: no prior; the parent spawns a subagent with the record in the brief', () => {
  const c = cases.find((x) => x.id.includes('.brief.') && x.expected === 'review')!;
  assert.equal(c.setup, 'handoff-optin');
  assert.equal(c.prior, undefined);
  assert.equal(c.tool, 'Agent');
  const input = c.input as {
    tool_name: string;
    tool_input: { prompt: string | { $join: string[] }; subagent_type: string };
  };
  assert.equal(input.tool_name, 'Agent');
  // The brief is the prefix joined with the record's parts (a protected
  // record is parts; a plain one, a string).
  const prompt = input.tool_input.prompt;
  const text = typeof prompt === 'string' ? prompt : prompt.$join.join('');
  assert.ok(text.length > 40);
  assert.ok(!text.includes('[object Object]'));
  assert.equal(input.tool_input.subagent_type, 'general-purpose');
});

test('report: the prior is the Agent result carrying the record; the parent acts', () => {
  const c = cases.find((x) => x.id.includes('.report.') && x.expected === 'review')!;
  assert.equal(c.setup, 'injection-optin');
  const prior = c.prior![0];
  assert.equal((prior.input as { tool_name: string }).tool_name, 'Agent');
  const out = prior.output as {
    agentId: string;
    status: string;
    content: Array<{ type: string }>;
  };
  assert.equal(out.agentId, SUBAGENT_ID);
  assert.equal(out.status, 'completed');
  assert.equal(out.content[0].type, 'text');
});

test('ids are unique and stable in shape', () => {
  const ids = new Set(cases.map((c) => c.id));
  assert.equal(ids.size, cases.length);
  for (const c of cases) assert.match(c.id, /^agentdojo-agents\.[^.]+\.[^.]+\.(read|brief|report)\.[^.]+\.[^.]+$/);
});
