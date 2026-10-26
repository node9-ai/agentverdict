// The runtime-gate annotation: beside every outside label, can a guard that
// sees this one call decide it, and if not, why. The source label is never
// changed; this is a second, independent layer (node9Firewall#371).
//
// Four kinds of reason, in order of precedence when more than one applies:
//
//   label-noise      the label contradicts the case itself
//   artefact         the conversion changed what the label refers to
//   missing-context  the label depends on something the call does not carry
//                    (who asked, the role of a value in a conversation)
//   threat-model     the source counts as risky an action a developer
//                    workstation treats as routine
//
// The decidable score leaves out label-noise, artefact and missing-context,
// which are facts about the case. threat-model stays in the decidable score
// and is reported as its own column: it is a judgement about threat models a
// reader may not share.
//
// Every reason is a mechanical predicate over the case and the source's own
// metadata (src/decidable/rules.ts). No rule reads any tool's result.

export type GateFit = 'decidable' | 'label-noise' | 'artefact' | 'missing-context' | 'threat-model';

export const PRECEDENCE: GateFit[] = ['label-noise', 'artefact', 'missing-context', 'threat-model'];

export interface Reason {
  fit: Exclude<GateFit, 'decidable'>;
  /** One sentence a reader can check against the case. */
  definition: string;
  /** The sources the rule is defined for. */
  sources: string[];
  /** The evidence the rule rests on. */
  basis: string;
}

export const REASONS = {
  'obfuscated-to-random-letters': {
    fit: 'artefact',
    definition:
      "A credential CredData labelled T whose value is only ASCII letters: when this corpus was built, AgentVerdict ran CredData's obfuscation script, which replaced each letter with a random letter of the same case, so the readable value the label was given for (a word, a name, a placeholder) is gone, while untouched F lines keep theirs.",
    sources: ['creddata'],
    basis: 'CredData obfuscate_creds.py at 0b1940e (generate_value, gen_random_value), run by AgentVerdict in corpus 1.11.0; value position from meta ValueStart and ValueEnd',
  },
  'context-only-value': {
    fit: 'missing-context',
    definition:
      'A PII-TRACE conversation: whether a value in it is private depends on whose document it came from, which the dataset sets by the conversation and the value does not show.',
    sources: ['pii-trace'],
    basis: 'PII-TRACE dataset card: sensitivity by context and provenance; the same identifier may or may not be PII',
  },
  'requester-not-in-call': {
    fit: 'missing-context',
    definition:
      "An AgentDojo state-changing call whose tool the dataset's own tasks use both legitimately and for the attacker's goal: whether this call is the attack depends on who asked for it, which the call does not carry.",
    sources: ['agentdojo-calls'],
    basis: 'the same tool name appears in agentdojo-calls with both labels',
  },
  'test-or-example-location': {
    fit: 'threat-model',
    definition:
      "A credential CredData labelled T in a file CredData's own path classification puts under test, mock, example, sample, fixture, spec or template, or with an .example, .sample, .dist or .template extension: a test or example credential.",
    sources: ['creddata'],
    basis: "CredData word_in_path.json (the directory category in each case's path) and the file extension",
  },
  'world-readable-read': {
    fit: 'threat-model',
    definition:
      'A RedCode-Exec script that only reads or lists a path an unprivileged user can read on a stock Debian system: risky in RedCode\'s sandboxed-agent model, routine on a workstation.',
    sources: ['redcode-exec'],
    basis: 'sources/reference-system/readable.json: test -r (and -x for a directory) as nobody in a pinned Debian image',
  },
} as const satisfies Record<string, Reason>;

export type ReasonCode = keyof typeof REASONS;

export interface Annotation {
  gate_fit: GateFit;
  /** Present when gate_fit is not decidable. */
  gate_fit_reason?: ReasonCode;
}
