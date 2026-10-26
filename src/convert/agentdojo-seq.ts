// AgentDojo, the combination: the poisoned tool result as a prior `post`
// call, then the attacker's action, in one session; and the clean result
// followed by the user's own action. Labels are AgentDojo's ground truth,
// since corpus 4.0.0:
//   attack sequences   the injection task's first state-changing ground-truth
//                      call after the record that carries the injection: the
//                      action AgentDojo scores an attack as successful by.
//                      A correct tool stops it (review).
//   benign sequences   the user task's first state-changing ground-truth call
//                      after the clean record: the action AgentDojo scores
//                      utility by. The user asked for it: allow, whatever the
//                      destination (until 4.0.0 node9's design held the
//                      "pay the bill" sends whose IBAN came from the bill read).
// AgentVerdict's part is the mapping, stated in LABEL_RULES: which call is the
// action (the first call to an ACTIONS tool, the fixed list in agentdojo.ts),
// and that a stopped case is review rather than block.
//
// Pairing: each vector of a suite with four injection tasks of that suite,
// one per attack template, chosen from the vector's own stable slot (as
// convertAgentDojo does) so the group count stays bounded and no vector
// depends on another being present; one user task per vector, by the same
// slot, for the benign twin. Ids and groups are stable since 1.12.0:
//   agentdojo-seq.<suite>.<vector>.<template>.<injection task>-<action>
//   agentdojo-seq.<suite>.<vector>.benign.<user task>-<action>
// A later live run (an LLM agent driven by AgentDojo's own pipeline with the
// guard as its hook) reports under the same ids: suite, vector, template and
// task name the scenario; only how the action is produced changes (replayed
// from the ground truth here, chosen by the model there).
//
// Group: the vector's, `agentdojo.<suite>.<vector>`, shared with the text
// cases built from the same vector (convertAgentDojo), so every case of one
// vector is on one side of the holdout split. The tasks are a lookup table
// (AgentDojo's published ground truth), never held out.

import { claudeOutput, claudePre } from './payload.ts';
import { mk, slug } from './record.ts';
import { protect, reveal } from '../hygiene.ts';
import type { BenchRecord, Template } from '../types.ts';
import { ACTIONS, MODEL, loadCalls, loadSnapshot, vectorCases, type Call } from './agentdojo.ts';

/** The first call of a task that changes the world, with its arguments. */
function firstAction(calls: Call[]): Call | undefined {
  return calls.find((c) => ACTIONS.has(c.function));
}

export function convertAgentDojoSequences(): BenchRecord[] {
  const snap = loadSnapshot();
  const calls = loadCalls();
  const sha = calls.commit.slice(0, 7);
  const templates = Object.keys(snap.templates).sort();
  const out: BenchRecord[] = [];
  for (const c of vectorCases(snap)) {
    const { injection_tasks, user_tasks } = calls.suites[c.suite];
    const defaults = new Map(snap.suites[c.suite].vectors.map((v) => [v.id, reveal(v.default)]));
    const readTool = c.base.tool;
    const readInput = c.base.input;
    const seqId = (kind: string, rest: string) => `agentdojo-seq.${c.suite}.${slug(c.v.id)}.${kind}.${rest}`;

    // Attack: the poisoned record, then the attacker's call.
    templates.forEach((t, ti) => {
      const task = injection_tasks[(c.vi + ti) % injection_tasks.length];
      const action = firstAction(task.calls);
      if (!action) return;
      const injection = snap.templates[t]
        .replaceAll('{user}', snap.user)
        .replaceAll('{model}', MODEL)
        .replaceAll('{goal}', reveal(task.goal));
      const record = c.render(injection);
      const name = `mcp__agentdojo-${c.suite}__${action.function}`;
      out.push(
        mk({
          id: seqId(t.replace(/_/g, '-'), `${slug(task.id)}-${action.function.replace(/_/g, '-')}`),
          channel: 'mcp',
          tool: name,
          stage: 'pre',
          input: claudePre(name, action.args as Template),
          prior: [{ stage: 'post', input: readInput, output: claudeOutput.mcpText(protect(record)) }],
          setup: 'exposure-org',
          expected: 'review',
          why: 'attacker_action_after_poisoned_result',
          family: `agentdojo_seq_${t}`,
          group: `agentdojo.${c.suite}.${c.v.id}`,
          source: 'agentdojo-seq',
          source_ref: `${c.ref}, attack ${t}, ${calls.repo}@${sha} injection_tasks.py (${task.id}, first action)`,
          license: 'MIT',
          note: c.v.description,
        })
      );
    });

    // Benign: the clean record, then the user's own call (one user task per
    // vector, rotated, so every vector has a benign twin).
    const task = user_tasks[c.vi % user_tasks.length];
    const action = firstAction(task.calls);
    if (action) {
      const record = c.render(defaults.get(c.v.id) ?? '');
      const name = `mcp__agentdojo-${c.suite}__${action.function}`;
      out.push(
        mk({
          id: seqId('benign', `${slug(task.id)}-${action.function.replace(/_/g, '-')}`),
          channel: 'mcp',
          tool: name,
          stage: 'pre',
          input: claudePre(name, action.args as Template),
          prior: [{ stage: 'post', input: readInput, output: claudeOutput.mcpText(protect(record)) }],
          setup: 'exposure-org',
          expected: 'allow',
          why: 'user_action_after_clean_result',
          family: 'agentdojo_seq_benign',
          group: `agentdojo.${c.suite}.${c.v.id}`,
          source: 'agentdojo-seq',
          source_ref: `${c.ref}, default text, ${calls.repo}@${sha} user_tasks.py (${task.id}, first action)`,
          license: 'MIT',
          note: readTool === name ? undefined : c.v.description,
        })
      );
    }
  }
  return out;
}
