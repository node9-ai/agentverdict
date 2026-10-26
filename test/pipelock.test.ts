// The pipelock adapter needs the pipelock binary in external/ (git-ignored),
// so these tests skip when it is absent.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, loadProfiles } from '../src/corpus.ts';

const BIN = path.join(ROOT, 'external', 'pipelock', '3.6.0', 'pipelock');
const skip = fs.existsSync(BIN) ? false : 'pipelock binary not in external/';

async function adapter() {
  const { PipelockHookAdapter } = await import('../adapters/pipelock-hook/index.ts');
  return new PipelockHookAdapter(BIN);
}

test('egress-lock becomes strict mode with the profile allow list only', { skip }, async () => {
  const a = await adapter();
  const env = { home: '/tmp/x', cwd: '/tmp/x/project' };
  const { config, approx } = a.translate(loadProfiles().get('egress-lock')!, env, new Set());
  assert.equal(config.mode, 'strict');
  assert.deepEqual(config.api_allowlist, ['corp.example']);
  assert.deepEqual(approx, []);
});

test('a profile pipelock cannot express says so', { skip }, async () => {
  const a = await adapter();
  const env = { home: '/tmp/x', cwd: '/tmp/x/project' };
  const { approx } = a.translate(loadProfiles().get('egress-watch')!, env, new Set());
  assert.ok(approx.some((x) => x.includes('ask-before-unlisted-host')));
});

test('a config pipelock refuses is a measurement error, never a block', { skip }, async () => {
  const a = await adapter();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-'));
  try {
    fs.writeFileSync(path.join(home, 'pipelock.yaml'), 'version: 1\nssrf:\n  ip_allowlist: ["fd00::/8"]\n');
    const payload = { session_id: 's', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } };
    await assert.rejects(a.decide({ id: 'probe', stage: 'pre', tool: 'Bash' } as never, payload, { home, cwd: home }), /could not read the case/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('tool output is unreachable through the hook', { skip }, async () => {
  const a = await adapter();
  assert.match(a.unreachable({ stage: 'post' } as never) ?? '', /PreToolUse only/);
  assert.equal(a.unreachable({ stage: 'pre' } as never), null);
});

test('the MCP path reaches MCP tool output only', { skip }, async () => {
  const { PipelockAdapter } = await import('../adapters/pipelock-mcp/index.ts');
  const a = new PipelockAdapter(BIN);
  assert.equal(a.unreachable({ stage: 'post', tool: 'mcp__github__get_issue' } as never), null);
  assert.match(a.unreachable({ stage: 'post', tool: 'WebFetch' } as never) ?? '', /not modelled/);
});

test('plain MCP tool output passes the proxy unchanged', { skip }, async () => {
  const { PipelockAdapter } = await import('../adapters/pipelock-mcp/index.ts');
  const a = new PipelockAdapter(BIN);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-'));
  try {
    const env = { home, cwd: home };
    await a.prepare(loadProfiles().get('clean')!, env, new Set());
    const record = { id: 'probe', stage: 'post', tool: 'mcp__notes__read_note', output: [{ type: 'text', text: 'Lunch moved to 1pm.' }] };
    const d = await a.decide(record as never, { tool_input: { id: 'n1' } }, env);
    assert.equal(d.verdict, 'allow');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
