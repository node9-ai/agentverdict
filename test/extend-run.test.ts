// Extending a run to a newer corpus: carried answers keep their verdict and
// take the current record's side of the split; new cases run; a case that
// changed, or another tool version, refuses (src/extend-run.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus, loadProfiles } from '../src/corpus.ts';
import { CalibrationAdapter } from '../adapters/calibration/index.ts';
import { extendRun, planExtension } from '../src/extend-run.ts';
import { resultBase } from '../src/runner.ts';
import type { BenchRecord, CaseResult } from '../src/types.ts';

const corpus = loadCorpus();
const [a, b, c] = corpus.filter((r) => r.setup === 'clean' && r.stage === 'pre').slice(0, 3);

test('carried answers keep their verdict and take the new side of the split; new cases run', async () => {
  const adapter = new CalibrationAdapter('allow');
  // As measured: a was held out then, b public; both answered "block" (not what this adapter says).
  const before = new Map<string, BenchRecord>([
    [a.id, { ...a, private: true }],
    [b.id, { ...b }],
  ]);
  const answers = new Map<string, CaseResult>(
    [a, b].map((r) => [r.id, { ...resultBase(adapter, { ...r, private: r === a }), actual: 'block', latency_ms: 7, detail: 'then' }])
  );
  const plan = planExtension(adapter, [a, b, c], before, answers);
  assert.deepEqual([...plan.carried.keys()], [a.id, b.id]);
  assert.deepEqual(plan.toRun.map((r) => r.id), [c.id]);
  assert.equal(plan.carried.get(a.id)!.private, a.private, 'the side of the split is the current one');
  const { results } = await extendRun(adapter, [a, b, c], plan, loadProfiles());
  assert.deepEqual(results.map((r) => r.id), [a.id, b.id, c.id], 'corpus order');
  assert.equal(results[0].actual, 'block');
  assert.equal(results[0].detail, 'then');
  assert.equal(results[2].actual, 'allow', 'the new case ran');
});

test('a case that changed since the earlier run, or another tool version, refuses', () => {
  const adapter = new CalibrationAdapter('allow');
  const answer = new Map<string, CaseResult>([[a.id, { ...resultBase(adapter, a), actual: 'block', latency_ms: 1 }]]);
  assert.throws(() => planExtension(adapter, [a], new Map([[a.id, { ...a, expected: a.expected === 'allow' ? 'block' : 'allow' }]]), answer), /changed since the earlier run/);
  const other = new Map<string, CaseResult>([[a.id, { ...resultBase(adapter, a), tool_version: 'older', actual: 'block', latency_ms: 1 }]]);
  assert.throws(() => planExtension(adapter, [a], new Map([[a.id, a]]), other), /earlier answer is from/);
});
