# numbat 0.3.0

- Method: numbat 0.3.0 hook PreToolUse --agent claude, shipped catalog in its default monitor mode, fresh HOME per case, sandboxed (bubblewrap: no network, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)
- Corpus: v8.0.0 (SHA-256 `9c3722e7e826317411f19fc63f0ee0d53807efa00080bd259631a1c4896b3d50`)
- Measured: 2026-11-17T18:53:00.440Z on 12th Gen Intel(R) Core(TM) i7-1265U, Node v25.9.0, linux 7.0.0-43-generic
- Measured in parts: 12878 case(s) on 2026-11-09 (corpus 7.0.0, carried from results/numbat/0.3.0/corpus-7.0.0); 1019 case(s) on 2026-11-17 (corpus 8.0.0).
- Volatile: 292 case(s) depend on live registries and advisory databases at run time; package snapshots fetched: osv-malicious-packages 2026-10-02, osv-other-ecosystems 2026-10-11, datadog-packages 2026-10-11, typomind 2026-10-11, node9-bench-package-list-more 2026-10-18, popular-packages 2026-10-23.

## Not measured

Cases this tool has the protection for but the benchmark cannot reach, by the adapter's reason. They are left out of every rate below, never counted as misses. What the benchmark does not measure for any tool: DATASHEET, section 9.

| Reason | Official | Extended | Of which holdout |
|---|---:|---:|---:|
| numbat enforces on pre-action callbacks only | 74 | 1799 | 152 |
| numbat has no setting for the user's git rules, and this case's verdict rests on them | 361 | 0 | 61 |
| numbat has no setting for being consulted before moving money, and this case's verdict rests on it | 14 | 0 | 0 |
| numbat has no setting for being consulted before managing users and access, and this case's verdict rests on it | 10 | 0 | 0 |
| numbat has no setting for the user's organisation, and this call goes inside it | 3 | 0 | 1 |
| numbat has no setting for being consulted before publishing, and this case's verdict rests on it | 3 | 0 | 0 |
| numbat has no setting for being consulted before deleting data, and this case's verdict rests on it | 3 | 0 | 0 |
| numbat has no setting for being consulted before changing a credential, and this case's verdict rests on it | 2 | 0 | 0 |

## Headline score (official set, labels from outside sources)

The official set's headline section: categories a guard can protect with few false positives, labelled by a party other than node9's team (DATASHEET, Sets). This is the benchmark's number. The balanced score is the mean of attacks stopped and allow cases let through: stopping everything, or nothing, scores 50%.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 507 | n/a (0/0) | 0.0% (0/146) | 0.0% (0/361) | n/a | 50.0% | n/a (0/0) | 0 |
| pii | 1501 | 0.0% (0/424) | n/a (0/0) | 0.0% (0/1077) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 2916 | 0.0% (0/731) | n/a (0/0) | 0.0% (0/2185) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 2000 | 0.0% (0/837) | n/a (0/0) | 0.0% (0/1163) | n/a | 50.0% | n/a (0/0) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 504 | n/a (0/0) | 0.0% (0/438) | 0.0% (0/64) | n/a | 50.0% | n/a (0/0) | 2 |
| all | 7928 | 0.0% (0/2301) | 0.0% (0/584) | 0.0% (0/5041) | n/a | 50.0% | n/a (0/0) | 2 |
| all, holdout split | 751 | 0.0% (0/261) | n/a (0/0) | 0.0% (0/490) | n/a | 50.0% | n/a (0/0) | 0 |

## Comparison score (labels from outside sources, every set)

Every case whose expected verdict was written by a party other than node9's team, the extended set included. Comparable with summaries written before sets existed; node9's own tests are the regression track below.

| Channel | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2306 | n/a (0/0) | 0.0% (0/146) | 0.0% (0/361) | n/a | 50.0% | n/a (0/0) | 1799 |
| pii | 2397 | 0.0% (0/1122) | n/a (0/0) | 0.0% (0/1275) | n/a | 50.0% | n/a (0/0) | 0 |
| secrets | 4358 | 0.0% (0/1553) | n/a (0/0) | 0.0% (0/2805) | n/a | 50.0% | n/a (0/0) | 0 |
| shell | 2000 | 0.0% (0/837) | n/a (0/0) | 0.0% (0/1163) | n/a | 50.0% | n/a (0/0) | 0 |
| package | 500 | 0.0% (0/309) | n/a (0/0) | 0.0% (0/191) | n/a | 50.0% | n/a (0/0) | 0 |
| mcp | 595 | 0.0% (0/29) | 0.0% (0/438) | 0.0% (0/126) | n/a | 50.0% | n/a (0/0) | 2 |
| all | 12156 | 0.0% (0/3850) | 0.0% (0/584) | 0.0% (0/5921) | n/a | 50.0% | n/a (0/0) | 1801 |
| all, holdout split | 1241 | 0.0% (0/467) | n/a (0/0) | 0.0% (0/622) | n/a | 50.0% | n/a (0/0) | 152 |

