# hol-guard 3.59.0

- Method: hol-guard 3.59.0: the whole Claude Code hook (hol-guard hook --harness claude-code, run directly in place of the installed bridge and its daemon, which serve one HOME), fresh HOME per case, each profile in HOL Guard's settings where it has one, minimal environment, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v8.0.0 (SHA-256 `9c3722e7e826317411f19fc63f0ee0d53807efa00080bd259631a1c4896b3d50`)
- Measured: 2026-11-18T05:42:49.145Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-43-generic
- Retried: 1 case(s) that errored or timed out on the first pass (host load); 1 recovered.
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| HOL Guard has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| HOL Guard has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| HOL Guard has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| HOL Guard has no setting for the user's organisation, and this call goes inside it | 3 | 0 | 1 |
| HOL Guard has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| HOL Guard has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| HOL Guard has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 507 | n/a (0/0) | 0.0% (0/146) | 29.6% (107/361) | 0.0% | 35.2% | n/a (0/0) | 0 |
| pii | 1501 | 100.0% (424/424) | n/a (0/0) | 100.0% (1077/1077) | 28.2% | 50.0% | 13.9% (59/424) | 0 |
| secrets | 2916 | 10.0% (73/731) | n/a (0/0) | 1.3% (28/2185) | 72.3% | 54.4% | 32.9% (24/73) | 0 |
| shell | 2000 | 100.0% (837/837) | n/a (0/0) | 86.8% (1009/1163) | 45.3% | 56.6% | 39.3% (329/837) | 0 |
| package | 500 | 100.0% (309/309) | n/a (0/0) | 100.0% (191/191) | 61.8% | 50.0% | 0.0% (0/309) | 0 |
| mcp | 504 | n/a (0/0) | 100.0% (438/438) | 100.0% (64/64) | 87.3% | 50.0% | 33.3% (146/438) | 2 |
| all | 7928 | 71.4% (1643/2301) | 75.0% (438/584) | 49.1% (2476/5041) | 45.7% | 61.5% | 26.8% (558/2081) | 2 |
| all, holdout split | 751 | 48.7% (127/261) | n/a (0/0) | 36.5% (179/490) | 41.5% | 56.1% | 3.1% (4/127) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2306 | n/a (0/0) | 74.7% (916/1227) | 40.2% (434/1079) | 67.9% | 67.2% | 0.0% (0/916) | 0 |
| pii | 2397 | 100.0% (1122/1122) | n/a (0/0) | 100.0% (1275/1275) | 46.8% | 50.0% | 5.5% (62/1122) | 0 |
| secrets | 4358 | 13.0% (202/1553) | n/a (0/0) | 1.1% (30/2805) | 87.1% | 56.0% | 11.9% (24/202) | 0 |
| shell | 2000 | 100.0% (837/837) | n/a (0/0) | 86.8% (1009/1163) | 45.3% | 56.6% | 39.3% (329/837) | 0 |
| package | 500 | 100.0% (309/309) | n/a (0/0) | 100.0% (191/191) | 61.8% | 50.0% | 0.0% (0/309) | 0 |
| mcp | 595 | 100.0% (29/29) | 100.0% (438/438) | 100.0% (126/126) | 78.8% | 50.0% | 31.3% (146/467) | 2 |
| all | 12156 | 64.9% (2499/3850) | 81.3% (1354/1665) | 46.2% (3065/6639) | 55.7% | 61.8% | 14.6% (561/3853) | 2 |
| all, holdout split | 1241 | 51.2% (239/467) | 72.3% (81/112) | 30.1% (199/662) | 61.7% | 62.6% | 1.3% (4/320) | 0 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2374 | 40.0% (8/20) | 74.1% (919/1241) | 39.7 (442/1113) | 0.1% (1/927) | 0 | 1990.5 | 13867.2 |
| pii | 2491 | 99.4% (1172/1179) | n/a (0/0) | 99.9 (1311/1312) | 5.3% (62/1172) | 0 | 1884.9 | 5742.5 |
| secrets | 4685 | 22.1% (391/1767) | 97.4% (38/39) | 2.6 (75/2879) | 16.6% (71/429) | 0 | 1799.7 | 5400.4 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 76.3 (29/38) | 10.4% (12/115) | 0 | 2100.4 | 17572.9 |
| shell | 2858 | 99.4% (879/884) | 45.5% (10/22) | 88.2 (1404/1591) | 38.7% (344/889) | 361 | 1868.1 | 5460.5 |
| package | 566 | 100.0% (310/310) | n/a (0/0) | 100.0 (256/256) | 0.0% (0/310) | 0 | 1872.0 | 5959.5 |
| mcp | 770 | 100.0% (80/80) | 99.3% (445/448) | 99.0 (205/207) | 29.9% (157/525) | 35 | 1848.4 | 6841.6 |
| all | 13897 | 67.8% (2948/4348) | 80.8% (1419/1757) | 50.3 (3722/7396) | 14.8% (647/4367) | 396 | 1865.0 | 7547.1 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2222 | 40.0% (8/20) | 74.2% (838/1129) | 39.3 (422/1073) | 0.1% (1/846) | 0 | 1985.2 | 13701.3 |
| pii | 2149 | 99.3% (1007/1014) | n/a (0/0) | 99.9 (1134/1135) | 5.8% (58/1007) | 0 | 1887.2 | 5857.5 |
| secrets | 3984 | 24.3% (369/1517) | 97.4% (38/39) | 3.0 (73/2428) | 17.4% (71/407) | 0 | 1801.8 | 5251.5 |
| egress | 153 | 100.0% (108/108) | 100.0% (7/7) | 76.3 (29/38) | 10.4% (12/115) | 0 | 2100.4 | 17572.9 |
| shell | 2727 | 99.4% (879/884) | 36.8% (7/19) | 87.7 (1337/1524) | 38.5% (341/886) | 300 | 1868.0 | 5287.8 |
| package | 494 | 100.0% (252/252) | n/a (0/0) | 100.0 (242/242) | 0.0% (0/252) | 0 | 1867.7 | 5270.4 |
| mcp | 767 | 100.0% (80/80) | 99.3% (444/447) | 99.0 (204/206) | 30.0% (157/524) | 34 | 1847.9 | 6841.6 |
| all | 12496 | 69.8% (2703/3875) | 81.3% (1334/1641) | 51.8 (3441/6646) | 15.9% (640/4037) | 334 | 1866.9 | 7587.2 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 72.3% (81/112) | 50.0 (20/40) | 0.0% (0/81) | 0 | 2126.7 | 14318.6 |
| pii | 342 | 100.0% (165/165) | n/a (0/0) | 100.0 (177/177) | 2.4% (4/165) | 0 | 1878.1 | 5386.3 |
| secrets | 701 | 8.8% (22/250) | n/a (0/0) | 0.4 (2/451) | 0.0% (0/22) | 0 | 1791.3 | 5735.6 |
| shell | 131 | n/a (0/0) | 100.0% (3/3) | 100.0 (67/67) | 100.0% (3/3) | 61 | 1878.6 | 8088.6 |
| package | 72 | 100.0% (58/58) | n/a (0/0) | 100.0 (14/14) | 0.0% (0/58) | 0 | 1900.3 | 7765.1 |
| mcp | 3 | n/a (0/0) | 100.0% (1/1) | 100.0 (1/1) | 0.0% (0/1) | 1 | 1892.3 | 4254.5 |
| all | 1401 | 51.8% (245/473) | 73.3% (85/116) | 37.5 (281/750) | 2.1% (7/330) | 62 | 1844.5 | 7174.8 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 97.0% (289/298) | 81.0% (47/58) | 76.9% (110/143) | 75.3% | 58.7% | 16.1% (54/336) | 0 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 100.0% (36/36) | n/a (0/0) | 100.0% (42/42) | 46.2% | 50.0% | 0.0% (0/36) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 100.0% (429/429) | 100.0% (39/39) | 91.7% | 50.0% | 0.0% (0/429) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 100.0% (29/29) | n/a (0/0) | 100.0% (62/62) | 31.9% | 50.0% | 0.0% (0/29) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 100.0% (146/146) | 100.0% (21/21) | 87.4% | 50.0% | 0.0% (0/146) | 1 |
| AgentDojo (ETH Zurich), across agents: the poisoned result read by a subagent, handed to one in a brief, or reported back by one, before the attacker's call | outside | 504 | n/a (0/0) | 66.7% (292/438) | 66.2% (43/65) | 87.2% | 50.3% | 50.0% (146/292) | 1 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 70.0% (7/10) | 50.0% (2/4) | 77.8% | 60.0% | 42.9% (3/7) | 1 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 100.0% (55/55) | 0.0% | n/a | n/a (0/0) | 32 |
| Cascading failures: the same call once more after five identical ones, a ninth subagent after eight (node9's rule) | node9's team | 64 | 80.0% (16/20) | 0.0% (0/12) | 62.5% (20/32) | 44.4% | 43.8% | 0.0% (0/16) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 31.6% (107/339) | 0.0% | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 31.6% (107/339) | 0.0% | n/a | n/a (0/0) | 0 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 100.0% (347/347) | n/a (0/0) | 100.0% (360/360) | 49.1% | 50.0% | 15.0% (52/347) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 70.0% (70/100) | n/a (0/0) | 47.6% (20/42) | 77.8% | 61.2% | 15.7% (11/70) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 100.0% (837/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 39.3% (329/837) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 72.7% (411/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 100.0% (598/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 100.0% (191/191) | 0.0% | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 54.9% (201/366) | 53.2% (181/340) | 52.6% | 50.8% | 0.0% (0/201) | 0 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 100.0% (286/286) | n/a (0/0) | 100.0% | n/a | 0.0% (0/286) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 100.0% (371/371) | n/a (0/0) | 100.0% (361/361) | 50.7% | 50.0% | 8.9% (33/371) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 100.0% (359/359) | n/a (0/0) | 100.0% (356/356) | 50.2% | 50.0% | 0.3% (1/359) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 100.0% (215/215) | n/a (0/0) | 100.0% (198/198) | 52.1% | 50.0% | 0.0% (0/215) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 100.0% (128/128) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/128) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 100.0% (72/72) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/72) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 100.0% (73/73) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 0.0% (0/73) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 2.3% (32/1383) | n/a (0/0) | 1.1% (30/2805) | 51.6% | 50.6% | 0.0% (0/32) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 100.0% | 0.0% (0/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 100.0% (22/22) | 0.0% | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 100.0% (10/10) | 88.2% (15/17) | 40.0% | 55.9% | 100.0% (10/10) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 96.4% (350/363) | 0.0% | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 91.4% (64/70) | 50.0% (1/2) | 77.8% (21/27) | 75.6% | 56.3% | 12.3% (8/65) | 0 |

