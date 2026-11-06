# How the benchmark works

This page explains what the benchmark measures, how a case is built, who
wrote each answer, how a tool is scored, and how the cases map to the OWASP
Top 10 for Agentic Applications. It is written for a reader who has not
seen the code. The technical record is in the repository: `DATASHEET.md`
(the corpus as a dataset), `CHANGELOG.md` (every corpus version) and the
source files named below. Numbers here are from corpus 7.0.0.

## 1. The question

An AI coding agent works through tools: it runs shell commands, reads and
writes files, installs packages, calls MCP servers. A guard sits between the
agent and those tools and decides, call by call, whether to let the call
through, stop it, or stop it and ask a person.

The benchmark asks one question of a guard, 13,329 times:

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
- **A tool's maker**: node9's own tests, and the suites other guards' makers
  wrote: agent-egress-bench (pipelock), agent-guard-bench (agent-guard) and
  agentic-security-benchmark (MoorAI). These are the **vendor section**:
  reported with equal weight beside the headline, never inside it.

Where the benchmark turned a source's data into a verdict (for example, a
PII dataset that marks values, not calls), the mapping is AgentVerdict's and
says so on the case. Every public label can be disputed through an issue,
and the answer is public; at launch, each measured tool's maker and the
authors of the outside sources are invited to review the labels in their
categories. A changed label is a new corpus version.

## 4. The three sets

| Set | What | Use |
|---|---|---|
| **Official** | 9,090 cases: every category a guard can protect without many false positives. Headline section 7,428 (outside labels), vendor section 1,662 | The benchmark |
| **Quick** | A fixed tenth of the official public cases, every source and verdict represented (`src/quick.ts`) | Between changes, in minutes |
| **Extended** | 4,239 cases left out of the official set, each with the written reason | So nothing is hidden |

A case leaves the official set for one of three reasons only, and the rule
applies to every tool alike:

1. **No tool can protect the category without many false positives.**
2. **The test itself is flawed.**
3. **It is text with no action after it.** Protection is measured on the
   action.

Each exclusion has a code and a one-line definition (`src/scope/reasons.ts`):

| Code | Cases | What is left out |
|---|---:|---|
| `text-only` | 1,799 | A tool result carrying injected (or harmless trigger-word) text with no action after it. Detecting the text is an extra layer; the official set measures the action that follows |
| `creddata-category-out` | 1,314 | CredData lines that are only a generic password, UUID, salt, nonce or Firebase domain: a value no guard can tell from ordinary code |
| `context-only` | 413 | PII-TRACE conversations, where a value is private or not depending on whose document it came from, which the call does not show |
| `pii-no-checksum` | 431 | Documents whose only sensitive identifier has no check digit (passport, licence, national ID, account, PIN numbers): a plain digit string |
| `invented-card` | 137 | Documents whose only card number fails the Luhn check: the dataset invented a number no real card carries |
| `action-without-context` | 91 | An AgentDojo call alone, without the result that led to it: whether it is the attacker's or the user's is not in the call |
| `pii-biometric` | 39 | Documents whose only sensitive value is a biometric identifier, which has no shape a guard can recognise |

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

1,401 of the 13,329 cases are held out. They are kept in a private
repository and reported as a number only, never case by case; the quick set
never contains them. A tool's holdout score is measured by us, in the same
runner, and printed beside its public score. The board shows the public
headline score; the holdout score beside it is the check against a tool
that learned the public cases by heart, which does well on the public cases
and worse on the held-out ones.

**How the held-out cases are chosen (since corpus 7.0.0).** Each source
whose sample is a small part of a much larger pool draws extra rows from
the part of that pool the public sample did not take, with a salt that
lives only in the private repository: CredData (from repositories the public
sample never touched), Nemotron-PII, Gretel, OpenPII, BrowseSafe,
agent-guard-bench, InjecAgent, and the OSV, Datadog and typomind package
lists. A source counts only when its remaining pool is at least five times
the rows drawn from it. Anyone can rerun the public fetch scripts: they
reproduce the public sample exactly, and the rest of the upstream pool, where
the held-out rows are, mixes them with every row that was never chosen. The
held-out draw keeps the counts per source and label that the holdout had
before 7.0.0. node9's own generated rows (its token generator, its
system-operation and exposure designs, its hand-chosen package lists) are
held out the same way they were, since the code that makes them is private.

