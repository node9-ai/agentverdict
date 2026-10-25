import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertNode9Bench } from '../src/convert/node9-bench.ts';

test('legitimate npx execution retains its allow label but declares live registry dependence', () => {
  const records = convertNode9Bench('legit');
  const row = records.find((r) => r.id === 'legit-credential.18')!;
  assert.equal(row.expected, 'allow');
  assert.equal(row.volatile, true);
  assert.match(row.note ?? '', /registry|package age/i);
  assert.equal(records.filter((r) => r.volatile).length, 1);
});
