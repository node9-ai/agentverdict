// Which set each case belongs to: one predicate per decision, applied in
// convert so a clean rebuild reproduces the sets, and recomputed by validate
// so a hand edit fails. Each predicate reads the record alone: its source,
// its label and the tags its converter wrote from the source's own metadata
// (src/scope/pii-types.ts). No rule reads a tool's result.
//
// Order: the exclusions, in the order below, then official. An official case
// is in the headline section when its labels come from an outside source and
// in the vendor section otherwise (LABELS in src/suites.ts).

import { labelsOf } from '../suites.ts';
import type { BenchRecord, Section, SetName } from '../types.ts';
import { PII_HIGH_TAGS, TAG, type PiiClass } from './pii-types.ts';
import type { ExtendedReason } from './reasons.ts';
import { owaspOf } from './owasp.ts';

export type Scope = { set: 'official'; section: Section } | { set: 'extended'; extended_reason: ExtendedReason };

/** The whole source is out: the label depends on context the call does not carry. */
const CONTEXT_ONLY_SOURCES = new Set(['pii-trace']);
/** The whole source is text with no action after it. */
const TEXT_ONLY_SOURCES = new Set(['agentdojo', 'injecagent', 'browsesafe', 'notinject']);
/** The whole source is an action with no record of what came before it. */
const ACTION_WITHOUT_CONTEXT_SOURCES = new Set(['agentdojo-calls']);
/**
 * Single cases whose harm depends on what the user asked, which the call does
 * not say (design 6.1.0, section 3, fixed before measuring): a customer query
 * out of scope only for the task the agent was given, a merge of a pull
 * request the call does not show, forty GPU machines, a repository made
 * public, data sent to a "telemetry" server whose approval no field states.
 */
/**
 * Cases whose only credential is a published documentation example or a
 * declared fake, and nothing else in them carries the harm (reason
 * `documentation-example-credential`, src/scope/reasons.ts). Found by a search
 * of every stop-labelled case for the values in DOCUMENTATION_EXAMPLE_VALUES,
 * then read by hand: cases that also read a credential file or name a
 * credential path stay official (asb.v4-chain-001, aeb.mcp-chain-dns-exfil-009).
 * test/scope-doc-example.test.ts fails on a stop-labelled case carrying such
 * a value that is in neither list, so a new one is classified on purpose.
 */
export const DOCUMENTATION_EXAMPLE_CASES = new Set([
  'aeb.url-dlp-aws-key-001',
  'aeb.url-dlp-userinfo-cred-012',
  'aeb.mcp-input-dlp-001',
  'aeb.mcp-input-env-leak-003',
  'aeb.mcp-input-nested-deep-011',
  'asb.v4-webhook-002',
  'asb.v4-paste-004',
  'asb.v4-attackerapi-001',
  'asb.v4-message-001',
  'asb.v4-chain-005',
]);

/** Stop-labelled cases that carry a documentation example value but stay official: another part of the case carries the harm. */
export const DOCUMENTATION_EXAMPLE_KEPT = new Set(['asb.v4-chain-001', 'aeb.mcp-chain-dns-exfil-009']);

/** The documentation example values the search looks for: AWS's documented example key pair and its variants. */
export const DOCUMENTATION_EXAMPLE_VALUES = /AKIAIOSFODNN7EXAMPLE|wJalrXUtnFEMI[A-Za-z0-9/+]*EXAMPLEKEY/;

export const ACTION_WITHOUT_CONTEXT_CASES = new Set([
  'asb.v4-dbquery-001',
  'asb.v4-vcs-005',
  'asb.v4-purchase-003',
  'asb.v4-setting-001',
  'asb.v4-attackerapi-003',
]);
/** CredData categories out of the official set, for T and F lines alike. */
export const CREDDATA_OUT = new Set(['Password', 'UUID', 'Salt', 'Nonce', 'Firebase Domain']);

/** The `<ns>:` values of a record's tags. */
export function tagValues(r: BenchRecord, ns: string): string[] {
  return (r.tags ?? []).filter((t) => t.startsWith(`${ns}:`)).map((t) => t.slice(ns.length + 1));
}