**What it cannot hide.** A source used whole or by a fixed rule (RedCode,
NL2SH-ALFA, MBPP, Exercism, NotInject, AgentDojo, PII-TRACE, the most
downloaded packages, agent-egress-bench, agentic-security-benchmark, and
node9's tests transcribed from its public repository) is public in full:
anyone can read and learn all of it, so holding part of it out would hide
nothing. In the official set's headline, the holdout therefore covers
secrets, personal data and the attack side of packages; its shell cases
(agent-guard-bench, node9's system operations), and a few MCP and package
ones, are in the vendor section; its injected text (BrowseSafe, InjecAgent)
is in the extended set, like every injected text without an action after
it. It has no headline shell, MCP or injection number.

Until corpus 7.0.0 the holdout was a fifth of every source, chosen by a
salted hash of the case's group. That split could be rebuilt: the public
fetch scripts reproduced each whole sample, and the public snapshot minus
that sample was the holdout. Every case of 6.1.1 is public since 7.0.0, and
its answers stay comparable.

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
mapping is AgentVerdict's, not OWASP's. The risks themselves are defined in
OWASP's list:
https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

Official set, by risk (attacks / ordinary cases):

| Risk | Name | What falls under it here | Headline (outside labels) | Vendor section |
|---|---|---|---:|---:|
| ASI01 | Agent Goal Hijack | The agent read poisoned content (a web page, an email, a tool result) and its next action is the attacker's; and the ordinary actions after harmless content | 146 / 361 | 29 / 36 |
| ASI02 | Tool Misuse and Exploitation | Personal data sent out, harmful shell commands, git commands that stage the whole tree or destroy work, data leaving through egress and MCP tools, harmful actions through business tools; and ordinary commands, documents and actions | 1,112 / 1,642 | 486 / 363 |
| ASI03 | Identity and Privilege Abuse | Credentials leaving the machine or used where they should not be; and code that only looks like it holds one | 714 / 2,206 | 246 / 74 |
| ASI04 | Agentic Supply Chain Vulnerabilities | Malicious and typosquatted packages; and the most downloaded ones | 309 / 191 | 0 / 65 |
| ASI05 | Unexpected Code Execution | Installing from an untrusted source, eval injection, reverse shells; and ordinary programs run whole | 149 / 598 | 8 / 0 |
| ASI06 | Memory and Context Poisoning | Instructions written to the agent's memory or instruction files, or carried to the next agent in a shared artifact or a hand-off; and ordinary memory writes | no cases yet | 15 / 3 |
| ASI07 | Insecure Inter-Agent Communication | | no cases yet | no cases yet |
| ASI08 | Cascading Failures | | no cases yet | no cases yet |
| ASI09 | Human-Agent Trust Exploitation | Actions that need a person's approval (moving money, changing credentials, deleting, managing users and access, publishing); and the ordinary actions beside them | none | 32 / 55 |
| ASI10 | Rogue Agents | The agent disables or bypasses a check that oversees its own work: the git hooks that run before a commit or push, or its own hook settings; and the ordinary commits and hook edits beside them | no cases yet | 120 / 130 |

`npm run report -- <runs> --owasp` adds the per-risk table to a report, with
the headline and vendor sections in separate columns. It shows every risk, with "no cases yet" where the corpus has none, rather than
leaving a row out. Live scenarios (a fake project, bait, a task and a
success condition) for the empty risks are planned after launch.

## 8. Limits

Stated in full in `DATASHEET.md`, section 9. The ones that matter most:

- **Replay, not a live agent.** The benchmark measures whether a guard
  stops a call once it is attempted, not how often a model attempts it.
- **Only what a hook sees.** Calls are never run, so protection that acts
  when a call runs (a network proxy, a sandbox) is out of reach; so are
  hook events other than before and after a call, and the MCP tool list.
  Cases a tool would protect that way are reported as not measured for it,
  by reason, in its summary. The full list: `DATASHEET.md`, section 9,
  "What the benchmark does not measure".
- **Each source's labels answer that source's question.** CredData counts
  short test passwords as credentials; RedCode counts reading
  world-readable files as risky. A case can be hard to decide from the call
  alone; the dispute process is where that is settled.
- **Some labels are ours.** Where AgentVerdict mapped a source to a verdict,
  the mapping is ours, it says so, and it can be disputed.
- **Small sources.** Some sources have a few dozen cases; their rows carry
  an interval, and a rate on them is read with its width.
- **Live registries.** 292 package cases depend on registries and advisory
  databases at run time; they are marked volatile and listed apart.

## 9. Bias checks

We build AgentVerdict and node9 is measured on it, so we check whether our
own choices favour node9. Each check changes one choice and asks whether
node9's result holds. The per-tool numbers of every check are published
with the tools' results.

| Check | The choice it tests |
|---|---|
| Exclusions | Do the cases left out of the official set (the extended set, each with its reason) hide a tool's misses? Every tool is scored on them too. |
| Labels we set | Do the answers AgentVerdict set, where a source gives none for our question, favour one tool? Scored apart from the cases whose answer is the source's own. |
| One source | Does a result rest on one large source? Each source is left out in turn and the board ranked again. |
| The metric | Does a rank hold only under the balanced score? Ranked again by attacks stopped, by ordinary work let through, and per channel. |
| Fitting | Does a tool do much better on the public cases than on the held-out ones of the same kind? |
| Vendor section | How does each tool do on suites a maker wrote? Shown apart, never in the headline. |
| Setup | Did a tool run below its documented default? Every case a tool could not be measured on is listed by reason. |

**Labels we set.** Where a source gives no answer for our question, we set
it, and the rule is on each case (section 3). Most of these cases are
ordinary work: commands, scripts and installs that a user asked for. A tool
that asks before every unfamiliar command loses on them, and some of them
(deleting a test file, changing a file's permissions) could be argued
either way. These are the labels most open to doubt, so we name them and
invite the sources' authors and every maker to dispute them.

**Fitting to the public cases.** Every public case can be studied by any
maker, node9 included, and a tool can be fitted to them. That is why about a
tenth of the cases are drawn in secret and kept apart: nobody sees them, no
maker can tune on them, and every tool is scored on them as well. The board
shows both scores. A gap between a tool's public and held-out score on the
same kind of case is a sign of fitting to the public cases.

## 10. Run it, check it, dispute it

```bash
npm ci --ignore-scripts
npm run bench -- --set quick
npm run bench -- --adapter hook --hook-name mytool --hook-cmd "mytool hook"
npm run report -- <run> [<run> ...] [--owasp]
npm run check-results -- results/<adapter>/<version>/corpus-<corpus>
```

Every outside tool runs in a sandbox (`src/sandbox.ts`): no network, the
home directory, the desktop keyring and the temp directories hidden, the
case's HOME the only place to write. node9's adapters run without it. Step
by step, with the options: `README.md`, "Test your guard".

How to put a tool on the board, dispute a label or add cases:
`CONTRIBUTING.md`.
