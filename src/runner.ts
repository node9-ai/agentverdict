// The replay loop, shared by the CLI (run.ts), the release check and the
// tests. Cases run one at a time (one tool process at a time, by design: the
// machine this runs on is memory-bound). Each case gets a fresh temporary home
// that is populated from its profile and deleted afterwards, except for a pure
// adapter (one that sets fixedHome), which gets that home and no files at all.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, corpusHash, corpusVersionLabel, loadCorpus, publicCorpusHash, writeJsonl } from './corpus.ts';
import { materialize, scrub, type Env } from './template.ts';
import { summarize, summarizeComparison, summarizeHeadline, summarizeSuites, toMarkdown, type Summary } from './score.ts';
import type { Adapter } from './adapter.ts';
import type { BenchRecord, CaseResult, Profile } from './types.ts';
import { Node9GateAdapter, type Node9Mode } from '../adapters/node9-gate/index.ts';
import { Node9EngineAdapter } from '../adapters/node9-engine/index.ts';
import { CalibrationAdapter } from '../adapters/calibration/index.ts';
import { PipelockHookAdapter } from '../adapters/pipelock-hook/index.ts';
import { PipelockAdapter } from '../adapters/pipelock-mcp/index.ts';
import { HolGuardNativeAdapter } from '../adapters/hol-guard-native/index.ts';
import { NumbatAdapter } from '../adapters/numbat/index.ts';
import { GenericHookAdapter, type HookOptions } from '../adapters/generic-hook/index.ts';
import { labelsOf, suiteOf } from './suites.ts';

export const ADAPTERS = ['node9-gate', 'node9-engine', 'pipelock-hook', 'pipelock', 'hol-guard-native', 'numbat', 'numbat-enforce', 'calibration-allow', 'calibration-block', 'hook'] as const;

export async function makeAdapter(
  name: string,
  source: 'npm' | 'local',
  proxyDir?: string,
  daemon?: boolean,
  recommended = false,
  hook?: HookOptions,
  mode?: Node9Mode
): Promise<Adapter> {
  if (name === 'hook') {
    if (!hook) throw new Error('adapter hook needs --hook-name and --hook-cmd');
    return new GenericHookAdapter(hook);
  }
  if (name === 'node9-gate') return new Node9GateAdapter({ source, proxyDir, daemon, recommended, mode });
  if (name === 'node9-engine') return Node9EngineAdapter.create({ source, proxyDir });
  if (name === 'pipelock-hook') return new PipelockHookAdapter();
  if (name === 'pipelock') return new PipelockAdapter();
  if (name === 'hol-guard-native') return new HolGuardNativeAdapter();
  if (name === 'numbat') return new NumbatAdapter('monitor');
  if (name === 'numbat-enforce') return new NumbatAdapter('enforce');
  if (name === 'calibration-allow') return new CalibrationAdapter('allow');
  if (name === 'calibration-block') return new CalibrationAdapter('block');
  throw new Error(`unknown adapter ${name}; one of ${ADAPTERS.join(', ')}`);
}

export async function runCases(
  adapter: Adapter,
  records: BenchRecord[],
  profiles: Map<string, Profile>,
  onProgress?: (done: number, total: number) => void,
  shouldStop?: () => boolean
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const [i, r] of records.entries()) {
    if (shouldStop?.()) break;
    const base = {
      id: r.id,
      adapter: adapter.name,
      tool_version: adapter.toolVersion,
      channel: r.channel,
      expected: r.expected,
      private: r.private,
      suite: suiteOf(r.source),
      labels: labelsOf(r.source),
      set: r.set,
      ...(r.section ? { section: r.section } : {}),
      ...(r.extended_reason ? { extended_reason: r.extended_reason } : {}),
      owasp: r.owasp,
    };
    const why = adapter.unreachable(r);
    if (why !== null) {
      results.push({ ...base, actual: 'unreachable', latency_ms: null, detail: why });
      continue;
    }
    const pure = adapter.fixedHome !== undefined;
    const home = pure ? adapter.fixedHome! : fs.mkdtempSync(path.join(os.tmpdir(), 'node9-bench-'));
    const env: Env = { home, cwd: path.join(home, 'project') };
    const secrets = new Set<string>();
    try {
      const profile = profiles.get(r.setup);
      if (!profile) throw new Error(`unknown profile ${r.setup}`);
      if (!pure) fs.mkdirSync(env.cwd, { recursive: true });
      for (const f of pure ? [] : (profile.files ?? [])) {
        const file = materialize(f.path, env) as string;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, materialize(f.content, env, secrets) as string);
      }
      await adapter.prepare(profile, env, secrets);
      for (const p of r.prior ?? []) {
        // The prior is its own call: its tool name comes from its payload, not from the case's call.
        const priorTool = (p.input as { tool_name?: string }).tool_name ?? r.tool;
        const priorRecord = { ...r, tool: priorTool, stage: p.stage, input: p.input, output: p.output, prior: undefined };
        await adapter.decide(priorRecord, materialize(p.input, env, secrets) as Record<string, unknown>, env);
      }
      const payload = materialize(r.input, env, secrets) as Record<string, unknown>;
      materialize(r.output, env, secrets);
      const d = await adapter.decide(r, payload, env);
      results.push({
        ...base,
        actual: d.verdict,
        latency_ms: Math.round(d.latencyMs * 1000) / 1000,
        detail: d.detail === undefined ? undefined : scrub(d.detail.split(home).join('{{HOME}}'), secrets),
        ...(d.transient ? { transient: scrub(d.transient.split(home).join('{{HOME}}'), secrets) } : {}),
      });
    } catch (e) {
      results.push({ ...base, actual: 'error', latency_ms: null, detail: scrub(String((e as Error).message).slice(0, 300), secrets) });
    } finally {
      await adapter.release?.(env);
      if (!pure) fs.rmSync(home, { recursive: true, force: true });
    }
    onProgress?.(i + 1, records.length);
  }
  return results;
}

