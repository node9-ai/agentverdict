import { test } from 'node:test';
import assert from 'node:assert/strict';
import { excerpt, findGaps, ruleOf } from '../src/gaps.ts';
import type { BenchRecord, CaseResult } from '../src/types.ts';

const rec = (over: Partial<BenchRecord>): BenchRecord =>
  ({
    id: 'x',
    channel: 'shell',
    agent: 'claude-code',
    tool: 'Bash',
    stage: 'pre',
    input: { tool_name: 'Bash', tool_input: { command: 'ls -la' } },
    setup: 'clean',
    expected: 'block',
    why: 'w',
    family: 'f',
    group: 'g',
    source: 'redcode-exec',
    source_ref: 'r',
    license: 'MIT',
    private: false,
    ...over,
  }) as BenchRecord;

const res = (id: string, expected: CaseResult['expected'], actual: CaseResult['actual'], priv = false, detail?: string): CaseResult => ({
  id,
  adapter: 't',
  tool_version: '0',
  channel: 'shell',
  expected,
  actual,
  private: priv,
  latency_ms: 1,
  detail,
});

test('a credential line shows its key name, never its value', () => {
  const r = rec({ channel: 'secrets', tool: 'Write', input: { tool_name: 'Write', tool_input: { file_path: '{{CWD}}/app.py', content: 'DB_PASSWORD = "Zx81kq0Lm2"' } } });
  assert.equal(excerpt(r), 'app.py: DB_PASSWORD = <value>');
});

test('a personal-data case shows the identifier types, never the document', () => {
  const r = rec({ channel: 'pii', note: 'identifiers: SSN, PASSPORTNUM; all tags: NAME, SSN' });
  assert.equal(excerpt(r), 'identifiers: SSN, PASSPORTNUM');
});

test('misses and false positives are grouped by family, and false positives by rule too', () => {
  const corpus = [
    rec({ id: 'a1', family: 'read' }),
    rec({ id: 'a2', family: 'read' }),
    rec({ id: 'a3', family: 'delete' }),
    rec({ id: 'b1', family: 'ordinary', expected: 'allow', source: 'redcode-exec' }),
  ];
  const results = [res('a1', 'block', 'allow'), res('a2', 'block', 'allow'), res('a3', 'block', 'block'), res('b1', 'allow', 'review', false, 'Blocked [Smart Rule: rm]')];
  const [g] = findGaps(results, corpus, 'public');
  assert.equal(g.missedTotal, 2);
  assert.deepEqual(
    g.missed.map((x) => [x.key, x.count]),
    [['read', 2]]
  );
  assert.equal(g.falsePositives[0].key, 'ordinary | Smart Rule: rm');
});

test('the public split leaves the holdout out', () => {
  const corpus = [rec({ id: 'p' }), rec({ id: 'h', private: true })];
  const [g] = findGaps([res('p', 'block', 'allow'), res('h', 'block', 'allow', true)], corpus, 'public');
  assert.equal(g.missedTotal, 1);
});

test('ruleOf takes the bracketed rule name', () => {
  assert.equal(ruleOf('NODE9: blocked [node9 Egress (Blocked)]. INSTRUCTIONS'), 'node9 Egress (Blocked)');
  assert.equal(ruleOf(undefined), '(no reason given)');
});
