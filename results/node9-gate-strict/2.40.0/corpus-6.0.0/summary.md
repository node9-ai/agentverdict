# node9-gate-strict 2.40.0

- Method: node9 check / node9 log from @node9/proxy@2.40.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=strict, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review
- Corpus: v6.0.0 (SHA-256 `7fdff48a90702be6d4e3764ca3c7ddcf49f64b49d851cb3378e516b6e039eacd`)
- Measured: 2026-10-26T02:47:04.067Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Retried: 3 case(s) that errored or timed out on the first pass (host load); 3 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1262 | 100.0% (362/362) | n/a (0/0) | 100.0% (900/900) | 28.7% | 50.0% | 38.4% (139/362) | 0 |
| secrets | 2462 | 55.6% (328/590) | n/a (0/0) | 1.2% (22/1872) | 93.7% | 77.2% | 88.7% (291/328) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.1% (524/1163) | 60.5% | 75.4% | 83.4% (670/803) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 168 | n/a (0/0) | 89.7% (131/146) | 59.1% (13/22) | 91.0% | 65.3% | 89.3% (117/131) | 0 |
| all | 6682 | 83.7% (1714/2049) | 89.7% (131/146) | 32.5% (1459/4487) | 55.8% | 75.8% | 72.7% (1342/1845) | 0 |
| all, holdout split | 1315 | 84.7% (348/411) | 91.3% (21/23) | 34.2% (301/881) | 55.1% | 75.4% | 69.9% (258/369) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1986 | n/a (0/0) | 51.7% (501/969) | 1.3% (13/1017) | 97.5% | 75.2% | 100.0% (501/501) | 0 |
| pii | 2055 | 100.0% (957/957) | n/a (0/0) | 100.0% (1098/1098) | 46.6% | 50.0% | 15.3% (146/957) | 0 |
| secrets | 3669 | 36.6% (479/1309) | n/a (0/0) | 1.2% (28/2360) | 94.5% | 67.7% | 67.8% (325/479) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.1% (524/1163) | 60.5% | 75.4% | 83.4% (670/803) | 0 |
| package | 451 | 85.0% (221/260) | n/a (0/0) | 0.0% (0/191) | 100.0% | 92.5% | 56.6% (125/221) | 0 |
| mcp | 259 | 51.7% (15/29) | 89.7% (131/146) | 36.9% (31/84) | 82.5% | 73.3% | 81.5% (119/146) | 0 |
| all | 10420 | 73.0% (2475/3392) | 56.7% (632/1115) | 28.6% (1694/5913) | 64.7% | 70.1% | 60.7% (1886/3107) | 0 |
| all, holdout split | 2034 | 71.4% (489/685) | 55.2% (111/201) | 30.4% (349/1148) | 63.2% | 68.7% | 58.5% (351/600) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2036 | 100.0% (7/7) | 52.3% (513/981) | 1.3 (14/1048) | 98.7% (513/520) | 0 | 449.5 | 552.7 |
| pii | 2149 | 99.9% (1013/1014) | n/a (0/0) | 100.0 (1135/1135) | 19.2% (195/1013) | 0 | 475.8 | 569.5 |
| secrets | 3977 | 44.7% (672/1504) | 100.0% (39/39) | 1.9 (47/2434) | 75.1% (534/711) | 0 | 459.9 | 531.5 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 50.0 (19/38) | 100.0% (115/115) | 0 | 461.6 | 584.0 |
| shell | 2037 | 95.9% (810/845) | 100.0% (10/10) | 44.8 (529/1182) | 81.7% (670/820) | 0 | 450.1 | 861.8 |
| package | 515 | 85.0% (221/260) | n/a (0/0) | 0.8 (2/255) | 56.6% (125/221) | 0 | 1027.2 | 1683.4 |
| mcp | 407 | 58.1% (36/62) | 90.4% (170/188) | 20.4 (32/157) | 78.6% (162/206) | 0 | 459.5 | 551.1 |
| all | 11274 | 75.4% (2867/3800) | 60.3% (739/1225) | 28.5 (1778/6249) | 64.2% (2314/3606) | 0 | 461.2 | 1255.5 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 1646 | 100.0% (6/6) | 52.6% (421/801) | 1.2 (10/839) | 98.6% (421/427) | 0 | 449.6 | 556.8 |
| pii | 1723 | 100.0% (815/815) | n/a (0/0) | 100.0 (908/908) | 18.9% (154/815) | 0 | 475.7 | 583.7 |
| secrets | 3195 | 45.0% (535/1188) | 100.0% (34/34) | 1.9 (37/1973) | 77.0% (438/569) | 0 | 460.0 | 533.8 |
| egress | 120 | 100.0% (77/77) | 100.0% (7/7) | 52.8 (19/36) | 100.0% (84/84) | 0 | 461.6 | 584.0 |
| shell | 1624 | 96.4% (647/671) | 100.0% (7/7) | 43.6 (412/946) | 82.3% (538/654) | 0 | 450.3 | 870.7 |
| package | 397 | 84.2% (170/202) | n/a (0/0) | 1.0 (2/195) | 57.1% (97/170) | 0 | 1015.7 | 1683.4 |
| mcp | 368 | 61.4% (35/57) | 90.2% (148/164) | 17.7 (26/147) | 77.6% (142/183) | 0 | 459.5 | 574.1 |
| all | 9073 | 75.8% (2285/3016) | 60.9% (617/1013) | 28.0 (1414/5044) | 64.6% (1874/2902) | 0 | 461.2 | 1250.3 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 390 | 100.0% (1/1) | 51.1% (92/180) | 1.9 (4/209) | 98.9% (92/93) | 0 | 448.9 | 543.5 |
| pii | 426 | 99.5% (198/199) | n/a (0/0) | 100.0 (227/227) | 20.7% (41/198) | 0 | 475.8 | 567.0 |
| secrets | 782 | 43.4% (137/316) | 100.0% (5/5) | 2.2 (10/461) | 67.6% (96/142) | 0 | 459.6 | 528.9 |
| egress | 33 | 100.0% (31/31) | n/a (0/0) | 0.0 (0/2) | 100.0% (31/31) | 0 | 459.0 | 522.2 |
| shell | 413 | 93.7% (163/174) | 100.0% (3/3) | 49.6 (117/236) | 79.5% (132/166) | 0 | 449.6 | 813.4 |
| package | 118 | 87.9% (51/58) | n/a (0/0) | 0.0 (0/60) | 54.9% (28/51) | 0 | 1027.2 | 1773.6 |
| mcp | 39 | 20.0% (1/5) | 91.7% (22/24) | 60.0 (6/10) | 87.0% (20/23) | 0 | 457.6 | 481.9 |
| all | 2201 | 74.2% (582/784) | 57.5% (122/212) | 30.2 (364/1205) | 62.5% (440/704) | 0 | 461.4 | 1259.4 |

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
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 95.9% (803/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 83.4% (670/803) | 0 |
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

