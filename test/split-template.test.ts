import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HOLDOUT_PERCENT, hasHoldout, hashHeld, isHoldout, loadHeldGroups } from '../src/split.ts';
import { isJoined, materialize, scrub, split } from '../src/template.ts';

test('holdout is a pure function of the group', () => {
  for (const g of ['a', 'gauntlet.verb-axis.cat', 'b.c']) assert.equal(isHoldout(g), isHoldout(g));
});

test('without the holdout salt every group is public', { skip: hasHoldout() }, () => {
  for (const g of ['a', 'gauntlet.verb-axis.cat', 'b.c']) assert.equal(isHoldout(g), false);
});

test('the hash rule of the private generators draws about the configured share of groups', { skip: !hasHoldout() }, () => {
  let held = 0;
  const total = 20_000;
  for (let i = 0; i < total; i++) if (hashHeld(`group-${i}`)) held++;
  const share = (100 * held) / total;
  assert.ok(Math.abs(share - HOLDOUT_PERCENT) < 1, `holdout share ${share.toFixed(2)}%`);
});

test('held-out groups are read from held-groups.json, and its absence reads as none listed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-held-'));
  try {
    assert.equal(loadHeldGroups(dir), null);
    fs.writeFileSync(path.join(dir, 'held-groups.json'), JSON.stringify(['a.b', 'c']));
    assert.deepEqual([...loadHeldGroups(dir)!].sort(), ['a.b', 'c']);
    fs.writeFileSync(path.join(dir, 'held-groups.json'), JSON.stringify({ a: 1 }));
    assert.throws(() => loadHeldGroups(dir), /JSON array of group names/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('$join assembles parts and records the value as a secret', () => {
  const secrets = new Set<string>();
  const out = materialize({ a: { $join: ['ab', 'cd'] }, b: ['x', { $join: ['{{HOME}}', '/k'] }] }, { home: '/h', cwd: '/h/p' }, secrets);
  assert.deepEqual(out, { a: 'abcd', b: ['x', '/h/k'] });
  assert.deepEqual([...secrets].sort(), ['/h/k', 'abcd']);
});

test('placeholders are substituted in plain strings', () => {
  assert.equal(materialize('{{HOME}}/a {{CWD}}/b', { home: '/h', cwd: '/h/p' }), '/h/a /h/p/b');
});

test('an object with $join and another key is not a join', () => {
  assert.equal(isJoined({ $join: ['a'], other: 1 }), false);
  assert.deepEqual(materialize({ $join: ['a'], other: 1 } as never, { home: '/h', cwd: '/h/p' }), { $join: ['a'], other: 1 });
});

test('split never leaves a part longer than the chunk size and round-trips', () => {
  const v = 'abcdefghijklmnopqrstuvwxyz0123';
  const j = split(v);
  assert.ok(j.$join.every((p) => p.length <= 4));
  assert.equal(j.$join.join(''), v);
});

test('scrub removes a secret in raw, URL-encoded and JSON-escaped form', () => {
  const s = 'k/e"y+value=1';
  const text = `raw ${s} url ${encodeURIComponent(s)} json ${JSON.stringify(s).slice(1, -1)}`;
  const out = scrub(text, [s]);
  assert.ok(!out.includes(s));
  assert.ok(!out.includes(encodeURIComponent(s)));
  assert.equal(out.split('<redacted>').length - 1, 3);
});
