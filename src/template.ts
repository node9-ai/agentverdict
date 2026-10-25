// Materialise a record template into the exact bytes a tool sees.
//
// Two substitutions, both done in memory only:
//   {"$join": [...]}  -> the parts joined with no separator. Credential- and
//                        card-shaped values live in the corpus only as parts,
//                        so no committed file carries one contiguously.
//   {{HOME}} / {{CWD}} -> the per-case temporary home and its project dir.
//
// Every joined value is also returned so the runner can scrub it from any
// text it writes back (a tool's reason string may quote the matched value).

import type { Joined, Template } from './types.ts';

export interface Env {
  home: string;
  cwd: string;
}

export function isJoined(v: unknown): v is Joined {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.keys(v).length === 1 &&
    Array.isArray((v as Joined).$join)
  );
}

function substitute(s: string, env: Env): string {
  return s.replaceAll('{{HOME}}', env.home).replaceAll('{{CWD}}', env.cwd);
}

export function materialize(t: Template | undefined, env: Env, secrets: Set<string> = new Set()): unknown {
  if (t === undefined) return undefined;
  if (typeof t === 'string') return substitute(t, env);
  if (t === null || typeof t !== 'object') return t;
  if (isJoined(t)) {
    const v = substitute(t.$join.join(''), env);
    secrets.add(v);
    return v;
  }
  if (Array.isArray(t)) return t.map((x) => materialize(x, env, secrets));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) out[k] = materialize(v, env, secrets);
  return out;
}

/** Replace every materialised secret (and its common encodings) in `text`. */
export function scrub(text: string, secrets: Iterable<string>): string {
  let out = text;
  for (const s of secrets) {
    if (s.length < 4) continue;
    for (const form of [s, encodeURIComponent(s), JSON.stringify(s).slice(1, -1)]) {
      out = out.split(form).join('<redacted>');
    }
  }
  return out;
}

/** Split a value into parts so no part is itself credential-shaped. */
export function split(value: string, size = 4): Joined {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += size) parts.push(value.slice(i, i + size));
  return { $join: parts };
}
