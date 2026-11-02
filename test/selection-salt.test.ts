import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { drawSecret, selectionSalt } from '../src/sources/selection-salt.ts';

test('without the selection salt the held-out draw refuses', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-sel-'));
  try {
    assert.throws(() => selectionSalt(dir), /selection salt is in the holdout repository/);
    fs.writeFileSync(path.join(dir, 'selection-salt'), 'short\n');
    assert.throws(() => selectionSalt(dir), /too short/);
    fs.writeFileSync(path.join(dir, 'selection-salt'), '0123456789abcdef0123\n');
    assert.equal(selectionSalt(dir), '0123456789abcdef0123');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the secret draw is a pure function of the salt and the keys, not of the pool order', () => {
  const pool = Array.from({ length: 200 }, (_, i) => ({ id: `r${i}` }));
  const a = drawSecret(pool, (r) => r.id, 10, 'salt-one-0123456789', 'src');
  const b = drawSecret([...pool].reverse(), (r) => r.id, 10, 'salt-one-0123456789', 'src');
  assert.deepEqual(a, b);
  assert.equal(a.length, 10);
  const c = drawSecret(pool, (r) => r.id, 10, 'salt-two-0123456789', 'src');
  assert.notDeepEqual(a.map((r) => r.id), c.map((r) => r.id), 'another salt draws other rows');
  assert.throws(() => drawSecret([{ id: 'x' }, { id: 'x' }], (r) => r.id, 1, 'salt-one-0123456789', 'src'), /duplicate keys/);
});
