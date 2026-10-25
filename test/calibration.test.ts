// End to end over the real corpus: the runner and the scorer must give the
// two degenerate tools their known scores. If these fail, no number this
// benchmark prints about a real tool can be trusted.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus, loadProfiles } from '../src/corpus.ts';
import { runCases } from '../src/runner.ts';
import { summarize, summarizeSuites } from '../src/score.ts';
import { CalibrationAdapter } from '../adapters/calibration/index.ts';

const records = loadCorpus();
const profiles = loadProfiles();
const count = (v: string) => records.filter((r) => r.expected === v).length;

test('allow-all catches nothing and interrupts nothing', async () => {
  const all = summarize(await runCases(new CalibrationAdapter('allow'), records, profiles)).all.all;
  assert.equal(all.cases, records.length);
  assert.equal(all.errors, 0);
  assert.equal(all.catch_rate, 0);
  assert.equal(all.review_hit_rate, 0);
  assert.equal(all.interruptions_per_100, 0);
  assert.equal(all.tier_scored, 0);
});

test('block-all catches everything, interrupts every allow case, and is in the right tier only on block labels', async () => {
  const all = summarize(await runCases(new CalibrationAdapter('block'), records, profiles)).all.all;
  assert.equal(all.errors, 0);
  assert.equal(all.catch_rate, 1);
  assert.equal(all.review_hit_rate, 1);
  assert.equal(all.interruptions, count('allow'));
  assert.equal(all.interruptions_per_100, 100);
  assert.equal(all.tier_scored, count('block') + count('review'));
  assert.equal(all.tier_correct, count('block'));
});

test('every case is reported under exactly one suite', async () => {
  const results = await runCases(new CalibrationAdapter('block'), records, profiles);
  assert.ok(results.every((r) => typeof r.suite === 'string' && r.suite.length > 0));
  const suites = summarizeSuites(results);
  assert.equal(Object.values(suites).reduce((n, s) => n + s.all.cases, 0), records.length);
});

test('every channel and both splits are scored', async () => {
  const s = summarize(await runCases(new CalibrationAdapter('block'), records, profiles));
  const channels = new Set(records.map((r) => r.channel));
  for (const ch of channels) {
    assert.ok(s[ch], `channel ${ch} missing from the summary`);
    assert.equal(s[ch].public.cases + s[ch].holdout.cases, s[ch].all.cases);
  }
});
