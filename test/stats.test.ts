import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatInterval, formatP, mcnemar, wilson } from '../src/stats.ts';

const close = (a: number, b: number, eps = 5e-4) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('wilson matches published values', () => {
  // Newcombe (1998), Statistics in Medicine 17:857, method 3: 81/263 -> 0.2553 to 0.3662.
  const i = wilson(81, 263);
  close(i.low, 0.2553);
  close(i.high, 0.3662);
  // 0/10 and 10/10 stay inside [0, 1] and are not degenerate.
  const zero = wilson(0, 10);
  assert.equal(zero.low, 0);
  close(zero.high, 0.2775);
  const all = wilson(10, 10);
  close(all.low, 0.7225);
  assert.equal(all.high, 1);
});

test('wilson with no cases is the whole range', () => {
  assert.deepEqual(wilson(0, 0), { low: 0, high: 1 });
});

test('mcnemar exact p-values', () => {
  assert.equal(mcnemar(0, 0), 1);
  assert.equal(mcnemar(3, 3), 1);
  // b = 0, c = 6: 2 * (1/2)^6 = 0.03125
  close(mcnemar(0, 6), 0.03125, 1e-9);
  // b = 2, c = 10: 2 * (1 + 12 + 66) / 4096 = 0.03857
  close(mcnemar(2, 10), 0.038574, 1e-6);
  // symmetric in b and c
  assert.equal(mcnemar(10, 2), mcnemar(2, 10));
  // large n stays finite and tiny
  const p = mcnemar(0, 320);
  assert.ok(p > 0 && p < 1e-90);
});

test('formatting', () => {
  assert.equal(formatInterval({ low: 0.4344, high: 0.4751 }), '43.4-47.5%');
  assert.equal(formatP(0.0005), 'p < 0.001');
  assert.equal(formatP(0.03125), 'p = 0.031');
});
