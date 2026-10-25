// Uncertainty for the numbers the bench reports.
//
// wilson(): the Wilson score interval for a proportion (95% by default). It
// stays inside [0, 1] and behaves at 0/n and n/n, where the normal
// approximation does not; with sources of 40 to 200 cases that matters.
//
// mcnemar(): the exact McNemar test for two tools (or two versions) scored on
// the same cases. Only the discordant cases count: b where only the first was
// right, c where only the second was. Under "no difference" each discordant
// case is a fair coin, so the two-sided p-value is the binomial tail
// 2 * P(X <= min(b, c)), X ~ Bin(b + c, 1/2), capped at 1.

export interface Interval {
  low: number;
  high: number;
}

export function wilson(successes: number, n: number, z = 1.959963984540054): Interval {
  if (n === 0) return { low: 0, high: 1 };
  const p = successes / n;
  const z2 = z * z;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  // At 0/n and n/n the bound is exactly 0 or 1; say so instead of 1 - 1e-16.
  return {
    low: successes === 0 ? 0 : Math.max(0, centre - half),
    high: successes === n ? 1 : Math.min(1, centre + half),
  };
}

/** Two-sided exact McNemar p-value for b and c discordant cases. */
export function mcnemar(b: number, c: number): number {
  const n = b + c;
  if (n === 0) return 1;
  const k = Math.min(b, c);
  // Sum C(n, i) / 2^n for i = 0..k in log space, so n in the thousands is safe.
  let logC = 0; // log C(n, 0)
  let tail = 0;
  for (let i = 0; i <= k; i++) {
    if (i > 0) logC += Math.log(n - i + 1) - Math.log(i);
    tail += Math.exp(logC - n * Math.LN2);
  }
  return Math.min(1, 2 * tail);
}

/** "43.4-47.5%", one decimal, for a report cell. */
export function formatInterval(i: Interval): string {
  return `${(i.low * 100).toFixed(1)}-${(i.high * 100).toFixed(1)}%`;
}

/** "p = 0.031", or "p < 0.001". */
export function formatP(p: number): string {
  return p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`;
}

/**
 * Cohen's kappa between two raters over the same items: agreement beyond
 * what the raters' own label frequencies would give by chance. 1 is perfect
 * agreement, 0 is chance, below 0 is worse than chance. Null when the items
 * are empty or every pair carries one and the same label (chance is then
 * total and the ratio undefined).
 */
export function cohenKappa(a: string[], b: string[]): number | null {
  if (a.length !== b.length) throw new Error('kappa: the raters answered different numbers of items');
  const n = a.length;
  if (n === 0) return null;
  const labels = new Set([...a, ...b]);
  let agree = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) agree++;
  const po = agree / n;
  let pe = 0;
  for (const l of labels) pe += (a.filter((x) => x === l).length / n) * (b.filter((x) => x === l).length / n);
  if (pe === 1) return null;
  return (po - pe) / (1 - pe);
}
