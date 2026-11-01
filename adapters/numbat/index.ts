// numbat (Perplexity) at its Claude Code PreToolUse callback:
// `numbat hook PreToolUse --agent claude`, payload on stdin.
//
// Two modes, because numbat ships detection-only:
//   numbat          as installed by default: monitor mode, the shipped rule
//                   catalog. It never blocks; its findings are recorded in
//                   the case detail so detection can be read apart from
//                   enforcement.
//   numbat-enforce  every shipped rule copied into an operator rules
//                   directory with `enforce: true` and its version bumped,
//                   then `--enforce`: numbat's documented way to turn its own
//                   detections into denies. Blocking is limited by numbat's
//                   design to a static subset of shell syntax; a match outside
//                   it stays a finding.
//
// Verdicts: a native deny (permissionDecision "deny") is block, anything else
// allow. A numbat error suppresses its deny by design; a diagnostic record of
// that kind is a measurement error here, never a silent allow.
// Unreachable: tool output (numbat enforces on pre-action callbacks only).
// Profiles have no equivalent without writing new numbat rules, which would
// be this benchmark authoring the competitor's policy; such cases say so.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import type { Adapter, Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import type { Env } from '../../src/template.ts';
import { ROOT } from '../../src/corpus.ts';

const TIMEOUT_MS = 15_000;
const DEFAULT_VERSION = '0.3.0';

function bumpVersion(v: string): string {
  const parts = String(v).split('.');
  const last = Number(parts[parts.length - 1]);
  parts[parts.length - 1] = String(Number.isInteger(last) ? last + 1 : 1);
  return parts.join('.');
}

/** Every shipped rule with `enforce: true` and a bumped version, under `dir`. */
function writeEnforceCatalog(shipped: string, dir: string): number {
  fs.rmSync(dir, { recursive: true, force: true });
  let n = 0;
  for (const group of fs.readdirSync(shipped)) {
    const src = path.join(shipped, group);
    if (!fs.statSync(src).isDirectory()) continue;
    fs.mkdirSync(path.join(dir, group), { recursive: true });
    for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.yaml'))) {
      const rule = parse(fs.readFileSync(path.join(src, f), 'utf-8')) as Record<string, unknown>;
      rule.enforce = true;
      rule.version = bumpVersion(String(rule.version));
      fs.writeFileSync(path.join(dir, group, f), stringify(rule, { lineWidth: 0 }));
      n++;
    }
  }
  return n;
}

export class NumbatAdapter implements Adapter {
  readonly name: string;
  readonly toolVersion: string;
  readonly method: string;
  private readonly bin: string;
  private readonly rulesDir: string | null;
  private approx: string[] = [];

  constructor(mode: 'monitor' | 'enforce', bin?: string) {
    const base = path.join(ROOT, 'external', 'numbat', DEFAULT_VERSION);
    this.bin = bin ?? process.env.NUMBAT_BIN ?? path.join(base, 'numbat');
    if (!fs.existsSync(this.bin)) throw new Error(`${this.bin} not found: download the numbat release into external/numbat/<version>/`);
    const v = spawnSync(this.bin, ['version'], { encoding: 'utf-8', env: { PATH: '/usr/bin:/bin', HOME: os.tmpdir() } });
    const m = /numbat (\S+)/.exec(v.stdout ?? '');
    if (!m) throw new Error(`cannot read the numbat version: ${(v.stderr ?? '').slice(0, 200)}`);
    this.toolVersion = m[1];
    this.name = mode === 'enforce' ? 'numbat-enforce' : 'numbat';
    if (mode === 'enforce') {
      this.rulesDir = path.join(path.dirname(this.bin), 'bench-enforce-rules');
      const n = writeEnforceCatalog(path.join(path.dirname(this.bin), 'rules'), this.rulesDir);
      const check = spawnSync(this.bin, ['rules', 'check', '--rules-dir', this.rulesDir], { encoding: 'utf-8', env: { PATH: '/usr/bin:/bin', HOME: os.tmpdir() } });
      if (check.status !== 0) throw new Error(`numbat rules check refused the enforce catalog: ${(check.stderr || check.stdout || '').slice(0, 400)}`);
      this.method = `numbat ${this.toolVersion} hook PreToolUse --agent claude --enforce, all ${n} shipped rules set to enforce, fresh HOME per case`;
    } else {
      this.rulesDir = null;
      this.method = `numbat ${this.toolVersion} hook PreToolUse --agent claude, shipped catalog in its default monitor mode, fresh HOME per case`;
    }
  }

