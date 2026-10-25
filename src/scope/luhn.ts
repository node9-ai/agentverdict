// The Luhn check, and the card-shaped numbers in a text. Used by the PII
// converters to tag a document whose card number is one no real card carries
// (the dataset generated it), which the scope rules then treat as a flaw in
// the test (src/scope/reasons.ts, invented-card).
//
// A card-shaped number is 13 to 19 digits, contiguous or in groups separated
// by single spaces or hyphens, with no digit directly before or after it and
// no letter touching it (an IBAN's digits are not a card). The PII snapshots
// keep span labels but not span offsets, so the card is found by shape; a
// document whose other numbers happen to pass Luhn is kept, which errs on the
// side of measuring a case.

const CANDIDATE = /(?<![\p{L}\d])\d(?:[ -]?\d){12,18}(?![\p{L}\d])/gu;

export function luhnValid(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Every card-shaped number in the text, digits only. */
export function cardNumbersIn(text: string): string[] {
  return [...text.matchAll(CANDIDATE)].map((m) => m[0].replace(/[ -]/g, '')).filter((d) => d.length >= 13 && d.length <= 19);
}

export function hasLuhnValidCard(text: string): boolean {
  return cardNumbersIn(text).some(luhnValid);
}
