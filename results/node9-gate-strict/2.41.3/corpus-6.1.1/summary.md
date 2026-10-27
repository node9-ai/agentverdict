# node9-gate-strict 2.41.3

- Method: node9 check / node9 log from @node9/proxy@2.41.3, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=strict, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.1.1 (SHA-256 `712fdf856bed4fec5152a0180d4b9d7c2b3c99fc91636cfef9d60eace1739ed3`)
- Measured: 2026-10-26T23:08:30.255Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1262 | 100.0% (362/362) | n/a (0/0) | 100.0% (900/900) | 28.7% | 50.0% | 38.4% (139/362) | 0 |
| secrets | 2462 | 55.6% (328/590) | n/a (0/0) | 1.2% (22/1872) | 93.7% | 77.2% | 88.7% (291/328) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.1% (524/1163) | 60.5% | 75.4% | 40.2% (323/803) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 168 | n/a (0/0) | 89.7% (131/146) | 59.1% (13/22) | 91.0% | 65.3% | 89.3% (117/131) | 0 |
| all | 6682 | 83.7% (1714/2049) | 89.7% (131/146) | 32.5% (1459/4487) | 55.8% | 75.8% | 53.9% (995/1845) | 0 |
| all, holdout split | 1315 | 84.7% (348/411) | 91.3% (21/23) | 34.2% (301/881) | 55.1% | 75.4% | 51.2% (189/369) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1986 | n/a (0/0) | 51.7% (501/969) | 1.3% (13/1017) | 97.5% | 75.2% | 100.0% (501/501) | 0 |
| pii | 2055 | 100.0% (957/957) | n/a (0/0) | 100.0% (1098/1098) | 46.6% | 50.0% | 15.3% (146/957) | 0 |
| secrets | 3669 | 36.6% (479/1309) | n/a (0/0) | 1.2% (28/2360) | 94.5% | 67.7% | 67.8% (325/479) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.1% (524/1163) | 60.5% | 75.4% | 40.2% (323/803) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 259 | 51.7% (15/29) | 89.7% (131/146) | 36.9% (31/84) | 82.5% | 73.3% | 81.5% (119/146) | 0 |
| all | 10420 | 73.0% (2475/3392) | 56.7% (632/1115) | 28.6% (1694/5913) | 64.7% | 70.1% | 49.5% (1539/3107) | 0 |
| all, holdout split | 2034 | 71.4% (489/685) | 55.2% (111/201) | 30.4% (349/1148) | 63.2% | 68.7% | 47.0% (282/600) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 40.0% (8/20) | 52.2% (513/983) | 1.3 (14/1051) | 98.5% (513/521) | 0 | 457.6 | 553.0 |
| pii | 2149 | 99.9% (1013/1014) | n/a (0/0) | 100.0 (1135/1135) | 19.2% (195/1013) | 0 | 488.1 | 968.5 |
| secrets | 3996 | 44.9% (684/1523) | 100.0% (39/39) | 1.9 (47/2434) | 74.1% (536/723) | 0 | 470.8 | 862.2 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 50.0 (19/38) | 100.0% (115/115) | 0 | 447.7 | 845.7 |
| shell | 2670 | 76.5% (890/1164) | 100.0% (10/10) | 38.0 (569/1496) | 36.6% (329/900) | 0 | 463.6 | 926.7 |
| package | 517 | 84.7% (221/261) | n/a (0/0) | 0.8 (2/256) | 56.6% (125/221) | 0 | 977.0 | 2205.2 |
| mcp | 434 | 48.8% (39/80) | 90.4% (170/188) | 19.3 (32/166) | 78.0% (163/209) | 0 | 471.4 | 547.0 |
| all | 11973 | 71.1% (2963/4170) | 60.2% (739/1227) | 27.6 (1818/6576) | 53.4% (1976/3702) | 0 | 471.8 | 1271.5 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1659 | 40.0% (6/15) | 52.4% (421/803) | 1.2 (10/841) | 98.6% (421/427) | 0 | 457.8 | 545.2 |
| pii | 1723 | 100.0% (815/815) | n/a (0/0) | 100.0 (908/908) | 18.9% (154/815) | 0 | 488.0 | 811.9 |
| secrets | 3211 | 45.2% (544/1204) | 100.0% (34/34) | 1.9 (37/1973) | 76.0% (439/578) | 0 | 470.6 | 861.6 |
| egress | 120 | 100.0% (77/77) | 100.0% (7/7) | 52.8 (19/36) | 100.0% (84/84) | 0 | 448.4 | 845.7 |
| shell | 2126 | 76.8% (711/926) | 100.0% (7/7) | 37.0 (442/1193) | 36.9% (265/718) | 0 | 463.6 | 905.2 |
| package | 399 | 83.7% (170/203) | n/a (0/0) | 1.0 (2/196) | 57.1% (97/170) | 0 | 982.2 | 2313.4 |
| mcp | 393 | 51.4% (38/74) | 90.2% (148/164) | 16.8 (26/155) | 76.9% (143/186) | 0 | 471.4 | 549.7 |
| all | 9631 | 71.2% (2361/3314) | 60.8% (617/1015) | 27.2 (1444/5302) | 53.8% (1603/2978) | 0 | 471.6 | 1270.5 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 395 | 40.0% (2/5) | 51.1% (92/180) | 1.9 (4/210) | 97.9% (92/94) | 0 | 457.3 | 561.5 |
| pii | 426 | 99.5% (198/199) | n/a (0/0) | 100.0 (227/227) | 20.7% (41/198) | 0 | 488.8 | 2481.5 |
| secrets | 785 | 43.9% (140/319) | 100.0% (5/5) | 2.2 (10/461) | 66.9% (97/145) | 0 | 472.0 | 878.0 |
| egress | 33 | 100.0% (31/31) | n/a (0/0) | 0.0 (0/2) | 100.0% (31/31) | 0 | 439.9 | 490.6 |
| shell | 544 | 75.2% (179/238) | 100.0% (3/3) | 41.9 (127/303) | 35.2% (64/182) | 0 | 463.2 | 926.7 |
| package | 118 | 87.9% (51/58) | n/a (0/0) | 0.0 (0/60) | 54.9% (28/51) | 0 | 970.4 | 1953.1 |
| mcp | 41 | 16.7% (1/6) | 91.7% (22/24) | 54.5 (6/11) | 87.0% (20/23) | 0 | 471.9 | 522.3 |
| all | 2342 | 70.3% (602/856) | 57.5% (122/212) | 29.4 (374/1274) | 51.5% (373/724) | 0 | 472.6 | 1274.4 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 100.0% (298/298) | 100.0% (58/58) | 45.5% (65/143) | 84.6% | 77.3% | 99.7% (355/356) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 4.8% (2/42) | 94.7% | 97.6% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 51.7% (15/29) | n/a (0/0) | 29.0% (18/62) | 45.5% | 61.3% | 13.3% (2/15) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 89.7% (131/146) | 59.1% (13/22) | 91.0% | 65.3% | 89.3% (117/131) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 20.0% (1/5) | 90.9% | 90.0% | 100.0% (10/10) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 90.6% (29/32) | 0.0% (0/55) | 100.0% | 95.3% | 100.0% (29/29) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 600 | 100.0% (300/300) | n/a (0/0) | 100.0% (300/300) | 50.0% | 50.0% | 17.7% (53/300) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 84.0% (84/100) | n/a (0/0) | 26.2% (11/42) | 88.4% | 78.9% | 28.6% (24/84) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 95.9% (803/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 40.2% (323/803) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 1.1% (6/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 86.6% (518/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 600 | n/a (0/0) | 59.7% (179/300) | 4.3% (13/300) | 93.2% | 77.7% | 100.0% (179/179) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 240 | n/a (0/0) | 72.5% (174/240) | n/a (0/0) | 100.0% | n/a | 100.0% (174/174) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 600 | 100.0% (300/300) | n/a (0/0) | 100.0% (300/300) | 50.0% | 50.0% | 27.7% (83/300) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 600 | 100.0% (300/300) | n/a (0/0) | 100.0% (300/300) | 50.0% | 50.0% | 4.7% (14/300) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 100.0% (215/215) | n/a (0/0) | 100.0% (198/198) | 52.1% | 50.0% | 0.0% (0/215) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 104 | 100.0% (104/104) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 55.8% (58/104) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 60 | 78.3% (47/60) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 48.9% (23/47) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 60 | 56.7% (34/60) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 38.2% (13/34) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 3511 | 27.9% (321/1151) | n/a (0/0) | 1.2% (28/2360) | 92.0% | 63.4% | 100.0% (321/321) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 29.4% (5/17) | 66.7% | 85.3% | 0.0% (0/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 600 | 23.0% (69/300) | n/a (0/0) | 12.3% (37/300) | 65.1% | 55.3% | 0.0% (0/69) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 38.6% (27/70) | 0.0% (0/2) | 11.1% (3/27) | 90.0% | 63.2% | 33.3% (9/27) | 0 |

