import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { copyRun } from '../src/holdout/results.ts';
import { ROOT, readCorpusVersion } from '../src/corpus.ts';

function fakeRun(summaryExtra = ''): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-run-'));
  const run = path.join(dir, 'corpus-test-run');
  fs.mkdirSync(run);
  const v = readCorpusVersion().version;
  fs.writeFileSync(path.join(run, 'summary.json'), JSON.stringify({ adapter: 'test-adapter', tool_version: '0.0.0-test', corpus_version: v }));
  fs.writeFileSync(path.join(run, 'summary.md'), `# summary\n${summaryExtra}\n`);
  fs.writeFileSync(path.join(run, 'cases.jsonl'), [{ id: 'pub.case-001', private: false }, { id: 'held.case-001', private: true }].map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(path.join(run, 'holdout.md'), 'held.case-001 missed\n');
  return run;
}

test('a run lands with its public cases only, and never the reports that list holdout cases', () => {
  const out = path.join(ROOT, 'results', 'test-adapter');
  try {
    const { to, kept, held } = copyRun(fakeRun());
    assert.deepEqual([kept, held], [1, 1]);
    const files = fs.readdirSync(path.join(ROOT, to)).sort();
    assert.deepEqual(files, ['cases.jsonl', 'summary.json', 'summary.md']);
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, to, 'cases.jsonl'), 'utf-8'), /held\.case-001/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('a summary that names a holdout case is refused, and nothing is copied', () => {
  const out = path.join(ROOT, 'results', 'test-adapter');
  try {
    assert.throws(() => copyRun(fakeRun('missed: held.case-001')), /holdout case held\.case-001/);
    assert.equal(fs.existsSync(out), false);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
