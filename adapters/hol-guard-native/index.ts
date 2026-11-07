// HOL Guard's command authority: the native `hol-guard-runtime pre-tool`
// decision its Claude Code PreToolUse hook relies on.
//
// Why not the hook itself: `hol-guard hook --harness claude-code` hands the
// decision to a resident native process managed by HOL Guard's daemon. In an
// isolated home (fresh HOME, no desktop session) that resident never became
// available, and the hook then fails closed, denying every call with
// `native_pre_tool_unavailable`, `ls` included. Counting those denies would be
// counting a broken setup. The runtime's own `pre-tool --stdin` takes the same
// Claude Code payload and returns the same rule authority's decision in
// milliseconds, so this adapter measures that layer.
//
// What this layer does not include (so a miss here may be caught by HOL Guard
// as deployed): the Python layers around it (package supply-chain lookups,
// secret and prompt-injection screening of content, approvals memory, Guard
// Cloud policy), tools other than the shell (Read, Write, WebFetch, MCP: the
// runtime answers `native_pre_tool_command_missing` for them), and tool output
// (PostToolUse). Profiles have no equivalent
// input: protected paths, destination lists and planted decoys are not
// expressible to this command, and each such case says so.
//
// Verdicts: policy_action "block" is block, "review" and "require-reapproval"
// (ask again, e.g. under sudo) are review, "allow" is allow. A request the runtime rejects as malformed is a measurement error.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ruleNotGiven, type Adapter, type Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import type { Env } from '../../src/template.ts';
import { ROOT } from '../../src/corpus.ts';
import { installRoot, sandboxNote, sandboxed } from '../../src/sandbox.ts';

const TIMEOUT_MS = 15_000;
const DEFAULT_VERSION = '3.42.0';

function runtimePath(version: string): string {
  const lib = path.join(ROOT, 'external', 'hol-guard', version, 'venv', 'lib');
  const py = fs.existsSync(lib) ? fs.readdirSync(lib).find((d) => d.startsWith('python3')) : undefined;
  return path.join(lib, py ?? 'python3', 'site-packages', 'codex_plugin_scanner', '_native', 'hol-guard-runtime');
}

export class HolGuardNativeAdapter implements Adapter {
  readonly name = 'hol-guard-native';
  readonly toolVersion: string;
  readonly method: string;
  private readonly bin: string;
  private approx: string[] = [];

  constructor(bin?: string) {
    this.bin = bin ?? process.env.HOL_GUARD_RUNTIME ?? runtimePath(DEFAULT_VERSION);
    if (!fs.existsSync(this.bin)) throw new Error(`${this.bin} not found: pip install hol-guard into external/hol-guard/<version>/venv`);
    const manifest = JSON.parse(fs.readFileSync(path.join(path.dirname(this.bin), 'runtime-manifest.json'), 'utf-8')) as { package_version: string };
    this.toolVersion = manifest.package_version;
    this.method = `hol-guard-runtime pre-tool --stdin from hol-guard ${this.toolVersion} (the native command authority behind its Claude Code hook), fresh HOME per case, minimal environment, ${sandboxNote()}`;
  }

  unreachable(record: BenchRecord, profile?: Profile): string | null {
    const rule = ruleNotGiven(record, profile, 'HOL Guard');
    if (rule) return rule;
    if (record.stage === 'post') return "HOL Guard's native pre-tool authority decides PreToolUse only";
    // The runtime answers `native_pre_tool_command_missing` for a call without a shell command.
    if (record.tool !== 'Bash') return "HOL Guard's native pre-tool authority decides shell commands; other tools go through its Python hook layers";
    return null;
  }

  async prepare(profile: Profile): Promise<void> {
    const approx: string[] = [];
    if (profile.protectedPaths?.length) approx.push('protected paths are not an input of the native pre-tool authority');
    if (profile.egress) approx.push('destination policy is not an input of the native pre-tool authority');
    if (profile.canaries?.length) approx.push('planted decoys are not an input of the native pre-tool authority');
    this.approx = approx;
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    const t0 = performance.now();
    const s = sandboxed(this.bin, ['pre-tool', '--stdin'], { home: env.home, cwd: env.cwd, ro: [installRoot(this.bin)] });
    const r = spawnSync(s.cmd, s.args, {
      input: JSON.stringify(payload),
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: env.cwd,
      env: { HOME: env.home, PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR: os.tmpdir() },
    });
    const latencyMs = performance.now() - t0;
    if (r.error) throw r.error;
    let j: Record<string, unknown>;
    try {
      j = JSON.parse(r.stdout ?? '');
    } catch {
      throw new Error(`hol-guard-runtime gave no decision (exit ${r.status}): ${(r.stdout || r.stderr || '').slice(0, 200)}`);
    }
    const action = j.policy_action;
    let verdict: Verdict;
    if (action === 'block') verdict = 'block';
    else if (action === 'review' || action === 'require-reapproval') verdict = 'review';
    else if (action === 'allow') verdict = 'allow';
    else throw new Error(`unknown HOL Guard policy_action ${String(action)}`);
    const reason = `${String(j.reason_code ?? '')}: ${String(j.reason ?? '')}`.slice(0, 240);
    const notes = [reason, ...this.approx.map((a) => `[setting approximated: ${a}]`)].filter(Boolean);
    return { verdict, latencyMs, detail: notes.join(' ') };
  }
}
