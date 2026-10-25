# AI Agent Security Benchmark

Does a guard stop what an AI coding agent can do to a developer's machine,
without getting in the way of ordinary work?

This benchmark replays **11,274 tool calls** a coding agent really makes
(the exact hook payloads Claude Code sends) through the guard under test,
and scores each answer against the right one. Leaked secrets and personal
data, harmful commands and scripts, malicious and typosquatted packages, an
attacker's action after the agent read poisoned content, and dangerous
actions that need a person's approval. On the other side, with the same
weight: ordinary commands, ordinary scripts, ordinary installs, ordinary
documents. A guard that stops everything scores 50%.

Built and maintained by [node9](https://node9.ai). node9 is one of the
tools measured here; its results are published like everyone else's,
including where it loses.

Results: **[node9.ai/ai-agent-security-benchmark](https://node9.ai/ai-agent-security-benchmark)**

<!-- scoreboard: generated from results/ by the release script, never typed -->

## What makes it different

- **The action, not the text.** A poisoned web page is not the harm; the
  agent sending your files where the page said is. The official set
  measures the call the agent makes, in the order it makes it.
- **False positives count.** Every attack source has an ordinary-work
  counterpart, and the score is balanced between them.
- **Who wrote each answer is on every case.** Labels from an outside source
  (CredData, AgentDojo, RedCode, NL2SH-ALFA, OSV and others) make the
  headline score. Suites written by a tool's maker (node9's own tests,
  pipelock's agent-egress-bench) are reported in their own section, never in
  the headline. Where node9-bench mapped a source's data to a verdict, it
  says so, and those labels get a blind check by two annotators.
- **A holdout nobody tunes on.** About a fifth of the cases are kept in a
  private repository; the number on the board is measured on them, and only
  the number is published.
- **Mapped to the OWASP Top 10 for Agentic Applications.** Every case
  carries the ASI risk its harm falls under.

## The three sets

| Set | What | Use |
|---|---|---|
| **Official** | Every category a guard can protect with few false positives. Headline section: outside labels. Vendor section: the makers' own suites | The benchmark |
| **Quick** | A fixed tenth of the official public split, every source and verdict represented (about 700 cases) | Between changes, in minutes |
| **Extended** | Everything excluded from the official set, each case with the written reason it is out | So nothing is hidden |

A category is out of the official set only when no tool can protect it
without many false positives, when the test itself is flawed (card numbers
the dataset invented), or when it is text with no action after it. The
reasons are listed in `src/scope/reasons.ts` and `DATASHEET.md`.

## Run it

```bash
npm ci --ignore-scripts
npm run bench -- --set quick                       # node9, the quick set
npm run bench -- --adapter hook --hook-name mytool --hook-cmd "mytool hook"
npm run report -- <run> [<run> ...] [--split public|holdout] [--set extended] [--owasp] [--ci]
```

Put your own tool on the board: [CONTRIBUTING.md](CONTRIBUTING.md).

## What is in the repository

| Path | What |
|---|---|
| `corpus/` | The cases, one JSON object per line, one file per channel |
| `profiles/` | The settings a case runs in (paths declared off-limits, an outbound policy, decoys), tool-neutral |
| `sources/` | The pinned snapshot of each outside source, with its licence and notice |
| `src/convert/`, `src/sources/` | How each source became cases, and how it was fetched |
| `src/scope/` | The sets, the reasons, the OWASP rule |
| `adapters/` | How each measured tool is run |
| `results/` | Every published run, case by case |
| `viewer/index.html` | Every case in a browser, no secret shown |
| `DATASHEET.md` | The corpus as a dataset: composition, collection, labels, limits |
| `CHANGELOG.md` | Every corpus version and what changed |

## Limits

Stated in full in `DATASHEET.md`, section 9. The two that matter most: the
benchmark replays calls, it does not run an agent (whether a model attempts
the action is another benchmark's question), and several labels are
node9-bench's reading of a source's data, checked blind but still ours.

## Licence and citation

Code: Apache-2.0 (`LICENSE`). node9-bench's own data: CC-BY-4.0
(`LICENSE-DATA`). Each outside source keeps its own licence
(`sources/<name>/LICENSE`, `NOTICE`). How to cite: `CITATION.cff`.
