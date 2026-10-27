# node9-gate-soft 2.41.3

- Method: node9 check / node9 log from @node9/proxy@2.41.3, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=soft, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.1.1 (SHA-256 `712fdf856bed4fec5152a0180d4b9d7c2b3c99fc91636cfef9d60eace1739ed3`)
- Measured: 2026-10-27T02:25:39.148Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1262 | 38.4% (139/362) | n/a (0/0) | 0.0% (0/900) | 100.0% | 69.2% | 93.5% (130/139) | 0 |
| secrets | 2462 | 49.3% (291/590) | n/a (0/0) | 1.2% (22/1872) | 93.0% | 74.1% | 26.8% (78/291) | 0 |
| shell | 2000 | 35.6% (298/837) | n/a (0/0) | 0.3% (4/1163) | 98.7% | 67.6% | 100.0% (298/298) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 168 | n/a (0/0) | 21.9% (32/146) | 18.2% (4/22) | 88.9% | 51.9% | 56.3% (18/32) | 0 |
| all | 6682 | 46.3% (949/2049) | 21.9% (32/146) | 0.7% (30/4487) | 97.0% | 72.0% | 66.2% (649/981) | 0 |
| all, holdout split | 1315 | 45.5% (187/411) | 26.1% (6/23) | 0.9% (8/881) | 96.0% | 71.8% | 65.8% (127/193) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1986 | n/a (0/0) | 51.7% (501/969) | 1.3% (13/1017) | 97.5% | 75.2% | 100.0% (501/501) | 0 |
| pii | 2055 | 15.3% (146/957) | n/a (0/0) | 0.0% (0/1098) | 100.0% | 57.6% | 93.8% (137/146) | 0 |
| secrets | 3669 | 24.8% (325/1309) | n/a (0/0) | 1.2% (28/2360) | 92.1% | 61.8% | 24.0% (78/325) | 0 |
| shell | 2000 | 35.6% (298/837) | n/a (0/0) | 0.3% (4/1163) | 98.7% | 67.6% | 100.0% (298/298) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 259 | 27.6% (8/29) | 21.9% (32/146) | 15.5% (13/84) | 75.5% | 53.7% | 50.0% (20/40) | 0 |
| all | 10420 | 29.4% (998/3392) | 47.8% (533/1115) | 1.0% (58/5913) | 96.3% | 66.5% | 75.7% (1159/1531) | 0 |
| all, holdout split | 2034 | 27.7% (190/685) | 47.8% (96/201) | 1.1% (13/1148) | 95.7% | 65.6% | 76.2% (218/286) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 35.0% (7/20) | 51.6% (507/983) | 1.3 (14/1051) | 98.6% (507/514) | 0 | 452.0 | 543.1 |
| pii | 2149 | 19.2% (195/1014) | n/a (0/0) | 0.4 (4/1135) | 95.4% (186/195) | 0 | 478.0 | 553.3 |
| secrets | 3996 | 32.8% (500/1523) | 100.0% (39/39) | 1.3 (31/2434) | 52.9% (285/539) | 0 | 461.3 | 514.2 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 441.7 | 584.2 |
| shell | 2670 | 25.9% (301/1164) | 0.0% (0/10) | 0.3 (4/1496) | 99.7% (300/301) | 0 | 462.5 | 880.4 |
| package | 517 | 84.7% (221/261) | n/a (0/0) | 0.0 (0/256) | 56.6% (125/221) | 0 | 951.6 | 1666.8 |
| mcp | 434 | 22.5% (18/80) | 33.0% (62/188) | 7.8 (13/166) | 66.3% (53/80) | 0 | 462.3 | 505.7 |
| all | 11973 | 32.3% (1345/4170) | 50.1% (615/1227) | 1.0 (66/6576) | 79.9% (1566/1960) | 0 | 464.3 | 1211.9 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1659 | 40.0% (6/15) | 51.8% (416/803) | 1.2 (10/841) | 98.6% (416/422) | 0 | 451.5 | 544.5 |
| pii | 1723 | 18.9% (154/815) | n/a (0/0) | 0.3 (3/908) | 95.5% (147/154) | 0 | 478.2 | 552.9 |
| secrets | 3211 | 33.8% (407/1204) | 100.0% (34/34) | 1.2 (24/1973) | 51.9% (229/441) | 0 | 461.3 | 514.1 |
| egress | 120 | 94.8% (73/77) | 100.0% (7/7) | 0.0 (0/36) | 100.0% (80/80) | 0 | 442.0 | 584.2 |
| shell | 2126 | 26.2% (243/926) | 0.0% (0/7) | 0.2 (2/1193) | 99.6% (242/243) | 0 | 462.4 | 878.5 |
| package | 399 | 83.7% (170/203) | n/a (0/0) | 0.0 (0/196) | 57.1% (97/170) | 0 | 955.7 | 1673.3 |
| mcp | 393 | 23.0% (17/74) | 34.1% (56/164) | 7.7 (12/155) | 67.1% (49/73) | 0 | 462.3 | 505.7 |
| all | 9631 | 32.3% (1070/3314) | 50.5% (513/1015) | 1.0 (51/5302) | 79.6% (1260/1583) | 0 | 464.2 | 1205.6 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 395 | 20.0% (1/5) | 50.6% (91/180) | 1.9 (4/210) | 98.9% (91/92) | 0 | 453.7 | 538.9 |
| pii | 426 | 20.6% (41/199) | n/a (0/0) | 0.4 (1/227) | 95.1% (39/41) | 0 | 476.9 | 2469.1 |
| secrets | 785 | 29.2% (93/319) | 100.0% (5/5) | 1.5 (7/461) | 57.1% (56/98) | 0 | 461.4 | 518.4 |
| egress | 33 | 96.8% (30/31) | n/a (0/0) | 0.0 (0/2) | 100.0% (30/30) | 0 | 434.7 | 488.6 |
| shell | 544 | 24.4% (58/238) | 0.0% (0/3) | 0.7 (2/303) | 100.0% (58/58) | 0 | 462.8 | 937.8 |
| package | 118 | 87.9% (51/58) | n/a (0/0) | 0.0 (0/60) | 54.9% (28/51) | 0 | 931.7 | 1666.8 |
| mcp | 41 | 16.7% (1/6) | 25.0% (6/24) | 9.1 (1/11) | 57.1% (4/7) | 0 | 463.8 | 518.3 |
| all | 2342 | 32.1% (275/856) | 48.1% (102/212) | 1.2 (15/1274) | 81.2% (306/377) | 0 | 465.0 | 1264.8 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 99.7% (297/298) | 89.7% (52/58) | 4.9% (7/143) | 98.0% | 96.6% | 99.7% (348/349) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 0.0% (0/42) | 100.0% | 100.0% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 27.6% (8/29) | n/a (0/0) | 14.5% (9/62) | 47.1% | 56.5% | 25.0% (2/8) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 21.9% (32/146) | 18.2% (4/22) | 88.9% | 51.9% | 56.3% (18/32) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 10.0% (1/10) | 0.0% (0/5) | 100.0% | 55.0% | 100.0% (1/1) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 90.6% (29/32) | 0.0% (0/55) | 100.0% | 95.3% | 100.0% (29/29) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 600 | 17.7% (53/300) | n/a (0/0) | 0.0% (0/300) | 100.0% | 58.8% | 84.9% (45/53) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 32.0% (32/100) | n/a (0/0) | 2.4% (1/42) | 97.0% | 64.8% | 50.0% (16/32) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 35.6% (298/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 100.0% (298/298) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.0% (0/565) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 0.7% (4/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 600 | n/a (0/0) | 59.7% (179/300) | 4.3% (13/300) | 93.2% | 77.7% | 100.0% (179/179) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 240 | n/a (0/0) | 72.5% (174/240) | n/a (0/0) | 100.0% | n/a | 100.0% (174/174) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 600 | 27.7% (83/300) | n/a (0/0) | 0.0% (0/300) | 100.0% | 63.8% | 96.4% (80/83) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 600 | 4.7% (14/300) | n/a (0/0) | 0.0% (0/300) | 100.0% | 52.3% | 100.0% (14/14) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 104 | 100.0% (104/104) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 55.8% (58/104) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 60 | 78.3% (47/60) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 48.9% (23/47) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 60 | 56.7% (34/60) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 38.2% (13/34) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 3511 | 27.9% (321/1151) | n/a (0/0) | 1.2% (28/2360) | 92.0% | 63.4% | 23.7% (76/321) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 0.0% (0/10) | 0.0% (0/17) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 600 | 0.0% (0/300) | n/a (0/0) | 0.0% (0/300) | n/a | 50.0% | n/a (0/0) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 11.4% (8/70) | 0.0% (0/2) | 0.0% (0/27) | 100.0% | 55.6% | 37.5% (3/8) | 0 |

