// Any tool that works as a Claude Code hook, run from its command line alone
// (node9Firewall#368, plan 3): a vendor needs no adapter code.
//
//   npm run bench -- --adapter hook --hook-name mytool --hook-cmd "mytool hook" [--hook-post-cmd "mytool post-hook"] [--hook-version 1.2.3]
//
// The contract is Claude Code's own. For a `pre` case the PreToolUse payload
// goes to the command's stdin, for a `post` case the PostToolUse payload with
// `tool_response`; the command runs with the case's project as its working
// directory, the case's fresh HOME, and a minimal environment. The verdict:
//   exit 2                                            block (pre), flagged (post)
//   exit 0, hookSpecificOutput.permissionDecision     deny: block; ask: review
//   exit 0, decision: "block"                         block (pre), flagged (post)
//   exit 0, additionalContext on a post case          flagged (review)
//   exit 0 otherwise                                  allow
//   the time limit                                    review (held for a human)
//   any other exit code                               a measurement error
// Each command runs through the shell (`sh -c`), so a command line may carry
// its own flags and files.
//
// Profiles. The adapter knows nothing about the tool's settings, so it does
// not translate the profile; it writes the profile, materialised, to
// $HOME/.node9-bench/profile.json in the case's HOME, and a vendor's command
// may read it there to configure the tool (protected paths, the egress
// policy, planted canaries, opt-in features, the organisation's domains, the
// actions the user wants held). A tool that ignores it is measured as it is;
// the summary's method line says so.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import { materialize, type Env } from '../../src/template.ts';

const TIMEOUT_MS = 15_000;

export interface HookOptions {
  /** The adapter's name in results/ (results/hook-<name>/). */
  name: string;
  /** Command line for PreToolUse, run through sh -c with the payload on stdin. */
  command: string;
  /** Command line for PostToolUse; without it post cases are unreachable. */
  postCommand?: string;
  /** Recorded with every result. */
  version?: string;
}

function lastJson(stdout: string): Record<string, unknown> | undefined {
  const lines = stdout.trim().split('\n').reverse();
  for (const line of lines) {
    try {
      const v = JSON.parse(line) as unknown;
      if (v && typeof v === 'object') return v as Record<string, unknown>;
    } catch {
      /* not JSON */
    }
  }
  return undefined;
}

export function hookVerdict(r: { status: number | null; signal: string | null; stdout: string; stderr: string }, post: boolean): { verdict: Verdict; detail?: string } {
  const held = r.signal !== null || r.status === null;
  if (held) return { verdict: 'review', detail: 'held for a human (timeout)' };
  const json = lastJson(r.stdout ?? '');
  const hso = (json?.hookSpecificOutput ?? {}) as Record<string, unknown>;
  const reason = String(hso.permissionDecisionReason ?? json?.reason ?? hso.additionalContext ?? '').slice(0, 240) || undefined;
  if (r.status === 2) return { verdict: post ? 'review' : 'block', detail: reason ?? ((r.stderr ?? '').trim().slice(0, 240) || undefined) };
  if (r.status !== 0) throw new Error(`hook exited ${r.status}: ${(r.stderr ?? '').slice(0, 300)}`);
  if (hso.permissionDecision === 'deny' || json?.decision === 'block') return { verdict: post ? 'review' : 'block', detail: reason };
  if (hso.permissionDecision === 'ask') return { verdict: 'review', detail: reason };
  if (post && typeof hso.additionalContext === 'string' && hso.additionalContext.length > 0) return { verdict: 'review', detail: reason };
  return { verdict: 'allow', detail: reason };
}

export class GenericHookAdapter implements Adapter {
  readonly name: string;
  readonly toolVersion: string;
  readonly method: string;

  constructor(private readonly opts: HookOptions) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.name)) throw new Error(`hook: --hook-name must be lowercase [a-z0-9-], got "${opts.name}"`);
    this.name = `hook-${opts.name}`;
    this.toolVersion = opts.version ?? 'unknown';
    this.method = `generic Claude Code hook adapter: PreToolUse through \`${opts.command}\`${opts.postCommand ? `, PostToolUse through \`${opts.postCommand}\`` : ', no PostToolUse command (post cases unreachable)'}; payload on stdin, fresh HOME per case, the profile written to $HOME/.node9-bench/profile.json for the command to read; the tool's own settings are whatever the command applies`;
  }

  unreachable(record: BenchRecord): string | null {
    return record.stage === 'post' && !this.opts.postCommand ? 'no PostToolUse command given (--hook-post-cmd)' : null;
  }

  async prepare(profile: Profile, env: Env, secrets: Set<string>): Promise<void> {
    const dir = path.join(env.home, '.node9-bench');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'profile.json'), JSON.stringify(materialize(profile as never, env, secrets), null, 2) + '\n', { mode: 0o600 });
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    const post = record.stage === 'post';
    const body = post ? { ...payload, tool_response: materialize(record.output, env) } : payload;
    const t0 = performance.now();
    const r = spawnSync('sh', ['-c', post ? this.opts.postCommand! : this.opts.command], {
      input: JSON.stringify(body),
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: env.cwd,
      env: { HOME: env.home, PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR: os.tmpdir() },
    });
    const latencyMs = performance.now() - t0;
    if (r.error && (r.error as NodeJS.ErrnoException).code !== 'ETIMEDOUT') throw r.error;
    const { verdict, detail } = hookVerdict({ status: r.status, signal: r.signal, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }, post);
    return { verdict, latencyMs, detail };
  }
}
