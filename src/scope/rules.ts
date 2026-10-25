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
  if (ACTION_WITHOUT_CONTEXT_SOURCES.has(r.source)) return { set: 'extended', extended_reason: 'action-without-context' };
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
