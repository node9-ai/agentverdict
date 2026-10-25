import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreement } from '../src/annotation/agreement.ts';
import { renderPage, shownCases } from '../src/annotation/page.ts';
import { MIN_PER_STRATUM, drawSample, labelsWrittenHere } from '../src/annotation/sample.ts';
import { loadCorpus, loadProfiles } from '../src/corpus.ts';
import { cohenKappa } from '../src/stats.ts';
import type { Sample } from '../src/annotation/sample.ts';

const corpus = loadCorpus();

test("cohen's kappa: perfect, chance, and undefined when one label covers everything", () => {
  assert.equal(cohenKappa(['a', 'b', 'a', 'b'], ['a', 'b', 'a', 'b']), 1);
  assert.equal(cohenKappa(['a', 'a', 'b', 'b'], ['a', 'b', 'a', 'b']), 0);
  assert.equal(cohenKappa(['a', 'a'], ['a', 'a']), null);
  assert.equal(cohenKappa([], []), null);
  assert.throws(() => cohenKappa(['a'], []));
});

test('the sample: official public cases of sources whose labels node9-bench wrote or mapped, strata filled by the rule, fixed order', () => {
  const s = drawSample(corpus, 200);
  assert.equal(s.cases.length, 200);
  assert.equal(new Set(s.cases).size, 200);
  const byId = new Map(corpus.map((r) => [r.id, r]));
  for (const id of s.cases) {
    const r = byId.get(id)!;
    assert.equal(r.private, false, id);
    assert.equal(r.set, 'official', id);
    assert.ok(labelsWrittenHere(r.source), id);
  }
  for (const st of s.strata) assert.ok(st.drawn >= Math.min(MIN_PER_STRATUM, st.population), `${st.source}/${st.expected}`);
  assert.ok(s.strata.some((st) => st.source === 'dangerous-actions') && s.strata.some((st) => st.source === 'nemotron-pii'));
  assert.ok(!s.strata.some((st) => st.source === 'creddata' || st.source === 'redcode-exec'), 'sources with their own labels are not sampled');
  assert.deepEqual(drawSample([...corpus].reverse(), 200).cases, s.cases);
});

test('the page shows the call and the setting, never the label, source or reason', () => {
  const s = drawSample(corpus, 200);
  const sample: Sample = { corpus_version: 'x', corpus_sha256: 'y', ...s, cases: s.cases.slice(0, 30) };
  const cases = shownCases(sample, corpus, loadProfiles());
  assert.equal(cases.length, 30);
  const html = renderPage(sample, cases);
  const embedded = JSON.parse(/const CASES = (.*);\n/.exec(html)![1].replace(/\\u003c/g, '<')) as Array<Record<string, unknown>>;
  for (const c of embedded) assert.deepEqual(Object.keys(c).sort(), ['id', 'input', 'n', 'output', 'prior', 'setting', 'stage', 'tool'].filter((k) => k !== 'output' || 'output' in c).sort());
  assert.doesNotMatch(html, /\{\{HOME\}\}|\{\{CWD\}\}|\$join/);
  assert.match(html, /what should a correct guard do/);
});

test('agreement: contested when both differ from the label, low when they differ from each other; promotion by the written rule', () => {
  const pool = corpus.filter((r) => r.source === 'dangerous-actions' && !r.private);
  const ids = [...pool.filter((r) => r.expected === 'review').slice(0, 5), ...pool.filter((r) => r.expected === 'allow').slice(0, 5)].map((r) => r.id);
  const label = Object.fromEntries(ids.map((id) => [id, corpus.find((r) => r.id === id)!.expected]));
  const sample: Sample = { corpus_version: 'x', corpus_sha256: 'y', salt: 's', size: ids.length, rule: '', strata: [], cases: ids };
  const flip = (v: string) => (v === 'allow' ? 'review' : 'allow');
  const a = { annotator: 'founder', corpus_version: 'x', answers: { ...label, [ids[0]]: flip(label[ids[0]]) } };
  const b = { annotator: 'outside', corpus_version: 'x', answers: { ...label, [ids[0]]: flip(label[ids[0]]), [ids[1]]: flip(label[ids[1]]) } };
  const res = agreement(sample, a as never, b as never, corpus);
  const f = res.sources.find((x) => x.source === 'dangerous-actions')!;
  assert.deepEqual(f.contested, [ids[0]]);
  assert.deepEqual(f.lowAgreement, [ids[1]]);
  assert.equal(f.rate.bLabel, 0.8);
  assert.equal(f.promoted, false);
  const perfect = agreement(sample, { ...a, answers: label } as never, { ...b, answers: label } as never, corpus).sources[0];
  assert.equal(perfect.promoted, true);
});
