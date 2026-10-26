# node9-gate 2.40.0

- Method: node9 check / node9 log from @node9/proxy@2.40.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.0.0 (SHA-256 `7fdff48a90702be6d4e3764ca3c7ddcf49f64b49d851cb3378e516b6e039eacd`)
- Measured: 2026-10-25T23:40:25.095Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Retried: 1 case(s) that errored or timed out on the first pass (host load); 1 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1262 | 38.4% (139/362) | n/a (0/0) | 0.0% (0/900) | 100.0% | 69.2% | 93.5% (130/139) | 0 |
| secrets | 2462 | 49.3% (291/590) | n/a (0/0) | 1.2% (22/1872) | 93.0% | 74.1% | 26.8% (78/291) | 0 |
| shell | 2000 | 88.4% (740/837) | n/a (0/0) | 2.1% (25/1163) | 96.7% | 93.1% | 87.2% (645/740) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.5% (1/191) | 99.5% | 92.2% | 56.6% (125/221) | 0 |
| mcp | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| all | 6682 | 67.9% (1391/2049) | 86.3% (126/146) | 1.3% (59/4487) | 96.3% | 83.9% | 71.9% (1090/1517) | 0 |
| all, holdout split | 1315 | 67.2% (276/411) | 91.3% (21/23) | 2.2% (19/881) | 94.0% | 83.1% | 71.0% (211/297) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1986 | n/a (0/0) | 51.7% (501/969) | 1.3% (13/1017) | 97.5% | 75.2% | 100.0% (501/501) | 0 |
| pii | 2055 | 15.3% (146/957) | n/a (0/0) | 0.0% (0/1098) | 100.0% | 57.6% | 93.8% (137/146) | 0 |
| secrets | 3669 | 24.8% (325/1309) | n/a (0/0) | 1.2% (28/2360) | 92.1% | 61.8% | 24.0% (78/325) | 0 |
| shell | 2000 | 88.4% (740/837) | n/a (0/0) | 2.1% (25/1163) | 96.7% | 93.1% | 87.2% (645/740) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.5% (1/191) | 99.5% | 92.2% | 56.6% (125/221) | 0 |
| mcp | 259 | 27.6% (8/29) | 86.3% (126/146) | 23.8% (20/84) | 87.0% | 76.4% | 85.1% (114/134) | 0 |
| all | 10420 | 42.5% (1440/3392) | 56.2% (627/1115) | 1.5% (87/5913) | 96.0% | 72.2% | 77.4% (1600/2067) | 0 |
| all, holdout split | 2034 | 40.7% (279/685) | 55.2% (111/201) | 2.1% (24/1148) | 94.2% | 71.0% | 77.4% (302/390) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2036 | 100.0% (7/7) | 51.7% (507/981) | 1.3 (14/1048) | 98.6% (507/514) | 0 | 616.1 | 3662.7 |
| pii | 2149 | 19.2% (195/1014) | n/a (0/0) | 0.4 (4/1135) | 95.4% (186/195) | 0 | 522.0 | 1847.9 |
| secrets | 3977 | 32.9% (495/1504) | 100.0% (39/39) | 1.3 (31/2434) | 53.2% (284/534) | 0 | 489.6 | 951.6 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 407.6 | 782.4 |
| shell | 2037 | 88.4% (747/845) | 100.0% (10/10) | 2.1 (25/1182) | 86.5% (655/757) | 0 | 475.7 | 893.1 |
| package | 515 | 85.0% (221/260) | n/a (0/0) | 1.2 (3/255) | 56.6% (125/221) | 0 | 1313.9 | 5866.3 |
| mcp | 407 | 30.6% (19/62) | 87.8% (165/188) | 12.7 (20/157) | 84.8% (156/184) | 0 | 591.9 | 3003.6 |
| all | 11274 | 47.0% (1787/3800) | 59.4% (728/1225) | 1.6 (97/6249) | 80.4% (2023/2515) | 0 | 500.1 | 3003.2 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1646 | 100.0% (6/6) | 51.9% (416/801) | 1.2 (10/839) | 98.6% (416/422) | 0 | 620.5 | 3464.9 |
| pii | 1723 | 18.9% (154/815) | n/a (0/0) | 0.3 (3/908) | 95.5% (147/154) | 0 | 523.1 | 1764.8 |
| secrets | 3195 | 34.0% (404/1188) | 100.0% (34/34) | 1.2 (24/1973) | 52.3% (229/438) | 0 | 489.6 | 928.5 |
| egress | 120 | 94.8% (73/77) | 100.0% (7/7) | 0.0 (0/36) | 100.0% (80/80) | 0 | 408.4 | 782.4 |
| shell | 1624 | 89.4% (600/671) | 100.0% (7/7) | 1.7 (16/946) | 86.7% (526/607) | 0 | 475.5 | 893.1 |
| package | 397 | 84.2% (170/202) | n/a (0/0) | 1.0 (2/195) | 57.1% (97/170) | 0 | 1313.9 | 6047.7 |
| mcp | 368 | 31.6% (18/57) | 87.2% (143/164) | 10.9 (16/147) | 84.5% (136/161) | 0 | 591.4 | 4602.4 |
| all | 9073 | 47.2% (1425/3016) | 59.9% (607/1013) | 1.4 (71/5044) | 80.3% (1631/2032) | 0 | 500.1 | 2954.6 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 390 | 100.0% (1/1) | 50.6% (91/180) | 1.9 (4/209) | 98.9% (91/92) | 0 | 603.1 | 4242.1 |
| pii | 426 | 20.6% (41/199) | n/a (0/0) | 0.4 (1/227) | 95.1% (39/41) | 0 | 518.5 | 2011.0 |
| secrets | 782 | 28.8% (91/316) | 100.0% (5/5) | 1.5 (7/461) | 57.3% (55/96) | 0 | 489.6 | 955.7 |
| egress | 33 | 96.8% (30/31) | n/a (0/0) | 0.0 (0/2) | 100.0% (30/30) | 0 | 402.0 | 726.7 |
| shell | 413 | 84.5% (147/174) | 100.0% (3/3) | 3.8 (9/236) | 86.0% (129/150) | 0 | 475.7 | 854.3 |
| package | 118 | 87.9% (51/58) | n/a (0/0) | 1.7 (1/60) | 54.9% (28/51) | 0 | 1298.8 | 4929.6 |
| mcp | 39 | 20.0% (1/5) | 91.7% (22/24) | 40.0 (4/10) | 87.0% (20/23) | 0 | 596.6 | 3003.6 |
| all | 2201 | 46.2% (362/784) | 57.1% (121/212) | 2.2 (26/1205) | 81.2% (392/483) | 0 | 500.2 | 3163.0 |

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
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 88.4% (740/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 87.2% (645/740) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.4% (2/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 3.8% (23/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.5% (1/191) | 0.0% | n/a | n/a (0/0) | 0 |
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

