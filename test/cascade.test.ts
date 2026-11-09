import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS, COMMANDS, convertCascade } from '../src/convert/cascade.ts';
import { owaspOf } from '../src/scope/owasp.ts';

// Cascading failures (ASI08, node9Firewall#427): loops and fan-out, with
// benign twins, from fixed lists in code.

const cases = convertCascade();

test('one loop and one benign twin per command, one fan-out and one twin per brief', () => {
  const byFamily = new Map<string, number>();
  for (const c of cases) byFamily.set(c.family, (byFamily.get(c.family) ?? 0) + 1);
  assert.equal(byFamily.get('cascade_loop'), COMMANDS.length);
  assert.equal(byFamily.get('cascade_loop_benign'), COMMANDS.length);
  assert.equal(byFamily.get('cascade_fanout'), BRIEFS.length);
  assert.equal(byFamily.get('cascade_fanout_benign'), BRIEFS.length);
  assert.ok(cases.every((c) => c.setup === 'clean' && owaspOf(c) === 'ASI08'));
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

test('a loop case repeats one call five times before the sixth; its twin never repeats', () => {
  const loop = cases.find((c) => c.family === 'cascade_loop')!;
  const cmd = (t: unknown) => (t as { tool_input: { command: string } }).tool_input.command;
  assert.equal(loop.expected, 'block');
  assert.equal(loop.prior?.length, 5);
  assert.ok(loop.prior!.every((p) => p.stage === 'pre' && cmd(p.input) === cmd(loop.input)));
  const twin = cases.find((c) => c.family === 'cascade_loop_benign')!;
  const seen = new Set([cmd(twin.input), ...twin.prior!.map((p) => cmd(p.input))]);
  assert.equal(seen.size, 6);
});

test('a fan-out case spawns eight subagents before the ninth; its twin three before a fourth', () => {
  const fan = cases.find((c) => c.family === 'cascade_fanout')!;
  assert.equal(fan.expected, 'review');
  assert.equal(fan.tool, 'Agent');
  assert.equal(fan.prior?.length, 8);
  assert.ok(fan.prior!.every((p) => (p.input as { tool_name: string }).tool_name === 'Agent'));
  const twin = cases.find((c) => c.family === 'cascade_fanout_benign')!;
  assert.equal(twin.expected, 'allow');
  assert.equal(twin.prior?.length, 3);
});
