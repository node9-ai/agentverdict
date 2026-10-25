import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SMALL_MIN, buildReport, owaspTable, type ReportRun } from '../src/report.ts';
import type { CaseResult } from '../src/types.ts';

let n = 0;
const c = (
  suite: string,
  labels: CaseResult['labels'],
  expected: CaseResult['expected'],
  actual: CaseResult['actual'],
  scope: Pick<CaseResult, 'set' | 'section' | 'extended_reason'> = labels === 'outside' ? { set: 'official', section: 'headline' } : { set: 'official', section: 'vendor' }
): CaseResult => ({
  id: `case-${n++}`,
  adapter: 't',
  tool_version: '0',
  channel: 'secrets',
  expected,
  actual,
  private: false,
  latency_ms: 1,
  suite,
  labels,
  ...scope,
});
const out = (reason: string): Pick<CaseResult, 'set' | 'extended_reason'> => ({ set: 'extended', extended_reason: reason });

/** Cells under SMALL_MIN carry "(small: interval)"; these tests check the counts. */
const strip = (md: string) => md.replace(/ \(small: [^)]*\)/g, '');

const runA: ReportRun = {
  label: 'tool-a 1.0',
  corpus: '1.14.0',
  cases: [
    c('creddata', 'outside', 'block', 'block'),
    c('creddata', 'outside', 'block', 'allow'),
    c('creddata', 'outside', 'allow', 'allow'),
    c('creddata', 'outside', 'allow', 'review'),
    c('nl2sh-alfa', 'outside', 'allow', 'allow'),
    c('exposure', 'node9', 'review', 'review'),
    c('exposure', 'node9', 'review', 'error'),
  ],
};
const runB: ReportRun = {
  label: 'tool-b 2.0',
  corpus: '1.11.0',
  cases: [c('creddata', 'outside', 'block', 'allow'), c('creddata', 'outside', 'allow', 'allow')],
};

