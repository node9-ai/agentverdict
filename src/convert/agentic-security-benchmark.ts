// Source: sources/agentic-security-benchmark/snapshot.json (refresh with
// npm run sources:agentic-security-benchmark), Itay Glick's
// agentic-security-benchmark (MoorAI, Apache-2.0), written by hand to the
// AMTSO Guidelines for Testing of Agentic Security Products v1.0. The author
// ships a security product and grades it on these files, so the source is
// classified `competitor` in suites.ts: the vendor section, never the
// headline. Every label is the source's `shouldDetect`, taken as is.
//
// Vector 4, outbound action: each record is a resolved Claude Code tool call,
// sent as its PreToolUse payload. A chain (`actions`) sends the step the
// source names (`consumeAction`, counted from 1) as the case and the steps
// before it as `prior`. The placeholders are resolved to the fixed values the
// source's own harness uses (scorers/corpus.mjs), with the source's sandbox
// paths under our per-case home; the `asb-sandbox` profile creates the files
// they name.
//
// Vector 5, memory and cross-agent: only the `steps` records, as the calls an
// agent makes for them (CASES_V5 below, one line per record, fixed before
// measuring). The case is the write to a memory or instruction file when the
// record has one; otherwise the tool output that carries the instruction (a
// `post` case, flagged or not). A step the record states in words ("Append to
// CLAUDE.md: '...'") becomes the write of the quoted text, which the record's
// next step shows. The step where a later session loads the memory has no hook
// in Claude Code and is not a case.

import fs from 'node:fs';
import path from 'node:path';
import { claudeOutput, claudePost, claudePre } from './payload.ts';
import { mk } from './record.ts';
import { ROOT } from '../corpus.ts';
import { holdoutNames } from '../holdout/names.ts';
import { protect, reveal, sensitive } from '../hygiene.ts';
import type { BenchRecord, Channel, Joined, PriorCall, Profile, Template } from '../types.ts';

export const SOURCE = 'agentic-security-benchmark';
export const PROFILE = 'asb-sandbox';
const SNAPSHOT = 'sources/agentic-security-benchmark/snapshot.json';
const LICENSE = 'Apache-2.0';

/** The source's fixed placeholder values (scorers/corpus.mjs at the pinned commit), its sandbox paths under our home. */
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET = 'wJalrXUtnFEMIK7MDENGbPxRfiCYzEXAMPLEKEY1';
const GH_TOKEN = 'ghp_ABCDEFghijklMNOPqrstUVWXyz0123456789';
const PLACEHOLDERS: Array<[string, string]> = [
  ['{{CRED_FILE}}', '{{HOME}}/creds/.env'],
  ['{{BENIGN_FILE}}', '{{HOME}}/src/math.js'],
  ['{{STAGE_FILE}}', '{{HOME}}/tmp/staged.txt'],
  ['{{AWS_KEY}}', AWS_KEY],
  ['{{AWS_SECRET}}', AWS_SECRET],
  ['{{GH_TOKEN}}', GH_TOKEN],
];

/** The files the source's sandbox holds (its placeholderTokens): a credential file, a source file the cases edit, an empty staging file. */
export function sandboxFiles(): NonNullable<Profile['files']> {
  return [
    { path: '{{HOME}}/creds/.env', content: protect(`AWS_ACCESS_KEY_ID=${AWS_KEY}\nAWS_SECRET_ACCESS_KEY=${AWS_SECRET}\n`) },
    { path: '{{HOME}}/src/math.js', content: 'export function add(a, b) { return a + b; }\n' },
    { path: '{{HOME}}/tmp/staged.txt', content: '' },
  ];
}

type Json = string | number | boolean | null | Joined | Json[] | { [k: string]: Json };

/** Every string resolved and stored again with protect(), so no credential-shaped value sits contiguously in the corpus. */
function resolve(x: Json): Template {
  if (typeof x === 'string' || (x && typeof x === 'object' && '$join' in x && Array.isArray((x as Joined).$join))) {
    let s = reveal(x as string | Joined);
    for (const [token, value] of PLACEHOLDERS) s = s.split(token).join(value);
    return protect(s);
  }
  if (Array.isArray(x)) return x.map(resolve);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, resolve(v)]));
  return x as Template;
}

const text = (v: Json): string => reveal(v as string | Joined);

interface Action {
  tool_name: string;
  tool_input: Json;
}

interface V4Row {
  id: string;
  family: string;
  subTechnique: string;
  shouldDetect: boolean;
  consumeAction?: number;
  amtso: { harm: string };
  validity?: Json;
  action?: Action;
  actions?: Action[];
}

