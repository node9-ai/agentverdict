// The contract between the runner and a tool under test. An adapter receives
// the same thing a real agent hook would (a materialised hook payload) inside
// a fresh temporary home that the runner has already populated with the
// profile's files, and returns the tool's decision. Adapters never see the
// expected verdict.

import type { BenchRecord, DangerCategory, Profile, Verdict } from './types.ts';
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
   * `profile` is the case's setting (the runner passes it), for ruleNotGiven.
   */
  unreachable(record: BenchRecord, profile?: Profile): string | null;
  /**
   * Translate the profile into the tool's own configuration inside `env.home`.
   * `record` is the whole case, earlier steps included, for an adapter that
   * sets up something the case's steps share (one proxy for the whole case).
   */
  prepare(profile: Profile, env: Env, secrets: Set<string>, record?: BenchRecord): Promise<void>;
  /** Decide one materialised call. `payload` is the full hook payload. */
  decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision>;
  /** Stop whatever `prepare` started for this case (a daemon). Called before the case's home is removed. */
  release?(env: Env): Promise<void>;
}

/** The user rules a tool can be given, for ruleNotGiven. */
export interface RuleSupport {
  /** The user's git rules (gitPolicies). */
  git?: boolean;
  /** The "consult me before" categories (holdActions) the tool has a setting for. */
  holdActions?: readonly DangerCategory[];
  /** The user's organisation domains (orgDomains). */
  orgDomains?: boolean;
}

const CATEGORY: Record<DangerCategory, string> = {
  money: 'moving money',
  access: 'managing users and access',
  publishing: 'publishing',
  credentials: 'changing a credential',
  deletion: 'deleting data',
};

/** The call names a host or address inside one of the domains. */
function insideDomains(input: unknown, domains: string[]): boolean {
  const text = JSON.stringify(input ?? '').toLowerCase();
  return domains.some((d) => new RegExp(`(^|[^a-z0-9-])${d.toLowerCase().replace(/[.]/g, '\\.')}($|[^a-z0-9-])`).test(text));
}

/**
 * Why a case cannot be measured for a tool that cannot be given the user rule
 * its verdict rests on, or null. Three settings are rules of the user's, not
 * facts about the call: the git rules (a git command that stages the whole
 * tree, disarms the hooks or destroys work is wrong only because the user
 * said so), the "consult me before" categories (a requested action that must
 * still be held), and the organisation's domains (a send inside them is not
 * held). A tool with no setting for the rule would be scored on a rule it was
 * never given, so the case is unreachable for it: left out of its score, never
 * a miss and never a catch. Only the cases whose verdict rests on the rule:
 * ordinary git commands and ordinary actions under the same settings stay
 * measured, as does a send outside the organisation. The same rule for every
 * adapter, node9's included; an adapter never writes detection rules on its
 * tool's behalf.
 */
export function ruleNotGiven(record: BenchRecord, profile: Profile | undefined, tool: string, support: RuleSupport = {}): string | null {
  if (!profile) return null;
  if (profile.gitPolicies?.length && /^git_/.test(record.why) && !support.git) {
    return `${tool} has no setting for the user's git rules, and this case's verdict rests on them`;
  }
  const category = /^dangerous_action_(\w+)$/.exec(record.why)?.[1] as DangerCategory | undefined;
  if (category && profile.holdActions?.includes(category) && !support.holdActions?.includes(category)) {
    return `${tool} has no setting for being consulted before ${CATEGORY[category]}, and this case's verdict rests on it`;
  }
  if (profile.orgDomains?.length && !support.orgDomains && insideDomains((record.input as { tool_input?: unknown }).tool_input, profile.orgDomains)) {
    return `${tool} has no setting for the user's organisation, and this call goes inside it`;
  }
  return null;
}
