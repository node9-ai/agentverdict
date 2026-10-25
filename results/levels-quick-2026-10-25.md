# Side-by-side report, official set

- node9-gate-audit 2.39.0: corpus 6.0.0
- node9-gate-soft 2.40.0: corpus 6.0.0
- node9-gate 2.40.0: corpus 6.0.0
- node9-gate-strict 2.39.0: corpus 6.0.0
- node9-gate-block-all 2.39.0: corpus 6.0.0

## Headline score (official set, outside labels, all channels)

| Run | Attacks stopped | False positives | Precision | Balanced score |
|---|---:|---:|---:|---:|
| node9-gate-audit 2.39.0 | 0.0% (0/182) | 0.0% (0/367) | n/a | 50.0% |
| node9-gate-soft 2.40.0 | 65.4% (119/182) | 0.8% (3/367) | 97.5% | 82.3% |
| node9-gate 2.40.0 | 75.3% (137/182) | 1.9% (7/367) | 95.1% | 86.7% |
| node9-gate-strict 2.39.0 | 89.0% (162/182) | 33.2% (122/367) | 57.0% | 77.9% |
| node9-gate-block-all 2.39.0 | 100.0% (182/182) | 100.0% (367/367) | 33.2% | 50.0% |

## By OWASP Agentic Top 10 risk

