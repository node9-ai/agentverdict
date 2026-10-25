import { test } from 'node:test';
import assert from 'node:assert/strict';
import { osvLookupFailure } from '../adapters/node9-gate/index.ts';
import { isTransient } from '../src/runner.ts';
import type { CaseResult } from '../src/types.ts';

const line = (misses: string[]) => JSON.stringify({ ts: '2026-10-19T00:00:00Z', event: 'package-check-miss', tool: 'Bash', misses });

test('a failed OSV lookup in the call log is a transient signal', () => {
  assert.match(osvLookupFailure(line(['PyPI package "example": OSV online timeout'])) ?? '', /OSV online timeout/);
  assert.match(osvLookupFailure(line(['npm package "x": OSV online unavailable'])) ?? '', /unavailable/);
  assert.match(
    osvLookupFailure(line(['RubyGems package "x": local index unavailable, no online lookup (online fallback off)'])) ?? '',
    /no online lookup/
  );
});

test('a registry miss, other events and noise are not', () => {
  assert.equal(osvLookupFailure(line(['PyPI package "gone": registry metadata unavailable'])), undefined);
  assert.equal(osvLookupFailure(JSON.stringify({ event: 'something-else', misses: ['OSV online timeout'] })), undefined);
  assert.equal(osvLookupFailure('not json package-check-miss OSV online'), undefined);
  assert.equal(osvLookupFailure(''), undefined);
});

test('isTransient covers a reported lookup failure, whatever the verdict', () => {
  const base: CaseResult = { id: 'x', adapter: 'node9-gate', tool_version: '0', channel: 'package', expected: 'block', actual: 'allow', private: false, latency_ms: 1 };
  assert.equal(isTransient(base), false);
  assert.equal(isTransient({ ...base, transient: 'OSV online timeout' }), true);
  assert.equal(isTransient({ ...base, actual: 'block', expected: 'allow', transient: 'OSV online timeout' }), true);
});
