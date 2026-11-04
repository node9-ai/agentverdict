import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, readCorpusVersion } from '../src/corpus.ts';

const version = '2.50.0';
const dir = path.join(ROOT, 'results', 'node9-gate', version, `corpus-${readCorpusVersion().version}`);

test('the page data takes every number from the published runs and names no case', { skip: !fs.existsSync(dir) }, () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'av-page-')), 'benchmark.json');
  execFileSync(process.execPath, ['--import', 'tsx', path.join(ROOT, 'src', 'page-data.ts'), '--node9', version, '--out', out], { cwd: ROOT });
  const data = JSON.parse(fs.readFileSync(out, 'utf-8'));
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8'));
  const pub = summary.headline.all.public;
  assert.equal(data.board[0].public.attacks_stopped, pub.caught + pub.review_hits);
  assert.equal(data.board[0].public.benign_stopped, pub.interruptions);
  assert.equal(data.board[0].public.balanced, pub.balanced_score);
  assert.equal(data.board[0].holdout.balanced, summary.headline.all.holdout.balanced_score);
  assert.equal(data.node9_levels.length, 3);
  const text = JSON.stringify(data);
  for (const l of fs.readFileSync(path.join(dir, 'cases.jsonl'), 'utf-8').split('\n').filter(Boolean).slice(0, 2000)) {
    assert.ok(!text.includes(`"${JSON.parse(l).id}"`), 'a case id in the page data');
  }
});
