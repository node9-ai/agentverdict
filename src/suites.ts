// Suites: the chapters a score is reported by, one per origin of the cases.
//
// A suite groups the `source` values that came from one place, so a run can
// say "on the cases from node9's own tests, X; on the cases built from
// AgentThreatBench, Y". A source not listed here is its own suite, so a new
// public dataset gets its own row without any change to this file.
//
// A score on a suite built from an external benchmark is this benchmark's
// question asked on that benchmark's scenarios (did the tool stop the
// action), not that benchmark's own score (did the agent fall for it).

export const SUITES: Record<string, { title: string; sources: string[] }> = {
  'node9-tests': {
    title: "node9's own tests and corpora",
    sources: [
      'node9-jail-gauntlet',
      'node9-legit-credential-corpus',
      'node9-egress-carriers-corpus',
      'node9-canary-fixtures',
      'node9-canary-generators',
      'node9-checksum-fixtures',
      'node9-pii-fixtures',
      'node9-injection-tests',
    ],
  },
  packages: {
    title: 'Package installs (OSV malicious-packages and everyday installs)',
    sources: ['osv-malicious-packages', 'node9-bench-package-list'],
  },
  agentdojo: {
    title: 'AgentDojo (ETH Zurich): injections in tool results',
    sources: ['agentdojo'],
  },
  'agentdojo-calls': {
    title: "AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes",
    sources: ['agentdojo-calls'],
  },
  'agentdojo-seq': {
    title: "AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one",
    sources: ['agentdojo-seq'],
  },
  exposure: {
    title: 'Exposure: ordinary sends after reading outside content',
    sources: ['node9-bench-exposure'],
  },
  'dangerous-actions': {
    title: 'Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked)',
    sources: ['dangerous-actions'],
  },
  'notinject-seq': {
    title: 'NotInject: an ordinary action after benign text with trigger words',
    sources: ['notinject-seq'],
  },
  notinject: {
    title: 'NotInject: benign text with injection trigger words',
    sources: ['notinject'],
  },
  'nemotron-pii': {
    title: 'Nemotron-PII (NVIDIA): documents sent off the machine',
    sources: ['nemotron-pii'],
  },
  'agent-egress-bench': {
    title: "agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches",
    sources: ['agent-egress-bench'],
  },
  'redcode-exec': {
    title: 'RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run',
    sources: ['redcode-exec'],
  },
  'nl2sh-alfa': {
    title: 'NL2SH-ALFA: ordinary shell commands for English tasks',
    sources: ['nl2sh-alfa'],
  },
  'benign-scripts': {
    title: 'Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole',
    sources: ['benign-scripts'],
  },
  'popular-packages': {
    title: 'Most downloaded npm and PyPI packages (official download statistics), installed',
    sources: ['popular-packages'],
  },
  browsesafe: {
    title: 'BrowseSafe-Bench (Perplexity): web pages with and without an injection',
    sources: ['browsesafe'],
  },
  injecagent: {
    title: 'InjecAgent (UIUC): tool results carrying an attacker instruction',
    sources: ['injecagent'],
  },
  'gretel-pii-finance': {
    title: 'Gretel synthetic PII finance: financial documents sent off the machine',
    sources: ['gretel-pii-finance'],
  },
  openpii: {
    title: 'OpenPII (ai4privacy): multilingual texts sent off the machine',
    sources: ['openpii'],
  },
  'pii-trace': {
    title: 'PII-TRACE (Perplexity): conversations sent off the machine',
    sources: ['pii-trace'],
  },
  'osv-other-ecosystems': {
    title: 'OpenSSF malicious packages beyond npm and PyPI',
    sources: ['osv-other-ecosystems'],
  },
  'datadog-packages': {
    title: 'DataDog malicious-software-packages: npm and PyPI names',
    sources: ['datadog-packages'],
  },
  typomind: {
    title: 'typomind (USENIX Security 2023): labelled typosquats',
    sources: ['typomind'],
  },
  creddata: {
    title: 'Samsung CredData: credential and look-alike lines written to a file',
    sources: ['creddata'],
  },
  'github-tokens': {
    title: 'GitHub tokens generated with and without a valid checksum',
    sources: ['node9-bench-generated'],
  },
  'everyday-installs-more': {
    title: 'Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions)',
    sources: ['node9-bench-package-list-more'],
  },
  'system-ops': {
    title: 'System directories: ordinary work and the changes a review is meant for',
    sources: ['node9-bench-system-ops'],
  },
};

// Who wrote each source's expected verdicts. The comparison score counts only
// `outside` sources: labels written by a party other than node9's team, so a
// number meant to compare tools is not graded by one of them. `node9` covers
// node9's own tests and the cases this repository generated; they keep their
// place as the regression track (did a release break what used to work).
// `competitor` is a benchmark written by the maker of a tool under test
// (pipelock's agent-egress-bench): reported as its own row, kept out of the
// comparison score for the same reason node9's own labels are.
// A source missing here has no origin, which validate refuses: a new source is
// classified on purpose rather than by default.
export type LabelOrigin = 'outside' | 'node9' | 'competitor';

