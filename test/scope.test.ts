import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadCorpus } from '../src/corpus.ts';
import { cardNumbersIn, hasLuhnValidCard, luhnValid } from '../src/scope/luhn.ts';
import { PII_HIGH_TAGS, TAG } from '../src/scope/pii-types.ts';
import { EXTENDED_REASONS } from '../src/scope/reasons.ts';
import { applyScope, scopeOf, scopeProblems } from '../src/scope/rules.ts';
import { isAsiId, owaspOf } from '../src/scope/owasp.ts';
import { labelsOf } from '../src/suites.ts';
import type { BenchRecord } from '../src/types.ts';

function rec(over: Partial<BenchRecord>): BenchRecord {
  return {
    id: 'x',
    channel: 'pii',
    agent: 'claude-code',
    tool: 'Bash',
    stage: 'pre',
    input: { tool_name: 'Bash', tool_input: { command: 'true' } },
    setup: 'clean',
    expected: 'block',
    why: 'w',
    family: 'f',
    group: 'g',
    source: 'nemotron-pii',
    source_ref: 'r',
    license: 'MIT',
    private: false,
    set: 'official',
    owasp: 'ASI02',
    ...over,
  };
}

// Card numbers in this file are built from parts so no committed line carries one.
const visa = ['4111', '1111', '1111', '1111'].join('');
const invented = ['4111', '1111', '1111', '1112'].join('');

test('luhn: a valid number passes, one digit off fails, wrong lengths fail', () => {
  assert.equal(luhnValid(visa), true);
  assert.equal(luhnValid(invented), false);
  assert.equal(luhnValid('0'), false);
  assert.equal(luhnValid(visa + '0000'), false);
});

test('card-shaped numbers: contiguous or grouped, not inside an IBAN or next to other digits', () => {
  assert.deepEqual(cardNumbersIn(`card ${visa} ok`), [visa]);
  assert.deepEqual(cardNumbersIn(`card ${['4111', '1111', '1111', '1111'].join(' ')} ok`), [visa]);
  assert.deepEqual(cardNumbersIn(`card ${['4111', '1111', '1111', '1111'].join('-')} ok`), [visa]);
  assert.deepEqual(cardNumbersIn(`iban DE89${['3704', '0044', '0532', '0130', '00'].join('')}`), []);
  assert.deepEqual(cardNumbersIn('phone +1 555 123 4567'), []);
  assert.equal(hasLuhnValidCard(`a ${invented} and ${visa}`), true);
  assert.equal(hasLuhnValidCard(`a ${invented}`), false);
});

test('every high tag of each PII snapshot is classified, and no stale tag is', () => {
  for (const [source, classes] of Object.entries(PII_HIGH_TAGS)) {
    const snap = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', source, 'snapshot.json'), 'utf-8')) as { rule: { high: string[] } };
    assert.deepEqual(Object.keys(classes).sort(), [...snap.rule.high].sort(), source);
  }
});

test('whole sources: context-only, text-only, action-without-context', () => {
  assert.deepEqual(scopeOf(rec({ source: 'pii-trace' })), { set: 'extended', extended_reason: 'context-only' });
  for (const source of ['agentdojo', 'injecagent', 'browsesafe', 'notinject'])
    assert.deepEqual(scopeOf(rec({ source, expected: 'allow' })), { set: 'extended', extended_reason: 'text-only' }, source);
  assert.deepEqual(scopeOf(rec({ source: 'agentdojo-calls' })), { set: 'extended', extended_reason: 'action-without-context' });
});

test('CredData: a line is out only when every category of it is out, T and F alike', () => {
  const cred = (category: string, expected: BenchRecord['expected']) =>
    scopeOf(rec({ source: 'creddata', channel: 'secrets', expected, tags: category.split(':').map(TAG.creddata) }));
  assert.deepEqual(cred('Password', 'block'), { set: 'extended', extended_reason: 'creddata-category-out' });
  assert.deepEqual(cred('Password', 'allow'), { set: 'extended', extended_reason: 'creddata-category-out' });
  assert.deepEqual(cred('Auth:Nonce:UUID', 'block'), { set: 'official', section: 'headline' });
  assert.deepEqual(cred('Password:Secret', 'block'), { set: 'official', section: 'headline' });
  assert.deepEqual(cred('SQL Password', 'block'), { set: 'official', section: 'headline' });
  assert.deepEqual(cred('PEM Private Key', 'block'), { set: 'official', section: 'headline' });
});

