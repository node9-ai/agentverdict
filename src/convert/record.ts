// Shared record constructor for the converters: fills the derived fields so a
// converter states only what it knows about the case.

import path from 'node:path';
import type { Agent, BenchRecord, Channel, PriorCall, Stage, Template, Verdict } from '../types.ts';
import { ROOT } from '../corpus.ts';
import { createHash } from 'node:crypto';
import { isHoldout } from '../split.ts';

export interface CaseSpec {
  id: string;
  channel: Channel;
  agent?: Agent;
  tool: string;
  stage?: Stage;
  input: Template;
  output?: Template;
  prior?: PriorCall[];
  setup: string;
  expected: Verdict;
  why: string;
  family: string;
  group: string;
  variant_of?: string;
  source: string;
  source_ref: string;
  license: string;
  volatile?: true;
  /** Facts the scope rules read (src/scope/), written from the source's own metadata. */
  tags?: string[];
  note?: string;
}

/**
 * A stable slot for a row among n choices: a SHA-256 of the row's own key,
 * never its position in a list. Converters use it where cases are spread
 * over carriers or command forms, so removing a row from a snapshot leaves
 * every other row's case as it was.
 */
export function slot(key: string, n: number): number {
  return createHash('sha256').update(key).digest().readUInt32BE(0) % n;
}

export function mk(spec: CaseSpec): BenchRecord {
  const r: BenchRecord = {
    id: spec.id,
    channel: spec.channel,
    agent: spec.agent ?? 'claude-code',
    tool: spec.tool,
    stage: spec.stage ?? 'pre',
    input: spec.input,
    setup: spec.setup,
    expected: spec.expected,
    why: spec.why,
    family: spec.family,
    group: spec.group,
    source: spec.source,
    source_ref: spec.source_ref,
    license: spec.license,
    private: isHoldout(spec.group),
    // The set is decided for every record at once, after deduplication
    // (src/scope/rules.ts, applyScope); a converter never chooses it. The two
    // optional fields are declared here so they keep this place in the
    // written record (JSON drops them while undefined).
    set: 'official',
    section: undefined,
    extended_reason: undefined,
    owasp: '',
  };
  if (spec.output !== undefined) r.output = spec.output;
  if (spec.prior !== undefined) r.prior = spec.prior;
  if (spec.variant_of !== undefined) r.variant_of = spec.variant_of;
  if (spec.volatile) r.volatile = true;
  if (spec.tags !== undefined && spec.tags.length > 0) r.tags = spec.tags;
  if (spec.note !== undefined) r.note = spec.note;
  return r;
}

/** Stable kebab id fragment from free text. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

// node9's own fixtures, read from the pinned snapshot in sources/node9/
// (npm run sources:node9), never from a live checkout.
export const PROXY = path.join(ROOT, 'sources', 'node9', 'node9-proxy');
export const DOC = path.join(ROOT, 'sources', 'node9', 'docs');
export const PROXY_LICENSE = 'Apache-2.0';
