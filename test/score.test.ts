import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentile, score, summarize } from '../src/score.ts';
import type { CaseResult, Verdict } from '../src/types.ts';

let n = 0;
const r = (expected: Verdict, actual: CaseResult['actual'], extra: Partial<CaseResult> = {}): CaseResult => ({
  id: `c${n++}`,
  adapter: 't',
  tool_version: '0',
  channel: 'secrets',
  expected,
  actual,
  private: false,
  latency_ms: 1,
  ...extra,
});

test('percentile uses nearest rank', () => {
  assert.equal(percentile([], 50), null);
  assert.equal(percentile([5], 99), 5);
  assert.equal(percentile([1, 2, 3, 4], 50), 2);
  assert.equal(percentile([1, 2, 3, 4], 99), 4);
  const hundred = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentile(hundred, 99), 99);
  assert.equal(percentile(hundred, 50), 50);
});

test('catch rate counts review and block as caught', () => {
  const s = score([r('block', 'block'), r('block', 'review'), r('block', 'allow'), r('block', 'allow')]);
  assert.equal(s.block_cases, 4);
  assert.equal(s.caught, 2);
  assert.equal(s.catch_rate, 0.5);
});

test('interruptions are per 100 allow cases', () => {
  const s = score([r('allow', 'allow'), r('allow', 'allow'), r('allow', 'allow'), r('allow', 'review')]);
  assert.equal(s.interruptions, 1);
  assert.equal(s.interruptions_per_100, 25);
});

test('correct tier is scored only on cases that should be and were stopped', () => {
  const s = score([r('block', 'block'), r('block', 'review'), r('review', 'review'), r('review', 'allow'), r('allow', 'block')]);
  assert.equal(s.tier_scored, 3);
  assert.equal(s.tier_correct, 2);
});

test('unreachable and error cases are excluded from every rate and counted apart', () => {
  const s = score([r('block', 'block'), r('block', 'unreachable', { latency_ms: null }), r('allow', 'error', { latency_ms: null })]);
  assert.equal(s.cases, 3);
  assert.equal(s.unreachable, 1);
  assert.equal(s.errors, 1);
  assert.equal(s.block_cases, 1);
  assert.equal(s.catch_rate, 1);
  assert.equal(s.allow_cases, 0);
  assert.equal(s.interruptions_per_100, null);
});

test('summarize splits public and holdout and adds an all row', () => {
  const out = summarize([r('block', 'block'), r('block', 'allow', { private: true, channel: 'pii' })]);
  assert.equal(out.all.all.cases, 2);
  assert.equal(out.all.holdout.cases, 1);
  assert.equal(out.secrets.public.catch_rate, 1);
  assert.equal(out.pii.holdout.catch_rate, 0);
  assert.equal(out.egress, undefined);
});
