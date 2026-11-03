// node9's forecast path, as the dashboard's OWASP report will run it: one
// `node9 forecast-cases` process per case, judging the raw benchmark record
// through forecastDecision() in a HOME prepared exactly as node9-gate prepares
// it for the real hook. The adapter exists for one comparison: the fidelity
// gate of the report (node9Firewall#320). `npm run compare` between a
// node9-gate run and a node9-forecast run of the same build must show no
// regressed, fixed or tier case before the report shows a customer a number.
//
// Unreachable here: post-stage cases, which forecast-cases does not simulate
// (the PostToolUse path has no headless entry). Cases with prior calls are
// reachable: forecast-cases replays `prior` itself with session state. The
// runner still calls decide() once per prior call before the case; those
// answers are stateless and discarded, by the runner's contract.
//
// The package check runs online (`--online-packages`) against the same
// production endpoints gateEnv gives the hook, so package cases compare.
//
// Latency is the whole child process, start-up included; it measures nothing
// about the engine and is not comparable with node9-gate's.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import type { Env } from '../../src/template.ts';
import { Node9GateAdapter, gateEnv, resolveCli, type GateOptions } from '../node9-gate/index.ts';

const TIMEOUT_MS = 60_000;

/** The `case` line forecast-cases prints, the fields this adapter reads. */
export interface ForecastCaseLine {
  id: string;
  decision?: 'allow' | 'log' | 'review' | 'block';
  enforced?: boolean;
  checkId?: string;
  layer?: string;
  notEnforcedBecause?: string;
  notApplicable?: string;
  notSimulated?: string;
  error?: string;
}

/**
 * What the hook would have answered for this forecast: review or block only
 * when the gate enforces that decision; a `log` decision, an unenforced block
 * and a case the HOME's settings do not reach are an allow at the hook.
 */
export function verdictOf(line: ForecastCaseLine): { verdict: Verdict; detail: string } {
  if (line.error) throw new Error(`forecast-cases: ${line.error}`);
  if (line.notSimulated) return { verdict: 'allow', detail: `not-simulated: ${line.notSimulated}` };
  if (line.notApplicable) return { verdict: 'allow', detail: `not-applicable: ${line.notApplicable}` };
  const stopped = line.enforced === true && (line.decision === 'review' || line.decision === 'block');
  const detail = [line.decision, line.checkId, line.layer, line.notEnforcedBecause && `not enforced: ${line.notEnforcedBecause}`]
    .filter(Boolean)
    .join(' ')
    .slice(0, 240);
  return { verdict: stopped ? (line.decision as Verdict) : 'allow', detail };
}

export class Node9ForecastAdapter implements Adapter {
  readonly name = 'node9-forecast';
  readonly toolVersion: string;
  readonly method: string;
  private readonly cli: string;
  private readonly gate: Node9GateAdapter;
  private readonly scratch: string;

  constructor(opts: Pick<GateOptions, 'source' | 'proxyDir'>) {
    // The HOME comes from the gate adapter, no daemon: the forecast reads the
    // same files the hook would, and nothing else differs between the two.
    this.gate = new Node9GateAdapter({ ...opts, daemon: false });
    const { cli, version } = resolveCli(opts);
    this.cli = cli;
    this.toolVersion = version;
    this.scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-forecast-'));
    this.method = `node9 forecast-cases from ${opts.source === 'npm' ? `@node9/proxy@${version}` : cli}, one process per case, package check online, HOME prepared as node9-gate-nodaemon prepares it, NODE9_TESTING=1`;
  }

  unreachable(record: BenchRecord): string | null {
    if (record.stage === 'post') return 'forecast-cases does not simulate the PostToolUse path';
    return null;
  }

  async prepare(profile: Profile, env: Env, secrets: Set<string>): Promise<void> {
    await this.gate.prepare(profile, env, secrets);
  }

  async decide(record: BenchRecord, _payload: Record<string, unknown>, env: Env): Promise<Decision> {
    // The raw record, templates intact: forecast-cases materialises {{HOME}},
    // {{CWD}} and $join itself, against the same home and project directory.
    const file = path.join(this.scratch, 'case.jsonl');
    fs.writeFileSync(file, JSON.stringify(record) + '\n');
    const t0 = performance.now();
    const r = spawnSync(process.execPath, [this.cli, 'forecast-cases', '--online-packages', '--cwd', env.cwd, file], {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: env.home,
      env: gateEnv(env.home),
    });
    const latencyMs = performance.now() - t0;
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(`node9 forecast-cases exited ${r.status}: ${(r.stderr ?? '').slice(0, 300)}`);
    const line = (r.stdout ?? '')
      .split('\n')
      .filter((l) => l.startsWith('{'))
      .map((l) => JSON.parse(l) as { case?: ForecastCaseLine })
      .find((o) => o.case?.id === record.id)?.case;
    if (!line) throw new Error(`node9 forecast-cases printed no case line for ${record.id}: ${(r.stderr ?? '').slice(0, 300)}`);
    const { verdict, detail } = verdictOf(line);
    return { verdict, latencyMs, detail: detail || undefined };
  }

  async release(env: Env): Promise<void> {
    await this.gate.release?.();
    fs.rmSync(path.join(this.scratch, 'case.jsonl'), { force: true });
  }
}
