// The one definition of "this text must not sit in a committed file as is":
// it trips the pinned node9 engine's secret detectors, or its PII detectors
// for anything stronger than an email address or a phone number. Used by
// validate (to fail), and by the converters and source snapshots (to store
// such text as {"$join": [...]} parts instead).

import { scanText, detectPii } from '@node9/policy-engine';
import { split } from './template.ts';
import type { Joined } from './types.ts';

/** Why the text is sensitive (a pattern name), or null when it is not. */
export function sensitive(text: string): string | null {
  const hit = scanText(text);
  if (hit) return hit.patternName;
  const pii = detectPii(text).filter((p) => p !== 'Email' && p !== 'Phone');
  return pii.length > 0 ? pii.join(', ') : null;
}

/** The text itself when it is safe to commit, otherwise its 4-character parts. */
export function protect(text: string): string | Joined {
  return sensitive(text) ? split(text) : text;
}

/** The plain text of a value stored with protect(). */
export function reveal(value: string | Joined): string {
  return typeof value === 'string' ? value : value.$join.join('');
}
