# node9-gate 2.55.3

- Method: node9 check / node9 log from @node9/proxy@2.55.3, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review, the profile's gitPolicies as commands.git-* review, sandboxed (bubblewrap: host network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-09T00:43:08.537Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-42-generic
- Retried: 2 case(s) that errored or timed out on the first pass (host load); 2 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| node9 has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| node9 has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1501 | 38.9% (165/424) | n/a (0/0) | 0.1% (1/1077) | 99.4% | 69.4% | 93.3% (154/165) | 0 |
| secrets | 2920 | 46.2% (330/714) | n/a (0/0) | 1.1% (25/2206) | 93.0% | 72.5% | 26.1% (86/330) | 0 |
| shell | 2000 | 89.8% (752/837) | n/a (0/0) | 1.6% (19/1163) | 97.5% | 94.1% | 74.9% (563/752) | 0 |
| package | 500 | 96.4% (298/309) | n/a (0/0) | 0.0% (0/191) | 100.0% | 98.2% | 53.0% (158/298) | 0 |
| mcp | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| all | 7428 | 67.6% (1545/2284) | 86.3% (126/146) | 1.1% (56/4998) | 96.8% | 83.8% | 64.2% (1073/1671) | 0 |
| all, holdout split | 755 | 48.0% (117/244) | n/a (0/0) | 0.4% (2/511) | 98.3% | 73.8% | 62.4% (73/117) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | 53.2% (575/1081) | 1.7% (18/1057) | 97.0% | 75.7% | 100.0% (575/575) | 0 |
| pii | 2397 | 15.8% (177/1122) | n/a (0/0) | 0.1% (1/1275) | 99.4% | 57.8% | 93.8% (166/177) | 0 |
| secrets | 4358 | 24.0% (372/1553) | n/a (0/0) | 1.2% (33/2805) | 91.9% | 61.4% | 23.1% (86/372) | 0 |
| shell | 2000 | 89.8% (752/837) | n/a (0/0) | 1.6% (19/1163) | 97.5% | 94.1% | 74.9% (563/752) | 0 |
| package | 500 | 96.4% (298/309) | n/a (0/0) | 0.0% (0/191) | 100.0% | 98.2% | 53.0% (158/298) | 0 |
| mcp | 259 | 27.6% (8/29) | 86.3% (126/146) | 23.8% (20/84) | 87.0% | 76.4% | 85.1% (114/134) | 0 |
| all | 11652 | 41.7% (1607/3850) | 57.1% (701/1227) | 1.4% (91/6575) | 96.2% | 72.0% | 72.0% (1662/2308) | 0 |
| all, holdout split | 1241 | 27.4% (128/467) | 66.1% (74/112) | 1.2% (8/662) | 96.2% | 66.8% | 74.8% (151/202) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 75.0% (15/20) | 53.1% (581/1095) | 1.7 (19/1091) | 97.5% (581/596) | 0 | 247.9 | 667.5 |
| pii | 2491 | 19.2% (226/1179) | n/a (0/0) | 0.4 (5/1312) | 95.1% (215/226) | 0 | 316.7 | 415.9 |
| secrets | 4685 | 31.4% (554/1767) | 100.0% (39/39) | 1.3 (36/2879) | 49.7% (295/593) | 0 | 246.5 | 331.3 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 293.4 | 527.1 |
| shell | 2794 | 88.6% (1085/1225) | 100.0% (10/10) | 3.8 (59/1559) | 52.8% (578/1095) | 0 | 299.7 | 417.4 |
| package | 566 | 96.5% (299/310) | n/a (0/0) | 0.0 (0/256) | 52.8% (158/299) | 0 | 857.8 | 1471.0 |
| mcp | 434 | 41.3% (33/80) | 89.1% (163/183) | 12.0 (20/166) | 82.1% (161/196) | 5 | 262.5 | 482.1 |
| all | 13329 | 49.4% (2315/4689) | 60.0% (800/1334) | 1.9 (139/7301) | 67.4% (2098/3115) | 5 | 278.6 | 1116.8 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 75.0% (15/20) | 51.6% (507/983) | 1.3 (14/1051) | 97.1% (507/522) | 0 | 247.4 | 765.7 |
| pii | 2149 | 19.3% (196/1014) | n/a (0/0) | 0.4 (5/1135) | 95.4% (187/196) | 0 | 316.6 | 396.0 |
| secrets | 3984 | 33.5% (508/1517) | 100.0% (39/39) | 1.4 (33/2428) | 51.4% (281/547) | 0 | 246.5 | 332.4 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 293.4 | 527.1 |
| shell | 2663 | 89.3% (1039/1164) | 100.0% (7/7) | 3.4 (51/1492) | 55.0% (575/1046) | 0 | 299.8 | 415.9 |
| package | 494 | 95.6% (241/252) | n/a (0/0) | 0.0 (0/242) | 48.5% (117/241) | 0 | 866.6 | 1474.3 |
| mcp | 431 | 41.3% (33/80) | 89.0% (162/182) | 12.2 (20/164) | 82.1% (160/195) | 5 | 262.5 | 482.1 |
| all | 11928 | 51.4% (2135/4155) | 59.3% (722/1218) | 1.9 (123/6550) | 67.8% (1937/2857) | 5 | 279.9 | 1114.5 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 66.1% (74/112) | 12.5 (5/40) | 100.0% (74/74) | 0 | 261.6 | 428.9 |
| pii | 342 | 18.2% (30/165) | n/a (0/0) | 0.0 (0/177) | 93.3% (28/30) | 0 | 317.5 | 430.0 |
| secrets | 701 | 18.4% (46/250) | n/a (0/0) | 0.7 (3/451) | 30.4% (14/46) | 0 | 246.3 | 326.3 |
| shell | 131 | 75.4% (46/61) | 100.0% (3/3) | 11.9 (8/67) | 6.1% (3/49) | 0 | 298.0 | 1142.8 |
| package | 72 | 100.0% (58/58) | n/a (0/0) | 0.0 (0/14) | 70.7% (41/58) | 0 | 763.5 | 1403.9 |
| mcp | 3 | n/a (0/0) | 100.0% (1/1) | 0.0 (0/2) | 100.0% (1/1) | 0 | 257.3 | 327.0 |
| all | 1401 | 33.7% (180/534) | 67.2% (78/116) | 2.1 (16/751) | 62.4% (161/258) | 0 | 257.4 | 1148.2 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 99.7% (297/298) | 89.7% (52/58) | 4.9% (7/143) | 98.0% | 96.6% | 99.7% (348/349) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 0.0% (0/42) | 100.0% | 100.0% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 27.6% (8/29) | n/a (0/0) | 14.5% (9/62) | 47.1% | 56.5% | 25.0% (2/8) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/5) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 100.0% (27/27) | 0.0% (0/55) | 100.0% | 100.0% | 100.0% (27/27) | 5 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 18.4% (64/347) | n/a (0/0) | 0.0% (0/360) | 100.0% | 59.2% | 84.4% (54/64) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 48.0% (48/100) | n/a (0/0) | 2.4% (1/42) | 98.0% | 72.8% | 50.0% (24/48) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 89.8% (752/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 74.9% (563/752) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.4% (2/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 2.8% (17/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 59.8% (219/366) | 5.3% (18/340) | 92.4% | 77.3% | 100.0% (219/219) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 72.7% (208/286) | n/a (0/0) | 100.0% | n/a | 100.0% (208/208) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 27.5% (102/371) | n/a (0/0) | 0.3% (1/361) | 99.0% | 63.6% | 97.1% (99/102) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 4.2% (15/359) | n/a (0/0) | 0.0% (0/356) | 100.0% | 52.1% | 100.0% (15/15) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 63.3% (81/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 94.4% (68/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 41.2% (28/68) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 90.4% (66/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 27.3% (18/66) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 26.6% (368/1383) | n/a (0/0) | 1.2% (33/2805) | 91.8% | 62.7% | 22.8% (84/368) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/17) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | 87.0% (314/361) | n/a (0/0) | 11.0% (40/363) | 88.7% | 88.0% | 0.0% (0/314) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 55.7% (39/70) | 0.0% (0/2) | 0.0% (0/27) | 100.0% | 77.1% | 17.9% (7/39) | 0 |

