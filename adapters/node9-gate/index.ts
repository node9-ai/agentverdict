// node9 at its real gate: the `node9` CLI exactly as an agent hook invokes it.
//
//   stage pre  -> `node9 check`, payload on stdin (the PreToolUse hook)
//   stage post -> `node9 log`,   payload on stdin (the PostToolUse hook)
//
// Verdicts are read the way node9's own gauntlet reads them
// (src/__tests__/helpers/gauntlet.ts): exit 2 is block; exit 0 with
// permissionDecision "ask" is review; exit 0 otherwise is allow; a process
// killed by the timeout was held for a human, which is a review. For `log`,
// a PostToolUse warning (additionalContext) or a block decision is a flag.
//
// Measurement conditions: a fresh HOME per case, NODE9_TESTING=1 (no
// approver dialog is reachable, so a review answers immediately and a hard
// block is never downgraded to a review), and every keyedness variable removed
// so the developer machine's cloud policy never leaks in. Network lookups
// (node9's package check) go to the same production endpoints a user's
// install uses; see gateEnv.
//
// The daemon. A real install runs node9's daemon beside the hooks; it holds
// session and file taint, and without it the hooks hold any file-sending call
// for review ("Taint service unavailable"). By default each case gets its own
// daemon, started in the case's HOME on a port of its own (NODE9_DAEMON_PORT,
// honoured under NODE9_TESTING=1 from node9 2.29.0), so it never meets the
// developer's live daemon on 7391 and no state crosses cases. Versions before
// 2.29.0 cannot move the port, so they run without one, as every run up to
// corpus 1.11.0 did; `--no-daemon` does the same on a newer version and is
// reported as the adapter `node9-gate-nodaemon`, so its results never mix
// with the default ones.

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, DangerCategory, Profile, Verdict } from '../../src/types.ts';
import { materialize, type Env } from '../../src/template.ts';
import { packageDir } from '../../src/corpus.ts';

const TIMEOUT_MS = 15_000;
const DAEMON_READY_MS = 15_000;

export interface GateOptions {
  /** `npm`: the pinned @node9/proxy. `local`: a node9-proxy checkout's dist/cli.js. */
  source: 'npm' | 'local';
  proxyDir?: string;
  /** Run a daemon per case. Default: yes from node9 2.29.0, which can put it on its own port; no before. */
  daemon?: boolean;
  /** The profiles carry the recommended setup (src/recommended.ts); recorded as its own adapter. */
  recommended?: boolean;
  /**
   * node9's own level, written as `mode` in the case's config file, exactly
   * as the Protection page's "How strict" switch writes it. Absent: the
   * shipped default (standard). A level other than standard is recorded as
   * its own adapter, node9-gate-<mode>.
   */
  mode?: Node9Mode;
}

/** node9's levels (2.39.0); `observe` is Audit's older name. */
export const NODE9_MODES = ['audit', 'soft', 'standard', 'strict', 'block-all', 'observe'] as const;
export type Node9Mode = (typeof NODE9_MODES)[number];

/**
 * The profile's "consult me before" categories (holdActions) in node9's own
 * terms: the check that holds that kind of action for a person. Categories
 * node9 has no check for run at its default, and the result says so.
 */
export const HOLD_ACTION_CHECKS: Record<DangerCategory, string | null> = {
  money: 'actions.money',
  access: 'actions.access',
  publishing: 'actions.publish',
  credentials: null,
  deletion: null,
};

const UNEXPRESSED: Record<DangerCategory, string> = {
  money: 'moving money',
  access: 'managing users and access',
  publishing: 'publishing',
  credentials: 'changing a credential',
  deletion: 'deleting data',
};

/** A TCP port nothing listens on now, chosen by the OS. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

/** True when [major, minor] of `version` is at least `min`. */
function atLeast(version: string, min: [number, number]): boolean {
  const [maj, minor] = version.split(/[.+-]/).map(Number);
  return maj > min[0] || (maj === min[0] && minor >= min[1]);
}

function resolveCli(opts: GateOptions): { cli: string; version: string } {
  if (opts.source === 'npm') {
    const dir = packageDir('@node9/proxy');
    const version = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')).version as string;
    return { cli: path.join(dir, 'dist', 'cli.js'), version };
  }
  const dir = opts.proxyDir ?? '/home/nadav/node9/node9-proxy';
  const cli = path.join(dir, 'dist', 'cli.js');
  if (!fs.existsSync(cli)) throw new Error(`${cli} not found: build the checkout first (npm run build)`);
  const version = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')).version;
  const sha = spawnSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' }).stdout.trim();
  const dirty = spawnSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf-8' }).stdout.trim() !== '';
  return { cli, version: `${version}+${sha}${dirty ? '-dirty' : ''}` };
}

