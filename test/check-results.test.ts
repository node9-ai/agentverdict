import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkResults } from '../src/check-results.ts';
import type { BenchRecord } from '../src/types.ts';

const rec = (id: string, over: Partial<BenchRecord> = {}): BenchRecord =>
  ({ id, expected: 'block', private: false, set: 'official', ...over }) as BenchRecord;
const corpus = [rec('a'), rec('b', { expected: 'allow' }), rec('h', { private: true }), rec('x', { set: 'extended' })];
const pinned = { version: '9.9.9', sha256: 'abc', public_sha256: 'pub' };
const line = (id: string, expected: string, actual: string) => JSON.stringify({ id, expected, actual });
const summary = { corpus_sha256: 'abc', corpus_version: '9.9.9' };

test('a complete public official submission passes, with the holdout and extended cases optional', () => {
  const rep = checkResults([line('a', 'block', 'block'), line('b', 'allow', 'error')], summary, corpus, pinned, { split: 'public', set: 'official' });
  assert.deepEqual(rep.problems, []);
  assert.match(rep.notes.join('\n'), /1 case\(s\) errored/);
});

test('missing cases, unknown ids, wrong labels, bad verdicts, duplicates and another corpus are problems', () => {
  const rep = checkResults(
    [line('a', 'allow', 'block'), line('a', 'block', 'block'), line('zzz', 'block', 'block'), line('b', 'allow', 'maybe'), 'not json'],
    { corpus_sha256: 'def', corpus_version: '1.0.0' },
    corpus,
    pinned,
    { split: 'public', set: 'official' }
  );
  const all = rep.problems.join('\n');
  assert.match(all, /a expected allow, the corpus says block/);
  assert.match(all, /a appears twice/);
  assert.match(all, /zzz is not a case/);
  assert.match(all, /verdict maybe/);
  assert.match(all, /not JSON/);
  assert.match(all, /not on the pinned 9\.9\.9/);
});

test('holdout cases in a public check are ignored and noted; the full check requires them', () => {
  const pub = checkResults([line('a', 'block', 'block'), line('b', 'allow', 'allow'), line('h', 'block', 'allow')], summary, corpus, pinned, { split: 'public', set: 'official' });
  assert.deepEqual(pub.problems, []);
  assert.equal(pub.counts.ignoredHoldout, 1);
  const full = checkResults([line('a', 'block', 'block'), line('b', 'allow', 'allow')], summary, corpus, pinned, { split: 'all', set: 'all' });
  assert.match(full.problems.join('\n'), /2 case\(s\) of the checked split and set are missing/);
});

test('a run made in a public checkout carries the public hash and passes', () => {
  const rep = checkResults([line('a', 'block', 'block'), line('b', 'allow', 'allow')], { corpus_sha256: 'files-of-a-public-checkout', corpus_public_sha256: 'pub', corpus_version: '9.9.9' }, corpus, pinned, { split: 'public', set: 'official' });
  assert.deepEqual(rep.problems, []);
});
