# node9-gate-soft 2.40.0

- Method: node9 check / node9 log from @node9/proxy@2.40.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=soft, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.0.0 (SHA-256 `239b50fa201b3d26a33874a055e0897b318253ae768c2673e62418088c5e683f`)
- Measured: 2026-10-25T15:36:48.155Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 223 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 40.0% (12/30) | n/a (0/0) | 0.0% (0/73) | 100.0% | 70.0% | 91.7% (11/12) | 0 |
| secrets | 202 | 61.2% (30/49) | n/a (0/0) | 0.7% (1/153) | 96.8% | 80.3% | 30.0% (9/30) | 0 |
| shell | 161 | 80.6% (54/67) | n/a (0/0) | 0.0% (0/94) | 100.0% | 90.3% | 100.0% (54/54) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 33.3% (7/21) | 0 |
| mcp | 18 | n/a (0/0) | 15.4% (2/13) | 40.0% (2/5) | 50.0% | 37.7% | 0.0% (0/2) | 0 |
| all | 549 | 69.2% (117/169) | 15.4% (2/13) | 0.8% (3/367) | 97.5% | 82.3% | 68.1% (81/119) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| pii | 103 | 40.0% (12/30) | n/a (0/0) | 0.0% (0/73) | 100.0% | 70.0% | 91.7% (11/12) | 0 |
| secrets | 202 | 61.2% (30/49) | n/a (0/0) | 0.7% (1/153) | 96.8% | 80.3% | 30.0% (9/30) | 0 |
| shell | 161 | 80.6% (54/67) | n/a (0/0) | 0.0% (0/94) | 100.0% | 90.3% | 100.0% (54/54) | 0 |
| package | 38 | 91.3% (21/23) | n/a (0/0) | 0.0% (0/15) | 100.0% | 95.7% | 33.3% (7/21) | 0 |
| mcp | 18 | n/a (0/0) | 15.4% (2/13) | 40.0% (2/5) | 50.0% | 37.7% | 0.0% (0/2) | 0 |
| all | 549 | 69.2% (117/169) | 15.4% (2/13) | 0.8% (3/367) | 97.5% | 82.3% | 68.1% (81/119) | 0 |
| all, holdout split | 0 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 472.2 | 798.5 |
| pii | 118 | 48.7% (19/39) | n/a (0/0) | 1.3 (1/79) | 94.7% (18/19) | 0 | 487.7 | 587.6 |
| secrets | 258 | 72.4% (55/76) | 100.0% (10/10) | 0.6 (1/172) | 67.7% (44/65) | 0 | 471.3 | 1065.8 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 0.0 (0/6) | 100.0% (13/13) | 0 | 452.1 | 483.5 |
| shell | 172 | 80.6% (54/67) | 0.0% (0/5) | 0.0 (0/100) | 100.0% (54/54) | 0 | 495.0 | 2861.0 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 33.3% (7/21) | 0 | 976.7 | 1410.3 |
| mcp | 40 | 66.7% (2/3) | 26.1% (6/23) | 14.3 (2/14) | 75.0% (6/8) | 0 | 470.3 | 1406.1 |
| all | 694 | 73.6% (159/216) | 50.0% (24/48) | 0.9 (4/430) | 79.2% (145/183) | 0 | 479.5 | 1222.4 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 39 | n/a (0/0) | 60.0% (3/5) | 0.0 (0/34) | 100.0% (3/3) | 0 | 472.2 | 798.5 |
| pii | 118 | 48.7% (19/39) | n/a (0/0) | 1.3 (1/79) | 94.7% (18/19) | 0 | 487.7 | 587.6 |
| secrets | 258 | 72.4% (55/76) | 100.0% (10/10) | 0.6 (1/172) | 67.7% (44/65) | 0 | 471.3 | 1065.8 |
| egress | 19 | 100.0% (8/8) | 100.0% (5/5) | 0.0 (0/6) | 100.0% (13/13) | 0 | 452.1 | 483.5 |
| shell | 172 | 80.6% (54/67) | 0.0% (0/5) | 0.0 (0/100) | 100.0% (54/54) | 0 | 495.0 | 2861.0 |
| package | 48 | 91.3% (21/23) | n/a (0/0) | 0.0 (0/25) | 33.3% (7/21) | 0 | 976.7 | 1410.3 |
| mcp | 40 | 66.7% (2/3) | 26.1% (6/23) | 14.3 (2/14) | 75.0% (6/8) | 0 | 470.3 | 1406.1 |
| all | 694 | 73.6% (159/216) | 50.0% (24/48) | 0.9 (4/430) | 79.2% (145/183) | 0 | 479.5 | 1222.4 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 85 | 100.0% (35/35) | 90.0% (18/20) | 3.3% (1/30) | 98.1% | 96.5% | 100.0% (53/53) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 10 | 100.0% (5/5) | n/a (0/0) | 0.0% (0/5) | 100.0% | 100.0% | 60.0% (3/5) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 18 | n/a (0/0) | 15.4% (2/13) | 40.0% (2/5) | 50.0% | 37.7% | 0.0% (0/2) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 8 | n/a (0/0) | 0.0% (0/5) | 0.0% (0/3) | n/a | 50.0% | n/a (0/0) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 11 | n/a (0/0) | 80.0% (4/5) | 0.0% (0/6) | 100.0% | 90.0% | 100.0% (4/4) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 27 | n/a (0/0) | n/a (0/0) | 0.0% (0/27) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 35 | 45.5% (5/11) | n/a (0/0) | 0.0% (0/24) | 100.0% | 72.7% | 80.0% (4/5) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 13 | 37.5% (3/8) | n/a (0/0) | 0.0% (0/5) | 100.0% | 68.8% | 100.0% (3/3) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 67 | 80.6% (54/67) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 100.0% (54/54) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 46 | n/a (0/0) | n/a (0/0) | 0.0% (0/46) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 48 | n/a (0/0) | n/a (0/0) | 0.0% (0/48) | n/a | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 15 | n/a (0/0) | n/a (0/0) | 0.0% (0/15) | n/a | n/a | n/a (0/0) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 38 | 50.0% (7/14) | n/a (0/0) | 0.0% (0/24) | 100.0% | 75.0% | 71.4% (5/7) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 33 | 25.0% (2/8) | n/a (0/0) | 0.0% (0/25) | 100.0% | 62.5% | 100.0% (2/2) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 8 | 100.0% (8/8) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 50.0% (4/8) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 5 | 100.0% (5/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/5) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 5 | 60.0% (3/5) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/3) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 199 | 60.9% (28/46) | n/a (0/0) | 0.7% (1/153) | 96.6% | 80.1% | 32.1% (9/28) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 8 | 100.0% (4/4) | n/a (0/0) | 0.0% (0/4) | 100.0% | 100.0% | 100.0% (4/4) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 5 | n/a (0/0) | n/a (0/0) | 0.0% (0/5) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 10 | n/a (0/0) | 0.0% (0/5) | 0.0% (0/5) | n/a | 50.0% | n/a (0/0) | 0 |