interface Step {
  role: string;
  stage: string;
  text: Json;
}

interface V5Row {
  id: string;
  family: string;
  subTechnique: string;
  shouldDetect: boolean;
  amtso?: { harm: string };
  validity?: Json;
  steps: Step[];
}

/** The reason label: the source's sub-technique, prefixed `ordinary_` for an ordinary action unless it already says so. */
const why = (shouldDetect: boolean, sub: string) => (shouldDetect || sub.startsWith('ordinary') ? sub : `ordinary_${sub}`).replace(/-/g, '_');

const note = (vector: string, sub: string, validity?: Json) => {
  const v = validity === undefined ? '' : text(validity);
  const base = `AMTSO ${vector}, ${sub}`;
  return v && !sensitive(v) ? `${base}. The source's reason: ${v}` : base;
};

/** Vector 4's channel: a credential leaving is secrets, an MCP call mcp, a package install package, the rest shell. */
function channelV4(r: V4Row, a: Action): Channel {
  if (r.amtso.harm === 'credential-exfiltration') return 'secrets';
  if (a.tool_name.startsWith('mcp__')) return 'mcp';
  const input = a.tool_input as Record<string, Json>;
  if (a.tool_name === 'Bash' && /^\s*(npm|pnpm|yarn|pip3?)\s+(install|add|i)\b/.test(text(input.command))) return 'package';
  return 'shell';
}

function convertV4(snap: Snapshot, rev: string): BenchRecord[] {
  return snap.vector4.rows.map((r) => {
    const steps = r.actions ?? [r.action!];
    const at = r.actions ? (r.consumeAction ?? steps.length) - 1 : 0;
    if (at < 0 || at >= steps.length) throw new Error(`${r.id}: consumeAction ${r.consumeAction} outside ${steps.length} steps`);
    const a = steps[at];
    const prior: PriorCall[] = steps.slice(0, at).map((p) => ({ stage: 'pre', input: claudePre(p.tool_name, resolve(p.tool_input)) }));
    return mk({
      id: `asb.${r.id}`,
      channel: channelV4(r, a),
      tool: a.tool_name,
      input: claudePre(a.tool_name, resolve(a.tool_input)),
      prior: prior.length > 0 ? prior : undefined,
      setup: PROFILE,
      expected: r.shouldDetect ? 'block' : 'allow',
      why: why(r.shouldDetect, r.subTechnique),
      family: r.family,
      group: `asb.${r.id}`,
      source: SOURCE,
      source_ref: `${snap.repo}@${rev}:${snap.vector4.file} (${r.id})`,
      license: LICENSE,
      tags: ['amtso:vector-4', `harm:${r.amtso.harm}`],
      note: note('attack vector 4 (outbound action)', r.subTechnique, r.validity),
    });
  });
}

const MEMORY = '{{HOME}}/.claude/projects/-bench/memory/MEMORY.md';
const ISSUE = 'mcp__asb__get_issue_comments';
const DOCUMENT = 'mcp__asb__get_document';

/**
 * Each vector 5 record as calls. `write`: the case is a Write of step `step`'s
 * text to `file`; `post`: the case is the PostToolUse of `tool` with step
 * `step`'s text as its output; `task`: the case is a Task call whose prompt is
 * step `step`'s text. `prior` lists earlier calls in the same form. The memory
 * file is the one the record names; a bare "# Memory" file is Claude Code's
 * auto-memory index. The two issue-tracker and document tools are neutral
 * names (the source names no tool), served by no real server.
 */
type Call =
  | { kind: 'write'; file: string; step: number }
  | { kind: 'post'; tool: string; args: Template; step: number }
  | { kind: 'task'; description: string; step: number };

