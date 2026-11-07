import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruleNotGiven, type Adapter, type Decision } from '../src/adapter.ts';
import { loadCorpus, loadProfiles } from '../src/corpus.ts';
import { runCases } from '../src/runner.ts';
import type { BenchRecord, Profile } from '../src/types.ts';

const corpus = loadCorpus();
const profiles = loadProfiles();
const byWhy = (setup: string, why: string) => corpus.find((r) => r.setup === setup && r.why === why)!;

test('a case whose verdict rests on a user rule the tool cannot be given is unreachable', () => {
  const git = profiles.get('git-guardrails');
  assert.match(ruleNotGiven(byWhy('git-guardrails', 'git_stage_whole_tree'), git, 'tool') ?? '', /git rules/);
  assert.equal(ruleNotGiven(byWhy('git-guardrails', 'git_stage_whole_tree'), git, 'tool', { git: true }), null);
  // An ordinary git command is allowed whatever the rules say: still measured.
  assert.equal(ruleNotGiven(byWhy('git-guardrails', 'ordinary_git'), git, 'tool'), null);

  const hold = profiles.get('ask-before-dangerous-actions');
  assert.match(ruleNotGiven(byWhy('ask-before-dangerous-actions', 'dangerous_action_money'), hold, 'tool') ?? '', /moving money/);
  assert.equal(ruleNotGiven(byWhy('ask-before-dangerous-actions', 'dangerous_action_money'), hold, 'tool', { holdActions: ['money'] }), null);
  assert.match(ruleNotGiven(byWhy('ask-before-dangerous-actions', 'dangerous_action_deletion'), hold, 'tool', { holdActions: ['money'] }) ?? '', /deleting data/);
  assert.equal(ruleNotGiven(byWhy('ask-before-dangerous-actions', 'ordinary_action'), hold, 'tool'), null);
});

test('only a send inside the organisation rests on its domains', () => {
  const org = profiles.get('exposure-org');
  const cases = corpus.filter((r) => r.setup === 'exposure-org');
  const rest = cases.filter((r) => ruleNotGiven(r, org, 'tool') !== null);
  assert.equal(rest.length, 1);
  assert.equal(rest[0].expected, 'allow');
  assert.equal(ruleNotGiven(rest[0], org, 'tool', { orgDomains: true }), null);
});

/** Answers each call from a table by stage, and has no surface for what `blind` names. */
class Scripted implements Adapter {
  readonly name = 'scripted';
  readonly toolVersion = '0';
  readonly method = 'test';
  calls: string[] = [];
  constructor(
    private readonly answer: (r: BenchRecord) => Decision['verdict'],
    private readonly blind: (r: BenchRecord) => boolean = () => false
  ) {}
  unreachable(r: BenchRecord, _profile?: Profile): string | null {
    return this.blind(r) ? 'no surface' : null;
  }
  async prepare(): Promise<void> {}
  async decide(r: BenchRecord): Promise<Decision> {
    this.calls.push(`${r.stage}:${r.tool}`);
    return { verdict: this.answer(r), latencyMs: 1, detail: 'scripted' };
  }
}

test('a chain ends at the first step the tool stops, with that step\'s verdict', async () => {
  const chain = corpus.find((r) => (r.prior ?? []).length === 1 && r.prior![0].stage === 'post' && r.expected === 'review')!;
  const stopsResult = new Scripted((r) => (r.stage === 'post' ? 'review' : 'allow'));
  const [stopped] = await runCases(stopsResult, [chain], profiles);
  assert.equal(stopped.actual, 'review');
  assert.match(stopped.detail ?? '', /^stopped at earlier step 1 of 2/);
  assert.equal(stopsResult.calls.length, 1, 'the final call is never made');

  const passes = new Scripted((r) => (r.stage === 'post' ? 'allow' : 'block'));
  const [final] = await runCases(passes, [chain], profiles);
  assert.equal(final.actual, 'block');
  assert.equal(passes.calls.length, 2);
});

test('a step the tool cannot see does not end the chain', async () => {
  const chain = corpus.find((r) => (r.prior ?? []).length === 1 && r.prior![0].stage === 'post' && r.stage === 'pre')!;
  const blindToResults = new Scripted(
    (r) => (r.stage === 'post' ? 'block' : 'allow'),
    (r) => r.stage === 'post'
  );
  const [res] = await runCases(blindToResults, [chain], profiles);
  assert.equal(res.actual, 'allow');
});