/**
 * Production endpoints for node9's package check (supply-chain/net.ts). Under
 * NODE9_TESTING=1 node9 makes no network call from the hot path unless these
 * overrides are set, so its own suite never needs the internet. The benchmark
 * needs NODE9_TESTING=1 for the approver conditions above but must measure the
 * check as a user gets it, so it passes node9's own default URLs back in.
 * Without them every package case reads as "lookup failed, allow".
 */
const PRODUCTION_ENDPOINTS = {
  NODE9_OSV_BUCKET_URL: 'https://osv-vulnerabilities.storage.googleapis.com',
  NODE9_OSV_API_URL: 'https://api.osv.dev',
  NODE9_NPM_REGISTRY_URL: 'https://registry.npmjs.org',
  NODE9_PYPI_URL: 'https://pypi.org',
};

export function gateEnv(home: string, daemonPort?: number): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const k of ['NODE9_API_KEY', 'NODE9_API_URL', 'NODE9_PROFILE', 'NODE9_MODE', 'NODE9_DEBUG', 'NODE9_DAEMON_PORT']) delete env[k];
  // NODE9_NO_AUTO_DAEMON stays set either way: the hooks must never start a
  // daemon of their own, which would outlive the case. With a daemon, the
  // benchmark starts it and points the hooks at its port.
  const port = daemonPort === undefined ? {} : { NODE9_DAEMON_PORT: String(daemonPort) };
  return { ...env, HOME: home, USERPROFILE: home, NODE9_TESTING: '1', NODE9_NO_AUTO_DAEMON: '1', NO_COLOR: '1', ...PRODUCTION_ENDPOINTS, ...port };
}

/**
 * The failed malicious-package lookup node9 recorded for one call, if any.
 * node9 allows an install when OSV cannot be asked (node9Firewall#295) and
 * writes the miss to ~/.node9/hook-debug.log as `package-check-miss`. Only a
 * miss of the OSV lookup counts: a registry miss ("registry metadata
 * unavailable") happens for every package removed from its registry and does
 * not decide the malicious verdict. `log` is the text the call appended.
 */
export function osvLookupFailure(log: string): string | undefined {
  for (const line of log.split('\n')) {
    if (!line.includes('package-check-miss')) continue;
    try {
      const entry = JSON.parse(line) as { event?: string; misses?: unknown };
      if (entry.event !== 'package-check-miss' || !Array.isArray(entry.misses)) continue;
      const miss = entry.misses.find((m): m is string => typeof m === 'string' && /OSV online|no online lookup/.test(m));
      if (miss) return miss.slice(0, 200);
    } catch {
      /* not a JSON line */
    }
  }
  return undefined;
}

/** The last JSON object node9 printed on stdout, if any. */
function lastJson(stdout: string): Record<string, unknown> | null {
  const lines = stdout.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{'));
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]) as Record<string, unknown>;
    } catch {
      /* not JSON, keep looking */
    }
  }
  return null;
}

export class Node9GateAdapter implements Adapter {
  readonly name: string;
  readonly toolVersion: string;
  readonly method: string;
  private readonly cli: string;
  private readonly withDaemon: boolean;
  private readonly mode: GateOptions['mode'];
  /** v2 config files node9 wrote from a legacy one (config migrate), by the legacy file. */
  private readonly migrated = new Map<string, Record<string, unknown>>();
  /** The categories the current profile asks to hold that node9 has no check for. */
  private unexpressed: DangerCategory[] = [];
  private daemonPort: number | undefined;
  private daemon: ChildProcess | null = null;

  constructor(opts: GateOptions) {
    const { cli, version } = resolveCli(opts);
    this.cli = cli;
    this.toolVersion = version;
    const portable = atLeast(version, [2, 29]);
    if (opts.daemon === true && !portable)
      throw new Error(`node9 ${version} has no NODE9_DAEMON_PORT (2.29.0+): its daemon would take the developer's port 7391.`);
    this.withDaemon = opts.daemon ?? portable;
    this.mode = opts.mode;
    const level = opts.mode && opts.mode !== 'standard' ? `-${opts.mode}` : '';
    this.name = (!this.withDaemon && portable ? 'node9-gate-nodaemon' : 'node9-gate') + (opts.recommended ? '-recommended' : '') + level;
    const daemon = this.withDaemon ? 'a daemon per case on its own port' : 'no daemon';
    const setup =
      (opts.recommended ? ', recommended setup (egress watch with an allowlist, injection scan on; src/recommended.ts)' : '') +
      (opts.mode ? `, node9 level mode=${opts.mode}` : '') +
      ', config written in node9\'s v2 format (node9 config migrate), the profile\'s holdActions as actions.* review';
    this.method = `node9 check / node9 log from ${opts.source === 'npm' ? `@node9/proxy@${version}` : cli}, fresh HOME per case, NODE9_TESTING=1, ${daemon}${setup}`;
  }

