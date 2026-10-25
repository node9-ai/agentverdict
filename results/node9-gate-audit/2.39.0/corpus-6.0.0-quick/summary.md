# node9-gate-audit 2.39.0

- Method: node9 check / node9 log from @node9/proxy@2.39.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=audit, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.0.0 (SHA-256 `239b50fa201b3d26a33874a055e0897b318253ae768c2673e62418088c5e683f`)
- Measured: 2026-10-25T14:57:14.389Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 223 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 0.0% (0/30) | n/a (0/0) | 0.0% (0/73) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 202 | 0.0% (0/49) | n/a (0/0) | 0.0% (0/153) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 161 | 0.0% (0/67) | n/a (0/0) | 0.0% (0/94) | n/a | 50.0% | n/a (0/0) | 0 |
| package | 38 | 0.0% (0/23) | n/a (0/0) | 0.0% (0/15) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 18 | n/a (0/0) | 0.0% (0/13) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |
| all | 549 | 0.0% (0/169) | 0.0% (0/13) | 0.0% (0/367) | n/a | 50.0% | n/a (0/0) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 0.0% (0/30) | n/a (0/0) | 0.0% (0/73) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 202 | 0.0% (0/49) | n/a (0/0) | 0.0% (0/153) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 161 | 0.0% (0/67) | n/a (0/0) | 0.0% (0/94) | n/a | 50.0% | n/a (0/0) | 0 |
| package | 38 | 0.0% (0/23) | n/a (0/0) | 0.0% (0/15) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 18 | n/a (0/0) | 0.0% (0/13) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |
| all | 549 | 0.0% (0/169) | 0.0% (0/13) | 0.0% (0/367) | n/a | 50.0% | n/a (0/0) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 491.0 | 10113.2 |
| pii | 118 | 0.0% (0/39) | n/a (0/0) | 0.0 (0/79) | n/a (0/0) | 0 | 499.8 | 1757.0 |
| secrets | 258 | 0.0% (0/76) | 50.0% (5/10) | 0.0 (0/172) | 100.0% (5/5) | 0 | 477.0 | 1156.0 |
| egress | 19 | 0.0% (0/8) | 0.0% (0/5) | 0.0 (0/6) | n/a (0/0) | 0 | 1898.9 | 2572.6 |
| shell | 172 | 0.0% (0/67) | 0.0% (0/5) | 0.0 (0/100) | n/a (0/0) | 0 | 472.3 | 1024.7 |
| package | 48 | 0.0% (0/23) | n/a (0/0) | 0.0 (0/25) | n/a (0/0) | 0 | 1070.3 | 2154.4 |
| mcp | 40 | 0.0% (0/3) | 0.0% (0/23) | 0.0 (0/14) | n/a (0/0) | 0 | 492.3 | 817.5 |
| all | 694 | 0.0% (0/216) | 16.7% (8/48) | 0.0 (0/430) | 100.0% (8/8) | 0 | 489.9 | 2241.1 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 491.0 | 10113.2 |
| pii | 118 | 0.0% (0/39) | n/a (0/0) | 0.0 (0/79) | n/a (0/0) | 0 | 499.8 | 1757.0 |
| secrets | 258 | 0.0% (0/76) | 50.0% (5/10) | 0.0 (0/172) | 100.0% (5/5) | 0 | 477.0 | 1156.0 |
| egress | 19 | 0.0% (0/8) | 0.0% (0/5) | 0.0 (0/6) | n/a (0/0) | 0 | 1898.9 | 2572.6 |
| shell | 172 | 0.0% (0/67) | 0.0% (0/5) | 0.0 (0/100) | n/a (0/0) | 0 | 472.3 | 1024.7 |
| package | 48 | 0.0% (0/23) | n/a (0/0) | 0.0 (0/25) | n/a (0/0) | 0 | 1070.3 | 2154.4 |
| mcp | 40 | 0.0% (0/3) | 0.0% (0/23) | 0.0 (0/14) | n/a (0/0) | 0 | 492.3 | 817.5 |
| all | 694 | 0.0% (0/216) | 16.7% (8/48) | 0.0 (0/430) | 100.0% (8/8) | 0 | 489.9 | 2241.1 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 85 | 0.0% (0/35) | 40.0% (8/20) | 0.0% (0/30) | 100.0% | 57.3% | 100.0% (8/8) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 10 | 0.0% (0/5) | n/a (0/0) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 18 | n/a (0/0) | 0.0% (0/13) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 8 | n/a (0/0) | 0.0% (0/5) | 0.0% (0/3) | n/a | 50.0% | n/a (0/0) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 11 | n/a (0/0) | 0.0% (0/5) | 0.0% (0/6) | n/a | 50.0% | n/a (0/0) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 35 | 0.0% (0/11) | n/a (0/0) | 0.0% (0/24) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 13 | 0.0% (0/8) | n/a (0/0) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 67 | 0.0% (0/67) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 46 | n/a (0/0) | n/a (0/0) | 0.0% (0/46) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 48 | n/a (0/0) | n/a (0/0) | 0.0% (0/48) | n/a | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 15 | n/a (0/0) | n/a (0/0) | 0.0% (0/15) | n/a | n/a | n/a (0/0) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 38 | 0.0% (0/14) | n/a (0/0) | 0.0% (0/24) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 33 | 0.0% (0/8) | n/a (0/0) | 0.0% (0/25) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 8 | 0.0% (0/8) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 5 | 0.0% (0/5) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 5 | 0.0% (0/5) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 199 | 0.0% (0/46) | n/a (0/0) | 0.0% (0/153) | n/a | 50.0% | n/a (0/0) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 8 | 0.0% (0/4) | n/a (0/0) | 0.0% (0/4) | n/a | 50.0% | n/a (0/0) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 5 | n/a (0/0) | n/a (0/0) | 0.0% (0/5) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 10 | n/a (0/0) | 0.0% (0/5) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |

