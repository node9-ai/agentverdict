# pipelock 3.8.0

- Method: pipelock 3.8.0: claude hook for PreToolUse, mcp proxy around a stub MCP server for MCP tool output; preset claude-code plus each profile translated into pipelock settings, fresh HOME per case, minimal environment, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v8.0.0 (SHA-256 `9c3722e7e826317411f19fc63f0ee0d53807efa00080bd259631a1c4896b3d50`)
- Measured: 2026-11-17T18:48:20.361Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-43-generic
- Measured in parts: 12878 case(s) on 2026-11-10 (corpus 7.0.0, carried from results/pipelock/3.8.0/corpus-7.0.0); 1019 case(s) on 2026-11-17 (corpus 8.0.0).
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| a command's output reaches pipelock only through its forward proxy, when the command runs; the benchmark runs no command | 15 | 471 | 56 |
| pipelock has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| Agent output is out of reach (an earlier Agent result) | 168 | 0 | 0 |
| a command's output reaches pipelock only through its forward proxy, when the command runs; the benchmark runs no command (an earlier Bash result) | 124 | 0 | 0 |
| a shell command's destination is checked by pipelock's forward proxy when the command runs; the benchmark never runs a command, and the hook has no destination check for shell commands | 37 | 0 | 0 |
| pipelock has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| pipelock has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| pipelock has no setting for the user's organisation, and this call goes inside it | 3 | 0 | 1 |
| pipelock has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| pipelock has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| pipelock has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |
| Task output reaches pipelock through no proxy the benchmark can drive | 1 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 507 | n/a (0/0) | 26.0% (38/146) | 0.0% (0/239) | 100.0% | 63.0% | 0.0% (0/38) | 122 |
| pii | 1501 | 33.0% (140/424) | n/a (0/0) | 0.1% (1/1077) | 99.3% | 66.5% | 100.0% (140/140) | 0 |
| secrets | 2916 | 26.1% (191/731) | n/a (0/0) | 2.2% (47/2185) | 80.3% | 62.0% | 100.0% (191/191) | 0 |
| shell | 2000 | 84.6% (708/837) | n/a (0/0) | 10.0% (116/1163) | 85.9% | 87.3% | 100.0% (708/708) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 504 | n/a (0/0) | 32.2% (94/292) | 0.0% (0/42) | 100.0% | 66.1% | 0.0% (0/94) | 170 |
| all | 7928 | 45.2% (1039/2301) | 30.1% (132/438) | 3.3% (164/4897) | 87.7% | 69.7% | 88.7% (1039/1171) | 292 |
| all, holdout split | 751 | 21.8% (57/261) | n/a (0/0) | 1.0% (5/490) | 91.9% | 60.4% | 100.0% (57/57) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2306 | n/a (0/0) | 28.8% (300/1041) | 1.5% (10/672) | 96.8% | 63.7% | 0.0% (0/300) | 593 |
| pii | 2397 | 13.3% (149/1122) | n/a (0/0) | 0.1% (1/1275) | 99.3% | 56.6% | 100.0% (149/149) | 0 |
| secrets | 4358 | 14.9% (232/1553) | n/a (0/0) | 2.3% (64/2805) | 78.4% | 56.3% | 100.0% (232/232) | 0 |
| shell | 2000 | 84.6% (708/837) | n/a (0/0) | 10.0% (116/1163) | 85.9% | 87.3% | 100.0% (708/708) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 595 | 6.9% (2/29) | 32.2% (94/292) | 1.9% (2/104) | 98.0% | 64.0% | 2.1% (2/96) | 170 |
| all | 12156 | 28.3% (1091/3850) | 29.6% (394/1333) | 3.1% (193/6210) | 88.5% | 62.8% | 73.5% (1091/1485) | 763 |
| all, holdout split | 1241 | 14.6% (68/467) | 42.1% (32/76) | 1.9% (12/642) | 89.3% | 58.3% | 68.0% (68/100) | 56 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2374 | 55.0% (11/20) | 29.3% (308/1052) | 2.3 (16/698) | 3.4% (11/319) | 604 | 317.7 | 3046.1 |
| pii | 2491 | 17.0% (201/1179) | n/a (0/0) | 0.8 (10/1312) | 100.0% (201/201) | 0 | 251.8 | 526.8 |
| secrets | 4685 | 24.7% (436/1767) | 88.6% (31/35) | 3.8 (109/2878) | 93.4% (436/467) | 5 | 225.3 | 399.2 |
| egress | 153 | 27.5% (22/80) | 0.0% (0/5) | 12.9 (4/31) | 100.0% (22/22) | 37 | 475.7 | 650.5 |
| shell | 2858 | 82.1% (726/884) | 4.5% (1/22) | 9.9 (158/1591) | 99.9% (726/727) | 361 | 236.6 | 360.1 |
| package | 566 | 0.0% (0/310) | n/a (0/0) | 0.0 (0/256) | n/a (0/0) | 0 | 219.4 | 283.2 |
| mcp | 770 | 38.8% (31/80) | 31.7% (95/300) | 1.1 (2/185) | 24.6% (31/126) | 205 | 310.5 | 806.2 |
| all | 13897 | 33.0% (1427/4320) | 30.8% (435/1414) | 4.3 (299/6951) | 76.6% (1427/1862) | 1212 | 234.9 | 1341.9 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2222 | 55.0% (11/20) | 28.3% (276/976) | 2.2 (15/678) | 3.8% (11/287) | 548 | 317.2 | 3046.1 |
| pii | 2149 | 17.6% (178/1014) | n/a (0/0) | 0.8 (9/1135) | 100.0% (178/178) | 0 | 251.1 | 533.7 |
| secrets | 3984 | 25.4% (385/1517) | 88.6% (31/35) | 3.8 (93/2427) | 92.5% (385/416) | 5 | 224.1 | 354.4 |
| egress | 153 | 27.5% (22/80) | 0.0% (0/5) | 12.9 (4/31) | 100.0% (22/22) | 37 | 475.7 | 650.5 |
| shell | 2727 | 82.1% (726/884) | 5.3% (1/19) | 10.1 (154/1524) | 99.9% (726/727) | 300 | 236.8 | 360.1 |
| package | 494 | 0.0% (0/252) | n/a (0/0) | 0.0 (0/242) | n/a (0/0) | 0 | 219.1 | 283.8 |
| mcp | 767 | 38.8% (31/80) | 31.8% (95/299) | 1.1 (2/184) | 24.6% (31/126) | 204 | 310.6 | 806.2 |
| all | 12496 | 35.2% (1353/3847) | 30.2% (403/1334) | 4.5 (277/6221) | 77.1% (1353/1756) | 1094 | 233.7 | 1330.1 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 42.1% (32/76) | 5.0 (1/20) | 0.0% (0/32) | 56 | 333.6 | 3579.4 |
| pii | 342 | 13.9% (23/165) | n/a (0/0) | 0.6 (1/177) | 100.0% (23/23) | 0 | 255.0 | 453.3 |
| secrets | 701 | 20.4% (51/250) | n/a (0/0) | 3.5 (16/451) | 100.0% (51/51) | 0 | 249.7 | 881.2 |
| shell | 131 | n/a (0/0) | 0.0% (0/3) | 6.0 (4/67) | n/a (0/0) | 61 | 232.3 | 284.8 |
| package | 72 | 0.0% (0/58) | n/a (0/0) | 0.0 (0/14) | n/a (0/0) | 0 | 221.9 | 281.3 |
| mcp | 3 | n/a (0/0) | 0.0% (0/1) | 0.0 (0/1) | n/a (0/0) | 1 | 217.2 | 225.5 |
| all | 1401 | 15.6% (74/473) | 40.0% (32/80) | 3.0 (22/730) | 69.8% (74/106) | 118 | 250.9 | 1554.2 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 77.0% (208/270) | 78.0% (39/50) | 40.9% (52/127) | 82.6% | 68.1% | 84.2% (208/247) | 52 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 0.0% (0/36) | n/a (0/0) | 0.0% (0/42) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 11.4% (49/429) | 2.6% (1/39) | 98.0% | 54.4% | 0.0% (0/49) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 6.9% (2/29) | n/a (0/0) | 3.2% (2/62) | 50.0% | 51.8% | 100.0% (2/2) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 32.2% (47/146) | 0.0% (0/21) | 100.0% | 66.1% | 0.0% (0/47) | 1 |
| AgentDojo (ETH Zurich), across agents: the poisoned result read by a subagent, handed to one in a brief, or reported back by one, before the attacker's call | outside | 504 | n/a (0/0) | 29.1% (85/292) | 0.0% (0/43) | 100.0% | 64.6% | 0.0% (0/85) | 169 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 12.5% (1/8) | 0.0% (0/4) | 100.0% | 56.3% | 0.0% (0/1) | 3 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 0.0% (0/55) | n/a | n/a | n/a (0/0) | 32 |
| Cascading failures: the same call once more after five identical ones, a ninth subagent after eight (node9's rule) | node9's team | 64 | 0.0% (0/20) | 0.0% (0/12) | 0.0% (0/32) | n/a | 50.0% | n/a (0/0) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/217) | n/a | n/a | n/a (0/0) | 122 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/217) | n/a | n/a | n/a (0/0) | 122 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 15.9% (55/347) | n/a (0/0) | 0.0% (0/360) | 100.0% | 57.9% | 100.0% (55/55) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 89.0% (89/100) | n/a (0/0) | 4.8% (2/42) | 97.8% | 92.1% | 100.0% (89/89) | 0 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 84.6% (708/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 100.0% (708/708) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 2.8% (16/565) | 0.0% | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 16.7% (100/598) | 0.0% | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | 38.9% (70/180) | 5.1% (9/177) | 88.6% | 66.9% | 0.0% (0/70) | 349 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | 50.0% (143/286) | n/a (0/0) | 100.0% | n/a | 0.0% (0/143) | 0 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 24.5% (91/371) | n/a (0/0) | 0.3% (1/361) | 98.9% | 62.1% | 100.0% (91/91) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 1.9% (7/359) | n/a (0/0) | 0.0% (0/356) | 100.0% | 51.0% | 100.0% (7/7) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 0.0% (0/128) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 0.0% (0/72) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 0.0% (0/73) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 16.5% (228/1383) | n/a (0/0) | 2.3% (64/2805) | 78.1% | 57.1% | 100.0% (228/228) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 100.0% (10/10) | 50.0% | 50.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 10.0% (1/10) | 5.9% (1/17) | 50.0% | 52.1% | 0.0% (0/1) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 10.7% (39/363) | 0.0% | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 41.4% (29/70) | 0.0% (0/1) | 7.4% (2/27) | 93.5% | 66.7% | 100.0% (29/29) | 1 |