  unreachable(record: BenchRecord): string | null {
    if (record.stage === 'post') return 'numbat enforces on pre-action callbacks only';
    return null;
  }

  async prepare(profile: Profile): Promise<void> {
    const approx: string[] = [];
    if (profile.protectedPaths?.length) approx.push('protected paths need a new numbat rule; not authored by the benchmark');
    if (profile.egress) approx.push('destination policy needs a new numbat rule; not authored by the benchmark');
    if (profile.canaries?.length) approx.push('planted decoys need a new numbat rule; not authored by the benchmark');
    this.approx = approx;
  }

  async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    // Records go to a file: with stdout as the sink, enforce mode reports
    // "no decision returned" on stderr and suppresses its own deny.
    const records = path.join(env.home, 'numbat-records.ndjson');
    const args = ['hook', 'PreToolUse', '--agent', 'claude', '--emit', 'all', '--output', 'file', '--output-file', records, '--state-db', path.join(env.home, 'numbat-state.db')];
    if (this.rulesDir) args.push('--rules-dir', this.rulesDir, '--enforce');
    const t0 = performance.now();
    const r = spawnSync(this.bin, args, {
      input: JSON.stringify(payload),
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      cwd: env.cwd,
      env: { HOME: env.home, PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR: os.tmpdir() },
    });
    const latencyMs = performance.now() - t0;
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(`numbat exited ${r.status}: ${(r.stderr ?? '').slice(0, 300)}`);

    // numbat writes its diagnostic records to stderr. An `error` one means it
    // could not do its job (a measurement error); a `warn` one is part of its
    // answer (for example "dynamic command executable": a command it does not
    // analyse) and goes into the detail.
    const warnings: string[] = [];
    for (const line of (r.stderr ?? '').split('\n').filter((l) => l.trim())) {
      let d: Record<string, any>;
      try {
        d = JSON.parse(line);
      } catch {
        throw new Error(`numbat reported: ${line.slice(0, 200)}`);
      }
      if (d.level !== 'warn' && d.level !== 'info') throw new Error(`numbat ${d.level ?? 'diagnostic'}: ${String(d.message ?? '').slice(0, 200)}`);
      if (d.level === 'warn') warnings.push(String(d.message ?? '').replace(/^.*?: (?=[a-z ]+analysis)/, '').slice(0, 120));
    }
    let response: Record<string, any> = {};
    try {
      response = JSON.parse((r.stdout ?? '').trim() || '{}');
    } catch {
      throw new Error(`numbat gave no JSON response: ${(r.stdout ?? '').slice(0, 200)}`);
    }
    const findings: string[] = [];
    let enforcement = '';
    const lines = fs.existsSync(records) ? fs.readFileSync(records, 'utf-8').split('\n').filter((l) => l.trim()) : [];
    for (const line of lines) {
      const j = JSON.parse(line) as Record<string, any>;
      if (j.record_type === 'finding') findings.push(String(j.rule_id));
      else if (j.record_type === 'enforcement') enforcement = `${j.decision}${j.reason ? ` (${j.reason})` : ''}`;
      else if (j.record_type === 'diagnostic' && /error|fatal/i.test(String(j.level ?? j.severity ?? ''))) {
        throw new Error(`numbat diagnostic: ${String(j.message ?? j.code ?? '').slice(0, 200)}`);
      }
    }
    const denied = response?.hookSpecificOutput?.permissionDecision === 'deny';
    const verdict: Verdict = denied ? 'block' : 'allow';
    const notes = [
      findings.length ? `findings: ${[...new Set(findings)].join(', ')}` : '',
      enforcement && !denied ? `enforcement: ${enforcement}` : '',
      ...warnings.map((w) => `[numbat warning: ${w}]`),
      ...this.approx.map((a) => `[setting approximated: ${a}]`),
    ].filter(Boolean);
    return { verdict, latencyMs, detail: notes.length ? notes.join(' ') : undefined };
  }
}
