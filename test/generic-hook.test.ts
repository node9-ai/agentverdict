import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GenericHookAdapter, hookVerdict } from '../adapters/generic-hook/index.ts';
import { loadCorpus, loadProfiles } from '../src/corpus.ts';
import { runCases } from '../src/runner.ts';

const r = (status: number | null, stdout = '', signal: string | null = null) => ({ status, signal, stdout, stderr: '' });

test('hook verdicts follow the Claude Code hook contract', () => {
  assert.equal(hookVerdict(r(2), false).verdict, 'block');
  assert.equal(hookVerdict(r(2), true).verdict, 'review');
  assert.equal(hookVerdict(r(0), false).verdict, 'allow');
  assert.equal(hookVerdict(r(0, JSON.stringify({ hookSpecificOutput: { permissionDecision: 'deny', permissionDecisionReason: 'no' } })), false).verdict, 'block');
  assert.equal(hookVerdict(r(0, JSON.stringify({ hookSpecificOutput: { permissionDecision: 'ask' } })), false).verdict, 'review');
  assert.equal(hookVerdict(r(0, JSON.stringify({ decision: 'block' })), false).verdict, 'block');
  assert.equal(hookVerdict(r(0, JSON.stringify({ hookSpecificOutput: { additionalContext: 'careful' } })), true).verdict, 'review');
  assert.equal(hookVerdict(r(0, JSON.stringify({ hookSpecificOutput: { additionalContext: 'careful' } })), false).verdict, 'allow');
  assert.equal(hookVerdict(r(null, '', 'SIGTERM'), false).detail, 'held for a human (timeout)');
  assert.throws(() => hookVerdict(r(1), false), /hook exited 1/);
});

test('a hook given as a command line runs through the real runner, with the profile written for it', async () => {
  // A toy hook: blocks any Bash command that names rm -rf, asks on curl, and reports the profile it was given.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n9b-hook-'));
  const script = path.join(dir, 'hook.js');
  fs.writeFileSync(
    script,
    [
      "const fs = require('fs');",
      "const p = JSON.parse(fs.readFileSync(0, 'utf8'));",
      "const profile = JSON.parse(fs.readFileSync(process.env.HOME + '/.agentverdict/profile.json', 'utf8'));",
      "const cmd = String((p.tool_input || {}).command || '');",
      "if (cmd.includes('rm -rf')) { console.error('refused by ' + profile.name); process.exit(2); }",
      "if (cmd.includes('curl')) { console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: 'network' } })); }",
      'process.exit(0);',
    ].join('\n')
  );
  const adapter = new GenericHookAdapter({ name: 'toy', command: `node ${script}`, version: '0.0.1' });
  const corpus = loadCorpus();
  const pick = (f: (cmd: string) => boolean) => corpus.find((c) => c.tool === 'Bash' && c.stage === 'pre' && !c.prior && typeof (c.input as { tool_input: { command?: unknown } }).tool_input.command === 'string' && f((c.input as { tool_input: { command: string } }).tool_input.command))!;
  const records = [pick((c) => c.includes('rm -rf')), pick((c) => c.startsWith('curl')), pick((c) => c.startsWith('ls')), corpus.find((c) => c.stage === 'post')!];
  const results = await runCases(adapter, records, loadProfiles());
  assert.equal(results[0].actual, 'block');
  assert.match(results[0].detail ?? '', /refused by/);
  assert.equal(results[1].actual, 'review');
  assert.equal(results[2].actual, 'allow');
  assert.equal(results[3].actual, 'unreachable');
  assert.equal(adapter.name, 'hook-toy');
  fs.rmSync(dir, { recursive: true, force: true });
});
