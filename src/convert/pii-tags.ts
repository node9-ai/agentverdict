// The tags a PII document carries for the scope rules (src/scope/): one
// `pii:<tag>` per fraud-enabling tag the source put on the document, in the
// source's own vocabulary, and, when one of those tags is a card number,
// whether a card-shaped number in the text passes Luhn. A source whose tags
// are not classified (PII-TRACE, out as a whole) gets the tags alone.

import { PII_HIGH_TAGS, TAG } from '../scope/pii-types.ts';
import { hasLuhnValidCard } from '../scope/luhn.ts';

export function piiTags(source: string, highTags: string[], text: string): string[] {
  const classes = PII_HIGH_TAGS[source] ?? {};
  const tags = highTags.map((t) => TAG.pii(t));
  if (highTags.some((t) => classes[t] === 'card')) tags.push(hasLuhnValidCard(text) ? TAG.cardValid : TAG.cardInvalid);
  return tags;
}
