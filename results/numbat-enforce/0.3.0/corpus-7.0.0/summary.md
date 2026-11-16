# numbat-enforce 0.3.0

- Method: numbat 0.3.0 hook PreToolUse --agent claude --enforce, all 51 shipped rules set to enforce, fresh HOME per case, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v7.0.0 (SHA-256 `3d927efafa0d762e534702f04daf207e1026ee684ae5bf7b6c248ea3bcc3255b`)
- Measured: 2026-11-09T22:51:11.045Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-42-generic
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| numbat enforces on pre-action callbacks only | 74 | 1799 | 152 |
| numbat has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| numbat has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| numbat has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| numbat has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| numbat has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| numbat has no setting for the user's organisation, and this call goes inside it | 2 | 0 | 1 |
| numbat has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| pii | 1501 | 0.0% (0/424) | n/a (0/0) | 0.0% (0/1077) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 2920 | 0.0% (0/714) | n/a (0/0) | 0.0% (0/2206) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 2000 | 3.6% (30/837) | n/a (0/0) | 0.0% (0/1163) | 100.0% | 51.8% | 100.0% (30/30) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 168 | n/a (0/0) | 0.0% (0/146) | 0.0% (0/21) | n/a | 50.0% | n/a (0/0) | 1 |
| all | 7428 | 1.3% (30/2284) | 0.0% (0/146) | 0.0% (0/4997) | 100.0% | 50.6% | 100.0% (30/30) | 1 |
| all, holdout split | 755 | 0.0% (0/244) | n/a (0/0) | 0.0% (0/511) | n/a | 50.0% | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2138 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 1799 |
| pii | 2397 | 0.0% (0/1122) | n/a (0/0) | 0.0% (0/1275) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 4358 | 0.0% (0/1553) | n/a (0/0) | 0.0% (0/2805) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 2000 | 3.6% (30/837) | n/a (0/0) | 0.0% (0/1163) | 100.0% | 51.8% | 100.0% (30/30) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 259 | 0.0% (0/29) | 0.0% (0/146) | 0.0% (0/83) | n/a | 50.0% | n/a (0/0) | 1 |
| all | 11652 | 0.8% (30/3850) | 0.0% (0/146) | 0.0% (0/5856) | 100.0% | 50.4% | 100.0% (30/30) | 1800 |
| all, holdout split | 1241 | 0.0% (0/467) | n/a (0/0) | 0.0% (0/622) | n/a | 50.0% | n/a (0/0) | 152 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2206 | 0.0% (0/13) | n/a (0/0) | 0.0 (0/341) | n/a (0/0) | 1852 | 128.6 | 150.8 |
| pii | 2491 | 0.0% (0/1179) | n/a (0/0) | 0.0 (0/1312) | n/a (0/0) | 0 | 130.1 | 158.1 |
| secrets | 4685 | 2.0% (36/1767) | 12.9% (4/31) | 0.0 (1/2878) | 90.0% (36/40) | 9 | 129.1 | 172.8 |
| egress | 153 | 12.0% (13/108) | 0.0% (0/7) | 0.0 (0/38) | 100.0% (13/13) | 0 | 131.0 | 148.9 |
| shell | 2794 | 3.9% (34/864) | 10.0% (1/10) | 0.4 (6/1559) | 97.1% (34/35) | 361 | 129.8 | 190.4 |
| package | 566 | 0.0% (0/310) | n/a (0/0) | 0.0 (0/256) | n/a (0/0) | 0 | 128.7 | 156.7 |
| mcp | 434 | 0.0% (0/72) | 0.6% (1/156) | 0.0 (0/160) | 0.0% (0/1) | 46 | 129.3 | 156.9 |
| all | 13329 | 1.9% (83/4313) | 2.9% (6/204) | 0.1 (7/6544) | 93.3% (83/89) | 2268 | 129.5 | 169.4 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2054 | 0.0% (0/13) | n/a (0/0) | 0.0 (0/341) | n/a (0/0) | 1700 | 128.6 | 150.8 |
| pii | 2149 | 0.0% (0/1014) | n/a (0/0) | 0.0 (0/1135) | n/a (0/0) | 0 | 130.1 | 157.9 |
| secrets | 3984 | 2.2% (33/1517) | 12.9% (4/31) | 0.0 (1/2427) | 89.2% (33/37) | 9 | 129.1 | 169.6 |
| egress | 153 | 12.0% (13/108) | 0.0% (0/7) | 0.0 (0/38) | 100.0% (13/13) | 0 | 131.0 | 148.9 |
| shell | 2663 | 3.9% (34/864) | 14.3% (1/7) | 0.3 (4/1492) | 97.1% (34/35) | 300 | 129.9 | 191.4 |
| package | 494 | 0.0% (0/252) | n/a (0/0) | 0.0 (0/242) | n/a (0/0) | 0 | 128.8 | 159.7 |
| mcp | 431 | 0.0% (0/72) | 0.6% (1/155) | 0.0 (0/159) | 0.0% (0/1) | 45 | 129.3 | 156.9 |
| all | 11928 | 2.1% (80/3840) | 3.0% (6/200) | 0.1 (5/5834) | 93.0% (80/86) | 2054 | 129.5 | 168.7 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a (0/0) | 152 | n/a | n/a |
| pii | 342 | 0.0% (0/165) | n/a (0/0) | 0.0 (0/177) | n/a (0/0) | 0 | 130.5 | 158.6 |
| secrets | 701 | 1.2% (3/250) | n/a (0/0) | 0.0 (0/451) | 100.0% (3/3) | 0 | 129.2 | 208.9 |
| shell | 131 | n/a (0/0) | 0.0% (0/3) | 3.0 (2/67) | n/a (0/0) | 61 | 127.6 | 149.6 |
| package | 72 | 0.0% (0/58) | n/a (0/0) | 0.0 (0/14) | n/a (0/0) | 0 | 128.0 | 154.2 |
| mcp | 3 | n/a (0/0) | 0.0% (0/1) | 0.0 (0/1) | n/a (0/0) | 1 | 114.0 | 143.4 |
| all | 1401 | 0.6% (3/473) | 0.0% (0/4) | 0.3 (2/710) | 100.0% (3/3) | 214 | 129.4 | 174.7 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 11.7% (35/298) | 10.5% (4/38) | 0.8% (1/128) | 97.5% | 55.4% | 89.7% (35/39) | 35 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 0.0% (0/36) | n/a (0/0) | 0.0% (0/42) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 468 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 0.0% (0/29) | n/a (0/0) | 0.0% (0/62) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 0.0% (0/146) | 0.0% (0/21) | n/a | 50.0% | n/a (0/0) | 1 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 10.0% (1/10) | 0.0% (0/4) | 100.0% | 55.0% | 0.0% (0/1) | 1 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 0.0% (0/55) | n/a | n/a | n/a (0/0) | 32 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 339 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 0.0% (0/347) | n/a (0/0) | 0.0% (0/360) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 2.4% (2/85) | n/a (0/0) | 0.0% (0/21) | 100.0% | 51.2% | 100.0% (2/2) | 36 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 3.6% (30/837) | n/a (0/0) | n/a (0/0) | 100.0% | n/a | 100.0% (30/30) | 0 |
| NL2SH-ALFA: ordinary shell commands for English tasks | outside | 565 | n/a (0/0) | n/a (0/0) | 0.0% (0/565) | n/a | n/a | n/a (0/0) | 0 |
| Benign scripts: MBPP reference solutions in Python and Exercism Bash examples, run whole | outside | 598 | n/a (0/0) | n/a (0/0) | 0.0% (0/598) | n/a | n/a | n/a (0/0) | 0 |
| Most downloaded npm and PyPI packages (official download statistics), installed | outside | 191 | n/a (0/0) | n/a (0/0) | 0.0% (0/191) | n/a | n/a | n/a (0/0) | 0 |
| BrowseSafe-Bench (Perplexity): web pages with and without an injection | outside | 706 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 706 |
| InjecAgent (UIUC): tool results carrying an attacker instruction | outside | 286 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 286 |
| Gretel synthetic PII finance: financial documents sent off the machine | outside | 732 | 0.0% (0/371) | n/a (0/0) | 0.0% (0/361) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenPII (ai4privacy): multilingual texts sent off the machine | outside | 715 | 0.0% (0/359) | n/a (0/0) | 0.0% (0/356) | n/a | 50.0% | n/a (0/0) | 0 |
| PII-TRACE (Perplexity): conversations sent off the machine | outside | 413 | 0.0% (0/215) | n/a (0/0) | 0.0% (0/198) | n/a | 50.0% | n/a (0/0) | 0 |
| OpenSSF malicious packages beyond npm and PyPI | outside | 128 | 0.0% (0/128) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| DataDog malicious-software-packages: npm and PyPI names | outside | 72 | 0.0% (0/72) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| typomind (USENIX Security 2023): labelled typosquats | outside | 73 | 0.0% (0/73) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
| Samsung CredData: credential and look-alike lines written to a file | outside | 4188 | 0.0% (0/1383) | n/a (0/0) | 0.0% (0/2805) | n/a | 50.0% | n/a (0/0) | 0 |
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 50.0% (5/10) | n/a (0/0) | 0.0% (0/10) | 100.0% | 75.0% | 100.0% (5/5) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 10.0% (1/10) | 0.0% (0/17) | 100.0% | 55.0% | 0.0% (0/1) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 1.7% (6/363) | 0.0% | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 15.7% (11/70) | n/a (0/0) | 0.0% (0/26) | 100.0% | 57.9% | 100.0% (11/11) | 3 |

