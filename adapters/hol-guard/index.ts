// HOL Guard at its Claude Code hook, the whole hook: `hol-guard hook
// --harness claude-code --json`, payload on stdin, in a fresh HOME per case.
//
// What `hol-guard install claude-code` writes (3.58.0): a native bridge
// (`hol-guard-runtime claude-hook-bridge`) that asks HOL Guard's resident
// daemon, and falls back to `hol-guard hook` when no daemon answers. The
// daemon serves one home, while every case brings its own home (its files,
// its planted decoys, the paths in its payload), so this adapter runs the
// fallback, which is the same Python hook without the daemon in front of it.
// On ten probe calls (every tool kind, both stages, secrets, packages,
// injection) the two paths gave the same decision; the fallback takes about
// 1.8 s per call against 0.1 s through a warm daemon.
//
// Reach: the tools the installed hook matches (Bash, PowerShell, Read, Grep,
// Write, Edit, MultiEdit, WebFetch, WebSearch, mcp__*), before and after the
// call. A tool outside that list is never shown to HOL Guard by Claude Code,
// so it is let through: measured as it is, not unreachable.
//
// Profiles in HOL Guard's own settings (`hol-guard settings set ...`), where
// it has one; what it has no setting for runs at the default and says so:
//   egress, block  -> network block   (no per-host list: allowlisted hosts are blocked too)
//   egress, review -> network ask     (no per-host list: a denied host is asked, not blocked)
//   injection-scan -> output-scanning ask
//   protected paths, planted decoys -> no setting
//
// Verdicts, before the call: permissionDecision "allow" is allow; "ask" is
// review; "deny" with a queued approval request (`approval_resume`, HOL Guard
// waiting for the user in its inbox) is review; "deny" without one is block.
// After the call: `decision: "block"` is block; a review or re-approval
// action is review; warn or allow is allow. A reason code that says HOL Guard
// could not decide (native review unavailable, deadline, overload, a harness
// it does not manage) is a measurement error, never a catch: its hook fails
// closed on those, and counting them would be counting a broken setup.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import type { Env } from '../../src/template.ts';
import { ROOT } from '../../src/corpus.ts';
import { installRoot, sandboxNote, sandboxed, withScratchHome } from '../../src/sandbox.ts';

const TIMEOUT_MS = 60_000;
const DEFAULT_VERSION = '3.58.0';

/** Tools the hook installed by `hol-guard install claude-code` 3.58.0 matches. */
const MATCHED = /^(Bash|PowerShell|Read|Grep|Write|Edit|MultiEdit|WebFetch|WebSearch|mcp__.*)$/;

/** Reason codes that say HOL Guard could not reach a decision. */
const NO_DECISION = /unavailable|not_ready|overloaded|exception|deadline|invalid_|harness_not_managed|_disabled|queue_|unsupported|mismatch|recording_only/;

type Json = Record<string, any>;

function minimalEnv(home: string): NodeJS.ProcessEnv {
  return { HOME: home, PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR: os.tmpdir() };
}

/** HOL Guard's answer as a verdict; throws when it says it could not decide. */
export function holVerdict(stage: 'pre' | 'post', j: Json): { verdict: Verdict; detail?: string } {
  const code = String(j.reason_code ?? '');
  if (code && NO_DECISION.test(code)) throw new Error(`HOL Guard could not decide: ${code}`);
  const hso = (j.hookSpecificOutput ?? {}) as Json;
  const reason = String(hso.permissionDecisionReason ?? j.reason ?? '').slice(0, 200);
  const detail = [code, reason].filter(Boolean).join(': ') || undefined;
  const action = String(j.policy_action ?? '');
  if (stage === 'post') {
    if (j.decision === 'block') return { verdict: 'block', detail };
    if (['review', 'require-reapproval', 'sandbox-required', 'block'].includes(action)) return { verdict: 'review', detail };
    if (action === 'warn' || action === 'allow' || action === '') return { verdict: 'allow', detail };
    throw new Error(`unknown HOL Guard action after the call: ${action}`);
  }
  const decision = hso.permissionDecision;
  if (decision === 'allow') return { verdict: 'allow', detail };
  if (decision === 'ask') return { verdict: 'review', detail };
  if (decision === 'deny') return { verdict: j.approval_resume ? 'review' : 'block', detail };
  if (decision === undefined && (action === 'warn' || action === 'allow')) return { verdict: 'allow', detail };
  throw new Error(`HOL Guard gave no decision: ${JSON.stringify(j).slice(0, 200)}`);
}

export class HolGuardAdapter implements Adapter {
  readonly name = 'hol-guard';
  readonly toolVersion: string;
  readonly method: string;
  private readonly python: string;
  private approx: string[] = [];

