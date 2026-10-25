import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChange, isTransient, missingBuildErrors, type BuildFingerprint } from '../src/release-check.ts';
import type { CaseResult } from '../src/types.ts';

const fp = (over: Partial<BuildFingerprint> = {}): BuildFingerprint => ({ sha256: 'a', size: 10, mtimeMs: 1, ino: 7, ...over });

test('an untouched build is unchanged', () => {
  assert.equal(buildChange(fp(), fp()), null);
});

test('a rebuild with identical bytes is still a change', () => {
  assert.match(buildChange(fp(), fp({ mtimeMs: 2 }))!, /same content/);
  assert.match(buildChange(fp(), fp({ ino: 8 }))!, /same content/);
});

test('different content, a missing file before or after, are changes', () => {
  assert.match(buildChange(fp(), fp({ sha256: 'b' }))!, /different content/);
  assert.match(buildChange(fp(), null)!, /disappeared/);
  assert.match(buildChange(null, fp())!, /missing/);
});

test('a call that found no dist/cli.js is recognised, other errors are not', () => {
  const r = (detail: string): CaseResult => ({ id: detail, adapter: 't', tool_version: '0', channel: 'egress', expected: 'block', actual: 'error', private: false, latency_ms: null, detail });
  const rs = [
    r("node9 exited 1: node:internal/modules/cjs/loader:1478 throw err; ^ Error: Cannot find module '/home/u/node9-proxy/dist/cli.js'"),
    r('node9 exited 1: TypeError: something else'),
  ];
  assert.deepEqual(missingBuildErrors(rs).map((x) => x.id), [rs[0].id]);
});

test('errors and time-limit holds are retried, real verdicts are not', () => {
  const r = (actual: CaseResult['actual'], detail?: string): CaseResult => ({ id: 'x', adapter: 't', tool_version: '0', channel: 'secrets', expected: 'block', actual, private: false, latency_ms: 1, detail });
  assert.equal(isTransient(r('error', 'node9 jail add failed: ETIMEDOUT')), true);
  assert.equal(isTransient(r('review', 'held for a human (timeout)')), true);
  assert.equal(isTransient(r('review', 'Node9 flagged this for your review')), false);
  assert.equal(isTransient(r('allow')), false);
  assert.equal(isTransient(r('block')), false);
});
