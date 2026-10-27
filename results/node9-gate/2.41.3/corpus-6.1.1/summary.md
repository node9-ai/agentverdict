# node9-gate 2.41.3

- Method: node9 check / node9 log from @node9/proxy@2.41.3, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.1.1 (SHA-256 `712fdf856bed4fec5152a0180d4b9d7c2b3c99fc91636cfef9d60eace1739ed3`)
- Measured: 2026-10-26T19:46:27.361Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1262 | 38.4% (139/362) | n/a (0/0) | 0.0% (0/900) | 100.0% | 69.2% | 93.5% (130/139) | 0 |
| secrets | 2462 | 49.3% (291/590) | n/a (0/0) | 1.2% (22/1872) | 93.0% | 74.1% | 26.8% (78/291) | 0 |
| shell | 2000 | 73.8% (618/837) | n/a (0/0) | 1.9% (22/1163) | 96.6% | 86.0% | 48.2% (298/618) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| all | 6682 | 61.9% (1269/2049) | 86.3% (126/146) | 1.2% (55/4487) | 96.2% | 81.2% | 53.3% (743/1395) | 0 |
| all, holdout split | 1315 | 62.8% (258/411) | 91.3% (21/23) | 1.9% (17/881) | 94.3% | 81.2% | 50.9% (142/279) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1986 | n/a (0/0) | 51.7% (501/969) | 1.3% (13/1017) | 97.5% | 75.2% | 100.0% (501/501) | 0 |
| pii | 2055 | 15.3% (146/957) | n/a (0/0) | 0.0% (0/1098) | 100.0% | 57.6% | 93.8% (137/146) | 0 |
| secrets | 3669 | 24.8% (325/1309) | n/a (0/0) | 1.2% (28/2360) | 92.1% | 61.8% | 24.0% (78/325) | 0 |
| shell | 2000 | 73.8% (618/837) | n/a (0/0) | 1.9% (22/1163) | 96.6% | 86.0% | 48.2% (298/618) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 259 | 27.6% (8/29) | 86.3% (126/146) | 23.8% (20/84) | 87.0% | 76.4% | 85.1% (114/134) | 0 |
| all | 10420 | 38.9% (1318/3392) | 56.2% (627/1115) | 1.4% (83/5913) | 95.9% | 70.9% | 64.4% (1253/1945) | 0 |
| all, holdout split | 2034 | 38.1% (261/685) | 55.2% (111/201) | 1.9% (22/1148) | 94.4% | 70.0% | 62.6% (233/372) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 40.0% (8/20) | 51.6% (507/983) | 1.3 (14/1051) | 98.4% (507/515) | 0 | 415.6 | 509.0 |
| pii | 2149 | 19.2% (195/1014) | n/a (0/0) | 0.4 (4/1135) | 95.4% (186/195) | 0 | 465.1 | 524.5 |
| secrets | 3996 | 32.9% (501/1523) | 100.0% (39/39) | 1.3 (31/2434) | 52.6% (284/540) | 0 | 462.3 | 569.5 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 394.5 | 550.6 |
| shell | 2670 | 60.0% (698/1164) | 100.0% (10/10) | 3.8 (57/1496) | 43.8% (310/708) | 0 | 461.6 | 1046.2 |
| package | 517 | 84.7% (221/261) | n/a (0/0) | 0.8 (2/256) | 56.6% (125/221) | 0 | 1052.1 | 2195.7 |
| mcp | 434 | 25.0% (20/80) | 87.8% (165/188) | 12.0 (20/166) | 84.3% (156/185) | 0 | 440.1 | 483.4 |
| all | 11973 | 41.9% (1746/4170) | 59.3% (728/1227) | 1.9 (128/6576) | 67.8% (1678/2474) | 0 | 459.8 | 1270.9 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1659 | 40.0% (6/15) | 51.8% (416/803) | 1.2 (10/841) | 98.6% (416/422) | 0 | 415.2 | 516.4 |
| pii | 1723 | 18.9% (154/815) | n/a (0/0) | 0.3 (3/908) | 95.5% (147/154) | 0 | 465.2 | 520.6 |
| secrets | 3211 | 33.9% (408/1204) | 100.0% (34/34) | 1.2 (24/1973) | 51.8% (229/442) | 0 | 462.3 | 565.9 |
| egress | 120 | 94.8% (73/77) | 100.0% (7/7) | 0.0 (0/36) | 100.0% (80/80) | 0 | 391.3 | 516.7 |
| shell | 2126 | 59.9% (555/926) | 100.0% (7/7) | 3.5 (42/1193) | 44.3% (249/562) | 0 | 461.5 | 1022.4 |
| package | 399 | 83.7% (170/203) | n/a (0/0) | 1.0 (2/196) | 57.1% (97/170) | 0 | 1055.9 | 2590.1 |
| mcp | 393 | 25.7% (19/74) | 87.2% (143/164) | 10.3 (16/155) | 84.0% (136/162) | 0 | 440.4 | 484.9 |
| all | 9631 | 41.8% (1385/3314) | 59.8% (607/1015) | 1.8 (97/5302) | 68.0% (1354/1992) | 0 | 459.6 | 1268.3 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 395 | 40.0% (2/5) | 50.6% (91/180) | 1.9 (4/210) | 97.8% (91/93) | 0 | 418.7 | 507.8 |
| pii | 426 | 20.6% (41/199) | n/a (0/0) | 0.4 (1/227) | 95.1% (39/41) | 0 | 465.0 | 528.3 |
| secrets | 785 | 29.2% (93/319) | 100.0% (5/5) | 1.5 (7/461) | 56.1% (55/98) | 0 | 462.4 | 607.3 |
| egress | 33 | 96.8% (30/31) | n/a (0/0) | 0.0 (0/2) | 100.0% (30/30) | 0 | 407.9 | 551.0 |
| shell | 544 | 60.1% (143/238) | 100.0% (3/3) | 5.0 (15/303) | 41.8% (61/146) | 0 | 462.5 | 1179.2 |
| package | 118 | 87.9% (51/58) | n/a (0/0) | 0.0 (0/60) | 54.9% (28/51) | 0 | 1026.4 | 1900.4 |
| mcp | 41 | 16.7% (1/6) | 91.7% (22/24) | 36.4 (4/11) | 87.0% (20/23) | 0 | 436.8 | 453.8 |
| all | 2342 | 42.2% (361/856) | 57.1% (121/212) | 2.4 (31/1274) | 67.2% (324/482) | 0 | 460.4 | 1335.0 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 99.7% (297/298) | 89.7% (52/58) | 4.9% (7/143) | 98.0% | 96.6% | 99.7% (348/349) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 4.8% (2/42) | 94.7% | 97.6% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 27.6% (8/29) | n/a (0/0) | 14.5% (9/62) | 47.1% | 56.5% | 25.0% (2/8) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/5) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 90.6% (29/32) | 0.0% (0/55) | 100.0% | 95.3% | 100.0% (29/29) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 600 | 17.7% (53/300) | n/a (0/0) | 0.0% (0/300) | 100.0% | 58.8% | 84.9% (45/53) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 40.0% (40/100) | n/a (0/0) | 2.4% (1/42) | 97.6% | 68.8% | 40.0% (16/40) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 73.8% (618/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 48.2% (298/618) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.4% (2/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 3.3% (20/598) | 0.0% | n/a | n/a (0/0) | 0 |
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
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/17) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 600 | 21.7% (65/300) | n/a (0/0) | 11.7% (35/300) | 65.0% | 55.0% | 0.0% (0/65) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 22.9% (16/70) | 0.0% (0/2) | 0.0% (0/27) | 100.0% | 61.1% | 12.5% (2/16) | 0 |

