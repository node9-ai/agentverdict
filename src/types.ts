// Record format for the runtime corpus. One JSON object per line, one file per
// channel under corpus/. The README documents every field; this file is the
// machine-checked version of that description.

export const CHANNELS = ['injection', 'pii', 'secrets', 'egress', 'shell', 'package', 'mcp'] as const;
export type Channel = (typeof CHANNELS)[number];

export const VERDICTS = ['allow', 'review', 'block'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const AGENTS = ['claude-code', 'codex', 'gemini', 'cursor', 'mcp-generic'] as const;
export type Agent = (typeof AGENTS)[number];

/**
 * Which set a case is measured in (src/scope/). `official` is the benchmark:
 * every category a guard can protect with few false positives. `extended` is
 * everything else, kept with the reason it is out, so excluded numbers stay
 * visible.
 */
export const SETS = ['official', 'extended'] as const;
export type SetName = (typeof SETS)[number];

/**
 * The section of the official set. `headline`: labels written by a party
 * other than node9 or a competitor; the comparison score. `vendor`: suites
 * written by a tool's maker (node9's own tests, pipelock's agent-egress-bench),
 * reported with equal weight in their own section, never in the headline.
 */
export const SECTIONS = ['headline', 'vendor'] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * The hook the verdict is read at. `pre`: the agent is about to run the call
 * (PreToolUse / BeforeTool). `post`: the call ran and returned `output`
 * (PostToolUse / AfterTool); the tool under test can only warn, taint or stop
 * the next step, so a `post` verdict of review means "flagged".
 */
export type Stage = 'pre' | 'post';

/**
 * A value that must never sit contiguously in a committed file (a
 * credential-shaped or card-shaped string). Stored as parts and joined in
 * memory by the runner, the same convention node9-proxy uses for its fixtures.
 */
export interface Joined {
  $join: string[];
}

/** Any JSON value, where strings may also be `Joined` and may carry `{{HOME}}`. */
export type Template = string | number | boolean | null | Joined | Template[] | { [k: string]: Template };

export interface PriorCall {
  stage: Stage;
  /** Hook payload, same shape as `BenchRecord.input`. */
  input: Template;
  /** Tool result as the agent reports it, for `post` priors. */
  output?: Template;
}

export interface BenchRecord {
  /** Immutable. Never reused for a different case, even after deletion. */
  id: string;
  channel: Channel;
  agent: Agent;
  /** Tool name exactly as the agent sends it (Bash, Read, mcp__fetch__fetch). */
  tool: string;
  stage: Stage;
  /** The full hook payload the agent writes to the hook's stdin. */
  input: Template;
  /** The tool result, in the agent's own `tool_response` shape, for `post` cases. */
  output?: Template;
  /** Calls earlier in the same session that the verdict depends on, oldest first. */
  prior?: PriorCall[];
  /** Name of a tool-neutral environment in profiles/ (protected paths, egress policy). */
  setup: string;
  expected: Verdict;
  /** Machine-readable reason label, for example credential_path_read. */
  why: string;
  /** Attack family or benign workload family. */
  family: string;
  /** Scenario or template id. Cases sharing a group always land on the same side of a split. */
  group: string;
  /** The base case this one rewrites, for variants. */
  variant_of?: string;
  source: string;
  /** Path and line, or URL, of the exact place the case came from. */
  source_ref: string;
  license: string;
  /** Holdout flag: never used to tune a rule or a model. Derived from `group`. */
  private: boolean;
  /**
   * True when the right verdict is fixed but the tool's answer depends on the
   * outside world at run time (advisory databases, package registries, the
   * date). A change on such a case is reported separately by compare and never
   * fails a release check on its own.
   */
  volatile?: true;
  /** The set the case is measured in. Derived by the rules in src/scope/, never set by hand. */
  set: SetName;
  /** For official cases: the section it is reported in. Derived from who wrote the labels. */
  section?: Section;
  /** For extended cases: why it is out of the official set, a code from src/scope/reasons.ts. */
  extended_reason?: string;
  /** The OWASP Agentic Top 10 risk the case's harm falls under (ASI01 to ASI10), by the rule in src/scope/owasp.ts. */
  owasp: string;
  /**
   * Facts about the case the scope rules read, each `<namespace>:<value>`:
   * the source's own category of the line (`creddata:Password`), the
   * identifier types a document carries (`pii:ssn`), whether a card number in
   * it passes Luhn (`card:luhn-valid`). Written by the converter from the
   * source's metadata; never a judgement.
   */
  tags?: string[];
  /** Free-text note for a reviewer. Never read by the scorer. */
  note?: string;
}

/**
 * A tool-neutral environment. Each adapter translates it into its own tool's
 * configuration. Paths may use {{HOME}}, the per-case temporary home.
 */
export interface Profile {
  name: string;
  description: string;
  /** Files created in the temporary home before the case runs (decoy content only). */
  files?: Array<{ path: string; content: Template }>;
  /** Paths the user or the organisation declared off-limits to the agent. */
  protectedPaths?: Array<{ path: string; scope: 'user' | 'org'; verdict: 'block' | 'review' }>;
  /** Outbound destination policy. Absent means the user configured none. */
  egress?: {
    mode: 'review' | 'block';
    allow?: string[];
    deny?: string[];
    /** Whether private and loopback addresses are reachable without review. */
    allowPrivate?: boolean;
  };
  /** Decoy secrets the user planted; any use of one is an exfiltration signal. */
  canaries?: Array<{ id: string; path: string; field: string; value: Template }>;
  /** Detection features the user switched on that are off by default. */
  optIn?: Array<'injection-scan'>;
  /** Email domains of the user's own organisation (policy.untrustedContent.orgDomains). */
  orgDomains?: string[];
  /**
   * Categories of action the user asked to be consulted on before they run,
   * even when the user requested the action (the dangerous-actions test). For
   * a tool with no such setting, a case in a held category is not measured
   * (ruleNotGiven in src/adapter.ts).
   */
  holdActions?: DangerCategory[];
  /**
   * Git rules the user declared for the agent (agent-guard-bench's three
   * policies): stage files by name only, never disarm the git hooks, never
   * destroy uncommitted or pushed work. For a tool with no such setting, a
   * command that breaks a rule is not measured (ruleNotGiven in
   * src/adapter.ts); an adapter never writes detection rules on its tool's
   * behalf.
   */
  gitPolicies?: GitPolicy[];
}

/** The git rules of the git-guardrails profile, in agent-guard-bench's order (policies A, B, C). */
export const GIT_POLICIES = ['stage-by-name', 'keep-hooks', 'keep-work'] as const;
export type GitPolicy = (typeof GIT_POLICIES)[number];

/**
 * The written categories of a dangerous action (the dangerous-actions test,
 * src/convert/dangerous-actions.ts): an action in one of them needs a
 * person's approval even when the user asked for it.
 */
export const DANGER_CATEGORIES = ['money', 'credentials', 'deletion', 'access', 'publishing'] as const;
export type DangerCategory = (typeof DANGER_CATEGORIES)[number];

export interface CaseResult {
  id: string;
  adapter: string;
  tool_version: string;
  channel: Channel;
  expected: Verdict;
  /** `unreachable`: the adapter declares it has no surface for this case. `error`: the run failed. */
  actual: Verdict | 'unreachable' | 'error';
  private: boolean;
  latency_ms: number | null;
  /** The tool's own reason or rule name, trimmed. Never contains a materialised secret. */
  detail?: string;
  /** The chapter the case is reported under (see suites.ts). Absent in results written before suites existed. */
  suite?: string;
  /** Who wrote the expected verdict (see suites.ts). Absent in results written before it was recorded. */
  labels?: 'outside' | 'node9' | 'competitor';
  /** The set, section and reason of the case (see src/scope/). Absent in results written before sets existed. */
  set?: SetName;
  section?: Section;
  extended_reason?: string;
  owasp?: string;
  /** Set when the tool reported a failed lookup behind this verdict (see Decision.transient). */
  transient?: string;
}
