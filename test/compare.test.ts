import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns, semverCmp } from '../src/compare.ts';
import type { CaseResult, Verdict } from '../src/types.ts';

const c = (id: string, expected: Verdict, actual: CaseResult['actual']): CaseResult => ({
  id,
  adapter: 't',
  tool_version: '0',
  channel: 'secrets',
  expected,
  actual,
  private: false,
  latency_ms: 1,
});
const run = (cases: CaseResult[]) => ({ dir: '/tmp/x', tool: '0', corpus: '1.0.0', cases });

test('buckets: regressed, fixed, tier and still wrong', () => {
  const base = run([
    c('regress', 'block', 'block'),
    c('fix', 'allow', 'review'),
    c('tier-worse', 'block', 'block'),
    c('tier-better', 'block', 'review'),
    c('wrong', 'block', 'allow'),
    c('same', 'allow', 'allow'),
  ]);
  const head = run([
    c('regress', 'block', 'allow'),
    c('fix', 'allow', 'allow'),
    c('tier-worse', 'block', 'review'),
    c('tier-better', 'block', 'block'),
    c('wrong', 'block', 'allow'),
    c('same', 'allow', 'allow'),
  ]);
  const r = compareRuns(base, head, new Set());
  assert.deepEqual(r.regressed.map((x) => x.id), ['regress']);
  assert.deepEqual(r.fixed.map((x) => x.id), ['fix']);
  assert.deepEqual(r.tierWorse.map((x) => x.id), ['tier-worse']);
  assert.deepEqual(r.tierBetter.map((x) => x.id), ['tier-better']);
  assert.deepEqual(r.stillWrong.map((x) => x.id), ['wrong']);
  assert.equal(r.pass, false);
});

test('an error in head is a regression', () => {
  const r = compareRuns(run([c('e', 'block', 'block')]), run([c('e', 'block', 'error')]), new Set());
  assert.equal(r.regressed.length, 1);
});

test('volatile cases never fail the gate and are split by direction', () => {
  const base = run([c('v-worse', 'block', 'block'), c('v-better', 'block', 'allow')]);
  const head = run([c('v-worse', 'block', 'allow'), c('v-better', 'block', 'block')]);
  const r = compareRuns(base, head, new Set(['v-worse', 'v-better']));
  assert.equal(r.pass, true);
  assert.deepEqual(r.volatileWorse.map((x) => x.id), ['v-worse']);
  assert.deepEqual(r.volatileBetter.map((x) => x.id), ['v-better']);
});

test('strict tier fails on a tier moving away from the label', () => {
  const base = run([c('t', 'block', 'block')]);
  const head = run([c('t', 'block', 'review')]);
  assert.equal(compareRuns(base, head, new Set()).pass, true);
  assert.equal(compareRuns(base, head, new Set(), true).pass, false);
});

test('a relabelled case and cases in only one run are not compared', () => {
  const base = run([c('relabel', 'allow', 'allow'), c('gone', 'block', 'block')]);
  const head = run([c('relabel', 'block', 'block'), c('new', 'block', 'allow')]);
  const r = compareRuns(base, head, new Set());
  assert.equal(r.shared, 1);
  assert.equal(r.onlyBase, 1);
  assert.equal(r.onlyHead, 1);
  assert.deepEqual(r.relabelled.map((x) => x.id), ['relabel']);
  assert.equal(r.pass, true);
  assert.equal(r.metrics.all, undefined);
});

test('metrics are computed on the same cases for both sides', () => {
  const base = run([c('a', 'block', 'allow'), c('b', 'allow', 'review')]);
  const head = run([c('a', 'block', 'block'), c('b', 'allow', 'allow'), c('extra', 'block', 'allow')]);
  const r = compareRuns(base, head, new Set());
  assert.equal(r.metrics.all.base.catch_rate, 0);
  assert.equal(r.metrics.all.head.catch_rate, 1);
  assert.equal(r.metrics.all.head.cases, 2);
});

test('semver comparison ignores build suffixes and orders numerically', () => {
  assert.ok(semverCmp('2.10.0', '2.9.9') > 0);
  assert.equal(semverCmp('2.27.0', '2.27.0+abc1234-dirty'), 0);
  assert.ok(semverCmp('1.1.1', '1.1.0') > 0);
});
