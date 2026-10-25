import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastLineOffset } from '../src/sources/fetch-creddata-spans.ts';

test('a value over several lines ends in the last line, not the first', () => {
  const text = 'key: `-----BEGIN\nAAAA\nBBBB\n-----END`';
  // CredData: ValueStart 6 counts in the first line, ValueEnd 8 in the last ("-----END").
  const end = lastLineOffset(text) + 8;
  assert.equal(text.slice(6, end), '-----BEGIN\nAAAA\nBBBB\n-----END');
});

test('a one-line value keeps its own offsets', () => {
  assert.equal(lastLineOffset('PASS=abc'), 0);
});