function piiReason(r: BenchRecord): ExtendedReason | null {
  const classes = PII_HIGH_TAGS[r.source];
  if (!classes || r.expected === 'allow') return null;
  const tags = tagValues(r, 'pii');
  if (tags.length === 0) return null;
  const present = new Set<PiiClass>();
  for (const t of tags) {
    const c = classes[t];
    if (!c) throw new Error(`scope: ${r.id} carries unclassified high tag ${t} (src/scope/pii-types.ts)`);
    present.add(c);
  }
  const cardValid = (r.tags ?? []).includes(TAG.cardValid);
  if (present.has('kept') || (present.has('card') && cardValid)) return null;
  // Nothing kept. The reason, in order of precedence when more than one applies.
  if (present.has('card')) return 'invented-card';
  if (present.has('no-checksum')) return 'pii-no-checksum';
  if (present.has('biometric')) return 'pii-biometric';
  return null;
}

export function scopeOf(r: BenchRecord): Scope {
  if (CONTEXT_ONLY_SOURCES.has(r.source)) return { set: 'extended', extended_reason: 'context-only' };
  if (TEXT_ONLY_SOURCES.has(r.source)) return { set: 'extended', extended_reason: 'text-only' };
  if (ACTION_WITHOUT_CONTEXT_SOURCES.has(r.source) || ACTION_WITHOUT_CONTEXT_CASES.has(r.id)) return { set: 'extended', extended_reason: 'action-without-context' };
  if (DOCUMENTATION_EXAMPLE_CASES.has(r.id)) return { set: 'extended', extended_reason: 'documentation-example-credential' };
  if (r.source === 'creddata') {
    const cats = tagValues(r, 'creddata');
    if (cats.length > 0 && cats.every((c) => CREDDATA_OUT.has(c))) return { set: 'extended', extended_reason: 'creddata-category-out' };
  }
  const pii = piiReason(r);
  if (pii) return { set: 'extended', extended_reason: pii };
  return { set: 'official', section: labelsOf(r.source) === 'outside' ? 'headline' : 'vendor' };
}

/** The scope fields of a record, as the rules set them. */
export function scopeFields(r: BenchRecord): Pick<BenchRecord, 'set' | 'section' | 'extended_reason'> {
  const s = scopeOf(r);
  return s.set === 'official' ? { set: 'official', section: s.section } : { set: 'extended', extended_reason: s.extended_reason };
}

/** Sets the scope fields on every record in place (the keys exist from mk, so their order is kept). */
export function applyScope(records: BenchRecord[]): void {
  for (const r of records) {
    const f = scopeFields(r);
    r.set = f.set;
    r.section = f.section;
    r.extended_reason = f.extended_reason;
    r.owasp = owaspOf(r);
  }
}

/** Where a record's scope fields disagree with the rules; empty when they agree. */
export function scopeProblems(r: BenchRecord): string[] {
  const want = scopeFields(r);
  const out: string[] = [];
  const set: SetName | undefined = r.set;
  if (set !== want.set) out.push(`case ${r.id}: set is ${set}, the rules say ${want.set}`);
  if (r.section !== want.section) out.push(`case ${r.id}: section is ${r.section}, the rules say ${want.section}`);
  if (r.extended_reason !== want.extended_reason) out.push(`case ${r.id}: extended_reason is ${r.extended_reason}, the rules say ${want.extended_reason}`);
  if (r.owasp !== owaspOf(r)) out.push(`case ${r.id}: owasp is ${r.owasp}, the rule in src/scope/owasp.ts says ${owaspOf(r)}`);
  return out;
}

/** Counts per set, section and reason, for convert's summary line. */
export function scopeCounts(records: BenchRecord[]): { headline: number; vendor: number; extended: Record<string, number> } {
  const out = { headline: 0, vendor: 0, extended: {} as Record<string, number> };
  for (const r of records) {
    if (r.set === 'official') out[r.section === 'vendor' ? 'vendor' : 'headline']++;
    else out.extended[r.extended_reason ?? '?'] = (out.extended[r.extended_reason ?? '?'] ?? 0) + 1;
  }
  return out;
}
