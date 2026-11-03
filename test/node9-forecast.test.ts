import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdictOf } from '../adapters/node9-forecast/index.ts';

test('node9-forecast: an enforced review or block is the hook verdict', () => {
  assert.equal(verdictOf({ id: 'c', decision: 'block', enforced: true, checkId: 'data.credential-files', layer: 'checks' }).verdict, 'block');
  assert.equal(verdictOf({ id: 'c', decision: 'review', enforced: true }).verdict, 'review');
});

test('node9-forecast: log, an unenforced block and allow are an allow at the hook', () => {
  assert.equal(verdictOf({ id: 'c', decision: 'log', enforced: true }).verdict, 'allow');
  const observed = verdictOf({ id: 'c', decision: 'block', enforced: false, notEnforcedBecause: 'observe mode' });
  assert.equal(observed.verdict, 'allow');
  assert.match(observed.detail, /not enforced: observe mode/);
  assert.equal(verdictOf({ id: 'c', decision: 'allow', enforced: true }).verdict, 'allow');
});

test('node9-forecast: a case the HOME does not reach is an allow that names the missing setting', () => {
  const d = verdictOf({ id: 'c', notApplicable: 'user-jail-path' });
  assert.equal(d.verdict, 'allow');
  assert.equal(d.detail, 'not-applicable: user-jail-path');
  assert.equal(verdictOf({ id: 'c', notSimulated: 'post-stage' }).detail, 'not-simulated: post-stage');
});

test('node9-forecast: a per-case error is thrown, so the runner records an error, not a verdict', () => {
  assert.throws(() => verdictOf({ id: 'c', error: 'boom' }), /boom/);
});
