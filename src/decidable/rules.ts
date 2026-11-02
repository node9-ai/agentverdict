// The predicates behind src/decidable/taxonomy.ts. Each reads the case and
// the source's own metadata in sources/; none reads a tool's result.
// annotate() gives every outside-labelled case exactly one annotation: the
// reason of highest precedence that applies, or decidable.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { reveal } from '../hygiene.ts';
import { labelsOf } from '../suites.ts';
import type { BenchRecord, Joined } from '../types.ts';
import { READ_FAMILIES, redcodeTarget } from './redcode-paths.ts';
import { PRECEDENCE, REASONS, type Annotation, type ReasonCode } from './taxonomy.ts';

const readJson = <T>(...p: string[]): T => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf-8')) as T;

/** CredData's own directory categories (word_in_path.json) that name test or example material. */
export const TEST_OR_EXAMPLE_DIRS = new Set(['test', 'mock', 'example', 'sample', 'fixture', 'spec', 'template']);
export const TEST_OR_EXAMPLE_EXTENSIONS = new Set(['.example', '.sample', '.dist', '.template']);

interface CredLine {
  id: number | string;
  path: string;
  content: string | Joined;
}

export interface Context {
  /** CredData T lines by id. */
  credLines: Map<string, CredLine>;
  /** CredData value positions by id (null: CredData records none). */
  spans: Map<string, { start: number; end: number } | null>;
  /** Reference system access by "kind:path". */
  readable: Map<string, string>;
}

export function loadContext(): Context {
  const snap = readJson<{ block: Array<CredLine & { value_span?: { start: number; end: number } | null }> }>('sources', 'creddata', 'snapshot.json');
  const spans = readJson<{ spans: Record<string, { start: number; end: number } | null> }>('sources', 'creddata', 'value-spans.json');
  const ref = readJson<{ paths: Record<string, string> }>('sources', 'reference-system', 'readable.json');
  // A held-out line drawn since 7.0.0 carries its span itself (value-spans.json
  // is public and names public lines only).
  const all = new Map<string, { start: number; end: number } | null>(Object.entries(spans.spans));
  for (const b of snap.block) if (b.value_span !== undefined) all.set(String(b.id), b.value_span);
  return {
    credLines: new Map(snap.block.map((b) => [String(b.id), b])),
    spans: all,
    readable: new Map(Object.entries(ref.paths)),
  };
}

/** The CredData meta Id a case was built from. */
export function credId(r: BenchRecord): string | null {
  return /\bId (\d+)\b/.exec(r.source_ref)?.[1] ?? null;
}

function credValue(r: BenchRecord, ctx: Context): string | null {
  const id = credId(r);
  const line = id ? ctx.credLines.get(id) : undefined;
  const span = id ? ctx.spans.get(id) : undefined;
  if (!line || !span) return null;
  return reveal(line.content).slice(span.start, span.end);
}

function credPath(r: BenchRecord, ctx: Context): string | null {
  const id = credId(r);
  return id ? (ctx.credLines.get(id)?.path ?? null) : null;
}

/** Every reason whose predicate holds for the case. */
export function reasonsFor(r: BenchRecord, ctx: Context, sourceFacts: SourceFacts): ReasonCode[] {
  const out: ReasonCode[] = [];
  const attack = r.expected !== 'allow';

  if (r.source === 'creddata' && attack) {
    const value = credValue(r, ctx);
    if (value !== null && /^[A-Za-z]+$/.test(value)) out.push('obfuscated-to-random-letters');
    const p = credPath(r, ctx);
    if (p !== null) {
      const dir = p.includes('/') ? p.split('/')[0] : '';
      if (TEST_OR_EXAMPLE_DIRS.has(dir) || TEST_OR_EXAMPLE_EXTENSIONS.has(path.posix.extname(p))) out.push('test-or-example-location');
    }
  }

  if (r.source === 'pii-trace') out.push('context-only-value');

  if (r.source === 'agentdojo-calls' && sourceFacts.agentdojoToolsBothLabels.has(r.tool)) out.push('requester-not-in-call');

  if (r.source === 'redcode-exec' && attack && READ_FAMILIES.has(r.family)) {
    const input = r.input as { tool_input?: { command?: string | Joined } };
    const cmd = input.tool_input?.command;
    const t = cmd === undefined ? null : redcodeTarget(r.family, reveal(cmd));
    if (t && ctx.readable.get(`${t.kind}:${t.path}`) === 'readable') out.push('world-readable-read');
  }
  return out;
}

/**
 * Facts about a whole source that a rule needs. Computed on the public split
 * only: the holdout is never read to write or tune a rule; the rule is then
 * applied to both splits.
 */
export interface SourceFacts {
  agentdojoToolsBothLabels: Set<string>;
}

export function sourceFacts(records: BenchRecord[]): SourceFacts {
  const labels = new Map<string, Set<string>>();
  for (const r of records) {
    if (r.source !== 'agentdojo-calls' || r.private) continue;
    const s = labels.get(r.tool) ?? new Set<string>();
    s.add(r.expected === 'allow' ? 'allow' : 'stop');
    labels.set(r.tool, s);
  }
  return { agentdojoToolsBothLabels: new Set([...labels].filter(([, s]) => s.size > 1).map(([t]) => t)) };
}

/** One annotation per outside-labelled case, keyed by id. */
export function annotate(records: BenchRecord[], ctx: Context = loadContext()): Map<string, Annotation> {
  const facts = sourceFacts(records);
  const out = new Map<string, Annotation>();
  for (const r of records) {
    if (labelsOf(r.source) !== 'outside') continue;
    const reasons = reasonsFor(r, ctx, facts);
    const top = PRECEDENCE.map((fit) => reasons.find((code) => REASONS[code].fit === fit)).find((c) => c !== undefined);
    out.set(r.id, top ? { gate_fit: REASONS[top].fit, gate_fit_reason: top } : { gate_fit: 'decidable' });
  }
  return out;
}
