import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadCorpus, readCorpusVersion } from '../src/corpus.ts';
import { sensitive } from '../src/hygiene.ts';
import { renderViewer, viewerRows } from '../src/viewer.ts';

const corpus = loadCorpus();
const rows = viewerRows(corpus);

test('the viewer has one row per case with its set, and no row carries the call or a flagged value', () => {
  assert.equal(rows.length, corpus.length);
  for (const r of rows) {
    assert.ok(r.set === 'official' ? r.section !== undefined : r.reason !== undefined, r.id);
    assert.equal(sensitive(r.excerpt), null, r.id);
    assert.ok(!('input' in r) && !('output' in r));
  }
});

test('the committed viewer page is the current corpus', () => {
  const file = path.join(ROOT, 'viewer', 'index.html');
  assert.ok(fs.existsSync(file), 'run npm run viewer');
  const html = fs.readFileSync(file, 'utf-8');
  assert.equal(html, renderViewer(readCorpusVersion().version, rows));
});
