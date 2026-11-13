# hol-guard 3.59.0

- Method: hol-guard 3.59.0: the whole Claude Code hook (hol-guard hook --harness claude-code, run directly in place of the installed bridge and its daemon, which serve one HOME), fresh HOME per case, each profile in HOL Guard's settings where it has one, minimal environment, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-08T07:07:33.843Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Retried: 1 case(s) that errored or timed out on the first pass (host load); 1 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| HOL Guard has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| HOL Guard has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| HOL Guard has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| HOL Guard has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| HOL Guard has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| HOL Guard has no setting for the user's organisation, and this call goes inside it | 2 | 0 | 1 |
| HOL Guard has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 100.0% (339/339) | 0.0% | n/a | n/a (0/0) | 0 |
| pii | 1501 | 100.0% (424/424) | n/a (0/0) | 100.0% (1077/1077) | 28.2% | 50.0% | 13.9% (59/424) | 0 |
| secrets | 2920 | 10.2% (73/714) | n/a (0/0) | 1.3% (29/2206) | 71.6% | 54.5% | 32.9% (24/73) | 0 |
| shell | 2000 | 100.0% (837/837) | n/a (0/0) | 86.8% (1009/1163) | 45.3% | 56.6% | 39.3% (329/837) | 0 |
| package | 500 | 100.0% (309/309) | n/a (0/0) | 100.0% (191/191) | 61.8% | 50.0% | 0.0% (0/309) | 0 |
| mcp | 168 | n/a (0/0) | 100.0% (146/146) | 100.0% (21/21) | 87.4% | 50.0% | 0.0% (0/146) | 1 |
| all | 7428 | 71.9% (1643/2284) | 100.0% (146/146) | 53.4% (2666/4997) | 40.2% | 60.1% | 23.0% (412/1789) | 1 |
| all, holdout split | 755 | 52.0% (127/244) | n/a (0/0) | 35.2% (180/511) | 41.4% | 58.4% | 3.1% (4/127) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | 100.0% (1081/1081) | 100.0% (1057/1057) | 50.6% | 50.0% | 0.0% (0/1081) | 0 |
| pii | 2397 | 100.0% (1122/1122) | n/a (0/0) | 100.0% (1275/1275) | 46.8% | 50.0% | 5.5% (62/1122) | 0 |
| secrets | 4358 | 13.1% (204/1553) | n/a (0/0) | 1.1% (31/2805) | 86.8% | 56.0% | 11.8% (24/204) | 0 |
| shell | 2000 | 100.0% (837/837) | n/a (0/0) | 86.8% (1009/1163) | 45.3% | 56.6% | 39.3% (329/837) | 0 |
| package | 500 | 100.0% (309/309) | n/a (0/0) | 100.0% (191/191) | 61.8% | 50.0% | 0.0% (0/309) | 0 |
| mcp | 259 | 100.0% (29/29) | 100.0% (146/146) | 100.0% (83/83) | 67.8% | 50.0% | 0.0% (0/175) | 1 |
| all | 11652 | 65.0% (2501/3850) | 100.0% (1227/1227) | 55.5% (3646/6574) | 50.6% | 59.0% | 11.1% (415/3728) | 1 |
| all, holdout split | 1241 | 51.6% (241/467) | 100.0% (112/112) | 33.2% (220/662) | 61.6% | 63.9% | 1.1% (4/353) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 75.0% (15/20) | 99.9% (1094/1095) | 100.0 (1091/1091) | 0.8% (9/1109) | 0 | 2014.2 | 9704.8 |
| pii | 2491 | 99.4% (1172/1179) | n/a (0/0) | 99.9 (1311/1312) | 5.3% (62/1172) | 0 | 2188.2 | 3242.7 |
| secrets | 4685 | 22.2% (393/1767) | 100.0% (39/39) | 2.7 (77/2879) | 16.4% (71/432) | 0 | 2083.0 | 3093.4 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 76.3 (29/38) | 10.4% (12/115) | 0 | 4318.7 | 12158.3 |
| shell | 2794 | 99.9% (863/864) | 100.0% (10/10) | 88.8 (1384/1559) | 39.4% (344/873) | 361 | 2198.0 | 15359.3 |
| package | 566 | 100.0% (310/310) | n/a (0/0) | 100.0 (256/256) | 0.0% (0/310) | 0 | 2171.2 | 3219.4 |
| mcp | 434 | 100.0% (80/80) | 100.0% (156/156) | 100.0 (164/164) | 3.4% (8/236) | 34 | 2109.1 | 3067.9 |
| all | 13329 | 68.0% (2941/4328) | 99.9% (1306/1307) | 59.1 (4312/7299) | 11.9% (506/4247) | 395 | 2125.9 | 9699.4 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 75.0% (15/20) | 99.9% (982/983) | 100.0 (1051/1051) | 0.9% (9/997) | 0 | 2017.7 | 9748.9 |
| pii | 2149 | 99.3% (1007/1014) | n/a (0/0) | 99.9 (1134/1135) | 5.8% (58/1007) | 0 | 2187.7 | 3242.7 |
| secrets | 3984 | 24.3% (369/1517) | 100.0% (39/39) | 3.0 (74/2428) | 17.4% (71/408) | 0 | 2084.8 | 3093.4 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 76.3 (29/38) | 10.4% (12/115) | 0 | 4318.7 | 12158.3 |
| shell | 2663 | 99.9% (863/864) | 100.0% (7/7) | 88.3 (1317/1492) | 39.2% (341/870) | 300 | 2195.0 | 15809.9 |
| package | 494 | 100.0% (252/252) | n/a (0/0) | 100.0 (242/242) | 0.0% (0/252) | 0 | 2169.8 | 3322.7 |
| mcp | 431 | 100.0% (80/80) | 100.0% (155/155) | 100.0 (163/163) | 3.4% (8/235) | 33 | 2110.0 | 3103.5 |
| all | 11928 | 69.9% (2694/3855) | 99.9% (1190/1191) | 61.2 (4010/6549) | 12.8% (499/3884) | 333 | 2129.3 | 10002.5 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 100.0% (112/112) | 100.0 (40/40) | 0.0% (0/112) | 0 | 1988.9 | 3015.2 |
| pii | 342 | 100.0% (165/165) | n/a (0/0) | 100.0 (177/177) | 2.4% (4/165) | 0 | 2194.1 | 3165.0 |
| secrets | 701 | 9.6% (24/250) | n/a (0/0) | 0.7 (3/451) | 0.0% (0/24) | 0 | 2076.0 | 3089.7 |
| shell | 131 | n/a (0/0) | 100.0% (3/3) | 100.0 (67/67) | 100.0% (3/3) | 61 | 2246.4 | 4174.2 |
| package | 72 | 100.0% (58/58) | n/a (0/0) | 100.0 (14/14) | 0.0% (0/58) | 0 | 2174.6 | 2940.9 |
| mcp | 3 | n/a (0/0) | 100.0% (1/1) | 100.0 (1/1) | 0.0% (0/1) | 1 | 2024.2 | 2045.0 |
| all | 1401 | 52.2% (247/473) | 100.0% (116/116) | 40.3 (302/750) | 1.9% (7/363) | 62 | 2097.2 | 3137.5 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 97.0% (289/298) | 100.0% (58/58) | 87.4% (125/143) | 73.5% | 55.0% | 15.6% (54/347) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 100.0% (42/42) | 46.2% | 50.0% | 0.0% (0/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 100.0% (429/429) | 100.0% (39/39) | 91.7% | 50.0% | 0.0% (0/429) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 100.0% (29/29) | n/a (0/0) | 100.0% (62/62) | 31.9% | 50.0% | 0.0% (0/29) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 100.0% (146/146) | 100.0% (21/21) | 87.4% | 50.0% | 0.0% (0/146) | 1 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 100.0% (4/4) | 71.4% | 50.0% | 0.0% (0/10) | 1 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 100.0% (55/55) | 0.0% | n/a | n/a (0/0) | 32 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 100.0% (339/339) | 0.0% | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 100.0% (339/339) | 0.0% | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 100.0% (347/347) | n/a (0/0) | 100.0% (360/360) | 49.1% | 50.0% | 15.0% (52/347) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 77.0% (77/100) | n/a (0/0) | 76.2% (32/42) | 70.6% | 50.4% | 23.4% (18/77) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 100.0% (837/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 39.3% (329/837) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 72.7% (411/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 100.0% (598/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 100.0% (191/191) | 0.0% | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 100.0% (366/366) | 100.0% (340/340) | 51.8% | 50.0% | 0.0% (0/366) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 100.0% (286/286) | n/a (0/0) | 100.0% | n/a | 0.0% (0/286) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 100.0% (371/371) | n/a (0/0) | 100.0% (361/361) | 50.7% | 50.0% | 8.9% (33/371) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 100.0% (359/359) | n/a (0/0) | 100.0% (356/356) | 50.2% | 50.0% | 0.3% (1/359) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 100.0% (215/215) | n/a (0/0) | 100.0% (198/198) | 52.1% | 50.0% | 0.0% (0/215) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 100.0% (72/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/72) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 100.0% (73/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/73) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 2.5% (34/1383) | n/a (0/0) | 1.1% (31/2805) | 52.3% | 50.7% | 0.0% (0/34) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 0.0% (0/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 100.0% (22/22) | 0.0% | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 88.2% (15/17) | 40.0% | 55.9% | 100.0% (10/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 96.4% (350/363) | 0.0% | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 91.4% (64/70) | 50.0% (1/2) | 77.8% (21/27) | 75.6% | 56.3% | 13.8% (9/65) | 0 |

