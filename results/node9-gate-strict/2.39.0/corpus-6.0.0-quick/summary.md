# node9-gate-strict 2.39.0

- Method: node9 check / node9 log from @node9/proxy@2.39.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=strict, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.0.0 (SHA-256 `239b50fa201b3d26a33874a055e0897b318253ae768c2673e62418088c5e683f`)
- Measured: 2026-10-25T14:10:37.432Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 223 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 100.0% (30/30) | n/a (0/0) | 100.0% (73/73) | 29.1% | 50.0% | 40.0% (12/30) | 0 |
| secrets | 202 | 63.3% (31/49) | n/a (0/0) | 0.7% (1/153) | 96.9% | 81.3% | 96.8% (30/31) | 0 |
| shell | 161 | 100.0% (67/67) | n/a (0/0) | 46.8% (44/94) | 60.4% | 76.6% | 83.6% (56/67) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 61.9% (13/21) | 0 |
| mcp | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| all | 549 | 88.2% (149/169) | 100.0% (13/13) | 33.2% (122/367) | 57.0% | 77.9% | 75.3% (122/162) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 100.0% (30/30) | n/a (0/0) | 100.0% (73/73) | 29.1% | 50.0% | 40.0% (12/30) | 0 |
| secrets | 202 | 63.3% (31/49) | n/a (0/0) | 0.7% (1/153) | 96.9% | 81.3% | 96.8% (30/31) | 0 |
| shell | 161 | 100.0% (67/67) | n/a (0/0) | 46.8% (44/94) | 60.4% | 76.6% | 83.6% (56/67) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 61.9% (13/21) | 0 |
| mcp | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| all | 549 | 88.2% (149/169) | 100.0% (13/13) | 33.2% (122/367) | 57.0% | 77.9% | 75.3% (122/162) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 100.0% (5/5) | 0.0 (0/34) | 100.0% (5/5) | 0 | 509.5 | 1065.4 |
| pii | 118 | 100.0% (39/39) | n/a (0/0) | 100.0 (79/79) | 48.7% (19/39) | 0 | 525.0 | 2761.4 |
| secrets | 258 | 76.3% (58/76) | 100.0% (10/10) | 4.1 (7/172) | 95.6% (65/68) | 0 | 553.2 | 3955.1 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 50.0 (3/6) | 100.0% (13/13) | 0 | 469.5 | 633.9 |
| shell | 172 | 100.0% (67/67) | 100.0% (5/5) | 45.0 (45/100) | 77.8% (56/72) | 0 | 978.9 | 13915.5 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 61.9% (13/21) | 0 | 1057.4 | 2433.4 |
| mcp | 40 | 100.0% (3/3) | 95.7% (22/23) | 28.6 (4/14) | 88.0% (22/25) | 0 | 536.1 | 1836.3 |
| all | 694 | 90.7% (196/216) | 97.9% (47/48) | 32.1 (138/430) | 79.4% (193/243) | 0 | 594.4 | 4075.2 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 100.0% (5/5) | 0.0 (0/34) | 100.0% (5/5) | 0 | 509.5 | 1065.4 |
| pii | 118 | 100.0% (39/39) | n/a (0/0) | 100.0 (79/79) | 48.7% (19/39) | 0 | 525.0 | 2761.4 |
| secrets | 258 | 76.3% (58/76) | 100.0% (10/10) | 4.1 (7/172) | 95.6% (65/68) | 0 | 553.2 | 3955.1 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 50.0 (3/6) | 100.0% (13/13) | 0 | 469.5 | 633.9 |
| shell | 172 | 100.0% (67/67) | 100.0% (5/5) | 45.0 (45/100) | 77.8% (56/72) | 0 | 978.9 | 13915.5 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 61.9% (13/21) | 0 | 1057.4 | 2433.4 |
| mcp | 40 | 100.0% (3/3) | 95.7% (22/23) | 28.6 (4/14) | 88.0% (22/25) | 0 | 536.1 | 1836.3 |
| all | 694 | 90.7% (196/216) | 97.9% (47/48) | 32.1 (138/430) | 79.4% (193/243) | 0 | 594.4 | 4075.2 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 85 | 100.0% (35/35) | 100.0% (20/20) | 43.3% (13/30) | 80.9% | 78.3% | 100.0% (55/55) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 10 | 100.0% (5/5) | n/a (0/0) | 0.0% (0/5) | 100.0% | 100.0% | 80.0% (4/5) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 8 | n/a (0/0) | 100.0% (5/5) | 0.0% (0/3) | 100.0% | 100.0% | 100.0% (5/5) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 11 | n/a (0/0) | 80.0% (4/5) | 0.0% (0/6) | 100.0% | 90.0% | 100.0% (4/4) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 35 | 100.0% (11/11) | n/a (0/0) | 100.0% (24/24) | 31.4% | 50.0% | 45.5% (5/11) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 13 | 100.0% (8/8) | n/a (0/0) | 40.0% (2/5) | 80.0% | 80.0% | 37.5% (3/8) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 67 | 100.0% (67/67) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 83.6% (56/67) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 46 | n/a (0/0) | n/a (0/0) | 2.2% (1/46) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 48 | n/a (0/0) | n/a (0/0) | 89.6% (43/48) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 15 | n/a (0/0) | n/a (0/0) | 0.0% (0/15) | n/a | n/a | n/a (0/0) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 38 | 100.0% (14/14) | n/a (0/0) | 100.0% (24/24) | 36.8% | 50.0% | 50.0% (7/14) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 33 | 100.0% (8/8) | n/a (0/0) | 100.0% (25/25) | 24.2% | 50.0% | 25.0% (2/8) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 8 | 100.0% (8/8) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 50.0% (4/8) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 5 | 100.0% (5/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 60.0% (3/5) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 5 | 60.0% (3/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 66.7% (2/3) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 199 | 60.9% (28/46) | n/a (0/0) | 0.7% (1/153) | 96.6% | 80.1% | 100.0% (28/28) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 8 | 100.0% (4/4) | n/a (0/0) | 0.0% (0/4) | 100.0% | 100.0% | 100.0% (4/4) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 5 | n/a (0/0) | n/a (0/0) | 0.0% (0/5) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 10 | n/a (0/0) | 100.0% (5/5) | 20.0% (1/5) | 83.3% | 90.0% | 0.0% (0/5) | 0 |

