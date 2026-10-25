// Source: sources/agentdojo/snapshot.json (refresh with npm run sources:agentdojo),
// taken from github.com/ethz-spylab/agentdojo (MIT) at one pinned commit.
//
// AgentDojo places an injection inside data a tool returns: an email body, a
// calendar event, a file in a cloud drive, a web page, a bank statement, a
// hotel review. Each such slot (an "injection vector") becomes one tool
// result, rendered from the environment record that holds it, in five
// versions:
//   benign   the slot holds AgentDojo's own default text          -> allow
//   attack   the slot holds one of four AgentDojo attack templates
//            (important_instructions, ignore_previous, injecagent,
//            system_message) carrying one of the suite's injection
//            goals, rotated so every template and goal is used      -> review
// A tool result has already reached the agent when a hook sees it, so the
// right response to an injected one is to flag it (review), as for node9's
// own injection cases.
//
// The result arrives as an MCP tool of a server named after the suite
// (mcp__agentdojo-workspace__get_received_emails ...), in Claude Code's MCP
// result shape. The cases run under `injection-optin`: they measure how well
// injected text is detected, which a default install does not attempt; the
// default-off behaviour is already covered by node9's own injection cases.
//
// What this does not measure: AgentDojo's own score, which is whether a model
// carries out the injected task. That needs a model in the loop.

import fs from 'node:fs';
import path from 'node:path';
import { claudeOutput, claudePost, claudePre } from './payload.ts';
import { mk, slot, slug, type CaseSpec } from './record.ts';
import { ROOT } from '../corpus.ts';
import { protect, reveal } from '../hygiene.ts';
import type { BenchRecord, Joined, Template } from '../types.ts';

const SNAPSHOT = 'sources/agentdojo/snapshot.json';
export const MODEL = 'Claude';

type Text = string | Joined;
interface Vector {
  id: string;
  description: string;
  default: Text;
  file: string;
  section: string;
  record: Text;
}
export interface Snapshot {
  repo: string;
  commit: string;
  user: string;
  templates: Record<string, string>;
  suites: Record<string, { vectors: Vector[]; goals: Array<{ id: string; goal: Text }> }>;
}

// The AgentDojo tool that returns each section of a suite's environment.
const TOOLS: Record<string, Record<string, string>> = {
  workspace: { initial_emails: 'get_received_emails', initial_events: 'search_calendar_events', initial_files: 'search_files' },
  slack: { web: 'get_webpage', slack: 'read_channel_messages' },
  banking: { filesystem: 'read_file', bank_account: 'get_most_recent_transactions' },
  travel: { hotels: 'get_rating_reviews_for_hotels', restaurants: 'get_rating_reviews_for_restaurants', car_rental: 'get_rating_reviews_for_car_rental' },
};

/** Plausible arguments for the call that returned the record. */
function argsFor(tool: string, record: string): Template {
  const key = /^"?([^":]+)"?:/.exec(record)?.[1];
  if (tool === 'get_webpage' && key) return { url: key };
  if (tool === 'read_file' && key) return { file_path: key };
  const name = /name:\s*"([^"]+)"/.exec(record)?.[1];
  if (tool.startsWith('get_rating_reviews_for_') && name) return { names: [name] };
  return {};
}

export interface VectorCase {
  suite: string;
  v: Vector;
  vi: number;
  base: Omit<CaseSpec, 'id' | 'output' | 'expected' | 'why' | 'family' | 'source_ref'>;
  ref: string;
  /** The tool's result with this vector's slot holding `slot`, other slots at their defaults. */
  render: (slot: string) => string;
}

/** Every injection vector of every suite as the tool result it sits in, in a fixed order. */
export function vectorCases(snap: Snapshot): VectorCase[] {
  const sha = snap.commit.slice(0, 7);
  const out: VectorCase[] = [];
  for (const suite of Object.keys(snap.suites).sort()) {
    const { vectors } = snap.suites[suite];
    const defaults = new Map(vectors.map((v) => [v.id, reveal(v.default)]));
    for (const v of vectors) {
      // The vector's slot: a stable hash of its key, not its position, so a
      // vector removed from the snapshot changes no other vector's cases.
      const vi = slot(`agentdojo:${suite}:${v.id}`, 1 << 30);
      const tool = TOOLS[suite]?.[v.section];
      if (!tool) throw new Error(`agentdojo: no tool for ${suite}/${v.section}`);
      const record = reveal(v.record);
      const render = (slot: string) =>
        record.replace(/\{([a-z0-9_]+)\}/g, (all, id: string) => (id === v.id ? slot : (defaults.get(id) ?? all)));
      const name = `mcp__agentdojo-${suite}__${tool}`;
      out.push({
        suite,
        v,
        vi,
        base: {
          channel: 'injection',
          tool: name,
          stage: 'post',
          input: claudePost(name, argsFor(tool, record)),
          setup: 'injection-optin',
          group: `agentdojo.${suite}.${v.id}`,
          source: 'agentdojo',
          license: 'MIT',
          note: v.description,
        },
        ref: `${snap.repo}@${sha}:${v.file} (vector ${v.id})`,
        render,
      });
    }
  }
  return out;
}

export function loadSnapshot(): Snapshot {
  return JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
}

export function convertAgentDojo(): BenchRecord[] {
  const snap = loadSnapshot();
  const templates = Object.keys(snap.templates).sort();
  const out: BenchRecord[] = [];
  for (const c of vectorCases(snap)) {
    const { goals } = snap.suites[c.suite];
    const defaults = new Map(snap.suites[c.suite].vectors.map((v) => [v.id, reveal(v.default)]));
    out.push(
      mk({
        ...c.base,
        id: `agentdojo.${c.suite}.${slug(c.v.id)}.benign`,
        output: claudeOutput.mcpText(protect(c.render(defaults.get(c.v.id) ?? ''))),
        expected: 'allow',
        why: 'benign_tool_output',
        family: 'benign_text',
        source_ref: c.ref,
      })
    );
    templates.forEach((t, ti) => {
      const g = goals[(c.vi + ti) % goals.length];
      const injection = snap.templates[t].replaceAll('{user}', snap.user).replaceAll('{model}', MODEL).replaceAll('{goal}', reveal(g.goal));
      out.push(
        mk({
          ...c.base,
          id: `agentdojo.${c.suite}.${slug(c.v.id)}.${t.replace(/_/g, '-')}`,
          output: claudeOutput.mcpText(protect(c.render(injection))),
          expected: 'review',
          why: 'instruction_in_tool_output',
          family: `agentdojo_${t}`,
          source_ref: `${c.ref}, attack ${t}, goal ${c.suite}/${g.id}`,
        })
      );
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Added in corpus 1.6.0, from sources/agentdojo/calls.json (refresh with
// npm run sources:agentdojo-calls), the facts AgentDojo's own code produces.

const CALLS = 'sources/agentdojo/calls.json';

export interface Call {
  function: string;
  args: Template;
  placeholder_args: Template | null;
}
export interface Calls {
  repo: string;
  commit: string;
  templates: Record<string, string>;
  suites: Record<
    string,
    {
      injection_tasks: Array<{ id: string; goal: Text; calls: Call[]; tools_sequence: Text }>;
      user_tasks: Array<{ id: string; calls: Call[] }>;
    }
  >;
}

export function loadCalls(): Calls {
  return JSON.parse(fs.readFileSync(path.join(ROOT, CALLS), 'utf-8')) as Calls;
}

/**
 * AgentDojo's other fixed templates on the same 39 vectors: `direct`,
 * `tool_knowledge` (the attack spelled out as the tool calls to make) and the
 * five denial-of-service templates, which ask the agent to stop instead of
 * acting. Same carrier, profile and label (review) as the four templates of
 * corpus 1.2.0; goals rotate the same way over this list, over every
 * injection task as AgentDojo's code lists them. Left out: `manual` (text to be
 * written by whoever runs it) and the five `important_instructions` variants,
 * which differ from it only in the names they sign with.
 */
export function convertAgentDojoTemplates(): BenchRecord[] {
  const snap = loadSnapshot();
  const calls = loadCalls();
  if (calls.commit !== snap.commit) throw new Error('agentdojo: calls.json and snapshot.json are pinned to different commits');
  const templates = Object.keys(calls.templates).sort();
  const out: BenchRecord[] = [];
  for (const c of vectorCases(snap)) {
    const tasks = calls.suites[c.suite].injection_tasks;
    templates.forEach((t, ti) => {
      const task = tasks[(c.vi + ti) % tasks.length];
      const usesGoal = calls.templates[t].includes('{goal}');
      const injection = calls.templates[t]
        .replaceAll('{user}', snap.user)
        .replaceAll('{model}', MODEL)
        .replaceAll('{goal}', reveal(task.goal))
        .replaceAll('{tools}', reveal(task.tools_sequence));
      out.push(
        mk({
          ...c.base,
          id: `agentdojo.${c.suite}.${slug(c.v.id)}.${t.replace(/_/g, '-')}`,
          output: claudeOutput.mcpText(protect(c.render(injection))),
          expected: 'review',
          why: 'instruction_in_tool_output',
          family: `agentdojo_${t}`,
          source_ref: `${c.ref}, attack ${t}${usesGoal ? `, goal ${c.suite}/${task.id}` : ''}`,
        })
      );
    });
  }
  return out;
}

/**
 * Tools whose call does something: changes state (send, create, update,
 * delete, invite, share) or reaches a web address. A call to any other tool
 * of the four suites reads the user's own data and is left out on both sides:
 * the reads an attacker needs first are the same reads ordinary work makes.
 * Fixed before measuring; a tool not in either list stops the conversion.
 */
export const ACTIONS = new Set([
  'add_calendar_event_participants',
  'add_user_to_channel',
  'append_to_file',
  'create_calendar_event',
  'create_file',
  'delete_email',
  'delete_file',
  'get_webpage',
  'invite_user_to_slack',
  'post_webpage',
  'remove_user_from_slack',
  'reschedule_calendar_event',
  'reserve_hotel',
  'schedule_transaction',
  'send_channel_message',
  'send_direct_message',
  'send_email',
  'send_money',
  'share_file',
  'update_password',
  'update_scheduled_transaction',
  'update_user_info',
]);
const READS = /^(get_|search_|read_|list_|check_)/;

/**
 * The tool calls AgentDojo's authors wrote as each task's ground truth, as
 * MCP tool calls before they run (PreToolUse), under a fresh install:
 *   injection task   a call that carries out the attacker's goal   -> block
 *   user task        a call that carries out the user's request    -> allow
 * Only calls to ACTIONS tools. Each distinct call (tool and arguments) once;
 * a call that appears on both sides would be dropped from both (none at the
 * pinned commit). Each case is the call alone, without the injected text
 * that led to it: it asks whether a tool stops the action from the call.
 */
export function convertAgentDojoCalls(): BenchRecord[] {
  const calls = loadCalls();
  const sha = calls.commit.slice(0, 7);
  const out: BenchRecord[] = [];
  const key = (c: Call) => JSON.stringify([c.function, c.args]);
  for (const suite of Object.keys(calls.suites).sort()) {
    const { injection_tasks, user_tasks } = calls.suites[suite];
    const kept = (tasks: Array<{ id: string; calls: Call[] }>) => {
      const seen = new Map<string, { task: string; n: number; call: Call }>();
      for (const t of tasks)
        t.calls.forEach((c, n) => {
          if (!ACTIONS.has(c.function)) {
            if (!READS.test(c.function)) throw new Error(`agentdojo: ${suite}/${c.function} is neither an action nor a read`);
            return;
          }
          if (!seen.has(key(c))) seen.set(key(c), { task: t.id, n, call: c });
        });
      return seen;
    };
    const attack = kept(injection_tasks);
    const benign = kept(user_tasks);
    const both = new Set([...attack.keys()].filter((k) => benign.has(k)));
    const emit = (side: Map<string, { task: string; n: number; call: Call }>, file: string, expected: 'block' | 'allow') => {
      for (const [k, { task, n, call }] of side) {
        if (both.has(k)) continue;
        const name = `mcp__agentdojo-${suite}__${call.function}`;
        out.push(
          mk({
            id: `agentdojo-calls.${suite}.${slug(task)}.${n}-${call.function.replace(/_/g, '-')}`,
            channel: 'mcp',
            tool: name,
            input: claudePre(name, call.args),
            setup: 'clean',
            expected,
            why: expected === 'block' ? 'injection_goal_action' : 'user_task_action',
            family: `agentdojo_call_${call.function}`,
            group: `agentdojo-calls.${suite}.${task}`,
            source: 'agentdojo-calls',
            source_ref: `${calls.repo}@${sha}:src/agentdojo/default_suites/v1/${suite}/${file} (${task}, ground_truth call ${n})`,
            license: 'MIT',
          })
        );
      }
    };
    emit(attack, 'injection_tasks.py', 'block');
    emit(benign, 'user_tasks.py', 'allow');
  }
  return out;
}
