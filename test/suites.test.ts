import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LABELS, SUITES, labelsOf, suiteOf } from '../src/suites.ts';
import { summarizeComparison, summarizeSuites, suiteLabels } from '../src/score.ts';
import { loadCorpus } from '../src/corpus.ts';
import type { CaseResult } from '../src/types.ts';

test('every source of the current corpus belongs to a declared suite', () => {
  const declared = new Set(Object.keys(SUITES));
  for (const src of new Set(loadCorpus().map((r) => r.source))) {
    assert.ok(declared.has(suiteOf(src)), `source ${src} is not in any suite of suites.ts`);
  }
});

test('a source no suite lists is its own suite', () => {
  assert.equal(suiteOf('agentthreatbench'), 'agentthreatbench');
});

test('no source is listed in two suites', () => {
  const all = Object.values(SUITES).flatMap((s) => s.sources);
  assert.equal(new Set(all).size, all.length);
});

test('suites partition the results and keep the declared order, unknown suites last', () => {
  const r = (suite: string | undefined, expected: CaseResult['expected'], actual: CaseResult['actual']): CaseResult => ({
    id: Math.random().toString(36),
    adapter: 't',
    tool_version: '0',
    channel: 'secrets',
    expected,
    actual,
    private: false,
    latency_ms: 1,
    suite,
  });
  const out = summarizeSuites([r('zzz-external', 'block', 'allow'), r('packages', 'block', 'block'), r('node9-tests', 'allow', 'allow'), r(undefined, 'allow', 'review')]);
  assert.deepEqual(Object.keys(out), ['node9-tests', 'packages', 'unassigned', 'zzz-external']);
  assert.equal(Object.values(out).reduce((n, s) => n + s.all.cases, 0), 4);
  assert.equal(out.packages.all.catch_rate, 1);
  assert.equal(out['zzz-external'].all.catch_rate, 0);
});

test('every source of the current corpus says who wrote its labels', () => {
  for (const src of new Set(loadCorpus().map((r) => r.source))) {
    assert.ok(labelsOf(src), `source ${src} has no label origin in LABELS`);
  }
});

test("node9's own tests never count toward the comparison score", () => {
  for (const src of SUITES['node9-tests'].sources) assert.equal(LABELS[src], 'node9');
  assert.equal(suiteLabels('node9-tests'), "node9's team");
  assert.equal(suiteLabels('agentdojo'), 'outside');
  assert.equal(suiteLabels('packages'), 'mixed');
});

test('the comparison score counts outside labels only', () => {
  const r = (id: string, labels: CaseResult['labels'], expected: CaseResult['expected'], actual: CaseResult['actual']): CaseResult => ({
    id,
    adapter: 'a',
    tool_version: '1',
    channel: 'pii',
    expected,
    actual,
    private: false,
    latency_ms: 1,
    ...(labels ? { labels } : {}),
  });
  const out = summarizeComparison([
    r('a', 'outside', 'block', 'block'),
    r('b', 'outside', 'allow', 'review'),
    r('c', 'node9', 'block', 'allow'),
    r('d', undefined, 'block', 'allow'),
  ]);
  assert.equal(out.all.all.cases, 2);
  assert.equal(out.all.all.catch_rate, 1);
  assert.equal(out.all.all.interruptions, 1);
});