export const LABELS: Record<string, LabelOrigin> = {
  'node9-jail-gauntlet': 'node9',
  'node9-legit-credential-corpus': 'node9',
  'node9-egress-carriers-corpus': 'node9',
  'node9-canary-fixtures': 'node9',
  'node9-canary-generators': 'node9',
  'node9-checksum-fixtures': 'node9',
  'node9-pii-fixtures': 'node9',
  'node9-injection-tests': 'node9',
  'node9-bench-package-list': 'node9',
  'node9-bench-generated': 'node9',
  'osv-malicious-packages': 'outside',
  agentdojo: 'outside',
  'agentdojo-calls': 'outside',
  'agentdojo-seq': 'outside',
  'dangerous-actions': 'node9',
  'notinject-seq': 'outside',
  'benign-scripts': 'outside',
  'popular-packages': 'outside',
  'node9-bench-exposure': 'node9',
  'node9-bench-package-list-more': 'node9',
  'node9-bench-system-ops': 'node9',
  'redcode-exec': 'outside',
  'nl2sh-alfa': 'outside',
  browsesafe: 'outside',
  injecagent: 'outside',
  'gretel-pii-finance': 'outside',
  openpii: 'outside',
  'pii-trace': 'outside',
  'osv-other-ecosystems': 'outside',
  'datadog-packages': 'outside',
  typomind: 'outside',
  creddata: 'outside',
  notinject: 'outside',
  'nemotron-pii': 'outside',
  'agent-egress-bench': 'competitor',
};

export function labelsOf(source: string): LabelOrigin | undefined {
  return LABELS[source];
}

// For each outside source, whether `expected` is the source's own label taken
// as is, or node9-bench's reading of something the source states that is not
// itself a block/allow label. The comparison score uses both, so a reader must
// be able to tell them apart: a mapped label is node9's judgement on outside
// material. validate refuses an outside source missing here. (Choosing review
// rather than block for a stopped case is node9's everywhere; the scores count
// both as stopped, so the tier does not move them.)
export type LabelRule = { rule: 'source' } | { rule: 'mapped'; mapping: string };

export const LABEL_RULES: Record<string, LabelRule> = {
  creddata: { rule: 'source' },
  'redcode-exec': { rule: 'source' },
  agentdojo: { rule: 'source' },
  'agentdojo-calls': { rule: 'source' },
  injecagent: { rule: 'source' },
  browsesafe: { rule: 'source' },
  notinject: { rule: 'source' },
  'osv-malicious-packages': { rule: 'source' },
  'osv-other-ecosystems': { rule: 'source' },
  'datadog-packages': { rule: 'source' },
  typomind: { rule: 'source' },
  'agentdojo-seq': {
    rule: 'mapped',
    mapping:
      "AgentDojo's ground truth gives the calls of each task; node9-bench takes the first state-changing call (the ACTIONS list in src/convert/agentdojo.ts) of the injection task after the poisoned result (stop) or of the user task after the clean result (allow). Which task the call belongs to is AgentDojo's; which call, and review rather than block, is node9-bench's.",
  },
  'notinject-seq': {
    rule: 'mapped',
    mapping:
      'NotInject labels each text benign; node9-bench puts it in a tool result and follows it with one fixed ordinary action (saving a short summary to a notes file), chosen before measuring. Allow: both the text and the action are benign.',
  },
  'nl2sh-alfa': {
    rule: 'mapped',
    mapping: 'The dataset has no safety label; every command is allow because users asked for it as an ordinary task.',
  },
  'benign-scripts': {
    rule: 'mapped',
    mapping: 'Neither source labels safety; a reference solution to a programming exercise (MBPP, the Exercism Bash track) is ordinary work, so every script is allow.',
  },
  'popular-packages': {
    rule: 'mapped',
    mapping: 'Download statistics label nothing; the most downloaded packages of a registry are what ordinary work installs, so every install is allow (each latest version checked against OSV MAL records on the fetch day).',
  },
  'nemotron-pii': {
    rule: 'mapped',
    mapping: "The dataset tags spans by type; node9-bench decided which types make sending the document a block (src/sources/fetch-nemotron-pii.ts, HIGH/LOW).",
  },
  'gretel-pii-finance': {
    rule: 'mapped',
    mapping: 'The dataset tags spans by type; node9-bench decided which types make sending the document a block (src/sources/fetch-pii-sets.ts, high/low).',
  },
  openpii: {
    rule: 'mapped',
    mapping: 'The dataset tags spans by type; node9-bench decided which types make sending the document a block (src/sources/fetch-pii-sets.ts, high/low).',
  },
  'pii-trace': {
    rule: 'mapped',
    mapping: 'The dataset tags spans by type; node9-bench decided which types make sending the conversation a block (src/sources/fetch-pii-sets.ts, high/low).',
  },
};

export function labelRuleOf(source: string): LabelRule | undefined {
  return LABEL_RULES[source];
}

const BY_SOURCE = new Map(Object.entries(SUITES).flatMap(([suite, s]) => s.sources.map((src) => [src, suite] as const)));

export function suiteOf(source: string): string {
  return BY_SOURCE.get(source) ?? source;
}

export function suiteTitle(suite: string): string {
  return SUITES[suite]?.title ?? suite;
}