The risk each case falls under, by the written rule in src/scope/owasp.ts (node9-bench's mapping). Headline: outside labels. Vendor: labels written by one of the parties. Attacks: attacks stopped out of the attacks measured. Benign: legitimate actions stopped by mistake.

| Risk | Name | Headline attacks: node9-gate-audit 2.39.0 | Headline attacks: node9-gate-soft 2.40.0 | Headline attacks: node9-gate 2.40.0 | Headline attacks: node9-gate-strict 2.39.0 | Headline attacks: node9-gate-block-all 2.39.0 | Headline benign: node9-gate-audit 2.39.0 | Headline benign: node9-gate-soft 2.40.0 | Headline benign: node9-gate 2.40.0 | Headline benign: node9-gate-strict 2.39.0 | Headline benign: node9-gate-block-all 2.39.0 | Vendor attacks: node9-gate-audit 2.39.0 | Vendor attacks: node9-gate-soft 2.40.0 | Vendor attacks: node9-gate 2.40.0 | Vendor attacks: node9-gate-strict 2.39.0 | Vendor attacks: node9-gate-block-all 2.39.0 | Vendor benign: node9-gate-audit 2.39.0 | Vendor benign: node9-gate-soft 2.40.0 | Vendor benign: node9-gate 2.40.0 | Vendor benign: node9-gate-strict 2.39.0 | Vendor benign: node9-gate-block-all 2.39.0 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ASI01 | Agent Goal Hijack | 0/13 (small: 0.0-22.8%) | 2/13 (small: 4.3-42.2%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 0/32 (small: 0.0-10.7%) | 2/32 (small: 1.7-20.1%) | 3/32 (small: 3.2-24.2%) | 4/32 (small: 5.0-28.1%) | 32/32 (small: 89.3-100.0%) | 3/10 (small: 10.8-60.3%) | 3/10 (small: 10.8-60.3%) | 8/10 (small: 49.0-94.3%) | 10/10 (small: 72.2-100.0%) | 10/10 (small: 72.2-100.0%) | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 3/10 (small: 10.8-60.3%) |
| ASI02 | Tool Misuse and Exploitation | 0/84 (small: 0.0-4.4%) | 55/84 (small: 54.8-74.8%) | 60/84 (small: 61.0-80.0%) | 84/84 (small: 95.6-100.0%) | 84/84 (small: 95.6-100.0%) | 0/119 | 0/119 | 0/119 | 74/119 | 119/119 | 0/30 (small: 0.0-11.4%) | 22/30 (small: 55.6-85.8%) | 27/30 (small: 74.4-96.5%) | 30/30 (small: 88.6-100.0%) | 30/30 (small: 88.6-100.0%) | 0/18 (small: 0.0-17.6%) | 1/18 (small: 1.0-25.8%) | 1/18 (small: 1.0-25.8%) | 10/18 (small: 33.7-75.4%) | 17/18 (small: 74.2-99.0%) |
| ASI03 | Identity and Privilege Abuse | 0/49 (small: 0.0-7.3%) | 30/49 (small: 47.2-73.6%) | 30/49 (small: 47.2-73.6%) | 31/49 (small: 49.3-75.3%) | 49/49 (small: 92.7-100.0%) | 0/153 | 1/153 | 1/153 | 1/153 | 153/153 | 5/37 (small: 5.9-28.0%) | 35/37 (small: 82.3-98.5%) | 35/37 (small: 82.3-98.5%) | 37/37 (small: 90.6-100.0%) | 37/37 (small: 90.6-100.0%) | 0/19 (small: 0.0-16.8%) | 0/19 (small: 0.0-16.8%) | 0/19 (small: 0.0-16.8%) | 6/19 (small: 15.4-54.0%) | 18/19 (small: 75.4-99.1%) |
| ASI04 | Agentic Supply Chain Vulnerabilities | 0/23 (small: 0.0-14.3%) | 21/23 (small: 73.2-97.6%) | 21/23 (small: 73.2-97.6%) | 21/23 (small: 73.2-97.6%) | 23/23 (small: 85.7-100.0%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 15/15 (small: 79.6-100.0%) | - | - | - | - | - | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 0/10 (small: 0.0-27.8%) | 10/10 (small: 72.2-100.0%) |
| ASI05 | Unexpected Code Execution | 0/13 (small: 0.0-22.8%) | 11/13 (small: 57.8-95.7%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 0/48 (small: 0.0-7.4%) | 0/48 (small: 0.0-7.4%) | 3/48 (small: 2.1-16.8%) | 43/48 (small: 77.8-95.5%) | 48/48 (small: 92.6-100.0%) | none | none | none | none | none | none | none | none | none | none |
| ASI06 | Memory and Context Poisoning | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI07 | Insecure Inter-Agent Communication | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI08 | Cascading Failures | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |
| ASI09 | Human-Agent Trust Exploitation | none | none | none | none | none | none | none | none | none | none | 0/5 (small: 0.0-43.4%) | 4/5 (small: 37.6-96.4%) | 4/5 (small: 37.6-96.4%) | 4/5 (small: 37.6-96.4%) | 5/5 (small: 56.6-100.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 6/6 (small: 61.0-100.0%) |
| ASI10 | Rogue Agents | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet | no cases yet |

## Per source: headline section (outside labels)

Labels written by a party other than node9 or the competitor: the cases the headline score is computed on. Attacks: attacks stopped out of the attacks measured (higher is better). Benign: legitimate actions stopped by mistake (lower is better). A side with fewer than 100 measured cases is marked small and shown with its Wilson 95% interval. Rows marked volatile depend on live registries and advisory databases at run time.

| Source | Area | Attacks: node9-gate-audit 2.39.0 | Attacks: node9-gate-soft 2.40.0 | Attacks: node9-gate 2.40.0 | Attacks: node9-gate-strict 2.39.0 | Attacks: node9-gate-block-all 2.39.0 | Benign: node9-gate-audit 2.39.0 | Benign: node9-gate-soft 2.40.0 | Benign: node9-gate 2.40.0 | Benign: node9-gate-strict 2.39.0 | Benign: node9-gate-block-all 2.39.0 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| CredData (Samsung) | secrets | 0/46 (small: 0.0-7.7%) | 28/46 (small: 46.5-73.6%) | 28/46 (small: 46.5-73.6%) | 28/46 (small: 46.5-73.6%) | 46/46 (small: 92.3-100.0%) | 0/153 | 1/153 | 1/153 | 1/153 | 153/153 |
| RedCode-Exec | shell | 0/67 (small: 0.0-5.4%) | 54/67 (small: 69.6-88.3%) | 61/67 (small: 81.8-95.8%) | 67/67 (small: 94.6-100.0%) | 67/67 (small: 94.6-100.0%) | - | - | - | - | - |
| NL2SH-ALFA (ordinary commands) | shell | - | - | - | - | - | 0/46 (small: 0.0-7.7%) | 0/46 (small: 0.0-7.7%) | 0/46 (small: 0.0-7.7%) | 1/46 (small: 0.4-11.3%) | 46/46 (small: 92.3-100.0%) |
| Benign scripts (MBPP Python, Exercism Bash) | shell | - | - | - | - | - | 0/48 (small: 0.0-7.4%) | 0/48 (small: 0.0-7.4%) | 3/48 (small: 2.1-16.8%) | 43/48 (small: 77.8-95.5%) | 48/48 (small: 92.6-100.0%) |
| AgentDojo, the action after a poisoned result | injection | 0/13 (small: 0.0-22.8%) | 2/13 (small: 4.3-42.2%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 13/13 (small: 77.2-100.0%) | 0/5 (small: 0.0-43.4%) | 2/5 (small: 11.8-76.9%) | 3/5 (small: 23.1-88.2%) | 4/5 (small: 37.6-96.4%) | 5/5 (small: 56.6-100.0%) |
| NotInject, an ordinary action after benign text | injection | - | - | - | - | - | 0/27 (small: 0.0-12.5%) | 0/27 (small: 0.0-12.5%) | 0/27 (small: 0.0-12.5%) | 0/27 (small: 0.0-12.5%) | 27/27 (small: 87.5-100.0%) |
| OSV, npm and PyPI | packages, volatile | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | - | - | - | - | - |
| DataDog, npm and PyPI | packages, volatile | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | - | - | - | - | - |
| typomind (typosquats) | packages, volatile | 0/5 (small: 0.0-43.4%) | 3/5 (small: 23.1-88.2%) | 3/5 (small: 23.1-88.2%) | 3/5 (small: 23.1-88.2%) | 5/5 (small: 56.6-100.0%) | - | - | - | - | - |
| OSV, other ecosystems | packages, volatile | 0/8 (small: 0.0-32.4%) | 8/8 (small: 67.6-100.0%) | 8/8 (small: 67.6-100.0%) | 8/8 (small: 67.6-100.0%) | 8/8 (small: 67.6-100.0%) | - | - | - | - | - |
| Most downloaded packages (npm, PyPI) | packages, volatile | - | - | - | - | - | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 0/15 (small: 0.0-20.4%) | 15/15 (small: 79.6-100.0%) |
| Nemotron-PII | pii | 0/11 (small: 0.0-25.9%) | 5/11 (small: 21.3-72.0%) | 5/11 (small: 21.3-72.0%) | 11/11 (small: 74.1-100.0%) | 11/11 (small: 74.1-100.0%) | 0/24 (small: 0.0-13.8%) | 0/24 (small: 0.0-13.8%) | 0/24 (small: 0.0-13.8%) | 24/24 (small: 86.2-100.0%) | 24/24 (small: 86.2-100.0%) |
| Gretel, financial documents | pii | 0/14 (small: 0.0-21.5%) | 7/14 (small: 26.8-73.2%) | 7/14 (small: 26.8-73.2%) | 14/14 (small: 78.5-100.0%) | 14/14 (small: 78.5-100.0%) | 0/24 (small: 0.0-13.8%) | 0/24 (small: 0.0-13.8%) | 0/24 (small: 0.0-13.8%) | 24/24 (small: 86.2-100.0%) | 24/24 (small: 86.2-100.0%) |
| OpenPII | pii | 0/8 (small: 0.0-32.4%) | 2/8 (small: 7.1-59.1%) | 2/8 (small: 7.1-59.1%) | 8/8 (small: 67.6-100.0%) | 8/8 (small: 67.6-100.0%) | 0/25 (small: 0.0-13.3%) | 0/25 (small: 0.0-13.3%) | 0/25 (small: 0.0-13.3%) | 25/25 (small: 86.7-100.0%) | 25/25 (small: 86.7-100.0%) |

## Per source: vendor section (labels written by one of the parties)

node9's own tests (the regression track) and a competitor's own suite. Each side's definitions, with equal weight in this section, never in the headline.

| Source | Labels by | Attacks: node9-gate-audit 2.39.0 | Attacks: node9-gate-soft 2.40.0 | Attacks: node9-gate 2.40.0 | Attacks: node9-gate-strict 2.39.0 | Attacks: node9-gate-block-all 2.39.0 | Benign: node9-gate-audit 2.39.0 | Benign: node9-gate-soft 2.40.0 | Benign: node9-gate 2.40.0 | Benign: node9-gate-strict 2.39.0 | Benign: node9-gate-block-all 2.39.0 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Actions after reading outside content | node9's team | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 0/3 (small: 0.0-56.1%) | 0/3 (small: 0.0-56.1%) | 0/3 (small: 0.0-56.1%) | 0/3 (small: 0.0-56.1%) | 3/3 (small: 43.9-100.0%) |
| Dangerous actions (category rule) | node9's team | 0/5 (small: 0.0-43.4%) | 4/5 (small: 37.6-96.4%) | 4/5 (small: 37.6-96.4%) | 4/5 (small: 37.6-96.4%) | 5/5 (small: 56.6-100.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 0/6 (small: 0.0-39.0%) | 6/6 (small: 61.0-100.0%) |
| node9's own tests | node9's team | 8/55 (small: 7.6-26.2%) | 53/55 (small: 87.7-99.0%) | 53/55 (small: 87.7-99.0%) | 55/55 (small: 93.5-100.0%) | 55/55 (small: 93.5-100.0%) | 0/30 (small: 0.0-11.4%) | 1/30 (small: 0.6-16.7%) | 1/30 (small: 0.6-16.7%) | 13/30 (small: 27.4-60.8%) | 23/30 (small: 59.1-88.2%) |
| GitHub tokens | node9's team | 0/4 (small: 0.0-49.0%) | 4/4 (small: 51.0-100.0%) | 4/4 (small: 51.0-100.0%) | 4/4 (small: 51.0-100.0%) | 4/4 (small: 51.0-100.0%) | 0/4 (small: 0.0-49.0%) | 0/4 (small: 0.0-49.0%) | 0/4 (small: 0.0-49.0%) | 0/4 (small: 0.0-49.0%) | 4/4 (small: 51.0-100.0%) |
| Everyday installs | node9's team | - | - | - | - | - | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) |
| Everyday installs, other ecosystems | node9's team | - | - | - | - | - | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) |
| System directory operations | node9's team | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 5/5 (small: 56.6-100.0%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 1/5 (small: 3.6-62.4%) | 5/5 (small: 56.6-100.0%) |
| agent-egress-bench (pipelock's benchmark) | competitor | 0/8 (small: 0.0-32.4%) | 3/8 (small: 13.7-69.4%) | 3/8 (small: 13.7-69.4%) | 8/8 (small: 67.6-100.0%) | 8/8 (small: 67.6-100.0%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 0/5 (small: 0.0-43.4%) | 2/5 (small: 11.8-76.9%) | 3/5 (small: 23.1-88.2%) |

