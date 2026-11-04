# node9-gate-soft 2.50.0

- Method: node9 check / node9 log from @node9/proxy@2.50.0, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, node9 level mode=soft, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review, the profile's gitPolicies as commands.git-* review
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-04T04:31:28.081Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-38-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1501 | 38.9% (165/424) | n/a (0/0) | 0.1% (1/1077) | 99.4% | 69.4% | 93.3% (154/165) | 0 |
| secrets | 2920 | 45.9% (328/714) | n/a (0/0) | 1.1% (24/2206) | 93.2% | 72.4% | 26.2% (86/328) | 0 |
| shell | 2000 | 77.1% (645/837) | n/a (0/0) | 0.6% (7/1163) | 98.9% | 88.2% | 100.0% (645/645) | 0 |
| package | 500 | 86.7% (268/309) | n/a (0/0) | 0.0% (0/191) | 100.0% | 93.4% | 59.0% (158/268) | 0 |
| mcp | 168 | n/a (0/0) | 21.9% (32/146) | 18.2% (4/22) | 88.9% | 51.9% | 56.3% (18/32) | 0 |
| all | 7428 | 61.6% (1406/2284) | 21.9% (32/146) | 0.7% (36/4998) | 97.6% | 79.2% | 73.8% (1061/1438) | 0 |
| all, holdout split | 755 | 47.1% (115/244) | n/a (0/0) | 0.4% (2/511) | 98.3% | 73.4% | 63.5% (73/115) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | 53.2% (575/1081) | 1.7% (18/1057) | 97.0% | 75.7% | 100.0% (575/575) | 0 |
| pii | 2397 | 15.8% (177/1122) | n/a (0/0) | 0.1% (1/1275) | 99.4% | 57.8% | 93.8% (166/177) | 0 |
| secrets | 4358 | 23.6% (366/1553) | n/a (0/0) | 1.1% (31/2805) | 92.2% | 61.2% | 23.5% (86/366) | 0 |
| shell | 2000 | 77.1% (645/837) | n/a (0/0) | 0.6% (7/1163) | 98.9% | 88.2% | 100.0% (645/645) | 0 |
| package | 500 | 86.7% (268/309) | n/a (0/0) | 0.0% (0/191) | 100.0% | 93.4% | 59.0% (158/268) | 0 |
| mcp | 259 | 27.6% (8/29) | 21.9% (32/146) | 15.5% (13/84) | 75.5% | 53.7% | 50.0% (20/40) | 0 |
| all | 11652 | 38.0% (1464/3850) | 49.5% (607/1227) | 1.1% (70/6575) | 96.7% | 69.9% | 79.7% (1650/2071) | 0 |
| all, holdout split | 1241 | 26.3% (123/467) | 66.1% (74/112) | 1.2% (8/662) | 96.1% | 66.4% | 76.6% (151/197) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 35.0% (7/20) | 53.1% (581/1095) | 1.7 (19/1091) | 98.8% (581/588) | 0 | 285.6 | 515.5 |
| pii | 2491 | 19.2% (226/1179) | n/a (0/0) | 0.4 (5/1312) | 95.1% (215/226) | 0 | 425.5 | 2301.6 |
| secrets | 4685 | 30.6% (541/1767) | 100.0% (39/39) | 1.2 (34/2879) | 50.5% (293/580) | 0 | 323.5 | 484.3 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 303.7 | 665.8 |
| shell | 2794 | 66.7% (817/1225) | 0.0% (0/10) | 1.0 (15/1559) | 79.6% (650/817) | 0 | 361.7 | 613.7 |
| package | 566 | 86.5% (268/310) | n/a (0/0) | 0.0 (0/256) | 59.0% (158/268) | 0 | 851.0 | 1727.8 |
| mcp | 434 | 28.7% (23/80) | 33.0% (62/188) | 7.8 (13/166) | 62.4% (53/85) | 0 | 283.3 | 369.7 |
| all | 13329 | 42.3% (1985/4689) | 51.5% (689/1339) | 1.2 (86/7301) | 77.0% (2060/2674) | 0 | 331.0 | 1122.2 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 35.0% (7/20) | 51.6% (507/983) | 1.3 (14/1051) | 98.6% (507/514) | 0 | 283.6 | 515.5 |
| pii | 2149 | 19.3% (196/1014) | n/a (0/0) | 0.4 (5/1135) | 95.4% (187/196) | 0 | 425.2 | 2301.6 |
| secrets | 3984 | 32.8% (498/1517) | 100.0% (39/39) | 1.3 (31/2428) | 52.0% (279/537) | 0 | 323.6 | 484.7 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 303.7 | 665.8 |
| shell | 2663 | 68.2% (794/1164) | 0.0% (0/7) | 0.9 (13/1492) | 81.9% (650/794) | 0 | 361.7 | 604.5 |
| package | 494 | 84.1% (212/252) | n/a (0/0) | 0.0 (0/242) | 55.2% (117/212) | 0 | 853.1 | 1726.6 |
| mcp | 431 | 28.7% (23/80) | 33.2% (62/187) | 7.9 (13/164) | 62.4% (53/85) | 0 | 283.3 | 366.4 |
| all | 11928 | 44.1% (1833/4155) | 50.3% (615/1223) | 1.2 (76/6550) | 77.7% (1903/2448) | 0 | 331.4 | 1118.9 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 66.1% (74/112) | 12.5 (5/40) | 100.0% (74/74) | 0 | 317.2 | 586.7 |
| pii | 342 | 18.2% (30/165) | n/a (0/0) | 0.0 (0/177) | 93.3% (28/30) | 0 | 427.3 | 486.1 |
| secrets | 701 | 17.2% (43/250) | n/a (0/0) | 0.7 (3/451) | 32.6% (14/43) | 0 | 322.5 | 476.3 |
| shell | 131 | 37.7% (23/61) | 0.0% (0/3) | 3.0 (2/67) | 0.0% (0/23) | 0 | 368.0 | 812.8 |
| package | 72 | 96.6% (56/58) | n/a (0/0) | 0.0 (0/14) | 73.2% (41/56) | 0 | 835.2 | 1932.5 |
| mcp | 3 | n/a (0/0) | 0.0% (0/1) | 0.0 (0/2) | n/a (0/0) | 0 | 282.9 | 380.9 |
| all | 1401 | 28.5% (152/534) | 63.8% (74/116) | 1.3 (10/751) | 69.5% (157/226) | 0 | 327.6 | 1210.5 |

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
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 18.4% (64/347) | n/a (0/0) | 0.0% (0/360) | 100.0% | 59.2% | 84.4% (54/64) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 33.0% (33/100) | n/a (0/0) | 2.4% (1/42) | 97.1% | 65.3% | 51.5% (17/33) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 77.1% (645/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 100.0% (645/645) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.0% (0/565) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 1.2% (7/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 59.8% (219/366) | 5.3% (18/340) | 92.4% | 77.3% | 100.0% (219/219) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 72.7% (208/286) | n/a (0/0) | 100.0% | n/a | 100.0% (208/208) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 27.5% (102/371) | n/a (0/0) | 0.3% (1/361) | 99.0% | 63.6% | 97.1% (99/102) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 4.2% (15/359) | n/a (0/0) | 0.0% (0/356) | 100.0% | 52.1% | 100.0% (15/15) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 63.3% (81/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 81.9% (59/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 47.5% (28/59) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 61.6% (45/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 40.0% (18/45) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 26.2% (362/1383) | n/a (0/0) | 1.1% (31/2805) | 92.1% | 62.5% | 23.2% (84/362) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 0.0% (0/10) | 0.0% (0/17) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | 46.0% (166/361) | n/a (0/0) | 2.2% (8/363) | 95.4% | 71.9% | 0.0% (0/166) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 21.4% (15/70) | 0.0% (0/2) | 0.0% (0/27) | 100.0% | 60.4% | 33.3% (5/15) | 0 |

