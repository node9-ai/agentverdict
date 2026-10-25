import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NODE9_SOURCES, PINS, PIN_FILE, sha256 } from '../src/sources/fetch-node9.ts';
import { DOC, PROXY } from '../src/convert/record.ts';
import { ROOT } from '../src/corpus.ts';

const pin = JSON.parse(fs.readFileSync(PIN_FILE, 'utf-8')) as Record<
  string,
  { commit: string; files: string[]; sha256: Record<string, string> }
>;

test('the snapshot of node9 files is the one pinned in fetch-node9.ts', () => {
  for (const [name, p] of Object.entries(PINS)) {
    assert.equal(pin[name]?.commit, p.commit, `${name}: pin.json was written for another commit; run npm run sources:node9`);
    assert.deepEqual(pin[name].files, p.files, `${name}: file list differs from fetch-node9.ts`);
  }
});

test('no snapshot file was edited by hand', () => {
  for (const [name, p] of Object.entries(pin)) {
    for (const file of p.files) {
      const text = fs.readFileSync(path.join(NODE9_SOURCES, name, file), 'utf-8');
      assert.equal(sha256(text), p.sha256[file], `sources/node9/${name}/${file} differs from its pinned hash`);
    }
  }
});

test('the converters read node9 files from the snapshot, not from a live checkout', () => {
  for (const dir of [PROXY, DOC]) {
    assert.ok(dir.startsWith(path.join(ROOT, 'sources', 'node9') + path.sep), `${dir} is outside sources/node9`);
  }
});
