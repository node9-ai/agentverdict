# pipelock 3.8.0

- Method: pipelock 3.8.0: claude hook for PreToolUse, mcp proxy around a stub MCP server for MCP tool output; preset claude-code plus each profile translated into pipelock settings, fresh HOME per case, minimal environment, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-10T15:21:41.063Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-42-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| a command's output reaches pipelock only through its forward proxy, when the command runs; the benchmark runs no command | 15 | 471 | 56 |
| pipelock has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| a command's output reaches pipelock only through its forward proxy, when the command runs; the benchmark runs no command (an earlier Bash result) | 124 | 0 | 0 |
| a shell command's destination is checked by pipelock's forward proxy when the command runs; the benchmark never runs a command, and the hook has no destination check for shell commands | 37 | 0 | 0 |
| pipelock has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| pipelock has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| pipelock has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| pipelock has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| pipelock has no setting for the user's organisation, and this call goes inside it | 2 | 0 | 1 |
| pipelock has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |
| Task output reaches pipelock through no proxy the benchmark can drive | 1 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/217) | n/a | n/a | n/a (0/0) | 122 |
| pii | 1501 | 33.0% (140/424) | n/a (0/0) | 0.1% (1/1077) | 99.3% | 66.5% | 100.0% (140/140) | 0 |
| secrets | 2920 | 25.2% (180/714) | n/a (0/0) | 2.0% (44/2206) | 80.4% | 61.6% | 100.0% (180/180) | 0 |
| shell | 2000 | 84.6% (708/837) | n/a (0/0) | 10.0% (116/1163) | 85.9% | 87.3% | 100.0% (708/708) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 168 | n/a (0/0) | 32.2% (47/146) | 0.0% (0/21) | 100.0% | 66.1% | 0.0% (0/47) | 1 |
| all | 7428 | 45.0% (1028/2284) | 32.2% (47/146) | 3.3% (161/4875) | 87.0% | 70.5% | 95.6% (1028/1075) | 123 |
| all, holdout split | 755 | 18.9% (46/244) | n/a (0/0) | 0.4% (2/511) | 95.8% | 59.2% | 100.0% (46/46) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | 29.3% (262/895) | 1.5% (10/650) | 96.3% | 63.9% | 0.0% (0/262) | 593 |
| pii | 2397 | 13.3% (149/1122) | n/a (0/0) | 0.1% (1/1275) | 99.3% | 56.6% | 100.0% (149/149) | 0 |
| secrets | 4358 | 14.4% (223/1553) | n/a (0/0) | 2.0% (55/2805) | 80.2% | 56.2% | 100.0% (223/223) | 0 |
| shell | 2000 | 84.6% (708/837) | n/a (0/0) | 10.0% (116/1163) | 85.9% | 87.3% | 100.0% (708/708) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 259 | 6.9% (2/29) | 32.2% (47/146) | 2.4% (2/83) | 96.1% | 62.8% | 4.1% (2/49) | 1 |
| all | 11652 | 28.1% (1082/3850) | 29.7% (309/1041) | 3.0% (184/6167) | 88.3% | 62.7% | 77.8% (1082/1391) | 594 |
| all, holdout split | 1241 | 12.6% (59/467) | 42.1% (32/76) | 0.5% (3/642) | 96.8% | 58.1% | 64.8% (59/91) | 56 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 55.0% (11/20) | 29.8% (270/906) | 2.4 (16/676) | 3.9% (11/281) | 604 | 320.3 | 3126.9 |
| pii | 2491 | 17.0% (201/1179) | n/a (0/0) | 0.8 (10/1312) | 100.0% (201/201) | 0 | 251.8 | 526.8 |
| secrets | 4685 | 24.2% (427/1767) | 88.6% (31/35) | 3.5 (100/2878) | 93.2% (427/458) | 5 | 224.5 | 347.0 |
| egress | 153 | 27.5% (22/80) | 0.0% (0/5) | 12.9 (4/31) | 100.0% (22/22) | 37 | 475.7 | 650.5 |
| shell | 2794 | 84.0% (726/864) | 10.0% (1/10) | 10.1 (158/1559) | 99.9% (726/727) | 361 | 236.3 | 339.5 |
| package | 566 | 0.0% (0/310) | n/a (0/0) | 0.0 (0/256) | n/a (0/0) | 0 | 219.4 | 283.2 |
| mcp | 434 | 38.8% (31/80) | 31.2% (48/154) | 1.2 (2/164) | 39.2% (31/79) | 36 | 312.1 | 645.2 |
| all | 13329 | 33.0% (1418/4300) | 31.5% (350/1110) | 4.2 (290/6876) | 80.2% (1418/1768) | 1043 | 232.8 | 1347.0 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 55.0% (11/20) | 28.7% (238/830) | 2.3 (15/656) | 4.4% (11/249) | 548 | 319.7 | 3126.9 |
| pii | 2149 | 17.6% (178/1014) | n/a (0/0) | 0.8 (9/1135) | 100.0% (178/178) | 0 | 251.1 | 533.7 |
| secrets | 3984 | 25.4% (385/1517) | 88.6% (31/35) | 3.8 (93/2427) | 92.5% (385/416) | 5 | 224.1 | 354.4 |
| egress | 153 | 27.5% (22/80) | 0.0% (0/5) | 12.9 (4/31) | 100.0% (22/22) | 37 | 475.7 | 650.5 |
| shell | 2663 | 84.0% (726/864) | 14.3% (1/7) | 10.3 (154/1492) | 99.9% (726/727) | 300 | 236.5 | 346.8 |
| package | 494 | 0.0% (0/252) | n/a (0/0) | 0.0 (0/242) | n/a (0/0) | 0 | 219.1 | 283.8 |
| mcp | 431 | 38.8% (31/80) | 31.4% (48/153) | 1.2 (2/163) | 39.2% (31/79) | 35 | 312.3 | 645.2 |
| all | 11928 | 35.4% (1353/3827) | 30.9% (318/1030) | 4.5 (277/6146) | 81.0% (1353/1671) | 925 | 232.8 | 1331.1 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | 42.1% (32/76) | 5.0 (1/20) | 0.0% (0/32) | 56 | 333.6 | 3579.4 |
| pii | 342 | 13.9% (23/165) | n/a (0/0) | 0.6 (1/177) | 100.0% (23/23) | 0 | 255.0 | 453.3 |
| secrets | 701 | 16.8% (42/250) | n/a (0/0) | 1.6 (7/451) | 100.0% (42/42) | 0 | 227.7 | 295.8 |
| shell | 131 | n/a (0/0) | 0.0% (0/3) | 6.0 (4/67) | n/a (0/0) | 61 | 232.3 | 284.8 |
| package | 72 | 0.0% (0/58) | n/a (0/0) | 0.0 (0/14) | n/a (0/0) | 0 | 221.9 | 281.3 |
| mcp | 3 | n/a (0/0) | 0.0% (0/1) | 0.0 (0/1) | n/a (0/0) | 1 | 217.2 | 225.5 |
| all | 1401 | 13.7% (65/473) | 40.0% (32/80) | 1.8 (13/730) | 67.0% (65/97) | 118 | 232.8 | 1452.2 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 77.0% (208/270) | 78.0% (39/50) | 40.9% (52/127) | 82.6% | 68.1% | 84.2% (208/247) | 52 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 0.0% (0/36) | n/a (0/0) | 0.0% (0/42) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | 11.4% (49/429) | 2.6% (1/39) | 98.0% | 54.4% | 0.0% (0/49) | 0 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 6.9% (2/29) | n/a (0/0) | 3.2% (2/62) | 50.0% | 51.8% | 100.0% (2/2) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 32.2% (47/146) | 0.0% (0/21) | 100.0% | 66.1% | 0.0% (0/47) | 1 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 12.5% (1/8) | 0.0% (0/4) | 100.0% | 56.3% | 0.0% (0/1) | 3 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 0.0% (0/55) | n/a | n/a | n/a (0/0) | 32 |
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
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 15.8% (219/1383) | n/a (0/0) | 2.0% (55/2805) | 79.9% | 56.9% | 100.0% (219/219) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 100.0% (10/10) | n/a (0/0) | 100.0% (10/10) | 50.0% | 50.0% | 100.0% (10/10) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 10.0% (1/10) | 5.9% (1/17) | 50.0% | 52.1% | 0.0% (0/1) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 10.7% (39/363) | 0.0% | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 41.4% (29/70) | 0.0% (0/1) | 7.4% (2/27) | 93.5% | 66.7% | 100.0% (29/29) | 1 |