test('the headline score counts outside labels only', () => {
  const md = buildReport([runA, runB]);
  assert.match(md, /^# Side-by-side report, official set$/m);
  assert.match(md, /## Headline score \(official set, outside labels, all channels\)/);
  // tool-a: 1 of 2 attacks, 1 of 3 benign stopped; the node9-labelled rows do not count.
  assert.match(md, /\| tool-a 1\.0 \| 50\.0% \(1\/2\) \| 33\.3% \(1\/3\) \| 50\.0% \| 58\.3% \|/);
  assert.match(md, /\| tool-b 2\.0 \| 0\.0% \(0\/1\) \| 0\.0% \(0\/1\) \| n\/a \| 50\.0% \|/);
});

test('the default report leaves the extended set out; --set extended shows it per reason; --set all shows everything', () => {
  const run: ReportRun = {
    label: 'tool-e 5.0',
    corpus: '3.1.0',
    cases: [
      c('creddata', 'outside', 'block', 'block'),
      c('creddata', 'outside', 'block', 'allow', out('creddata-category-out')),
      c('creddata', 'outside', 'allow', 'review', out('creddata-category-out')),
      c('pii-trace', 'outside', 'block', 'allow', out('context-only')),
      c('nl2sh-alfa', 'outside', 'allow', 'allow', {}),
    ],
  };
  const official = buildReport([run]);
  assert.match(official, /\| tool-e 5\.0 \| 100\.0% \(1\/1\) \| n\/a \(0\/0\)/);
  assert.doesNotMatch(official, /PII-TRACE|NL2SH-ALFA/);
  const extended = strip(buildReport([run], undefined, { set: 'extended' }));
  assert.match(extended, /^# Side-by-side report, extended set$/m);
  assert.match(extended, /\| tool-e 5\.0 \| 0\.0% \(0\/2\) \| 100\.0% \(1\/1\)/);
  assert.match(extended, /\| `creddata-category-out` \| Samsung CredData: credential and look-alike lines written to a file \| 0\/1 \| 1\/1 \|/);
  assert.match(extended, /\| `context-only` \| PII-TRACE \(Perplexity\): conversations sent off the machine \| 0\/1 \| - \|/);
  assert.match(extended, /^- `context-only`: A PII-TRACE conversation/m);
  assert.doesNotMatch(extended, /NL2SH-ALFA/);
  const all = strip(buildReport([run], undefined, { set: 'all' }));
  assert.match(all, /^# Side-by-side report$/m);
  assert.match(all, /\| tool-e 5\.0 \| 33\.3% \(1\/3\) \| 50\.0% \(1\/2\)/);
  assert.match(all, /NL2SH-ALFA/);
});

test('outside rows and the other rows go to separate tables, in the declared suite order', () => {
  const md = buildReport([runA, runB]);
  const outside = md.indexOf('## Per source: headline section (outside labels)');
  const other = md.indexOf('## Per source: vendor section (labels written by one of the parties)');
  assert.ok(outside > 0 && other > outside);
  const cred = md.indexOf('CredData (Samsung)');
  const nl2sh = md.indexOf('NL2SH-ALFA');
  const seq = md.indexOf('Actions after reading outside content');
  assert.ok(cred > outside && cred < nl2sh && nl2sh < other, 'the fixed order: CredData, then the shell rows');
  assert.ok(seq > other, 'exposure is in the second table');
});

test('cells are counts; "-", "not run" and "not measured" say why a number is missing', () => {
  const md = strip(buildReport([runA, runB]));
  const line = (needle: string) => md.split('\n').find((l) => l.includes(needle)) ?? '';
  assert.match(line('CredData (Samsung)'), /\| secrets \| 1\/2 \| 0\/1 \| 1\/2 \| 0\/1 \|$/);
  assert.match(line('NL2SH-ALFA'), /\| shell \| - \| not run \| 0\/1 \| not run \|$/);
  assert.match(line('Actions after reading outside content'), /\| node9's team \| 1\/1 \(1 not measured\) \| not run \| - \| not run \|$/);
});

test('a suite not in the fixed rows is appended under its suites.ts title', () => {
  const extra: ReportRun = { label: 'tool-c 3.0', corpus: '1.14.0', cases: [c('agentthreatbench', 'outside', 'block', 'block')] };
  const md = strip(buildReport([extra]));
  assert.match(md, /\| agentthreatbench \|  \| 1\/1 \| - \|/);
});

test('--split keeps one side of the holdout split; without it every case counts', () => {
  const hold = (r: CaseResult): CaseResult => ({ ...r, private: true });
  const run: ReportRun = {
    label: 'tool-d 4.0',
    corpus: '1.14.0',
    cases: [c('creddata', 'outside', 'block', 'block'), hold(c('creddata', 'outside', 'block', 'allow')), hold(c('creddata', 'outside', 'block', 'allow'))],
  };
  const line = (md: string) => strip(md).split('\n').find((l) => l.includes('CredData (Samsung)')) ?? '';
  assert.match(line(buildReport([run])), /\| secrets \| 1\/3 \| - \|$/);
  assert.match(line(buildReport([run], 'public')), /\| secrets \| 1\/1 \| - \|$/);
  assert.match(line(buildReport([run], 'holdout')), /\| secrets \| 0\/2 \| - \|$/);
  assert.match(buildReport([run], 'holdout'), /^# Side-by-side report, official set, holdout split only/);
});

test('--ci adds Wilson intervals and a paired test; without it the report has neither', () => {
  const plain = buildReport([runA, runB]);
  assert.doesNotMatch(plain, /Intervals: Wilson|McNemar|Paired test/);
  const withCi = buildReport([runA, runB], undefined, { ci: true });
  assert.match(withCi, /Intervals: Wilson 95%\./);
  // 1 of 2 creddata attacks stopped: Wilson 95% is 9.5% to 90.5%.
  assert.match(withCi, /1\/2 \(9\.5-90\.5%\)/);
  assert.match(withCi, /## Paired test against tool-a 1\.0/);
});

test('a side with fewer than SMALL_MIN measured cases is marked small with its interval; a larger one is a plain count', () => {
  const big: ReportRun = { label: 'tool-f 6.0', corpus: '5.1.0', cases: Array.from({ length: 120 }, (_, i) => c('redcode-exec', 'outside', 'block', i < 90 ? 'block' : 'allow')) };
  const md = buildReport([big, runA]);
  const line = md.split('\n').find((l) => l.includes('RedCode-Exec')) ?? '';
  assert.ok(120 >= SMALL_MIN);
  assert.match(line, /\| 90\/120 \| not run \|/);
  const cred = md.split('\n').find((l) => l.includes('CredData (Samsung)')) ?? '';
  assert.match(cred, /\| not run \| 1\/2 \(small: 9\.5-90\.5%\) \|/);
  assert.match(md, /marked small/);
});

test('--owasp: every risk listed, headline and vendor columns apart, "none" and "no cases yet" where empty', () => {
  const o = (labels: CaseResult['labels'], owasp: string, expected: CaseResult['expected'], actual: CaseResult['actual']): CaseResult => ({ ...c('s', labels, expected, actual), owasp });
  const run: ReportRun = {
    label: 't 1',
    corpus: '5.1.1',
    cases: [o('outside', 'ASI03', 'block', 'block'), o('outside', 'ASI03', 'allow', 'allow'), o('node9', 'ASI09', 'review', 'review'), o('node9', 'ASI09', 'allow', 'review')],
  };
  const md = strip(owaspTable([run]).join('\n'));
  assert.match(md, /\| Risk \| Name \| Headline attacks: t 1 \| Headline benign: t 1 \| Vendor attacks: t 1 \| Vendor benign: t 1 \|/);
  assert.match(md, /\| ASI03 \| Identity and Privilege Abuse \| 1\/1 \| 0\/1 \| none \| none \|/);
  assert.match(md, /\| ASI09 \| Human-Agent Trust Exploitation \| none \| none \| 1\/1 \| 1\/1 \|/);
  assert.match(md, /\| ASI06 \| Memory and Context Poisoning \| no cases yet \| no cases yet \| no cases yet \| no cases yet \|/);
  assert.equal(md.split('\n').filter((l) => /^\| ASI\d\d /.test(l)).length, 10);
});
