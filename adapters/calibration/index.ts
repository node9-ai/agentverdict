// Calibration adapters: a tool that allows everything and a tool that blocks
// everything. They exist to prove the instrument, not to score anything:
// allow-all must catch 0% and interrupt 0 times; block-all must catch 100%
// and interrupt on every allow case. A scorer that gives anything else is
// wrong, whatever it says about a real tool.

import type { Adapter, Decision } from '../../src/adapter.ts';
import type { Verdict } from '../../src/types.ts';

export class CalibrationAdapter implements Adapter {
  readonly name: string;
  readonly toolVersion = '0';
  readonly method: string;
  // Pure: no files, no processes.
  readonly fixedHome = '/tmp/node9-bench-calibration';

  constructor(private readonly verdict: Extract<Verdict, 'allow' | 'block'>) {
    this.name = `calibration-${verdict}`;
    this.method = `answers ${verdict} to every case`;
  }

  unreachable(): string | null {
    return null;
  }

  async prepare(): Promise<void> {}

  async decide(): Promise<Decision> {
    return { verdict: this.verdict, latencyMs: 0 };
  }
}
