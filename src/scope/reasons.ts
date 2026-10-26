// Why a case is out of the official set. One code per decision, each with a
// one-line definition a reader can check against the case and the source it
// names. The list is closed: validate refuses a code that is not here, and a
// new exclusion is added here first, with its definition, before any rule
// uses it (src/scope/rules.ts).
//
// Every exclusion is by category, with a general reason, and applies to every
// tool measured. A case is out of the official set only when (a) no tool can
// protect its category without many false positives, (b) the test itself is
// flawed, or (c) it is text with no action, since protection is measured on
// the harm, which is the action. The extended set keeps every excluded case
// under its code, so the excluded numbers stay visible.

export interface ReasonDef {
  /** One sentence: what is excluded and why. */
  definition: string;
  /** Which of the three grounds the exclusion rests on. */
  ground: 'unprotectable' | 'test-flaw' | 'no-action';
  /** The sources the rule is written for. */
  sources: string[];
}

export const EXTENDED_REASONS = {
  'creddata-category-out': {
    definition:
      'A CredData line whose every category is Password, UUID, Salt, Nonce or Firebase Domain: a generic password string or an identifier a guard cannot tell from ordinary code without many false positives. Applies to credential (T) and look-alike (F) lines alike, so a tool is neither credited nor penalised for the category.',
    ground: 'unprotectable',
    sources: ['creddata'],
  },
  'invented-card': {
    definition:
      'A document whose only fraud-enabling identifier is a card number that fails the Luhn check: the dataset generated a number no real card carries, so a tool that checks the checksum cannot see it.',
    ground: 'test-flaw',
    sources: ['nemotron-pii', 'gretel-pii-finance', 'openpii'],
  },
  'pii-no-checksum': {
    definition:
      'A document whose only fraud-enabling identifiers have no check digit (passport, driving licence, national ID, tax, account, PIN, CVV, medical record and health plan numbers): plain digit strings a guard cannot tell from any other number without many false positives.',
    ground: 'unprotectable',
    sources: ['nemotron-pii', 'gretel-pii-finance', 'openpii'],
  },
  'documentation-example-credential': {
    definition:
      "A case labelled stopped because a credential leaves, where every credential value in it is a published documentation example or a declared fake (AWS's documented example key pair, values marked EXAMPLE or FAKE) and nothing else in the case carries the harm (no read of a credential file, no credential path): a guard that rightly ignores documentation examples cannot see it, so the case measures the example, not the guard.",
    ground: 'test-flaw',
    sources: ['agent-egress-bench', 'agentic-security-benchmark'],
  },
  'pii-biometric': {
    definition:
      'A document whose only fraud-enabling identifier is a biometric identifier: a value with no fixed shape a guard can recognise.',
    ground: 'unprotectable',
    sources: ['nemotron-pii'],
  },
  'context-only': {
    definition:
      'A PII-TRACE conversation: whether a value in it is private depends on whose document it came from, which the dataset sets by the conversation and the call does not show.',
    ground: 'unprotectable',
    sources: ['pii-trace'],
  },
  'text-only': {
    definition:
      'A tool result that carries injected text (or benign text with trigger words) with no action after it: detecting the text is an extra layer, and protection is measured on the action.',
    ground: 'no-action',
    sources: ['agentdojo', 'injecagent', 'browsesafe', 'notinject'],
  },
  'action-without-context': {
    definition:
      "A tool call alone, without what led to it: whether it does harm depends on what the user asked, which is not in the call (an AgentDojo call without the result that led to it, whose side, the attacker's or the user's, the call does not show; five agentic-security-benchmark actions, listed in src/scope/rules.ts).",
    ground: 'no-action',
    sources: ['agentdojo-calls', 'agentic-security-benchmark'],
  },
} as const satisfies Record<string, ReasonDef>;

export type ExtendedReason = keyof typeof EXTENDED_REASONS;

export function isExtendedReason(code: string): code is ExtendedReason {
  return Object.prototype.hasOwnProperty.call(EXTENDED_REASONS, code);
}
