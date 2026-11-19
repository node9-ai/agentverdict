# node9-gate 2.65.6

- Method: node9 check / node9 log from @node9/proxy@2.65.6, fresh HOME per case, NODE9_TESTING=1, a daemon per case on its own port, config written in node9's v2 format (node9 config migrate), the profile's holdActions as actions.* review, the profile's gitPolicies as commands.git-* review, sandboxed (bubblewrap: host network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v8.0.0 (SHA-256 `9c3722e7e826317411f19fc63f0ee0d53807efa00080bd259631a1c4896b3d50`)
- Measured: 2026-11-19T03:17:53.913Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v22.23.3, linux 7.0.0-43-generic
- Retried: 1 case(s) that errored or timed out on the first pass (host load); 1 recovered.
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
| injection | 507 | n/a (0/0) | 8.9% (13/146) | 0.0% (0/361) | 100.0% | 54.5% | 69.2% (9/13) | 0 |
| pii | 1501 | 38.9% (165/424) | n/a (0/0) | 0.1% (1/1077) | 99.4% | 69.4% | 93.3% (154/165) | 0 |
| secrets | 2916 | 49.7% (363/731) | n/a (0/0) | 1.2% (26/2185) | 93.3% | 74.2% | 27.3% (99/363) | 0 |
| shell | 2000 | 89.8% (752/837) | n/a (0/0) | 1.6% (19/1163) | 97.5% | 94.1% | 74.9% (563/752) | 0 |
| package | 500 | 96.4% (298/309) | n/a (0/0) | 0.5% (1/191) | 99.7% | 98.0% | 53.0% (158/298) | 0 |
| mcp | 504 | n/a (0/0) | 66.2% (290/438) | 39.4% (26/66) | 91.8% | 63.4% | 85.5% (248/290) | 0 |
| all | 7928 | 68.6% (1578/2301) | 51.9% (303/584) | 1.4% (73/5043) | 96.3% | 81.9% | 65.4% (1231/1881) | 0 |
| all, holdout split | 751 | 57.5% (150/261) | n/a (0/0) | 0.6% (3/490) | 98.0% | 78.4% | 57.3% (86/150) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2306 | n/a (0/0) | 47.9% (588/1227) | 1.7% (18/1079) | 97.0% | 73.1% | 99.3% (584/588) | 0 |
| pii | 2397 | 15.8% (177/1122) | n/a (0/0) | 0.1% (1/1275) | 99.4% | 57.8% | 93.8% (166/177) | 0 |
| secrets | 4358 | 26.2% (407/1553) | n/a (0/0) | 1.4% (39/2805) | 91.3% | 62.4% | 24.3% (99/407) | 0 |
| shell | 2000 | 89.8% (752/837) | n/a (0/0) | 1.6% (19/1163) | 97.5% | 94.1% | 74.9% (563/752) | 0 |
| package | 500 | 96.4% (298/309) | n/a (0/0) | 0.5% (1/191) | 99.7% | 98.0% | 53.0% (158/298) | 0 |
| mcp | 595 | 27.6% (8/29) | 66.2% (290/438) | 27.3% (35/128) | 89.5% | 68.2% | 83.9% (250/298) | 0 |
| all | 12156 | 42.6% (1642/3850) | 52.7% (878/1665) | 1.7% (113/6641) | 95.7% | 72.0% | 72.2% (1820/2520) | 0 |
| all, holdout split | 1241 | 34.9% (163/467) | 66.1% (74/112) | 2.1% (14/662) | 94.4% | 69.4% | 69.2% (164/237) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2374 | 75.0% (15/20) | 47.9% (594/1241) | 1.7 (19/1113) | 96.9% (590/609) | 0 | 243.3 | 422.0 |
| pii | 2491 | 19.2% (226/1179) | n/a (0/0) | 0.4 (5/1312) | 95.1% (215/226) | 0 | 340.2 | 1023.9 |
| secrets | 4685 | 33.3% (589/1767) | 100.0% (39/39) | 1.5 (42/2879) | 49.0% (308/628) | 0 | 260.1 | 672.3 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 218.4 | 410.9 |
| shell | 2858 | 88.8% (1105/1245) | 45.5% (10/22) | 3.7 (59/1591) | 53.6% (598/1115) | 0 | 341.6 | 1024.9 |
| package | 566 | 96.5% (299/310) | n/a (0/0) | 0.4 (1/256) | 52.8% (158/299) | 0 | 864.9 | 1520.4 |
| mcp | 770 | 41.3% (33/80) | 68.8% (327/475) | 16.7 (35/210) | 82.5% (297/360) | 5 | 248.5 | 470.1 |
| all | 13897 | 50.3% (2370/4709) | 54.8% (977/1784) | 2.2 (161/7399) | 68.0% (2276/3347) | 5 | 308.2 | 1194.7 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2222 | 75.0% (15/20) | 46.1% (520/1129) | 1.3 (14/1073) | 96.4% (516/535) | 0 | 241.9 | 422.0 |
| pii | 2149 | 19.3% (196/1014) | n/a (0/0) | 0.4 (5/1135) | 95.4% (187/196) | 0 | 340.0 | 852.1 |
| secrets | 3984 | 33.5% (508/1517) | 100.0% (39/39) | 1.4 (33/2428) | 51.4% (281/547) | 0 | 260.4 | 701.8 |
| egress | 153 | 95.4% (103/108) | 100.0% (7/7) | 0.0 (0/38) | 100.0% (110/110) | 0 | 218.4 | 410.9 |
| shell | 2727 | 89.4% (1059/1184) | 36.8% (7/19) | 3.3 (51/1524) | 55.8% (595/1066) | 0 | 341.6 | 1003.5 |
| package | 494 | 95.6% (241/252) | n/a (0/0) | 0.4 (1/242) | 48.5% (117/241) | 0 | 869.6 | 1520.4 |
| mcp | 767 | 41.3% (33/80) | 68.8% (326/474) | 16.8 (35/208) | 82.5% (296/359) | 5 | 248.5 | 470.1 |
| all | 12496 | 51.6% (2155/4175) | 53.9% (899/1668) | 2.1 (139/6648) | 68.8% (2102/3054) | 5 | 308.3 | 1176.7 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 66.1% (74/112) | 12.5 (5/40) | 100.0% (74/74) | 0 | 271.0 | 392.6 |
| pii | 342 | 18.2% (30/165) | n/a (0/0) | 0.0 (0/177) | 93.3% (28/30) | 0 | 342.0 | 2331.8 |
| secrets | 701 | 32.4% (81/250) | n/a (0/0) | 2.0 (9/451) | 33.3% (27/81) | 0 | 257.5 | 552.2 |
| shell | 131 | 75.4% (46/61) | 100.0% (3/3) | 11.9 (8/67) | 6.1% (3/49) | 0 | 341.9 | 2326.1 |
| package | 72 | 100.0% (58/58) | n/a (0/0) | 0.0 (0/14) | 70.7% (41/58) | 0 | 817.5 | 1963.8 |
| mcp | 3 | n/a (0/0) | 100.0% (1/1) | 0.0 (0/2) | 100.0% (1/1) | 0 | 240.2 | 343.2 |
| all | 1401 | 40.3% (215/534) | 67.2% (78/116) | 2.9 (22/751) | 59.4% (174/293) | 0 | 307.5 | 1384.3 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 99.7% (297/298) | 89.7% (52/58) | 4.9% (7/143) | 98.0% | 96.6% | 99.7% (348/349) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 0.0% (0/42) | 100.0% | 100.0% | 86.1% (31/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 34.5% (148/429) | 0.0% (0/39) | 100.0% | 67.2% | 100.0% (148/148) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 27.6% (8/29) | n/a (0/0) | 14.5% (9/62) | 47.1% | 56.5% | 25.0% (2/8) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 86.3% (126/146) | 50.0% (11/22) | 92.0% | 68.2% | 88.9% (112/126) | 0 |
| AgentDojo (ETH Zurich), across agents: the poisoned result read by a subagent, handed to one in a brief, or reported back by one, before the attacker's call | outside | 504 | n/a (0/0) | 40.4% (177/438) | 22.7% (15/66) | 92.2% | 58.8% | 81.9% (145/177) | 0 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/5) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | 100.0% (27/27) | 0.0% (0/55) | 100.0% | 100.0% | 100.0% (27/27) | 5 |
| Cascading failures: the same call once more after five identical ones, a ninth subagent after eight (node9's rule) | node9's team | 64 | 100.0% (20/20) | 0.0% (0/12) | 0.0% (0/32) | 100.0% | 81.3% | 100.0% (20/20) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 18.4% (64/347) | n/a (0/0) | 0.0% (0/360) | 100.0% | 59.2% | 84.4% (54/64) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 48.0% (48/100) | n/a (0/0) | 2.4% (1/42) | 98.0% | 72.8% | 50.0% (24/48) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 89.8% (752/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 74.9% (563/752) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.4% (2/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 2.8% (17/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.5% (1/191) | 0.0% | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 59.8% (219/366) | 5.3% (18/340) | 92.4% | 77.3% | 100.0% (219/219) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 72.7% (208/286) | n/a (0/0) | 100.0% | n/a | 100.0% (208/208) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 27.5% (102/371) | n/a (0/0) | 0.3% (1/361) | 99.0% | 63.6% | 97.1% (99/102) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 4.2% (15/359) | n/a (0/0) | 0.0% (0/356) | 100.0% | 52.1% | 100.0% (15/15) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 63.3% (81/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 94.4% (68/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 41.2% (28/68) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 90.4% (66/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 27.3% (18/66) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 29.1% (403/1383) | n/a (0/0) | 1.4% (39/2805) | 91.2% | 63.9% | 24.1% (97/403) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 0.0% (0/17) | 100.0% | 100.0% | 100.0% (10/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | 87.0% (314/361) | n/a (0/0) | 11.0% (40/363) | 88.7% | 88.0% | 0.0% (0/314) | 0 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 55.7% (39/70) | 0.0% (0/2) | 0.0% (0/27) | 100.0% | 77.1% | 17.9% (7/39) | 0 |