test('PII documents: kept tags and Luhn-valid cards stay; the reason follows the precedence card, no-checksum, biometric', () => {
  const doc = (tags: string[], expected: BenchRecord['expected'] = 'block') => scopeOf(rec({ tags, expected }));
  assert.deepEqual(doc(['pii:ssn']), { set: 'official', section: 'headline' });
  assert.deepEqual(doc(['pii:credit_debit_card', TAG.cardValid]), { set: 'official', section: 'headline' });
  assert.deepEqual(doc(['pii:credit_debit_card', TAG.cardInvalid]), { set: 'extended', extended_reason: 'invented-card' });
  assert.deepEqual(doc(['pii:credit_debit_card', 'pii:passport_number', TAG.cardInvalid]), { set: 'extended', extended_reason: 'invented-card' });
  assert.deepEqual(doc(['pii:credit_debit_card', 'pii:iban', TAG.cardInvalid]), { set: 'official', section: 'headline' });
  assert.deepEqual(doc(['pii:passport_number', 'pii:biometric_identifier']), { set: 'extended', extended_reason: 'pii-no-checksum' });
  assert.deepEqual(doc(['pii:biometric_identifier']), { set: 'extended', extended_reason: 'pii-biometric' });
  assert.deepEqual(doc(['pii:passport_number'], 'allow'), { set: 'official', section: 'headline' });
  assert.throws(() => doc(['pii:not_a_tag']), /unclassified high tag/);
});

test("official cases: headline for outside labels, vendor for a party's own", () => {
  assert.deepEqual(scopeOf(rec({ source: 'redcode-exec', channel: 'shell' })), { set: 'official', section: 'headline' });
  assert.deepEqual(scopeOf(rec({ source: 'nl2sh-alfa', channel: 'shell', expected: 'allow' })), { set: 'official', section: 'headline' });
  assert.deepEqual(scopeOf(rec({ source: 'node9-jail-gauntlet', channel: 'secrets' })), { set: 'official', section: 'vendor' });
  assert.deepEqual(scopeOf(rec({ source: 'agent-egress-bench', channel: 'egress' })), { set: 'official', section: 'vendor' });
  assert.deepEqual(scopeOf(rec({ source: 'agentdojo-seq', channel: 'mcp' })), { set: 'official', section: 'headline' });
  assert.deepEqual(scopeOf(rec({ source: 'agentdojo-agents', channel: 'mcp' })), { set: 'official', section: 'headline' });
  assert.deepEqual(scopeOf(rec({ source: 'node9-bench-exposure', channel: 'mcp' })), { set: 'official', section: 'vendor' });
});

test('applyScope writes exactly what scopeProblems checks', () => {
  const rs = [rec({ source: 'pii-trace' }), rec({ source: 'redcode-exec' })];
  applyScope(rs);
  assert.equal(rs[0].set, 'extended');
  assert.equal(rs[0].section, undefined);
  assert.equal(rs[1].section, 'headline');
  assert.equal(rs[1].extended_reason, undefined);
  for (const r of rs) assert.deepEqual(scopeProblems(r), []);
  rs[1].set = 'extended';
  assert.equal(scopeProblems(rs[1]).length, 1);
});

test('the committed corpus: every case agrees with the rules, every reason is used, the headline holds outside labels only', () => {
  const corpus = loadCorpus();
  const used = new Set<string>();
  for (const r of corpus) {
    assert.deepEqual(scopeProblems(r), []);
    if (r.extended_reason) used.add(r.extended_reason);
    if (r.section === 'headline') assert.equal(labelsOf(r.source), 'outside', r.id);
    if (r.section === 'vendor') assert.notEqual(labelsOf(r.source), 'outside', r.id);
  }
  assert.deepEqual([...used].sort(), Object.keys(EXTENDED_REASONS).sort());
});

test('owasp: by source where it decides, by channel otherwise; every committed case carries the rule value', () => {
  assert.equal(owaspOf(rec({ source: 'creddata', channel: 'secrets' })), 'ASI03');
  assert.equal(owaspOf(rec({ source: 'nemotron-pii', channel: 'pii' })), 'ASI02');
  assert.equal(owaspOf(rec({ source: 'typomind', channel: 'package' })), 'ASI04');
  assert.equal(owaspOf(rec({ source: 'notinject-seq', channel: 'injection' })), 'ASI01');
  assert.equal(owaspOf(rec({ source: 'agentdojo-seq', channel: 'mcp' })), 'ASI01');
  assert.equal(owaspOf(rec({ source: 'agentdojo-agents', channel: 'mcp' })), 'ASI07');
  assert.equal(owaspOf(rec({ source: 'agentdojo-agents', channel: 'injection' })), 'ASI07');
  assert.equal(owaspOf(rec({ source: 'dangerous-actions', channel: 'mcp' })), 'ASI09');
  assert.equal(owaspOf(rec({ source: 'redcode-exec', channel: 'shell', family: 'redcode_eval_injection' })), 'ASI05');
  assert.equal(owaspOf(rec({ source: 'redcode-exec', channel: 'shell', family: 'redcode_read_sensitive_files' })), 'ASI02');
  assert.equal(owaspOf(rec({ source: 'benign-scripts', channel: 'shell', expected: 'allow' })), 'ASI05');
  for (const r of loadCorpus()) {
    assert.ok(isAsiId(r.owasp), r.id);
    assert.equal(r.owasp, owaspOf(r), r.id);
  }
});
