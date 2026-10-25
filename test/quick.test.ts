import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quickSet, QUICK_MIN } from '../src/quick.ts';
import { loadCorpus } from '../src/corpus.ts';

const corpus = loadCorpus();
const quick = quickSet(corpus);

test('the quick set never takes a holdout case or an extended one', () => {
  for (const r of corpus) {
    if (!quick.has(r.id)) continue;
    assert.equal(r.private, false, r.id);
    assert.equal(r.set, 'official', r.id);
  }
});

test('every source and verdict with public official cases is in the quick set', () => {
  const strata = new Set(corpus.filter((r) => !r.private && r.set === 'official').map((r) => `${r.source}/${r.expected}`));
  const covered = new Set(corpus.filter((r) => quick.has(r.id)).map((r) => `${r.source}/${r.expected}`));
  assert.deepEqual([...covered].sort(), [...strata].sort());
});

test('each stratum gives at least QUICK_MIN cases or all it has', () => {
  const pub = new Map<string, number>();
  const got = new Map<string, number>();
  for (const r of corpus) {
    if (r.private || r.set !== 'official') continue;
    const k = `${r.source}/${r.expected}`;
    pub.set(k, (pub.get(k) ?? 0) + 1);
    if (quick.has(r.id)) got.set(k, (got.get(k) ?? 0) + 1);
  }
  for (const [k, n] of pub) assert.equal(got.get(k), Math.min(n, Math.max(QUICK_MIN, Math.ceil(n * 0.1))), k);
});

test('the quick set is a pure function of the corpus', () => {
  assert.deepEqual([...quickSet([...corpus].reverse())].sort(), [...quick].sort());
});