  /** Start the case's daemon in its HOME and wait until it answers /health. */
  private async startDaemon(home: string): Promise<void> {
    this.daemonPort ??= await freePort();
    const child = spawn(process.execPath, [this.cli, 'daemon', 'start'], {
      cwd: home,
      env: gateEnv(home, this.daemonPort),
      stdio: 'ignore',
    });
    this.daemon = child;
    const deadline = Date.now() + DAEMON_READY_MS;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`node9 daemon exited with ${child.exitCode} before it was ready`);
      try {
        const res = await fetch(`http://127.0.0.1:${this.daemonPort}/health`, { signal: AbortSignal.timeout(500) });
        if (res.ok) return;
      } catch {
        /* not listening yet */
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`node9 daemon did not answer /health on ${this.daemonPort} within ${DAEMON_READY_MS} ms`);
  }

  async release(): Promise<void> {
    const child = this.daemon;
    this.daemon = null;
    if (!child || child.exitCode !== null) return;
    const exited = new Promise<void>((r) => child.once('exit', () => r()));
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
    await exited;
    clearTimeout(timer);
  }

  unreachable(): string | null {
    return null;
  }

  private run(home: string, args: string[], input?: string) {
    return spawnSync(process.execPath, [this.cli, ...args], {
      input,
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: home,
      env: gateEnv(home, this.withDaemon ? this.daemonPort : undefined),
    });
  }

  async prepare(profile: Profile, env: Env, secrets: Set<string>): Promise<void> {
    const n9 = path.join(env.home, '.node9');
    fs.mkdirSync(n9, { recursive: true });

    const policy: Record<string, unknown> = {};
    if (profile.egress) {
      policy.egress = {
        enabled: true,
        mode: profile.egress.mode,
        allow: profile.egress.allow ?? [],
        deny: profile.egress.deny ?? [],
        allowPrivate: profile.egress.allowPrivate ?? true,
      };
    }
    if (profile.optIn?.includes('injection-scan')) policy.injectionScan = { enabled: true };
    if (profile.orgDomains?.length) policy.untrustedContent = { orgDomains: profile.orgDomains };
    // node9's own translation into its v2 file (keyed by check), so the bench
    // never maps node9's settings by hand; then the level and the profile's
    // "consult me before" categories as the checks node9 holds them with. A
    // profile that asks for nothing, at the shipped level, gets no config
    // file at all: the shipped default.
    const file: Record<string, unknown> = Object.keys(policy).length > 0 ? this.toV2({ policy }) : {};
    const checks: Record<string, string> = { ...((file.checks as Record<string, string> | undefined) ?? {}) };
    this.unexpressed = [];
    for (const category of profile.holdActions ?? []) {
      const check = HOLD_ACTION_CHECKS[category];
      if (check) checks[check] = 'review';
      else this.unexpressed.push(category);
    }
    if (Object.keys(checks).length > 0) file.checks = checks;
    if (this.mode) file.mode = this.mode;
    if (Object.keys(file).length > 0) {
      fs.writeFileSync(path.join(n9, 'config.json'), JSON.stringify({ version: '2', ...file }));
    }

    // User-declared paths go through `node9 jail add`, which appends to the
    // store ~/.node9/jail-paths.json and rebuilds the user-jail shield from
    // the whole store. A profile with many paths (jailed-agent lists 15)
    // pre-writes all but the last into that store in the CLI's own format and
    // runs the command once for the last one, so the shield is still built by
    // node9 from the complete list, in one process instead of fifteen.
    const userPaths = (profile.protectedPaths ?? []).filter((p) => p.scope === 'user');
    if (userPaths.length > 0) {
      if (userPaths.some((p) => p.verdict !== 'block')) throw new Error('node9-gate: user protected paths support verdict block only');
      const targets = userPaths.map((p) => materialize(p.path, env) as string);
      if (targets.length > 1) {
        const paths = targets.slice(0, -1).map((p) => ({ path: p, verdict: 'block' }));
        fs.writeFileSync(path.join(n9, 'jail-paths.json'), JSON.stringify({ paths }, null, 2) + '\n', { mode: 0o600 });
      }
      const r = this.run(env.home, ['jail', 'add', targets[targets.length - 1]]);
      if (r.error || r.status !== 0) throw new Error(`node9 jail add failed: ${r.error?.message ?? r.stderr}`);
    }
    for (const p of profile.protectedPaths ?? []) {
      const target = materialize(p.path, env) as string;
      if (p.scope === 'user') {
        continue;
      } else {
        // An org mandate reaches the device through the synced rules cache,
        // the same file node9's own gauntlet writes for its org-jail rows.
        fs.writeFileSync(
          path.join(n9, 'rules-cache.json'),
          JSON.stringify({ fetchedAt: '2026-07-01T00:00:00Z', rules: [], managedConfig: { jailPaths: [{ path: target, verdict: p.verdict }] } })
        );
      }
    }

    if (profile.canaries?.length) {
      // `node9 canary plant` generates its own random values; the benchmark
      // needs fixed ones, so it writes the registry record plant would write.
      const now = '2026-10-02T00:00:00.000Z';
      const records = profile.canaries.map((c) => {
        const value = materialize(c.value, env, secrets) as string;
        const file = materialize(c.path, env) as string;
        return {
          id: c.id,
          kind: 'aws-profile',
          field: c.field,
          path: file,
          value,
          valueHash: createHash('sha256').update(value).digest('hex'),
          plantedAt: now,
          label: 'backup',
          fileHash: '',
          createdDir: false,
        };
      });
      fs.writeFileSync(path.join(n9, 'canaries.json'), JSON.stringify({ records }), { mode: 0o600 });
    }

    // Last, so the daemon starts with the case's configuration in place.
    if (this.withDaemon) await this.startDaemon(env.home);
  }

  /**
   * The v2 file node9 itself writes for a legacy one: `node9 config migrate`
   * in a scratch HOME, once per distinct legacy file. Throws when node9 does
   * not produce a v2 file, so a translation never fails silently.
   */
  private toV2(legacy: Record<string, unknown>): Record<string, unknown> {
    const key = JSON.stringify(legacy);
    const cached = this.migrated.get(key);
    if (cached) return structuredClone(cached);
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'node9-migrate-'));
    try {
      fs.mkdirSync(path.join(home, '.node9'));
      fs.writeFileSync(path.join(home, '.node9', 'config.json'), key);
      const r = this.run(home, ['config', 'migrate']);
      if (r.error || r.status !== 0) throw new Error(`node9 config migrate failed: ${r.error?.message ?? r.stderr}`);
      const v2 = JSON.parse(fs.readFileSync(path.join(home, '.node9', 'config.json'), 'utf-8')) as Record<string, unknown>;
      if (String(v2.version) !== '2') throw new Error(`node9 config migrate did not write a v2 file: ${JSON.stringify(v2).slice(0, 200)}`);
      delete v2.version;
      this.migrated.set(key, v2);
      return structuredClone(v2);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    const post = record.stage === 'post';
    const body = post ? { ...payload, tool_response: materialize(record.output, env) } : payload;
    const debugLog = path.join(env.home, '.node9', 'hook-debug.log');
    const logStart = fs.existsSync(debugLog) ? fs.statSync(debugLog).size : 0;
    const t0 = performance.now();
    const r = this.run(env.home, [post ? 'log' : 'check'], JSON.stringify(body));
    const latencyMs = performance.now() - t0;
    let transient: string | undefined;
    try {
      if (fs.existsSync(debugLog)) transient = osvLookupFailure(fs.readFileSync(debugLog, 'utf-8').slice(logStart));
    } catch {
      /* no log, no signal */
    }

    if (r.error && (r.error as NodeJS.ErrnoException).code !== 'ETIMEDOUT') throw r.error;
    const held = r.signal !== null || r.status === null;
    const json = lastJson(r.stdout ?? '');
    const hso = (json?.hookSpecificOutput ?? {}) as Record<string, unknown>;
    const reason = String(hso.permissionDecisionReason ?? json?.reason ?? hso.additionalContext ?? '').slice(0, 240);

    let verdict: Verdict;
    if (held) verdict = 'review';
    else if (r.status === 2) verdict = 'block';
    else if (r.status !== 0) throw new Error(`node9 exited ${r.status}: ${(r.stderr ?? '').slice(0, 300)}`);
    else if (hso.permissionDecision === 'deny' || json?.decision === 'block') verdict = 'block';
    else if (hso.permissionDecision === 'ask') verdict = 'review';
    else if (post && typeof hso.additionalContext === 'string' && hso.additionalContext.length > 0) verdict = 'review';
    else verdict = 'allow';

    // A case about a category the user asked to hold that node9 has no check
    // for: measured at node9's default, and the result says so.
    const category = /^dangerous_action_(\w+)$/.exec(record.why)?.[1] as DangerCategory | undefined;
    const unexpressed = category && this.unexpressed.includes(category) ? `node9 has no setting for approving ${UNEXPRESSED[category]}; measured at its default` : '';
    const detail = [held ? 'held for a human (timeout)' : reason, unexpressed].filter((x) => x !== '').join('; ');
    return {
      verdict,
      latencyMs,
      detail: detail || undefined,
      ...(transient ? { transient } : {}),
    };
  }
}

