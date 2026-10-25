# node9-gate 2.38.0

- Method: node9 check / node9 log from @node9/proxy@2.38.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port
- Corpus: v6.0.0 (SHA-256 `5481d76b2dd6c71ac2b0382baa219d74f5d78c27664b60753fa3f7f778420104`)
- Measured: 2026-10-25T12:07:28.432Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 40.0% (12/30) | n/a (0/0) | 0.0% (0/73) | 100.0% | 70.0% | 91.7% (11/12) | 0 |
| secrets | 202 | 61.2% (30/49) | n/a (0/0) | 0.7% (1/153) | 96.8% | 80.3% | 30.0% (9/30) | 0 |
| shell | 161 | 91.0% (61/67) | n/a (0/0) | 3.2% (3/94) | 95.3% | 93.9% | 88.5% (54/61) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 61.9% (13/21) | 0 |
| mcp | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| all | 549 | 73.4% (124/169) | 100.0% (13/13) | 2.2% (8/367) | 94.5% | 86.5% | 71.5% (98/137) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 40.0% (12/30) | n/a (0/0) | 0.0% (0/73) | 100.0% | 70.0% | 91.7% (11/12) | 0 |
| secrets | 202 | 61.2% (30/49) | n/a (0/0) | 0.7% (1/153) | 96.8% | 80.3% | 30.0% (9/30) | 0 |
| shell | 161 | 91.0% (61/67) | n/a (0/0) | 3.2% (3/94) | 95.3% | 93.9% | 88.5% (54/61) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 61.9% (13/21) | 0 |
| mcp | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| all | 549 | 73.4% (124/169) | 100.0% (13/13) | 2.2% (8/367) | 94.5% | 86.5% | 71.5% (98/137) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 421.9 | 584.9 |
| pii | 118 | 48.7% (19/39) | n/a (0/0) | 1.3 (1/79) | 94.7% (18/19) | 0 | 473.4 | 2172.3 |
| secrets | 258 | 72.4% (55/76) | 100.0% (10/10) | 0.6 (1/172) | 67.7% (44/65) | 0 | 582.4 | 2756.7 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 0.0 (0/6) | 100.0% (13/13) | 0 | 361.8 | 405.1 |
| shell | 172 | 91.0% (61/67) | 100.0% (5/5) | 3.0 (3/100) | 89.4% (59/66) | 0 | 462.2 | 856.1 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 61.9% (13/21) | 0 | 1019.4 | 2111.7 |
| mcp | 40 | 66.7% (2/3) | 95.7% (22/23) | 28.6 (4/14) | 91.7% (22/24) | 0 | 435.1 | 605.1 |
| all | 694 | 76.9% (166/216) | 93.8% (45/48) | 2.1 (9/430) | 81.5% (172/211) | 0 | 482.0 | 2548.7 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 421.9 | 584.9 |
| pii | 118 | 48.7% (19/39) | n/a (0/0) | 1.3 (1/79) | 94.7% (18/19) | 0 | 473.4 | 2172.3 |
| secrets | 258 | 72.4% (55/76) | 100.0% (10/10) | 0.6 (1/172) | 67.7% (44/65) | 0 | 582.4 | 2756.7 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 0.0 (0/6) | 100.0% (13/13) | 0 | 361.8 | 405.1 |
| shell | 172 | 91.0% (61/67) | 100.0% (5/5) | 3.0 (3/100) | 89.4% (59/66) | 0 | 462.2 | 856.1 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 61.9% (13/21) | 0 | 1019.4 | 2111.7 |
| mcp | 40 | 66.7% (2/3) | 95.7% (22/23) | 28.6 (4/14) | 91.7% (22/24) | 0 | 435.1 | 605.1 |
| all | 694 | 76.9% (166/216) | 93.8% (45/48) | 2.1 (9/430) | 81.5% (172/211) | 0 | 482.0 | 2548.7 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 85 | 100.0% (35/35) | 90.0% (18/20) | 3.3% (1/30) | 98.1% | 96.5% | 100.0% (53/53) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 10 | 100.0% (5/5) | n/a (0/0) | 0.0% (0/5) | 100.0% | 100.0% | 80.0% (4/5) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 18 | n/a (0/0) | 100.0% (13/13) | 80.0% (4/5) | 76.5% | 60.0% | 84.6% (11/13) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 8 | n/a (0/0) | 100.0% (5/5) | 0.0% (0/3) | 100.0% | 100.0% | 100.0% (5/5) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 11 | n/a (0/0) | 80.0% (4/5) | 0.0% (0/6) | 100.0% | 90.0% | 100.0% (4/4) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 35 | 45.5% (5/11) | n/a (0/0) | 0.0% (0/24) | 100.0% | 72.7% | 80.0% (4/5) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 13 | 37.5% (3/8) | n/a (0/0) | 0.0% (0/5) | 100.0% | 68.8% | 100.0% (3/3) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 67 | 91.0% (61/67) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 88.5% (54/61) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 46 | n/a (0/0) | n/a (0/0) | 0.0% (0/46) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 48 | n/a (0/0) | n/a (0/0) | 6.3% (3/48) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 15 | n/a (0/0) | n/a (0/0) | 0.0% (0/15) | n/a | n/a | n/a (0/0) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 38 | 50.0% (7/14) | n/a (0/0) | 0.0% (0/24) | 100.0% | 75.0% | 71.4% (5/7) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 33 | 25.0% (2/8) | n/a (0/0) | 0.0% (0/25) | 100.0% | 62.5% | 100.0% (2/2) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 8 | 100.0% (8/8) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 50.0% (4/8) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 5 | 100.0% (5/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 60.0% (3/5) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 5 | 60.0% (3/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 66.7% (2/3) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 199 | 60.9% (28/46) | n/a (0/0) | 0.7% (1/153) | 96.6% | 80.1% | 32.1% (9/28) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 8 | 100.0% (4/4) | n/a (0/0) | 0.0% (0/4) | 100.0% | 100.0% | 100.0% (4/4) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 5 | n/a (0/0) | n/a (0/0) | 0.0% (0/5) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 10 | n/a (0/0) | 100.0% (5/5) | 0.0% (0/5) | 100.0% | 100.0% | 100.0% (5/5) | 0 |

