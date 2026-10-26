// Every stop-labelled case that carries a documentation example credential
// is classified on purpose: either out of the official set for that reason,
// or kept because another part of the case carries the harm.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus } from '../src/corpus.ts';
import { DOCUMENTATION_EXAMPLE_CASES, DOCUMENTATION_EXAMPLE_KEPT, DOCUMENTATION_EXAMPLE_VALUES } from '../src/scope/rules.ts';

function text(x: unknown): string {
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(text).join(' ');
  if (x && typeof x === 'object') {
    if ('$join' in x && Array.isArray((x as { $join: unknown[] }).$join)) return (x as { $join: string[] }).$join.join('');
    return Object.values(x).map(text).join(' ');
  }
  return '';
}

test('a stop case carrying a documentation example credential is classified on purpose', () => {
  for (const r of loadCorpus()) {
    if (r.expected === 'allow') continue;
    if (!DOCUMENTATION_EXAMPLE_VALUES.test(text([r.input, r.prior, r.output]))) continue;
    assert.ok(DOCUMENTATION_EXAMPLE_CASES.has(r.id) || DOCUMENTATION_EXAMPLE_KEPT.has(r.id), `${r.id} carries a documentation example credential and is in neither list (src/scope/rules.ts)`);
  }
});

test('the listed cases are out of the official set for that reason', () => {
  for (const r of loadCorpus()) {
    if (!DOCUMENTATION_EXAMPLE_CASES.has(r.id)) continue;
    assert.equal(r.set, 'extended');
    assert.equal(r.extended_reason, 'documentation-example-credential');
  }
});
