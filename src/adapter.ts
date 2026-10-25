// The contract between the runner and a tool under test. An adapter receives
// the same thing a real agent hook would (a materialised hook payload) inside
// a fresh temporary home that the runner has already populated with the
// profile's files, and returns the tool's decision. Adapters never see the
// expected verdict.

import type { BenchRecord, Profile, Verdict } from './types.ts';
import type { Env } from './template.ts';

export interface Decision {
  verdict: Verdict;
  /** The tool's own reason or rule, for a human reading the results. */
  detail?: string;
  /** Wall-clock time of the decision itself, setup excluded. */
  latencyMs: number;
  /**
   * The tool reported that a lookup this verdict depends on failed (node9: an
   * OSV query timed out), so the answer may say more about the network than
   * about the tool. The runner retries such a case once, whatever its label.
   */
  transient?: string;
}

export interface Adapter {
  /** Stable adapter id, also the results directory name. */
  readonly name: string;
  /** Version of the tool under test, recorded with every result. */
  readonly toolVersion: string;
  /** One line on how decisions are obtained, copied into the summary. */
  readonly method: string;
  /**
   * Set by an adapter that never touches the filesystem (a pure library).
   * The runner then materialises every case against this home and creates
   * no temporary directory: the tool's config was built for this exact path.
   */
  readonly fixedHome?: string;
  /**
   * Null when the adapter can decide this case; otherwise the reason it has no
   * surface for it. Such a case is reported as `unreachable`, never as a miss.
   */
  unreachable(record: BenchRecord): string | null;
  /** Translate the profile into the tool's own configuration inside `env.home`. */
  prepare(profile: Profile, env: Env, secrets: Set<string>): Promise<void>;
  /** Decide one materialised call. `payload` is the full hook payload. */
  decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision>;
  /** Stop whatever `prepare` started for this case (a daemon). Called before the case's home is removed. */
  release?(env: Env): Promise<void>;
}
