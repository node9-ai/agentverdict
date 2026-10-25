import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cutSnapshot } from '../src/holdout/cut.ts';
import { mergeSnapshot } from '../src/holdout/merge.ts';
import { SECTIONS } from '../src/holdout/sections.ts';
import { hasHoldout, isHoldout } from '../src/split.ts';
import { loadCorpus } from '../src/corpus.ts';

test('the cut walks wildcard lists and keeps the kept and removed halves complementary', { skip: !hasHoldout() }, () => {
  // NotInject-shaped: splits.* is a wildcard over the split names.
  const rows = (n: number) => Array.from({ length: n }, (_, index) => ({ index, prompt: 'p' }));
  const snap = { dataset: 'd', splits: { NotInject_one: rows(60), NotInject_two: rows(60) } };
  const { pub, held, kept, removed } = cutSnapshot('notinject/snapshot.json', snap as never);
  assert.equal(kept + removed, 120);
  assert.ok(removed > 0, 'some group of 120 is held out');
  for (const split of ['NotInject_one', 'NotInject_two']) {
    const p = (pub.splits as Record<string, Array<{ index: number }>>)[split];
    const h = held.rows[`splits.${split}`] ?? [];
    assert.equal(p.length + h.length, 60);
    for (const r of p) assert.equal(isHoldout(`notinject.${split}.${r.index}`), false);
    for (const { at, row } of h) {
      assert.equal(isHoldout(`notinject.${split}.${(row as { index: number }).index}`), true);
      assert.equal(at, (row as { index: number }).index, 'the held row keeps its original position');
    }
  }
  // Merging the halves gives the snapshot back.
  assert.deepEqual(mergeSnapshot(pub, held), snap);
});

test('every committed case comes from a section the cut knows, by source', () => {
  // The section table names each source's rows; a source with no section would
  // be copied whole and leak its holdout. agentdojo-calls and dangerous-actions
  // are built from the task table, never held out, so they need no section.
  const known = new Set(SECTIONS.map((s) => s.file.split('/')[0].replace('.json', '')));
  const fileOf: Record<string, string> = {
    'node9-legit-credential-corpus': 'node9-bench', 'node9-jail-gauntlet': 'node9-bench', 'node9-egress-carriers-corpus': 'node9-bench',
    'node9-canary-fixtures': 'node9-bench', 'node9-canary-generators': 'node9-bench', 'node9-checksum-fixtures': 'node9-bench', 'node9-pii-fixtures': 'node9-bench',
    'node9-injection-tests': 'node9-bench', 'node9-bench-generated': 'node9-bench', 'node9-bench-exposure': 'node9-bench', 'node9-bench-system-ops': 'node9-bench',
    'osv-malicious-packages': 'packages', 'node9-bench-package-list': 'packages', 'node9-bench-package-list-more': 'packages-benign-more',
    'notinject-seq': 'notinject', 'agentdojo-seq': 'agentdojo', 'agent-egress-bench': 'agent-egress-bench',
  };
  const noHoldout = new Set(['agentdojo-calls', 'dangerous-actions']);
  for (const src of new Set(loadCorpus().map((r) => r.source))) {
    if (noHoldout.has(src)) continue;
    assert.ok(known.has(fileOf[src] ?? src), `source ${src} has no section in src/holdout/sections.ts`);
  }
});
