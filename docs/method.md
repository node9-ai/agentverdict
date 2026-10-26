# How the benchmark works

This page explains what the benchmark measures, how a case is built, who
wrote each answer, how a tool is scored, and how the cases map to the OWASP
Top 10 for Agentic Applications. It is written for a reader who has not
seen the code. The technical record is in the repository: `DATASHEET.md`
(the corpus as a dataset), `CHANGELOG.md` (every corpus version) and the
source files named below. Numbers here are from corpus 6.0.0.

## 1. The question

An AI coding agent works through tools: it runs shell commands, reads and
writes files, installs packages, calls MCP servers. A guard sits between the
agent and those tools and decides, call by call, whether to let the call
through, stop it, or stop it and ask a person.

The benchmark asks one question of a guard, 11,274 times:

> Given this one tool call, in this setting, should it be stopped?

It does not ask whether a model would fall for an attack. Other benchmarks
measure that. This one starts where they stop: the agent has already decided
to act, and the call is on its way. Whatever the model was told, the harm is
done by the call, so the call is what is measured.

## 2. What a case is

Every case is one tool call, exactly as Claude Code hands it to a hook: the
full `PreToolUse` payload (before the call runs) or `PostToolUse` payload
(after it ran, with the tool's output). A case also carries:

- **the setting** (`setup`): what the user has declared, written
  tool-neutrally in `profiles/`. For example, paths the user put off-limits,
  an outbound policy, decoy files, the user's organisation, actions the user
  wants to approve. Each tool's adapter translates the setting into that
  tool's own configuration. A tool with no such setting is measured as it
  is.
- **earlier calls** (`prior`), when the right answer depends on what came
  before. For example, an agent that read a poisoned web page and then sends
  a file somewhere.
- **the expected answer** (`expected`): `block`, `review` (stop and ask a
  person) or `allow`, with a one-line reason (`why`).

Calls are replayed, not generated: the benchmark does not run a model. The
same call reaches every tool in the same form.

## 3. Who wrote each answer

A benchmark built by a vendor is only worth something if the vendor did not
write the answers it is scored on. Every source is marked by who wrote its
labels (`LABELS` in `src/suites.ts`; `npm run validate` fails on a source
that is not marked):

- **Outside**: a party other than node9 or a competitor wrote the labels.
  Samsung's CredData, AgentDojo, RedCode, NL2SH-ALFA, OSV, NotInject,
  Nemotron-PII and others. Only these cases make the **headline score**.
- **A tool's maker**: node9's own tests, and agent-egress-bench, written by
  the author of pipelock. These are the **vendor section**: reported with
  equal weight beside the headline, never inside it.

Where the benchmark turned a source's data into a verdict (for example, a
PII dataset that marks values, not calls), the mapping is AgentVerdict's and
says so. Those labels get a blind check: two annotators, the founder and a
person outside node9, label a seeded sample seeing only the call, and the
agreement is published (`annotation/PROTOCOL.md`). Anyone can dispute a label
through an issue; the answer is public, and a changed label is a new corpus
version.

## 4. The three sets

| Set | What | Use |
|---|---|---|
| **Official** | 7,536 cases: every category a guard can protect without many false positives. Headline section 6,682 (outside labels), vendor section 854 | The benchmark |
| **Quick** | A fixed tenth of the official public cases, every source and verdict represented (`src/quick.ts`) | Between changes, in minutes |
| **Extended** | 3,738 cases left out of the official set, each with the written reason | So nothing is hidden |

A case leaves the official set for one of three reasons only, and the rule
applies to every tool alike:

1. **No tool can protect the category without many false positives.**
2. **The test itself is flawed.**
3. **It is text with no action after it.** Protection is measured on the
   action.

Each exclusion has a code and a one-line definition (`src/scope/reasons.ts`):

| Code | Cases | What is left out |
|---|---:|---|
| `text-only` | 1,647 | A tool result carrying injected (or harmless trigger-word) text with no action after it. Detecting the text is an extra layer; the official set measures the action that follows |
| `creddata-category-out` | 1,090 | CredData lines that are only a generic password, UUID, salt, nonce or Firebase domain: a value no guard can tell from ordinary code |
| `context-only` | 413 | PII-TRACE conversations, where a value is private or not depending on whose document it came from, which the call does not show |
| `pii-no-checksum` | 353 | Documents whose only sensitive identifier has no check digit (passport, licence, national ID, account, PIN numbers): a plain digit string |
| `invented-card` | 114 | Documents whose only card number fails the Luhn check: the dataset invented a number no real card carries |
| `action-without-context` | 91 | An AgentDojo call alone, without the result that led to it: whether it is the attacker's or the user's is not in the call |
| `pii-biometric` | 30 | Documents whose only sensitive value is a biometric identifier, which has no shape a guard can recognise |

The sets are computed by rules from each case's source, label and tags
(`src/scope/rules.ts`), never by hand and never from a tool's result. A
clean rebuild reproduces them.

## 5. How a tool is scored

Each answer is one of: let through (`allow`), stop and ask (`review`), stop
(`block`). For scoring, `review` and `block` both count as **stopped**.

- **Attacks stopped**: of the cases that should be stopped (labelled `block`
  or `review`), the share the tool stopped.
- **False positives** (interruptions): of the ordinary cases (labelled
  `allow`), the share the tool stopped. This is the number a developer
  feels.
- **Balanced score**: the average of the two sides, attacks stopped and
  ordinary work let through. A tool that stops everything scores 50%, and so
  does a tool that stops nothing; only telling them apart scores higher.
