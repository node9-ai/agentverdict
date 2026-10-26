# Side-by-side report, official set, public split only

- node9-gate-soft 2.40.0: corpus 6.0.0
- node9-gate 2.40.0: corpus 6.0.0
- node9-gate-strict 2.40.0: corpus 6.0.0

## Headline score (official set, outside labels, all channels)

| Run | Attacks stopped | False positives | Precision | Balanced score |
|---|---:|---:|---:|---:|
| node9-gate-soft 2.40.0 | 60.5% (1066/1761) | 0.7% (27/3606) | 97.5% | 79.9% |
| node9-gate 2.40.0 | 69.3% (1220/1761) | 1.1% (40/3606) | 96.8% | 84.1% |
| node9-gate-strict 2.40.0 | 83.8% (1476/1761) | 32.1% (1158/3606) | 56.0% | 75.9% |

## By OWASP Agentic Top 10 risk

The risk each case falls under, by the written rule in src/scope/owasp.ts (node9-bench's mapping). Headline: outside labels. Vendor: labels written by one of the parties. Attacks: attacks stopped out of the attacks measured. Benign: legitimate actions stopped by mistake.

| Risk | Name | Headline attacks: node9-gate-soft 2.40.0 | Headline attacks: node9-gate 2.40.0 | Headline attacks: node9-gate-strict 2.40.0 | Headline benign: node9-gate-soft 2.40.0 | Headline benign: node9-gate 2.40.0 | Headline benign: node9-gate-strict 2.40.0 | Vendor attacks: node9-gate-soft 2.40.0 | Vendor attacks: node9-gate 2.40.0 | Vendor attacks: node9-gate-strict 2.40.0 | Vendor benign: node9-gate-soft 2.40.0 | Vendor benign: node9-gate 2.40.0 | Vendor benign: node9-gate-strict 2.40.0 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ASI01 | Agent Goal Hijack | 26/123 | 105/123 | 110/123 | 3/279 | 7/279 | 8/279 | 12/25 (small: 30.0-66.5%) | 20/25 (small: 60.9-91.1%) | 25/25 (small: 86.7-100.0%) | 0/25 (small: 0.0-13.3%) | 0/25 (small: 0.0-13.3%) | 0/25 (small: 0.0-13.3%) |
| ASI02 | Tool Misuse and Exploitation | 519/832 | 582/832 | 809/832 | 0/1181 | 1/1181 | 726/1181 | 125/166 | 139/166 | 157/166 | 3/91 (small: 1.1-9.2%) | 3/91 (small: 1.1-9.2%) | 51/91 (small: 45.8-65.8%) |
| ASI03 | Identity and Privilege Abuse | 239/480 | 239/480 | 263/480 | 17/1528 | 17/1528 | 17/1528 | 167/185 | 167/185 | 184/185 | 3/58 (small: 1.8-14.1%) | 3/58 (small: 1.8-14.1%) | 16/58 (small: 17.8-40.2%) |
| ASI04 | Agentic Supply Chain Vulnerabilities | 170/202 | 170/202 | 170/202 | 3/145 | 0/145 | 0/145 | - | - | - | 5/50 (small: 4.3-21.4%) | 2/50 (small: 1.1-13.5%) | 2/50 (small: 1.1-13.5%) |
| ASI05 | Unexpected Code Execution | 112/124 | 124/124 | 124/124 | 4/473 | 15/473 | 407/473 | none | none | none | none | none | none |
| ASI06 | Memory and Context Poisoning | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI07 | Insecure Inter-Agent Communication | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI08 | Cascading Failures | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI09 | Human-Agent Trust Exploitation | none | none | none | none | none | none | 29/32 (small: 75.8-96.8%) | 29/32 (small: 75.8-96.8%) | 29/32 (small: 75.8-96.8%) | 0/55 (small: 0.0-6.5%) | 0/55 (small: 0.0-6.5%) | 0/55 (small: 0.0-6.5%) |
| ASI10 | Rogue Agents | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |

## Per source: headline section (outside labels)

Labels written by a party other than node9 or the competitor: the cases the headline score is computed on. Attacks: attacks stopped out of the attacks measured (higher is better). Benign: legitimate actions stopped by mistake (lower is better). A side with fewer than 100 measured cases is marked small and shown with its Wilson 95% interval. Rows marked volatile depend on live registries and advisory databases at run time.

| Source | Area | Attacks: node9-gate-soft 2.40.0 | Attacks: node9-gate 2.40.0 | Attacks: node9-gate-strict 2.40.0 | Benign: node9-gate-soft 2.40.0 | Benign: node9-gate 2.40.0 | Benign: node9-gate-strict 2.40.0 |
|---|---|---:|---:|---:|---:|---:|---:|
| CredData (Samsung) | secrets | 235/452 | 235/452 | 235/452 | 17/1528 | 17/1528 | 17/1528 |
| RedCode-Exec | shell | 519/664 | 594/664 | 641/664 | - | - | - |
| NL2SH-ALFA (ordinary commands) | shell | - | - | - | 0/458 | 1/458 | 3/458 |
| Benign scripts (MBPP Python, Exercism Bash) | shell | - | - | - | 4/473 | 15/473 | 407/473 |
| AgentDojo, the action after a poisoned result | injection | 26/123 | 105/123 | 110/123 | 3/17 (small: 6.2-41.0%) | 7/17 (small: 21.6-64.0%) | 8/17 (small: 26.2-69.0%) |
| NotInject, an ordinary action after benign text | injection | - | - | - | 0/262 | 0/262 | 0/262 |
| OSV, npm and PyPI | packages, volatile | 27/27 (small: 87.5-100.0%) | 27/27 (small: 87.5-100.0%) | 27/27 (small: 87.5-100.0%) | - | - | - |
| DataDog, npm and PyPI | packages, volatile | 38/48 (small: 65.7-88.3%) | 38/48 (small: 65.7-88.3%) | 38/48 (small: 65.7-88.3%) | - | - | - |
| typomind (typosquats) | packages, volatile | 25/47 (small: 39.2-66.7%) | 25/47 (small: 39.2-66.7%) | 25/47 (small: 39.2-66.7%) | - | - | - |
| OSV, other ecosystems | packages, volatile | 80/80 (small: 95.4-100.0%) | 80/80 (small: 95.4-100.0%) | 80/80 (small: 95.4-100.0%) | - | - | - |
| Most downloaded packages (npm, PyPI) | packages, volatile | - | - | - | 3/145 | 0/145 | 0/145 |
| Nemotron-PII | pii | 40/109 | 40/109 | 109/109 | 0/240 | 0/240 | 240/240 |
| Gretel, financial documents | pii | 64/132 | 64/132 | 132/132 | 0/239 | 0/239 | 239/239 |
| OpenPII | pii | 12/79 (small: 8.9-24.7%) | 12/79 (small: 8.9-24.7%) | 79/79 (small: 95.4-100.0%) | 0/244 | 0/244 | 244/244 |

## Per source: vendor section (labels written by one of the parties)

node9's own tests (the regression track) and a competitor's own suite. Each side's definitions, with equal weight in this section, never in the headline.

| Source | Labels by | Attacks: node9-gate-soft 2.40.0 | Attacks: node9-gate 2.40.0 | Attacks: node9-gate-strict 2.40.0 | Benign: node9-gate-soft 2.40.0 | Benign: node9-gate 2.40.0 | Benign: node9-gate-strict 2.40.0 |
|---|---|---:|---:|---:|---:|---:|---:|
| Actions after reading outside content | node9's team | 1/9 (small: 2.0-43.5%) | 9/9 (small: 70.1-100.0%) | 9/9 (small: 70.1-100.0%) | 0/3 (small: 0.0-56.1%) | 0/3 (small: 0.0-56.1%) | 0/3 (small: 0.0-56.1%) |
| Dangerous actions (category rule) | node9's team | 29/32 (small: 75.8-96.8%) | 29/32 (small: 75.8-96.8%) | 29/32 (small: 75.8-96.8%) | 0/55 (small: 0.0-6.5%) | 0/55 (small: 0.0-6.5%) | 0/55 (small: 0.0-6.5%) |
| node9's own tests | node9's team | 272/277 | 272/277 | 277/277 | 6/119 | 6/119 | 56/119 |
| GitHub tokens | node9's team | 4/4 (small: 51.0-100.0%) | 4/4 (small: 51.0-100.0%) | 4/4 (small: 51.0-100.0%) | 0/4 (small: 0.0-49.0%) | 0/4 (small: 0.0-49.0%) | 0/4 (small: 0.0-49.0%) |
| Everyday installs | node9's team | - | - | - | 5/35 (small: 6.3-29.4%) | 2/35 (small: 1.6-18.6%) | 2/35 (small: 1.6-18.6%) |
| Everyday installs, other ecosystems | node9's team | - | - | - | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) |
| System directory operations | node9's team | 0/7 (small: 0.0-35.4%) | 7/7 (small: 64.6-100.0%) | 7/7 (small: 64.6-100.0%) | 0/13 (small: 0.0-22.8%) | 0/13 (small: 0.0-22.8%) | 2/13 (small: 4.3-42.2%) |
| agent-egress-bench (pipelock's benchmark) | competitor | 27/79 (small: 24.7-45.2%) | 34/79 (small: 32.7-54.0%) | 69/79 (small: 78.2-93.0%) | 0/35 (small: 0.0-9.9%) | 0/35 (small: 0.0-9.9%) | 9/35 (small: 14.2-42.1%) |

