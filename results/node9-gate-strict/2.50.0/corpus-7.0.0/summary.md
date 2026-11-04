# node9-gate-strict 2.50.0

- Method: node9 check / node9 log from @node9/proxy@2.50.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=strict, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review, the profile's gitPolicies as commands.git-* review
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-04T01:11:15.796Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Retried: 1 case(s) that errored or timed out on the first pass (host load); 1 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1501 | 100.0% (424/424) | n/a (0/0) | 100.0% (1077/1077) | 28.2% | 50.0% | 38.9% (165/424) | 0 |
| secrets | 2920 | 51.8% (370/714) | n/a (0/0) | 1.1% (24/2206) | 93.9% | 75.4% | 88.6% (328/370) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.2% (526/1163) | 60.4% | 75.4% | 83.4% (670/803) | 0 |
| package | 500 | 86.7% (268/309) | n/a (0/0) | 1.0% (2/191) | 99.3% | 92.8% | 59.0% (158/268) | 0 |
| mcp | 168 | n/a (0/0) | 89.7% (131/146) | 59.1% (13/22) | 91.0% | 65.3% | 89.3% (117/131) | 0 |
| all | 7428 | 81.7% (1865/2284) | 89.7% (131/146) | 32.9% (1642/4998) | 54.9% | 74.6% | 72.0% (1438/1996) | 0 |
| all, holdout split | 755 | 63.9% (156/244) | n/a (0/0) | 35.0% (179/511) | 46.6% | 64.5% | 64.1% (100/156) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | 53.2% (575/1081) | 1.7% (18/1057) | 97.0% | 75.7% | 100.0% (575/575) | 0 |
| pii | 2397 | 100.0% (1122/1122) | n/a (0/0) | 100.0% (1275/1275) | 46.8% | 50.0% | 15.8% (177/1122) | 0 |
| secrets | 4358 | 34.3% (532/1553) | n/a (0/0) | 1.1% (31/2805) | 94.5% | 66.6% | 68.8% (366/532) | 0 |
| shell | 2000 | 95.9% (803/837) | n/a (0/0) | 45.2% (526/1163) | 60.4% | 75.4% | 83.4% (670/803) | 0 |
| package | 500 | 86.7% (268/309) | n/a (0/0) | 1.0% (2/191) | 99.3% | 92.8% | 59.0% (158/268) | 0 |
| mcp | 259 | 51.7% (15/29) | 89.7% (131/146) | 36.9% (31/84) | 82.5% | 73.3% | 81.5% (119/146) | 0 |
| all | 11652 | 71.2% (2740/3850) | 57.5% (706/1227) | 28.6% (1883/6575) | 64.7% | 69.6% | 59.9% (2065/3446) | 0 |
| all, holdout split | 1241 | 57.8% (270/467) | 66.1% (74/112) | 27.9% (185/662) | 65.0% | 65.7% | 52.9% (182/344) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 85.0% (17/20) | 53.6% (587/1095) | 1.9 (21/1091) | 97.2% (587/604) | 0 | 306.3 | 539.4 |
| pii | 2491 | 99.9% (1178/1179) | n/a (0/0) | 100.0 (1312/1312) | 19.2% (226/1178) | 0 | 456.3 | 515.8 |
| secrets | 4685 | 41.7% (737/1767) | 100.0% (39/39) | 1.8 (51/2879) | 74.5% (578/776) | 0 | 349.4 | 480.5 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 50.0 (19/38) | 100.0% (115/115) | 0 | 316.3 | 506.0 |
| shell | 2794 | 85.8% (1051/1225) | 100.0% (10/10) | 36.9 (575/1559) | 70.6% (749/1061) | 0 | 380.8 | 599.1 |
| package | 566 | 86.8% (269/310) | n/a (0/0) | 1.6 (4/256) | 59.1% (159/269) | 0 | 915.7 | 1581.0 |
| mcp | 434 | 55.0% (44/80) | 90.4% (170/188) | 19.3 (32/166) | 76.2% (163/214) | 0 | 330.4 | 381.9 |
| all | 13329 | 72.6% (3404/4689) | 60.7% (813/1339) | 27.6 (2014/7301) | 61.1% (2577/4217) | 0 | 357.5 | 1157.1 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 85.0% (17/20) | 52.2% (513/983) | 1.5 (16/1051) | 96.8% (513/530) | 0 | 305.1 | 538.3 |
| pii | 2149 | 99.9% (1013/1014) | n/a (0/0) | 100.0 (1135/1135) | 19.3% (196/1013) | 0 | 456.3 | 515.8 |
| secrets | 3984 | 45.0% (682/1517) | 100.0% (39/39) | 2.0 (48/2428) | 74.2% (535/721) | 0 | 349.3 | 475.4 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 50.0 (19/38) | 100.0% (115/115) | 0 | 316.3 | 506.0 |
| shell | 2663 | 87.5% (1019/1164) | 100.0% (7/7) | 37.9 (565/1492) | 72.0% (739/1026) | 0 | 380.7 | 594.2 |
| package | 494 | 84.5% (213/252) | n/a (0/0) | 1.7 (4/242) | 55.4% (118/213) | 0 | 918.0 | 1581.0 |
| mcp | 431 | 55.0% (44/80) | 90.4% (169/187) | 18.9 (31/164) | 76.1% (162/213) | 0 | 333.3 | 381.9 |
| all | 11928 | 74.5% (3096/4155) | 60.1% (735/1223) | 27.8 (1818/6550) | 62.1% (2378/3831) | 0 | 357.3 | 1153.3 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 66.1% (74/112) | 12.5 (5/40) | 100.0% (74/74) | 0 | 368.0 | 631.2 |
| pii | 342 | 100.0% (165/165) | n/a (0/0) | 100.0 (177/177) | 18.2% (30/165) | 0 | 455.5 | 515.2 |
| secrets | 701 | 22.0% (55/250) | n/a (0/0) | 0.7 (3/451) | 78.2% (43/55) | 0 | 349.9 | 545.2 |
| shell | 131 | 52.5% (32/61) | 100.0% (3/3) | 14.9 (10/67) | 28.6% (10/35) | 0 | 384.2 | 966.1 |
| package | 72 | 96.6% (56/58) | n/a (0/0) | 0.0 (0/14) | 73.2% (41/56) | 0 | 895.3 | 1621.7 |
| mcp | 3 | n/a (0/0) | 100.0% (1/1) | 50.0 (1/2) | 100.0% (1/1) | 0 | 195.5 | 363.0 |
| all | 1401 | 57.7% (308/534) | 67.2% (78/116) | 26.1 (196/751) | 51.6% (199/386) | 0 | 359.1 | 1162.9 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 100.0% (298/298) | 100.0% (58/58) | 46.2% (66/143) | 84.4% | 76.9% | 99.7% (355/356) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 4.8% (2/42) | 94.7% | 97.6% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 51.7% (15/29) | n/a (0/0) | 29.0% (18/62) | 45.5% | 61.3% | 13.3% (2/15) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 89.7% (131/146) | 59.1% (13/22) | 91.0% | 65.3% | 89.3% (117/131) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 20.0% (1/5) | 90.9% | 90.0% | 100.0% (10/10) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 90.6% (29/32) | 0.0% (0/55) | 100.0% | 95.3% | 100.0% (29/29) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 100.0% (347/347) | n/a (0/0) | 100.0% (360/360) | 49.1% | 50.0% | 18.4% (64/347) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 84.0% (84/100) | n/a (0/0) | 26.2% (11/42) | 88.4% | 78.9% | 29.8% (25/84) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 95.9% (803/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 83.4% (670/803) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 1.4% (8/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 86.6% (518/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 1.0% (2/191) | 0.0% | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 59.8% (219/366) | 5.3% (18/340) | 92.4% | 77.3% | 100.0% (219/219) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 72.7% (208/286) | n/a (0/0) | 100.0% | n/a | 100.0% (208/208) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 100.0% (371/371) | n/a (0/0) | 100.0% (361/361) | 50.7% | 50.0% | 27.5% (102/371) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 100.0% (359/359) | n/a (0/0) | 100.0% (356/356) | 50.2% | 50.0% | 4.2% (15/359) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 100.0% (215/215) | n/a (0/0) | 100.0% (198/198) | 52.1% | 50.0% | 0.0% (0/215) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 63.3% (81/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 81.9% (59/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 47.5% (28/59) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 61.6% (45/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 40.0% (18/45) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 26.2% (362/1383) | n/a (0/0) | 1.1% (31/2805) | 92.1% | 62.5% | 100.0% (362/362) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 29.4% (5/17) | 66.7% | 85.3% | 0.0% (0/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | 63.2% (228/361) | n/a (0/0) | 11.3% (41/363) | 84.8% | 75.9% | 30.7% (70/228) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 62.9% (44/70) | 0.0% (0/2) | 18.5% (5/27) | 89.8% | 71.3% | 29.5% (13/44) | 0 |

