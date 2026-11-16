import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, readCorpusVersion } from '../src/corpus.ts';
import { pageData, toolRuns, type ToolText } from '../src/page-data.ts';
import { score } from '../src/score.ts';

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
  // Only the levels measured at this version, Standard always among them.
  const measured = ['node9-gate-soft', 'node9-gate', 'node9-gate-strict'].filter((a) =>
    fs.existsSync(path.join(ROOT, 'results', a, version, `corpus-${readCorpusVersion().version}`, 'summary.json'))
  );
  assert.equal(data.node9_levels.length, measured.length);
  assert.ok(data.node9_levels.some((l: { level: string }) => l.level === 'Standard'));
  for (const l of data.node9_levels) assert.equal(l.version, version);
  const text = JSON.stringify(data);
  for (const l of fs.readFileSync(path.join(dir, 'cases.jsonl'), 'utf-8').split('\n').filter(Boolean).slice(0, 2000)) {
    assert.ok(!text.includes(`"${JSON.parse(l).id}"`), 'a case id in the page data');
  }
});

// Synthetic runs: two public headline cases, one public vendor case, one holdout case.
function run(adapter: string, version: string, corpus: string, verdicts: string[]) {
  const ids = ['h.attack', 'h.ordinary', 'v.attack', 'held.attack'];
  const expected = ['block', 'allow', 'block', 'block'];
  const cases = ids.map((id, i) => ({ id, adapter, tool_version: version, channel: 'shell', expected: expected[i], private: id.startsWith('held'), suite: id.startsWith('v') ? 'vendor-suite' : 'outside-suite', set: 'official', section: id.startsWith('v') ? 'vendor' : 'headline', owasp: 'ASI02', actual: verdicts[i] }));
  const sc = (rs: any[]) => score(rs as any);
  const pub = cases.filter((c) => !c.private && c.section === 'headline');
  const held = cases.filter((c) => c.private);
  const summary = { adapter, tool_version: version, corpus_version: corpus, measured_at: '2026-11-15T00:00:00Z', channels: { all: { holdout: { cases: held.length } } }, headline: { all: { public: sc(pub), holdout: sc(held) } } };
  return { summary, cases } as any;
}

const texts = (status: 'published' | 'review') => ({
  areas: [],
  owasp: [{ id: 'ASI02', name: 'Tool Misuse', what: '', tests: '' }],
  tools: [{ key: 'other', adapter: 'other-adapter', version: '1.0.0', tool: 'Other', maker: 'Maker', setup: 'its default', status, published_on: '2026-11-15', notes: ['a note'], statement: { by: 'Maker', date: '2026-11-10', text: 'as written' } }],
  board_notes: ['the holdout note'],
  links: {},
});
const info = { public_cases: 3, sources: 2, public_sha256: 'x' };

test('a published tool joins the board with its notes and statement, and in every breakdown', () => {
  const node9 = run('node9-gate', '9.9.9', '0.0.1', ['block', 'allow', 'block', 'block']);
  const other = run('other-adapter', '1.0.0', '0.0.1', ['allow', 'block', 'block', 'allow']);
  const others = toolRuns(texts('published').tools as ToolText[], '0.0.1', (a, v) => (a === 'other-adapter' && v === '1.0.0' ? other : undefined));
  const data = pageData('9.9.9', '0.0.1', { standard: node9 }, texts('published'), info, others);
  assert.deepEqual(data.board.map((b) => b.key), ['node9-standard', 'other']);
  const row = data.board[1];
  assert.deepEqual([row.public.attacks_stopped, row.public.benign_stopped], [0, 1]);
  assert.equal(row.holdout!.attacks_stopped, 0);
  assert.deepEqual(row.notes, ['a note']);
  assert.equal(row.statement!.text, 'as written');
  assert.deepEqual(data.board_notes, ['the holdout note']);
  assert.deepEqual(data.review, []);
  const vendor = data.sources.find((s) => s.suite === 'vendor-suite')!;
  assert.deepEqual(Object.keys(vendor.runs), ['node9-standard', 'other']);
  assert.deepEqual(vendor.runs.other.attacks, [1, 1]);
  assert.deepEqual(data.owasp[0].headline!.other, { attacks: [0, 1], benign: [1, 1] });
  assert.ok(!JSON.stringify(data).includes('held.attack'), 'a holdout case id in the page data');
});

test('a mode of a tool is marked as a variant of its default row', () => {
  const node9 = run('node9-gate', '9.9.9', '0.0.1', ['block', 'allow', 'block', 'block']);
  const other = run('other-adapter', '1.0.0', '0.0.1', ['allow', 'allow', 'allow', 'allow']);
  const enforce = run('other-enforce', '1.0.0', '0.0.1', ['block', 'allow', 'allow', 'allow']);
  const t = texts('published');
  t.tools[0] = { ...t.tools[0], mode: 'monitor (default)' } as any;
  t.tools.push({ key: 'other-enforce', adapter: 'other-enforce', version: '1.0.0', tool: 'Other', mode: 'enforce', variant_of: 'other', maker: 'Maker', setup: 'every rule enforced', status: 'published' } as any);
  const others = toolRuns(t.tools as ToolText[], '0.0.1', (a) => (a === 'other-adapter' ? other : a === 'other-enforce' ? enforce : undefined));
  const data = pageData('9.9.9', '0.0.1', { standard: node9 }, t, info, others);
  const row = data.board.find((b) => b.key === 'other-enforce')!;
  assert.deepEqual([row.mode, row.variant_of], ['enforce', 'other']);
  assert.deepEqual([data.board[1].mode, data.board[1].variant_of], ['monitor (default)', null]);
});

test('a tool under review is named with its date and no number', () => {
  const node9 = run('node9-gate', '9.9.9', '0.0.1', ['block', 'allow', 'block', 'block']);
  const data = pageData('9.9.9', '0.0.1', { standard: node9 }, texts('review'), info, toolRuns(texts('review').tools as ToolText[], '0.0.1', () => undefined));
  assert.deepEqual(data.board.map((b) => b.key), ['node9-standard']);
  assert.deepEqual(data.review, [{ tool: 'Other', maker: 'Maker', version: '1.0.0', published_on: '2026-11-15' }]);
  assert.ok(!JSON.stringify(data).includes('as written'), 'a statement shown before its result');
});

test('a published tool without its run, or with a run on another corpus or version, is refused', () => {
  const tools = texts('published').tools as ToolText[];
  assert.throws(() => toolRuns(tools, '0.0.1', () => undefined), /marked published but results\/other-adapter\/1\.0\.0\/corpus-0\.0\.1 has no run/);
  assert.throws(() => toolRuns(tools, '0.0.1', () => run('other-adapter', '1.0.0', '0.0.2', [])), /run made on corpus 0\.0\.2/);
  assert.throws(() => toolRuns(tools, '0.0.1', () => run('other-adapter', '0.9.0', '0.0.1', [])), /run made with 0\.9\.0/);
});
