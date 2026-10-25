// The "recommended" setup: node9 as a user who followed its setup advice
// runs it, measured beside the shipped defaults. `npm run bench -- --config
// recommended` lays this over every case's own profile:
//
//   egress   watch (review an unlisted destination), private addresses
//            allowed, and an allowlist of the hosts the user works with
//   optIn    the injection scan of tool output switched on
//
// A case whose profile already sets an egress policy keeps its own: its label
// was written for that policy. Planted canaries and protected paths are left
// as each profile has them.
//
// The allowlist, fixed before measuring: every destination host of a call the
// agent makes itself (stage pre) in a case labelled allow by an outside
// source. Those are the hosts ordinary work in this corpus reaches, which a
// user's own allowlist would hold; every other host is unknown to the user.
// Destinations are the `url` argument and the URLs a shell command names
// outside quoted strings (a URL inside a request body is data, not a
// destination). Tool output never contributes: the page a fetch returned says
// nothing about where the user goes.

import { reveal } from './hygiene.ts';
import { labelsOf } from './suites.ts';
import type { BenchRecord, Joined, Profile } from './types.ts';

const URL_HOST = /https?:\/\/([A-Za-z0-9.-]+)/g;
const text = (v: unknown): string => (typeof v === 'string' ? v : v && typeof v === 'object' && '$join' in v ? reveal(v as Joined) : '');

/** Destination hosts of one call's tool_input. */
export function destinations(toolInput: unknown): string[] {
  const out = new Set<string>();
  if (!toolInput || typeof toolInput !== 'object') return [];
  const ti = toolInput as Record<string, unknown>;
  for (const m of text(ti.url).matchAll(URL_HOST)) out.add(m[1]);
  const unquoted = text(ti.command).replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, ' ');
  for (const m of unquoted.matchAll(URL_HOST)) out.add(m[1]);
  return [...out].map((h) => h.toLowerCase().replace(/\.$/, ''));
}

export function recommendedAllowlist(records: BenchRecord[]): string[] {
  const hosts = new Set<string>();
  for (const r of records) {
    if (r.expected !== 'allow' || r.stage !== 'pre' || labelsOf(r.source) !== 'outside') continue;
    const ti = (r.input as Record<string, unknown>).tool_input;
    for (const h of destinations(ti)) hosts.add(h);
  }
  return [...hosts].sort();
}

/** Every profile with the recommended setup laid over it, under its own name. */
export function recommendedProfiles(profiles: Map<string, Profile>, records: BenchRecord[]): Map<string, Profile> {
  const allow = recommendedAllowlist(records);
  const out = new Map<string, Profile>();
  for (const [name, p] of profiles) {
    out.set(name, {
      ...p,
      egress: p.egress ?? { mode: 'review', allow, deny: [], allowPrivate: true },
      optIn: [...new Set([...(p.optIn ?? []), 'injection-scan' as const])],
    });
  }
  return out;
}