/**
 * A result the host may have caused: an error, a call cut off by the time
 * limit, or a verdict the tool says rests on a lookup that failed (a network
 * timeout during a long run). Retried once, whatever the case's label, so a
 * retry can move a verdict either way.
 */
export function isTransient(r: CaseResult): boolean {
  return r.actual === 'error' || r.detail === 'held for a human (timeout)' || r.transient !== undefined;
}

/**
 * Run once more every case the host may have failed, and keep the second
 * answer. On a loaded machine a tool process can take longer than an
 * adapter's time limit to start; a second failure is scored as it is.
 */
export async function retryTransient(
  adapter: Adapter,
  results: CaseResult[],
  records: BenchRecord[],
  profiles: Map<string, Profile>,
  shouldStop?: () => boolean
): Promise<{ count: number; recovered: number }> {
  const ids = new Set(results.filter(isTransient).map((r) => r.id));
  if (ids.size === 0) return { count: 0, recovered: 0 };
  const again = await runCases(adapter, records.filter((r) => ids.has(r.id)), profiles, undefined, shouldStop);
  const byId = new Map(again.map((r) => [r.id, r]));
  for (const [i, r] of results.entries()) if (byId.has(r.id)) results[i] = byId.get(r.id)!;
  const still = results.filter((r) => ids.has(r.id) && isTransient(r)).length;
  return { count: ids.size, recovered: ids.size - still };
}

/**
 * The registry state a run depends on: how many cases are volatile (their
 * verdict comes from live registries and advisory databases at run time)
 * and when each package snapshot was fetched, so a reader can place the
 * run's package verdicts against the data they rest on. The run's own date
 * is measured_at.
 */
export function registryState(records: BenchRecord[]): Summary['registries'] {
  const snapshots: Record<string, string> = {};
  const files: Array<[string, string]> = [
    ['osv-malicious-packages', path.join('sources', 'packages.json')],
    ['osv-other-ecosystems', path.join('sources', 'osv-other-ecosystems', 'snapshot.json')],
    ['datadog-packages', path.join('sources', 'datadog-packages', 'snapshot.json')],
    ['typomind', path.join('sources', 'typomind', 'snapshot.json')],
    ['node9-bench-package-list-more', path.join('sources', 'packages-benign-more', 'snapshot.json')],
    ['popular-packages', path.join('sources', 'popular-packages', 'snapshot.json')],
  ];
  for (const [source, file] of files) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const fetched = (JSON.parse(fs.readFileSync(full, 'utf-8')) as { fetched_at?: string }).fetched_at;
    if (fetched) snapshots[source] = fetched;
  }
  return { volatile_cases: records.filter((r) => r.volatile).length, snapshots_fetched_at: snapshots };
}

export function buildSummary(adapter: Adapter, results: CaseResult[], retried?: { count: number; recovered: number }, records: BenchRecord[] = loadCorpus()): Summary {
  return {
    adapter: adapter.name,
    tool_version: adapter.toolVersion,
    method: adapter.method,
    corpus_version: corpusVersionLabel(),
    corpus_sha256: corpusHash(),
    corpus_public_sha256: publicCorpusHash(),
    measured_at: new Date().toISOString(),
    host: { node: process.version, platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model ?? 'unknown' },
    channels: summarize(results),
    suites: summarizeSuites(results),
    comparison: summarizeComparison(results),
    headline: summarizeHeadline(results),
    registries: registryState(records),
    ...(retried && retried.count > 0 ? { retried } : {}),
  };
}

/** One directory per tool version and corpus version, so a new corpus never overwrites what it is compared against. */
export function resultsDir(summary: Summary, partial: boolean): string {
  return path.join(ROOT, 'results', summary.adapter, partial ? 'partial' : path.join(summary.tool_version, `corpus-${summary.corpus_version}`));
}

export function writeResults(dir: string, results: CaseResult[], summary: Summary): void {
  writeJsonl(path.join(dir, 'cases.jsonl'), results);
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'summary.md'), toMarkdown(summary) + '\n');
}