## All cases

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2374 | 0.0% (0/13) | 0.0% (0/146) | 0.0 (0/363) | n/a (0/0) | 1852 | 117.3 | 197.4 |
| pii | 2491 | 0.0% (0/1179) | n/a (0/0) | 0.0 (0/1312) | n/a (0/0) | 0 | 126.7 | 584.0 |
| secrets | 4685 | 0.0% (0/1767) | 0.0% (0/31) | 0.0 (0/2878) | n/a (0/0) | 9 | 122.1 | 169.8 |
| egress | 153 | 0.0% (0/108) | 0.0% (0/7) | 0.0 (0/38) | n/a (0/0) | 0 | 417.7 | 695.4 |
| shell | 2858 | 0.0% (0/884) | 0.0% (0/22) | 0.0 (0/1591) | n/a (0/0) | 361 | 123.0 | 159.4 |
| package | 566 | 0.0% (0/310) | n/a (0/0) | 0.0 (0/256) | n/a (0/0) | 0 | 118.1 | 145.3 |
| mcp | 770 | 0.0% (0/72) | 0.0% (0/448) | 0.0 (0/203) | n/a (0/0) | 47 | 123.0 | 521.7 |
| all | 13897 | 0.0% (0/4333) | 0.0% (0/654) | 0.0 (0/6641) | n/a (0/0) | 2269 | 122.6 | 513.9 |

## Public split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 2222 | 0.0% (0/13) | 0.0% (0/146) | 0.0 (0/363) | n/a (0/0) | 1700 | 117.3 | 197.4 |
| pii | 2149 | 0.0% (0/1014) | n/a (0/0) | 0.0 (0/1135) | n/a (0/0) | 0 | 125.9 | 589.7 |
| secrets | 3984 | 0.0% (0/1517) | 0.0% (0/31) | 0.0 (0/2427) | n/a (0/0) | 9 | 121.2 | 147.7 |
| egress | 153 | 0.0% (0/108) | 0.0% (0/7) | 0.0 (0/38) | n/a (0/0) | 0 | 417.7 | 695.4 |
| shell | 2727 | 0.0% (0/884) | 0.0% (0/19) | 0.0 (0/1524) | n/a (0/0) | 300 | 123.0 | 159.4 |
| package | 494 | 0.0% (0/252) | n/a (0/0) | 0.0 (0/242) | n/a (0/0) | 0 | 118.1 | 149.7 |
| mcp | 767 | 0.0% (0/72) | 0.0% (0/447) | 0.0 (0/202) | n/a (0/0) | 46 | 123.1 | 521.7 |
| all | 12496 | 0.0% (0/3860) | 0.0% (0/650) | 0.0 (0/5931) | n/a (0/0) | 2055 | 122.1 | 519.4 |

## Holdout split

| Channel | Cases | Catch rate (block) | Hit rate (review) | Interruptions / 100 allow | Correct tier | Unreachable | p50 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| injection | 152 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a (0/0) | 152 | n/a | n/a |
| pii | 342 | 0.0% (0/165) | n/a (0/0) | 0.0 (0/177) | n/a (0/0) | 0 | 136.3 | 200.3 |
| secrets | 701 | 0.0% (0/250) | n/a (0/0) | 0.0 (0/451) | n/a (0/0) | 0 | 132.9 | 193.7 |
| shell | 131 | n/a (0/0) | 0.0% (0/3) | 0.0 (0/67) | n/a (0/0) | 61 | 122.0 | 140.1 |
| package | 72 | 0.0% (0/58) | n/a (0/0) | 0.0 (0/14) | n/a (0/0) | 0 | 118.0 | 140.5 |
| mcp | 3 | n/a (0/0) | 0.0% (0/1) | 0.0 (0/1) | n/a (0/0) | 1 | 110.8 | 113.4 |
| all | 1401 | 0.0% (0/473) | 0.0% (0/4) | 0.0 (0/710) | n/a (0/0) | 214 | 131.3 | 196.1 |

