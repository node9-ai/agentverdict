// HOL Guard's answers and settings as the hol-guard adapter reads them. Pure
// functions only: no HOL Guard install is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HolGuardAdapter, holVerdict } from '../adapters/hol-guard/index.ts';
import { loadProfiles } from '../src/corpus.ts';

const pre = (permissionDecision: string, extra: Record<string, unknown> = {}) => ({ hookSpecificOutput: { permissionDecision }, ...extra });

test('before the call: allow, ask, a queued approval and a plain deny', () => {
  assert.equal(holVerdict('pre', pre('allow', { policy_action: 'warn', reason_code: 'native_policy_warning' })).verdict, 'allow');
  assert.equal(holVerdict('pre', pre('ask')).verdict, 'review');
  assert.equal(holVerdict('pre', pre('deny', { policy_action: 'block', reason_code: 'native_package_review', approval_resume: { request_id: 'x' } })).verdict, 'review');
  assert.equal(holVerdict('pre', pre('deny', { policy_action: 'block', reason_code: 'native_remote_code_execution' })).verdict, 'block');
});

test('after the call: block, review and warn', () => {
  assert.equal(holVerdict('post', { decision: 'block', policy_action: 'block', reason_code: 'output_secret_match' }).verdict, 'block');
  assert.equal(holVerdict('post', { policy_action: 'require-reapproval' }).verdict, 'review');
  assert.equal(holVerdict('post', { policy_action: 'warn' }).verdict, 'allow');
});

test('a fail-closed deny because HOL Guard could not decide is a measurement error, never a catch', () => {
  assert.throws(() => holVerdict('pre', pre('deny', { policy_action: 'block', reason_code: 'native_pre_tool_unavailable' })), /could not decide/);
  assert.throws(() => holVerdict('pre', pre('deny', { reason_code: 'daemon_hook_deadline_exhausted' })), /could not decide/);
  assert.throws(() => holVerdict('pre', {}), /no decision/);
});

test('profiles become HOL Guard settings where it has one, and say what it lacks', () => {
  const p = loadProfiles();
  const lock = HolGuardAdapter.translate(p.get('egress-lock')!);
  assert.deepEqual(lock.settings, [['network', 'block']]);
  assert.ok(lock.approx.some((a) => a.includes('allowlist')));
  assert.deepEqual(HolGuardAdapter.translate(p.get('egress-watch')!).settings, [['network', 'ask']]);
  assert.deepEqual(HolGuardAdapter.translate(p.get('injection-optin')!).settings, [['output-scanning', 'ask']]);
  assert.ok(HolGuardAdapter.translate(p.get('user-jail')!).approx.some((a) => a.includes('protected paths')));
  assert.deepEqual(HolGuardAdapter.translate(p.get('clean')!), { settings: [], approx: [] });
});