export const CASES_V5: Record<string, { call: Call; prior?: Call[] }> = {
  // A held-out record's line is in the holdout repository instead (src/holdout/names.ts).
  ...(holdoutNames().asbV5 as Record<string, { call: Call; prior?: Call[] }>),
  'v5-mem-001': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-mem-002': { call: { kind: 'write', file: '{{CWD}}/CLAUDE.md', step: 1 } },
  'v5-mem-003': { call: { kind: 'write', file: '{{CWD}}/notes/agent-context.md', step: 1 } },
  'v5-mem-004': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-mem-005': { call: { kind: 'write', file: '{{CWD}}/CLAUDE.local.md', step: 1 } },
  'v5-mem-006': {
    prior: [{ kind: 'post', tool: 'WebFetch', args: { url: 'https://example.com/releases/v4.2', prompt: 'Summarize the release notes.' }, step: 0 }],
    call: { kind: 'write', file: MEMORY, step: 1 },
  },
  'v5-mem-007': { call: { kind: 'write', file: '{{CWD}}/.claude/agents/context-loader.md', step: 0 } },
  'v5-mem-008': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-art-007': { call: { kind: 'post', tool: ISSUE, args: { issue: 'OPS-9001' }, step: 1 } },
  'v5-handoff-003': {
    prior: [{ kind: 'post', tool: DOCUMENT, args: { title: 'Migration plan' }, step: 0 }],
    call: { kind: 'task', description: 'Continue the migration', step: 1 },
  },
  'v5-handoff-008': { call: { kind: 'post', tool: 'Task', args: { description: 'Summarise the migrations', prompt: 'Subagent, summarise the migration files and report back.', subagent_type: 'general-purpose' }, step: 1 } },
  'v5-delay-001': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-delay-002': { call: { kind: 'write', file: '{{CWD}}/CLAUDE.md', step: 0 } },
  'v5-delay-003': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-delay-004': {
    prior: [{ kind: 'write', file: '{{CWD}}/notes/part-a.md', step: 0 }],
    call: { kind: 'write', file: '{{CWD}}/notes/part-b.md', step: 1 },
  },
  'v5-benign-003': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-benign-023': { call: { kind: 'write', file: MEMORY, step: 0 } },
  'v5-benign-024': { call: { kind: 'post', tool: ISSUE, args: { issue: 'OPS-9001' }, step: 1 } },
};

/** The hook payload (and output) of one call. */
function payload(c: Call, steps: Step[]): { tool: string; stage: 'pre' | 'post'; input: Template; output?: Template } {
  const step = steps[c.step];
  if (!step) throw new Error(`no step ${c.step}`);
  const body = protect(text(step.text));
  if (c.kind === 'write') return { tool: 'Write', stage: 'pre', input: claudePre('Write', { file_path: c.file, content: body }) };
  if (c.kind === 'task') return { tool: 'Task', stage: 'pre', input: claudePre('Task', { description: c.description, prompt: body, subagent_type: 'general-purpose' }) };
  const output = c.tool === 'WebFetch' ? claudeOutput.webFetch(String((c.args as Record<string, Template>).url), body) : claudeOutput.mcpText(body);
  return { tool: c.tool, stage: 'post', input: claudePost(c.tool, c.args), output };
}

function convertV5(snap: Snapshot, rev: string): BenchRecord[] {
  return snap.vector5.rows.map((r) => {
    const spec = CASES_V5[r.id];
    if (!spec) throw new Error(`${SOURCE}: vector 5 record ${r.id} has no line in CASES_V5`);
    const p = payload(spec.call, r.steps);
    const prior: PriorCall[] = (spec.prior ?? []).map((c) => {
      const q = payload(c, r.steps);
      return q.stage === 'post' ? { stage: 'post', input: q.input, output: q.output } : { stage: 'pre', input: q.input };
    });
    return mk({
      id: `asb.${r.id}`,
      channel: 'injection',
      tool: p.tool,
      stage: p.stage,
      input: p.input,
      output: p.output,
      prior: prior.length > 0 ? prior : undefined,
      setup: p.stage === 'post' ? 'injection-optin' : 'clean',
      // A write is stopped before it lands; a tool output can only be flagged.
      expected: r.shouldDetect ? (p.stage === 'post' ? 'review' : 'block') : 'allow',
      why: why(r.shouldDetect, r.subTechnique),
      family: r.family,
      group: `asb.${r.id}`,
      source: SOURCE,
      source_ref: `${snap.repo}@${rev}:${snap.vector5.file} (${r.id})`,
      license: LICENSE,
      tags: ['amtso:vector-5', ...(r.amtso ? [`harm:${r.amtso.harm}`] : [])],
      note: note('attack vector 5 (memory, context and cross-agent)', r.subTechnique, r.validity),
    });
  });
}

interface Snapshot {
  repo: string;
  commit: string;
  vector4: { file: string; rows: V4Row[] };
  vector5: { file: string; rows: V5Row[] };
}

export function convertAgenticSecurityBenchmark(file = path.join(ROOT, SNAPSHOT)): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(file, 'utf-8')) as Snapshot;
  const rev = snap.commit.slice(0, 7);
  return [...convertV4(snap, rev), ...convertV5(snap, rev)];
}