## By source (all cases)

One row per origin of the cases. A row built from an external benchmark asks this benchmark's question (did the tool stop the action) on that benchmark's scenarios; it is not that benchmark's own score.

| Source | Labels by | Cases | Catch rate (block) | Hit rate (review) | False positives (allow cases stopped) | Precision | Balanced score | Correct tier | Unreachable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node9's own tests and corpora | node9's team | 499 | 0.0% (0/298) | 0.0% (0/38) | 0.0% (0/128) | n/a | 50.0% | n/a (0/0) | 35 |
| Package installs (OSV malicious-packages and everyday installs) | mixed | 78 | 0.0% (0/36) | n/a (0/0) | 0.0% (0/42) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): injections in tool results | outside | 468 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 468 |
| AgentDojo (ETH Zurich): the tool calls its tasks' ground truth makes | outside | 91 | 0.0% (0/29) | n/a (0/0) | 0.0% (0/62) | n/a | 50.0% | n/a (0/0) | 0 |
| AgentDojo (ETH Zurich): the attacker's ground-truth call after the poisoned result, and the user's after a clean one | outside | 168 | n/a (0/0) | 0.0% (0/146) | 0.0% (0/21) | n/a | 50.0% | n/a (0/0) | 1 |
| AgentDojo (ETH Zurich), across agents: the poisoned result read by a subagent, handed to one in a brief, or reported back by one, before the attacker's call | outside | 504 | n/a (0/0) | 0.0% (0/438) | 0.0% (0/65) | n/a | 50.0% | n/a (0/0) | 1 |
| Exposure: ordinary sends after reading outside content | node9's team | 15 | n/a (0/0) | 0.0% (0/10) | 0.0% (0/4) | n/a | 50.0% | n/a (0/0) | 1 |
| Dangerous actions: money, credentials, deletion, access, publishing (a person approves even when the user asked) | node9's team | 87 | n/a (0/0) | n/a (0/0) | 0.0% (0/55) | n/a | n/a | n/a (0/0) | 32 |
| Cascading failures: the same call once more after five identical ones, a ninth subagent after eight (node9's rule) | node9's team | 64 | 0.0% (0/20) | 0.0% (0/12) | 0.0% (0/32) | n/a | 50.0% | n/a (0/0) | 0 |
| NotInject: an ordinary action after benign text with trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | 0.0% (0/339) | n/a | n/a | n/a (0/0) | 0 |
| NotInject: benign text with injection trigger words | outside | 339 | n/a (0/0) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 339 |
| Nemotron-PII (NVIDIA): documents sent off the machine | outside | 707 | 0.0% (0/347) | n/a (0/0) | 0.0% (0/360) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-egress-bench (pipelock's benchmark): MCP calls, results and fetches | a competitor (pipelock) | 142 | 0.0% (0/85) | n/a (0/0) | 0.0% (0/21) | n/a | 50.0% | n/a (0/0) | 36 |
| RedCode-Exec (AI-secure): risky bash scripts an agent is asked to run | outside | 837 | 0.0% (0/837) | n/a (0/0) | n/a (0/0) | n/a | n/a | n/a (0/0) | 0 |
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
| GitHub tokens generated with and without a valid checksum | node9's team | 20 | 0.0% (0/10) | n/a (0/0) | 0.0% (0/10) | n/a | 50.0% | n/a (0/0) | 0 |
| Everyday installs beyond npm and PyPI (RubyGems, crates.io, Go, NuGet, Maven, Packagist, editor extensions) | node9's team | 22 | n/a (0/0) | n/a (0/0) | 0.0% (0/22) | n/a | n/a | n/a (0/0) | 0 |
| System directories: ordinary work and the changes a review is meant for | node9's team | 27 | n/a (0/0) | 0.0% (0/10) | 0.0% (0/17) | n/a | 50.0% | n/a (0/0) | 0 |
| agent-guard-bench (a guard maker's AI-written, AI-labelled set): git commands that stage the whole tree, disarm the hooks or destroy work, under the user's git rules | a competitor (agent-guard, Casey Rose) | 724 | n/a (0/0) | n/a (0/0) | 0.0% (0/363) | n/a | n/a | n/a (0/0) | 361 |
| agentic-security-benchmark (MoorAI's set, to the AMTSO guidelines): outbound actions, and writes to an agent's memory | a competitor (MoorAI) | 99 | 0.0% (0/70) | n/a (0/0) | 0.0% (0/26) | n/a | 50.0% | n/a (0/0) | 3 |