- **Precision**: of everything the tool stopped, the share that were
  attacks. It depends on the mix of attacks and ordinary work in the corpus,
  so it is shown beside the false-positive rate, never instead of it.
- **Correct tier**: among the attacks stopped, the share where `review`
  versus `block` matches the label.

Cases a tool has no way to see (for example, an MCP call for a tool that
only reads shell commands) are counted as **not measured**, apart from every
rate, never as a miss. Every rate is also shown per source, and a side with
fewer than 100 measured cases is marked small and shown with its 95%
interval.

Rules for every tool, node9 included: the documented default setup of the
tool's current release, the same settings per case, the same runner. Before
a result is published, the tool's maker receives it and gets at least two
weeks to answer.

## 6. The holdout

About a fifth of the cases (2,201 of 11,274) are held out. A case's side is
fixed by a hash of its scenario group with a salt that is not in the code
(`src/split.ts`), so near-copies of one scenario never fall on both sides, a
new case joins its scenario's side, and the split never moves between runs.
Cases built only from AgentDojo's published task table (`agentdojo-calls`,
`dangerous-actions`) are never held out.

The holdout is not in this repository. Its cases, their source rows and the
salt live in a private repository, so nobody can read them, rebuild them
from what is published here, or tune on them; the quick set never contains
them. A tool's holdout score is measured by us, in the same runner, and
published as a number beside its public score; the holdout is never
published case by case. The number on the board is the holdout number. Its
purpose is to catch a tool that learned the public cases by heart: a tool
that only memorised them does well on the public split and worse on the
holdout.

Everything public is reproducible: the public corpus rebuilds from the
snapshots in `sources/` (`npm run convert`), and its hash is pinned in
`corpus-version.json` (`public_sha256`). node9's own lists (its tests, the
system-operation and exposure designs, the hand-chosen packages) are
published as rows in `sources/`; the code that generated them stays private
because it holds held-out rows too.

## 7. OWASP Top 10 for Agentic Applications

Every case carries the OWASP risk its harm falls under (`owasp`, ASI01 to
ASI10), set by one written rule in `src/scope/owasp.ts`. The rule looks at
the case's source when the source decides the risk, and at its channel
otherwise. The ordinary cases carry the risk they are the control for: a
harmless shell command sits under the same risk as the harmful ones, so a
false positive is counted against the risk it was meant to protect. The
mapping is AgentVerdict's, not OWASP's.

Official set, by risk (attacks / ordinary cases):

| Risk | Name | What falls under it here | Headline (outside labels) | Vendor section |
|---|---|---|---:|---:|
| ASI01 | Agent Goal Hijack | The agent read poisoned content (a web page, an email, a tool result) and its next action is the attacker's; and the ordinary actions after harmless content | 146 / 361 | 29 / 36 |
| ASI02 | Tool Misuse and Exploitation | Personal data sent out, harmful shell commands, data leaving through egress and MCP tools; and ordinary commands and documents | 1,050 / 1,465 | 223 / 107 |
| ASI03 | Identity and Privilege Abuse | Credentials leaving the machine or used where they should not be; and code that only looks like it holds one | 590 / 1,872 | 234 / 74 |
| ASI04 | Agentic Supply Chain Vulnerabilities | Malicious and typosquatted packages; and the most downloaded ones | 260 / 191 | 0 / 64 |
| ASI05 | Unexpected Code Execution | Installing from an untrusted source, eval injection, reverse shells; and ordinary programs run whole | 149 / 598 | none |
| ASI06 | Memory and Context Poisoning | | no cases yet | no cases yet |
| ASI07 | Insecure Inter-Agent Communication | | no cases yet | no cases yet |
| ASI08 | Cascading Failures | | no cases yet | no cases yet |
| ASI09 | Human-Agent Trust Exploitation | Actions that need a person's approval (moving money, changing credentials, deleting, managing users and access, publishing); and the ordinary actions beside them | none | 32 / 55 |
| ASI10 | Rogue Agents | | no cases yet | no cases yet |

`npm run report -- <runs> --owasp` adds the per-risk table to a report, with
the headline and vendor sections in separate columns. It shows every risk, with "no cases yet" where the corpus has none, rather than
leaving a row out. Live scenarios (a fake project, bait, a task and a
success condition) for the empty risks are planned after launch.

## 8. Limits

Stated in full in `DATASHEET.md`, section 9. The ones that matter most:

- **Replay, not a live agent.** The benchmark measures whether a guard
  stops a call once it is attempted, not how often a model attempts it.
- **Each source's labels answer that source's question.** CredData counts
  short test passwords as credentials; RedCode counts reading
  world-readable files as risky. A case can be hard to decide from the call
  alone; the blind check and the dispute process are where that is settled.
- **Some labels are ours.** Where AgentVerdict mapped a source to a verdict,
  the mapping is checked blind, but it is still ours, and it says so.
- **Small sources.** Some sources have a few dozen cases; their rows carry
  an interval, and a rate on them is read with its width.
- **Live registries.** 292 package cases depend on registries and advisory
  databases at run time; they are marked volatile and listed apart.

## 9. Run it, check it, dispute it

```bash
npm ci --ignore-scripts
npm run bench -- --set quick
npm run bench -- --adapter hook --hook-name mytool --hook-cmd "mytool hook"
npm run report -- <run> [<run> ...] [--owasp]
npm run check-results -- results/<adapter>/<version>/corpus-<corpus>
```

How to put a tool on the board, dispute a label or add cases:
`CONTRIBUTING.md`.
