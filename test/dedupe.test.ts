import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callKey, dropDuplicates, findDuplicates } from '../src/dedupe.ts';
import type { BenchRecord } from '../src/types.ts';

function rec(id: string, command: unknown, over: Partial<BenchRecord> = {}): BenchRecord {
  return {
    id,
    channel: 'shell',
    agent: 'claude-code',
    tool: 'Bash',
    stage: 'pre',
    input: { tool_name: 'Bash', tool_input: { command } },
    setup: 'clean',
    expected: 'allow',
    why: 'w',
    family: 'f',
    group: `g.${id}`,
    source: 'nl2sh-alfa',
    source_ref: 'r',
    license: 'MIT',
    private: false,
    ...over,
  } as BenchRecord;
}

test('exact copies of one call are one case', () => {
  const { records, sets } = dropDuplicates([rec('a', 'cat /proc/meminfo'), rec('b', 'cat /proc/meminfo')]);
  assert.deepEqual(
    records.map((r) => r.id),
    ['a']
  );
  assert.equal(sets[0].dropped[0].id, 'b');
});

test('indentation alone does not make a new case', () => {
  assert.equal(callKey(rec('a', '    key: 1\n  other: 2')), callKey(rec('b', 'key: 1\nother: 2')));
});

test('whitespace inside a line and letter case do make a new case', () => {
  assert.notEqual(callKey(rec('a', '4111 1111')), callKey(rec('b', '4111  1111')));
  assert.notEqual(callKey(rec('a', 'hostname -I')), callKey(rec('b', 'hostname -i')));
});

test('the same call through another tool, stage or setup is another case', () => {
  const base = rec('a', 'ls');
  assert.notEqual(callKey(base), callKey(rec('b', 'ls', { setup: 'other' })));
  assert.notEqual(callKey(base), callKey(rec('b', 'ls', { stage: 'post', output: { stdout: '' } })));
  assert.notEqual(callKey(base), callKey(rec('b', 'ls', { prior: [{ tool: 'Read', input: {} }] as never })));
});

test('a value stored as $join parts equals the plain text', () => {
  assert.equal(callKey(rec('a', { $join: ['cat ', '/etc', '/os-release'] })), callKey(rec('b', 'cat /etc/os-release')));
});

test('the outside-labelled copy is kept over a node9-labelled one', () => {
  const ours = rec('ours', 'ls -la', { source: 'node9-bench-system-ops' });
  const theirs = rec('theirs', 'ls -la', { source: 'nl2sh-alfa' });
  const { records } = dropDuplicates([ours, theirs]);
  assert.deepEqual(
    records.map((r) => r.id),
    ['theirs']
  );
});

test('copies with different labels are a conflict, never silently resolved', () => {
  const a = rec('a', 'rm -rf /tmp/x', { expected: 'allow' });
  const b = rec('b', 'rm -rf /tmp/x', { expected: 'block' });
  assert.equal(findDuplicates([a, b])[0].conflict, true);
  assert.throws(() => dropDuplicates([a, b]), /label conflict/);
});

test('among copies with the same label origin, the public copy is kept over a holdout one', () => {
  const held = rec('held', 'ls -la', { source: 'node9-bench-system-ops', private: true });
  const pub = rec('pub', 'ls -la', { source: 'node9-jail-gauntlet' });
  assert.deepEqual(dropDuplicates([held, pub]).records.map((r) => r.id), ['pub']);
  // The outside-labelled copy still wins, even when it is the holdout one.
  const theirs = rec('theirs', 'ls -la', { source: 'nl2sh-alfa', private: true });
  assert.deepEqual(dropDuplicates([pub, theirs]).records.map((r) => r.id), ['theirs']);
});
