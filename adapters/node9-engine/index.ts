// node9 at library level: evaluatePolicy() from @node9/policy-engine, in
// process, with the config node9-proxy's getConfig() builds for the case's
// profile (see snapshot.ts). The engine is pure, so the runner materialises
// cases against the snapshot's fixed home and creates no files.
//
// This adapter answers a narrower question than node9-gate: what the
// published policy library decides on its own. It is the right tool for
// in-process latency and for quickly measuring an engine change; it is not
// the product verdict. Checks that live in the proxy's orchestrator and not
// in evaluatePolicy (the PII gate, the canary gate, the file-tool jail guard,
// response scanning) are not reproduced here, on purpose: reproducing them
// would be a second copy of node9 that drifts. Cases that only those checks
// can decide simply score as misses for this adapter, and the gap between
// the two adapters' numbers is itself a finding.
//
// Unreachable here: post-stage cases (evaluatePolicy has no tool-output
// entry point) and cases with prior calls (the library is stateless).
// No host hooks are passed, so provenance and trusted-host tiers are skipped,
// as the engine's README documents for hosts that do not supply them.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile } from '../../src/types.ts';
import { ROOT, packageDir } from '../../src/corpus.ts';
import type { Env } from '../../src/template.ts';
import { buildSnapshots, checkoutInfo, type SnapshotMeta } from './snapshot.ts';

type Engine = {
  evaluatePolicy: (config: unknown, tool: string, args: unknown, ctx?: unknown, hooks?: unknown) => Promise<{ decision: 'allow' | 'review' | 'block'; reason?: string; ruleName?: string }>;
};

interface Snapshot {
  config: unknown;
  activeEnvironment?: unknown;
}

export class Node9EngineAdapter implements Adapter {
  readonly name = 'node9-engine';
  private current: Snapshot | null = null;
  private warmed = false;

  readonly fixedHome: string;

  private constructor(
    private readonly engine: Engine,
    readonly toolVersion: string,
    readonly method: string,
    private readonly configDir: string
  ) {
    const meta = JSON.parse(fs.readFileSync(path.join(configDir, '_meta.json'), 'utf-8')) as SnapshotMeta;
    this.fixedHome = meta.home;
  }

  static async create(opts: { source: 'npm' | 'local'; proxyDir?: string }): Promise<Node9EngineAdapter> {
    const proxyDir = opts.proxyDir ?? process.env.NODE9_PROXY_DIR ?? '/home/nadav/node9/node9-proxy';
    if (opts.source === 'npm') {
      const version = JSON.parse(fs.readFileSync(path.join(packageDir('@node9/policy-engine'), 'package.json'), 'utf-8')).version as string;
      const configDir = path.join(ROOT, 'configs', version);
      if (!fs.existsSync(path.join(configDir, '_meta.json'))) {
        throw new Error(`no config snapshots for ${version}: run npm run snapshot with the node9-proxy checkout at ${version}`);
      }
      const engine = (await import('@node9/policy-engine')) as unknown as Engine;
      return new Node9EngineAdapter(engine, version, `evaluatePolicy from @node9/policy-engine@${version}, in process, config snapshots configs/${version}`, configDir);
    }
    const dist = path.join(proxyDir, 'packages', 'policy-engine', 'dist', 'index.mjs');
    if (!fs.existsSync(dist)) throw new Error(`${dist} not found: build the checkout first`);
    const info = checkoutInfo(proxyDir);
    const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'node9-bench-configs-'));
    await buildSnapshots({ source: 'local', proxyDir, outDir: configDir });
    const engine = (await import(dist)) as Engine;
    const sha = info.commit.slice(0, 7) + (info.commit.endsWith('-dirty') ? '-dirty' : '');
    return new Node9EngineAdapter(engine, `${info.version}+${sha}`, `evaluatePolicy from ${dist}, in process, fresh config snapshots`, configDir);
  }

  unreachable(record: BenchRecord): string | null {
    if (record.stage === 'post') return 'evaluatePolicy has no tool-output entry point';
    if (record.prior?.length) return 'evaluatePolicy is stateless; prior calls cannot be replayed';
    return null;
  }

  async prepare(profile: Profile): Promise<void> {
    this.current = JSON.parse(fs.readFileSync(path.join(this.configDir, `${profile.name}.json`), 'utf-8')) as Snapshot;
    if (!this.warmed) {
      // One untimed pass so the first measured case does not pay for JIT and
      // the mvdan-sh parser's initialisation.
      for (let i = 0; i < 20; i++) await this.engine.evaluatePolicy(this.current.config, 'Bash', { command: `ls -la /tmp/${i}` }, {});
      this.warmed = true;
    }
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    if (!this.current) throw new Error('prepare() was not called');
    const tool = String(payload.tool_name);
    const args = payload.tool_input;
    const ctx = { agent: 'Claude Code', cwd: typeof payload.cwd === 'string' ? payload.cwd : env.cwd, activeEnvironment: this.current.activeEnvironment };
    const t0 = performance.now();
    const v = await this.engine.evaluatePolicy(this.current.config, tool, args, ctx, {});
    const latencyMs = performance.now() - t0;
    return { verdict: v.decision, latencyMs, detail: [v.ruleName, v.reason].filter(Boolean).join(': ').slice(0, 240) || undefined };
  }
}
