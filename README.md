# AgentVerdict

An open benchmark for AI agent guards: does the guard stop the harm, and let the work through?

This benchmark replays **13,329 tool calls** a coding agent really makes
(the exact hook payloads Claude Code sends) through the guard under test,
and scores each answer against the right one. Leaked secrets and personal
data, harmful commands and scripts, malicious and typosquatted packages, an
attacker's action after the agent read poisoned content, and dangerous
actions that need a person's approval. On the other side, with the same
weight: ordinary commands, ordinary scripts, ordinary installs, ordinary
documents. A guard that stops everything scores 50%.

The board: [node9.ai/ai-agent-security-benchmark](https://node9.ai/ai-agent-security-benchmark).
Every case, in a browser: [the case viewer](https://node9.ai/ai-agent-security-benchmark/cases).

Built and maintained by [node9](https://node9.ai). node9 is one of the
tools measured here; its results are published like everyone else's,
including where it loses.

Results are in [`results/`](results/): node9 at its three levels today. Every
other measured tool joins after its maker has had two weeks to review its
result (`CONTRIBUTING.md`).

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
  pipelock's agent-egress-bench, agent-guard's agent-guard-bench, MoorAI's
  agentic-security-benchmark) are reported in their own section, never in
  the headline. Where AgentVerdict mapped a source's data to a verdict, it
  says so on the case, and every public label can be disputed in the open.
- **A holdout nobody can rebuild.** 1,401 cases are kept in a private
  repository and drawn in secret from the part of each large source the
  public cases did not take, so rerunning the public fetch scripts does not
  reveal them. Each tool's holdout score is printed beside its public one,
  as a number only: a tool that learned the public cases by heart scores
  worse on the held-out ones.
- **Mapped to the OWASP Top 10 for Agentic Applications.** Every case
  carries the ASI risk its harm falls under.

## The three sets

| Set | What | Use |
|---|---|---|
| **Official** | Every category a guard can protect with few false positives. Headline section: outside labels. Vendor section: the makers' own suites | The benchmark |
| **Quick** | A fixed tenth of the official public split, every source and verdict represented (about 900 cases) | Between changes, in minutes |
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

## Sources and credits

AgentVerdict is built on other people's work. Every case keeps the licence
of the work it came from; the licence texts and notices are in
`sources/<name>/` and in `NOTICE`, and the papers are listed under
`references` in `CITATION.cff`. If you use AgentVerdict, please cite them
too.

| Source | By | Licence | Cases |
|---|---|---|---:|
| [CredData](https://github.com/Samsung/CredData) | Samsung (Yun et al., 2021) | Apache-2.0; each line keeps its repository's licence | 4,188 |
| [RedCode](https://github.com/AI-secure/RedCode) | Guo et al., NeurIPS 2024 Datasets and Benchmarks | CC BY 4.0 | 837 |
| [AgentDojo](https://github.com/ethz-spylab/agentdojo) | Debenedetti et al., ETH Zurich, [NeurIPS 2024](https://openreview.net/forum?id=m1YYAQjO3w) | MIT | 814 (87 with AgentVerdict's labels) |
| [NotInject](https://huggingface.co/datasets/leolee99/NotInject) | Li and Liu, [InjecGuard, 2024](https://arxiv.org/abs/2410.22770) | MIT | 678 |
| [BrowseSafe-Bench](https://huggingface.co/datasets/perplexity-ai/browsesafe-bench) | Perplexity AI, Zhang et al., [2025](https://arxiv.org/abs/2511.20597) | MIT | 706 |
| [Gretel synthetic PII finance](https://huggingface.co/datasets/gretelai/synthetic_pii_finance_multilingual) | Gretel.ai | Apache-2.0 | 732 |
| [Nemotron-PII](https://huggingface.co/datasets/nvidia/Nemotron-PII) | NVIDIA | CC BY 4.0 | 707 |
| [OpenPII 1M](https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1m) | Ai4Privacy | CC BY 4.0 | 715 |
| [agent-guard-bench](https://github.com/CASEY-OS/agent-guard-bench) | Casey Rose | MIT | 724 |
| [NL2SH-ALFA](https://huggingface.co/datasets/westenfelder/NL2SH-ALFA) | Westenfelder et al., MIT-ALFA, [NAACL 2025](https://aclanthology.org/2025.naacl-long.555/) | MIT | 565 |
| [MBPP](https://huggingface.co/datasets/google-research-datasets/mbpp) | Google Research, Austin et al., [2021](https://arxiv.org/abs/2108.07732) | CC BY 4.0 | 499 |
| [PII-TRACE](https://huggingface.co/datasets/perplexity-ai/PII-TRACE) | Perplexity AI, Zhang et al., [2026](https://arxiv.org/abs/2609.22200) | MIT | 413 |
| [InjecAgent](https://github.com/uiuc-kang-lab/InjecAgent) | Zhan et al., UIUC, [2024](https://arxiv.org/abs/2403.02691) | MIT | 286 |
| [top-pypi-packages](https://github.com/hugovk/top-pypi-packages) and the [npm registry's download counts](https://github.com/npm/registry/blob/main/docs/download-counts.md) | Hugo van Kemenade; npm | none stated; package names and download counts only | 191 |
| [agent-egress-bench](https://github.com/luckyPipewrench/agent-egress-bench) | luckyPipewrench (pipelock) | Apache-2.0 | 142 |
| [OpenSSF malicious-packages](https://github.com/ossf/malicious-packages) | OpenSSF | Apache-2.0 | 164 |
| [Exercism Bash track](https://github.com/exercism/bash) | Exercism | MIT | 99 |
| [agentic-security-benchmark](https://github.com/gitayg/agentic-security-benchmark) | Itay Glick (MoorAI) | Apache-2.0 | 99 |
| [Malicious software packages dataset](https://github.com/DataDog/malicious-software-packages-dataset) | Datadog Security Labs | Apache-2.0 | 72 |
| [typomind](https://github.com/ldklab/typomind-release) | Neupane et al., [USENIX Security 2023](https://www.usenix.org/conference/usenixsecurity23/presentation/neupane) | MIT | 73 |

The other 625 cases are node9's own tests
([node9-proxy](https://github.com/node9-ai/node9-proxy), Apache-2.0).
Counts are for the whole corpus, holdout included.

## Limits

Stated in full in `DATASHEET.md`, section 9. The two that matter most: the
benchmark replays calls, it does not run an agent (whether a model attempts
the action is another benchmark's question), and several labels are
AgentVerdict's reading of a source's data, open to dispute but still ours.

## Licence and citation

Code: Apache-2.0 (`LICENSE`). AgentVerdict's own data: CC-BY-4.0
(`LICENSE-DATA`). Each outside source keeps its own licence
(`sources/<name>/LICENSE`, `NOTICE`). How to cite: `CITATION.cff`.