  constructor(python?: string) {
    this.python = python ?? process.env.HOL_GUARD_PYTHON ?? path.join(ROOT, 'external', 'hol-guard', DEFAULT_VERSION, 'venv', 'bin', 'python');
    if (!fs.existsSync(this.python)) throw new Error(`${this.python} not found: pip install hol-guard into external/hol-guard/<version>/venv`);
    const v = withScratchHome((home) => {
      const s = sandboxed(this.python, ['-m', 'codex_plugin_scanner.cli', '--version'], { home, ro: [installRoot(this.python)] });
      return spawnSync(s.cmd, s.args, { encoding: 'utf-8', env: minimalEnv(home) });
    });
    const m = /(\d+\.\d+\.\d+)/.exec(v.stdout ?? '');
    if (!m) throw new Error(`cannot read the HOL Guard version: ${(v.stderr ?? '').slice(0, 200)}`);
    this.toolVersion = m[1];
    this.method = `hol-guard ${this.toolVersion}: the whole Claude Code hook (hol-guard hook --harness claude-code, the installed bridge's own fallback), fresh HOME per case, each profile in HOL Guard's settings where it has one, minimal environment, ${sandboxNote()}`;
  }

  unreachable(): string | null {
    return null;
  }

  private cli(args: string[], env: Env, input?: string) {
    const s = sandboxed(this.python, ['-m', 'codex_plugin_scanner.cli', 'guard', ...args], { home: env.home, cwd: env.cwd, ro: [installRoot(this.python)] });
    return spawnSync(s.cmd, s.args, {
      input,
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: env.cwd,
      env: minimalEnv(env.home),
    });
  }

  /** The profile as HOL Guard settings, plus what had no equivalent. */
  static translate(profile: Profile): { settings: string[][]; approx: string[] } {
    const settings: string[][] = [];
    const approx: string[] = [];
    if (profile.egress) {
      const e = profile.egress;
      if (e.mode === 'block') {
        settings.push(['network', 'block']);
        if (e.allow?.length) approx.push('HOL Guard has no per-host allowlist; allowlisted hosts are blocked too');
      } else {
        settings.push(['network', 'ask']);
        if (e.deny?.length) approx.push('HOL Guard has no per-host deny list; a denied host is asked about, not blocked');
      }
      if (e.allowPrivate) approx.push('HOL Guard has no exemption for private addresses');
    }
    if (profile.optIn?.includes('injection-scan')) settings.push(['output-scanning', 'ask']);
    if (profile.protectedPaths?.length) approx.push('HOL Guard has no list of protected paths');
    if (profile.canaries?.length) approx.push('HOL Guard has no planted-decoy setting');
    return { settings, approx };
  }

  async prepare(profile: Profile, env: Env): Promise<void> {
    const { settings, approx } = HolGuardAdapter.translate(profile);
    this.approx = approx;
    for (const s of settings) {
      const r = this.cli(['settings', 'set', ...s], env);
      if (r.status !== 0) throw new Error(`hol-guard settings set ${s.join(' ')} failed: ${(r.stderr ?? '').slice(-300)}`);
    }
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    if (!MATCHED.test(record.tool)) {
      return { verdict: 'allow', latencyMs: 0, detail: `the installed HOL Guard hook does not match ${record.tool}; Claude Code never asks it` };
    }
    const t0 = performance.now();
    const r = this.cli(['hook', '--harness', 'claude-code', '--json'], env, JSON.stringify(payload));
    const latencyMs = performance.now() - t0;
    if (r.error) throw r.error;
    const out = r.stdout ?? '';
    const start = out.indexOf('{');
    let j: Json;
    try {
      j = JSON.parse(out.slice(start));
    } catch {
      throw new Error(`HOL Guard gave no JSON (exit ${r.status}): ${(r.stderr ?? '').slice(-300)}`);
    }
    const v = holVerdict(record.stage, j);
    const notes = [v.detail, ...this.approx.map((a) => `[setting approximated: ${a}]`)].filter(Boolean);
    return { verdict: v.verdict, latencyMs, detail: notes.length ? notes.join(' ') : undefined };
  }

  /** The hook leaves a daemon behind in the case's home; stop every process that runs with that HOME. */
  async release(env: Env): Promise<void> {
    const mark = `HOME=${env.home}\0`;
    const victims: number[] = [];
    for (const d of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(d) || Number(d) === process.pid) continue;
      try {
        if (fs.readFileSync(`/proc/${d}/environ`, 'latin1').includes(mark)) victims.push(Number(d));
      } catch {
        /* gone, or not ours */
      }
    }
    for (const pid of victims) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}
