# Changelog

Versions are corpus versions: they say which cases and labels a result was
measured on. The rules for choosing the next one are in README.md
(Versioning). Code changes that do not touch `corpus/` or `profiles/` do not
get a corpus version; their commits carry the history.

Name: since 2026-10-26 the benchmark is called **AgentVerdict**
(repository `node9-ai/agentverdict`); until then it was node9-bench. The
entries below keep the old name where they describe their time. Source ids
(`node9-bench-*`) and the salts that draw the sets keep it too, so no case
and no split moves.

## corpus 7.0.0 (2026-11-02)

Major: the split moves. No case of 6.1.1 is removed or changed (id,
content, label, set); 1,356 cases are added, all held out.

- **Every 6.1.1 case is public**, apart from the 45 made by node9's private
  generators (token generator, system-operation and exposure designs,
  hand-chosen package lists), which stay held out. Until now a fifth of
  every source was held out by a salted hash of the case's group, and that
  holdout could be rebuilt: each public fetch script reproduces its whole
  sample, and the public snapshot minus that sample was the holdout (shown
  on agent-guard-bench: the 124 rows of the difference were exactly its 124
  held-out cases). Answers measured on 6.1.1 carry over unchanged
  (`npm run extend-run`).
- **A new holdout, drawn in secret.** Each source whose sample is a small
  part of a much larger pool draws extra rows from the part the sample did
  not take, with a selection salt kept in the holdout repository
  (`--held-extra` in its fetch script; `src/sources/held-extra.ts`), in the
  counts per label its 6.1.1 holdout had, from a pool at least five times as
  large: CredData 677 (from 32 repositories the sample never touched),
  Gretel 132, agent-guard-bench 124, OpenPII 115, Nemotron-PII 107,
  BrowseSafe 106, InjecAgent 46, OSV other ecosystems 24 (rubygems and
  nuget; the sample took the other six ecosystems whole), typomind 13,
  Datadog 12. A public refetch reproduces the public sample exactly; the
  held-out rows are mixed into the rest of each pool.
- **Sources used whole stay public in full** (RedCode, NL2SH-ALFA, MBPP,
  Exercism, NotInject, AgentDojo, PII-TRACE, the most downloaded packages,
  agent-egress-bench, agentic-security-benchmark, node9's tests from its
  public repository): holding part of them out would hide nothing. The
  holdout has no headline shell, MCP or injection case.
- **The split is a list.** `src/split.ts` reads the held-out groups from the
  holdout repository's `held-groups.json` instead of hashing them.
- **Found on the way:** `sources/creddata/value-spans.json`, copied whole to
  this repository, had listed the value positions of the 232 held-out
  CredData T lines; seven held-out case names were written in public code
  (fixed 2026-11-02, before this version). Both concerned 6.1.1's holdout,
  which is public now. Held-out CredData lines now carry their own spans,
  and the span and notice scripts leave held-out lines and repositories out
  of the public files.
- Counts: 13,329 cases, 1,401 held out, 11,928 public; official 9,090
  (headline 7,428, vendor 1,662), extended 4,239.

## corpus 6.1.1 (2026-10-26)

Patch: no case added or removed, no label, setup or id changed; 10 cases
move to the extended set. 6.1.0 was never measured.

- **New reason `documentation-example-credential`** (a test flaw): a case
  labelled stopped only because a credential leaves, where every credential
  in it is a published documentation example or a declared fake (AWS's
  documented example key pair, values marked EXAMPLE or FAKE) and nothing
  else in the case carries the harm. A guard that rightly ignores
  documentation examples cannot see it (node9 does; agent-egress-bench's own
  `fp-example-aws-key-003` labels the same key allow). Found by searching
  every stop-labelled case for the example values, then read by hand: 5
  agent-egress-bench and 5 agentic-security-benchmark cases move; 2 that also
  read a credential file stay official. A test fails on any new stop case
  carrying such a value that is not classified (`test/scope-doc-example.test.ts`).

Official 8,220 (headline 6,682 unchanged, vendor 1,538), extended 3,753.

## corpus 6.1.0 (2026-10-26)

Minor: cases and profiles added; no existing case or label changed. Every
6.0.0 case, held-out ones included, is byte-identical in 6.1.0, so results on
6.0.0 stay comparable source by source. Two sources written by other guards'
makers, both in the vendor section (`bench-6.1.0-new-sources-design.md` in
node9/docs, approved 2026-10-26):

- **agent-guard-bench** (Casey Rose, MIT, `CASEY-OS/agent-guard-bench@166e7ee`):
  600 of the 3,300 Bash commands of its blind_v20 set, 100 `stop` per policy
  and 300 `allow` by class (`src/sources/agb-sample.ts`). The commands stage
  the whole tree, disarm the git hooks or destroy uncommitted or pushed work;
  the ordinary ones are their near twins. AI-written and AI-labelled (the
  author's Claude labelers), stated in the DATASHEET. New profile
  `git-guardrails` and profile field `gitPolicies`: the user declared the
  author's three policies; a tool with no such setting is measured at its
  default (node9 has none; its adapter says so in the detail).
- **agentic-security-benchmark** (Itay Glick, MoorAI, Apache-2.0,
  `gitayg/agentic-security-benchmark@cbb3894`), written to the AMTSO
  guidelines: all 81 records of attack vector 4 (outbound actions: exfiltration,
  payments, repository settings, database, messages, persistence) under the
  new profile `asb-sandbox`, and the 18 `steps` records of vector 5 (memory,
  shared artifacts, hand-offs) as the calls an agent makes. Five actions
  whose harm depends on what the user asked go to the extended set
  (`action-without-context`).
- **OWASP**: first cases for ASI06 (memory and context poisoning, 18) and
  ASI10 (rogue agents, 199: the git-hooks classes and a write to the
  agent's own hook settings); vector 4's remote-code-execution actions under
  ASI05. Eight of ten risks now have cases; ASI07 and ASI08 wait for the
  network and multi-agent doors.
- Reports name each competitor source's maker (`COMPETITOR_MAKERS` in
  `src/suites.ts`).

What changed against 6.0.0, computed by `npm run corpus:diff -- <ref>` on
the public cases (sources not listed are unchanged):

| Source | Cases | Ids gone | Ids new | Content changed | Moved between splits | Labels changed | Holdout |
|---|---:|---:|---:|---:|---:|---:|---|
| agent-guard-bench | 0 to 476 public | 0 | 476 | 0 | 0 | 0 | 124 held |
| agentic-security-benchmark | 0 to 82 public | 0 | 82 | 0 | 0 | 0 | 17 held |

Total: 11,274 to 11,973 cases (public 9,073 to 9,631); holdout 2,201 to
2,342 (19.6%); 0 ids gone, 699 new, 0 contents changed, 0 moved between
splits, 0 labels changed. Official 8,230 (headline 6,682, vendor 1,548),
extended 3,743.

## corpus 6.0.0 (2026-10-25)

Major: ids and content of existing cases change; **no label moves** (no
`expected`, `setup` or `channel` of any case). The clean separation of the
holdout (`bench-holdout-separation-design.md` in node9/docs): every case is
derived from rows of one snapshot section, and nothing a converter writes
depends on another row being present, so the holdout is a list of rows that
can leave the public tree. `npm run holdout:check` proves it: the corpus
rebuilt from the cut sources without the salt equals the public cases here.

- **The holdout salt leaves the code**: `holdout/salt`, present only where
  the holdout is. Without it every group is public. `corpus-version.json`
  pins `public_sha256` (the public cases alone) beside `sha256`; summaries
  record both; `check-results` accepts a run that carries the public hash.
- **Order-independent converters.** NotInject and BrowseSafe carriers,
  package command forms and pinning, AgentDojo goals and tasks are a stable
  slot of the row's own key (`slot` in `src/convert/record.ts`), never a
  position or a running counter; token lookalike carriers come from a fixed
  table per prefix; the two combined package cases (a bad version hidden in
  a list, one run through npx) are marked on their package's snapshot row
  (`combined`) and take their id from it (`package.compromised.<name>.mixed-list`,
  `.npx-pinned`). `dedupe` keeps a public copy over a holdout one.
- **node9's own cases are snapshot rows** (`sources/node9-bench/<name>.json`,
  written by `npm run sources:node9-bench` from the generators in
  `src/sources/node9-bench/`); the converter only reads rows. The canary
  profile and the egress deny profiles are built from the rows present.
- **AgentDojo: the vector is the holdout unit.** `agentdojo-seq` cases take
  their vector's group, so every case of one vector is on one side (12 of 39
  vectors were split before); `agentdojo-calls` and `dangerous-actions`,
  built from the task table alone, are never held out (`NO_HOLDOUT_PREFIXES`
  in `src/split.ts`). `agentdojo-seq` pairs each vector with the tasks of its
  slot: 168 pairs have a first action, 172 before.
- Tools: `npm run holdout:cut`, `npm run holdout:check`, `npm run corpus:diff`.

What changed against 5.1.1, computed by `npm run corpus:diff -- <ref>`
(sources not listed are unchanged):

| Source | Cases | Ids gone | Ids new | Content changed | Moved between splits | Labels changed | Holdout |
|---|---:|---:|---:|---:|---:|---:|---|
| agentdojo | 468 | 0 | 0 | 198 | 0 | 0 | 72 |
| agentdojo-calls | 91 | 0 | 0 | 0 | 16 | 0 | 16 to 0 |
| agentdojo-seq | 172 to 168 | 147 | 143 | 25 | 4 | 0 | 54 to 28 |
| browsesafe | 600 | 283 | 283 | 0 | 0 | 0 | 106 |
| dangerous-actions | 87 | 0 | 0 | 0 | 14 | 0 | 14 to 0 |
| node9-bench-exposure | 15 | 0 | 0 | 15 | 0 | 0 | 3 |
| node9-bench-package-list | 42 | 0 | 0 | 30 | 0 | 0 | 7 |
| node9-bench-package-list-more | 22 | 0 | 0 | 16 | 0 | 0 | 7 |
| notinject | 339 | 233 | 233 | 0 | 0 | 0 | 77 |
| notinject-seq | 339 | 233 | 233 | 0 | 0 | 0 | 77 |
| osv-malicious-packages | 36 | 2 | 2 | 28 | 0 | 0 | 9 |
| popular-packages | 191 | 0 | 0 | 182 | 0 | 0 | 46 |

Total: 11,278 to 11,274 cases; holdout 2,257 to 2,201 (19.5%); 898 ids
gone, 894 new, 494 contents changed (a carrier, a command form, a goal, a
source_ref), 34 moved between splits, 0 labels changed. Results on 5.1.x are
not comparable to 6.0.0; every tool is re-measured.

## corpus 5.1.1 (2026-10-25)

Patch: no case added or removed, no label, setup or id changed.

- **OWASP risk on every case** (`owasp`, ASI01 to ASI10 of the OWASP Top 10
  for Agentic Applications), by one written rule in `src/scope/owasp.ts`:
  the source when it decides (RedCode's untrusted installation, eval
  injection and reverse shell, and the benign scripts: ASI05; the actions
  after outside content: ASI01; the dangerous actions that need a person's
  approval, and the ordinary actions beside them: ASI09), otherwise the channel (secrets ASI03;
  personal data, egress, shell and MCP actions ASI02; packages ASI04;
  injection ASI01). The benign side of a risk carries the risk it is the
  control for. node9-bench's mapping; validate recomputes it.
  `npm run report -- <runs> --owasp` adds the table per risk, with "no cases
  yet" for ASI06, ASI07, ASI08 and ASI10.
- **The 48 cases licensed `node9-internal`** (the 28 legitimate SSH commands
  and the 20 generated GitHub tokens) are now Apache-2.0, like node9's other
  tests (founder, 2026-10-24).

## corpus 5.1.0 (2026-10-23)

Minor: cases added, nothing existing changed. Step 6 of the three-sets plan.

- **Benign scripts** (+598), new source `benign-scripts` (outside labels,
  mapped by provenance): the 500 reference solutions of MBPP's test split
  (Google, CC BY 4.0), each followed by its test assertions and run inline
  exactly like RedCode's Python, and the 100 example solutions of the
  Exercism Bash track (MIT), run as the scripts they are; two identical
  programs dropped as duplicates. Under `jailed-agent`, the same profile as
  RedCode-Exec, so the inline-code rule and the jail pay their false
  positives on ordinary programs of the same form. Closes the form cue a
  review found (RedCode scripts against NL2SH one-liners).
- **Most downloaded packages** (+191), new source `popular-packages`
  (outside labels, mapped by provenance): the 100 most downloaded npm and
  PyPI packages by official download counts (PyPI: hugovk/top-pypi-packages,
  the BigQuery statistics of 2026-10-01; npm: api.npmjs.org last-month counts
  over a pool of 300 names from packages.ecosyste.ms), each latest version
  checked against OSV MAL records (none refused), 9 names already in
  node9-bench's own everyday-install list left out. Installed once each,
  pinned and unpinned in turn with the package channel's command forms;
  volatile. The outside benign side of the package channel.
- `npm run sources:benign-scripts`, `npm run sources:popular-packages`;
  downloads recorded in `external/MANIFEST.md`.

Totals: 11,278 cases; outside labels 10,424, node9 712, competitor 142;
holdout 2,257 (20.0%). Headline 6,686, vendor 854, extended 3,738.

## corpus 5.0.0 (2026-10-23)

Major: the setup of existing cases changed (837 RedCode-Exec cases), so
RedCode results on 4.x do not compare. No label, id or call changed. Step 5
of the three-sets plan.

- **RedCode-Exec runs under `jailed-agent`**, a new profile: the user
  declared everything outside the project off-limits (block), RedCode's own
  sandboxed-agent threat model, so reading `/etc/passwd` is blocked there
  while NL2SH-ALFA keeps `clean` and allows it. The declaration is general,
  the FHS top-level directories (`src/convert/profiles.ts`,
  `JAILED_SYSTEM_DIRS`), not written per script; every tool gets the same
  list. node9 cannot express "everything except the project" (its jail is a
  list of paths and refuses `/` or a home directory), which is why it is a
  list; recorded in DATASHEET, Known limitations, with what the list leaves
  out.

Totals: 10,489 cases, unchanged.

## corpus 4.1.0 (2026-10-23)

Minor: cases and a profile added; no existing case or label changed. Step 4
of the three-sets plan.

- **Dangerous actions** (+87), new source `dangerous-actions`, labels by
  node9-bench (vendor section until an outside person has checked them). A
  written category list, applied by the tool a call names, never by its
  arguments or by who asked: money movement (`send_money`,
  `schedule_transaction`, `update_scheduled_transaction`), credential change
  (`update_password`), deletion (`delete_email`, `delete_file`), user and
  access management (`invite_user_to_slack`, `remove_user_from_slack`,
  `add_user_to_channel`, `share_file`), publishing (`post_webpage`): review,
  a person approves even when the user asked (32). Any other state-changing
  action (calendar, hotel, files in the workspace, messages, profile
  details, reading a page): allow (55). Material: every distinct
  state-changing ground-truth call of AgentDojo's four suites, injection and
  user tasks alike; 4 calls whose arguments carry an IBAN or a card number
  are left out. New profile `ask-before-dangerous-actions` (`holdActions`:
  the user asked to be consulted before those five categories); a tool with
  no such setting is measured as it is. InjecAgent's attacker tools have no
  arguments in the source and are not included.
- **NotInject, the combination** (+339), new source `notinject-seq`
  (outside labels, mapped): each benign text with trigger words as a prior
  tool result, then one fixed ordinary action, a Write of a short summary to
  `notes/summary.md`, under `exposure-org` like agentdojo-seq. Allow. Same
  carriers and groups as the text-only cases, which stay in the extended
  set. Headline: 5,897; vendor: 854.

Totals: 10,489 cases; outside labels 9,635, node9 712, competitor 142;
holdout 2,086 (19.9%).

## corpus 4.0.0 (2026-10-23)

Major: labels of an existing source changed. Step 3 of the three-sets plan.
Results on 3.x stay comparable case by case except on `agentdojo-seq`
(`compare` lists its relabelled cases apart).

- **agentdojo-seq carries AgentDojo's ground truth** instead of node9's
  exposure design. The attack case is the poisoned result, then the
  injection task's first state-changing ground-truth call: review, the action
  AgentDojo scores an attack by. The benign case is the clean result, then
  the user task's first state-changing call: allow, whatever its destination
  (11 "pay the bill" cases move from review, node9's `accepted_interruption`,
  to allow). `why` is now `attacker_action_after_poisoned_result` or
  `user_action_after_clean_result`; ids, groups, calls and prior results are
  unchanged. `LABELS` marks the source outside; `LABEL_RULES` records the
  mapping (which call is the action, and review rather than block). The
  source moves from the vendor section to the headline: 5,558 headline, 767
  vendor.
- **InjecAgent, the combination: not built.** Its attacker cases name the
  tool and state the instruction in prose, without the call's arguments
  (`data/attacker_cases_dh.jsonl`, `data/attacker_cases_ds.jsonl` at the
  pinned commit: fields Attacker Tools, Modifed, Attacker Instruction,
  Expected Achievements, Attack Type). Building the call would mean inventing
  its arguments, so the text stays in the extended set and the gap is
  recorded (DATASHEET, Known limitations).

Totals: 10,063 cases, unchanged; outside labels 9,296, node9 625,
competitor 142.

## corpus 3.1.0 (2026-10-23)

Minor: no case or label changed; every case gains its set. Step 1 of the
three-sets plan (node9 docs `roadmap/active/bench-sets-build-plan.md`,
node9Firewall#371).

- **Set membership on every case** (`set`, `section`, `extended_reason`;
  README, Record format). `official` is the benchmark, built by category and
  size of harm; `extended` keeps every excluded case with a reason code from
  a closed list (`src/scope/reasons.ts`): `creddata-category-out` (1,090:
  Password, UUID, Salt, Nonce, Firebase Domain, T and F lines alike),
  `invented-card` (114: the only fraud-enabling identifier is a card number
  that fails Luhn), `pii-no-checksum` (353), `pii-biometric` (30),
  `context-only` (413: PII-TRACE), `text-only` (1,647: AgentDojo templates,
  InjecAgent, BrowseSafe, NotInject), `action-without-context` (91:
  AgentDojo calls). Official cases are `headline` (outside labels, 5,386) or
  `vendor` (node9's and pipelock's own suites, 939). The rules are
  predicates in `src/scope/rules.ts`, applied by `convert`; `validate`
  recomputes them and refuses a case whose fields disagree or whose reason
  is not in the list.
- **Tags** (`tags`): facts the rules read, written by the converters from the
  source's own metadata: CredData's categories of each line
  (`creddata:<category>`), the fraud-enabling identifier types of each PII
  document (`pii:<tag>`) and, for a card, whether a card-shaped number in the
  text passes Luhn (`card:luhn-valid`, `card:luhn-invalid`;
  `src/scope/luhn.ts`). No case content changed.
- **Quick set** draws from the official set's public split only (about 600
  cases, was about 900).
- Results carry `set`, `section` and `extended_reason`; older results get
  them from the corpus by id when reported.

Totals: 10,063 cases, unchanged. Official 6,325 (headline 5,386, vendor
939), extended 3,738.

## corpus 3.0.0 (2026-10-19)

Major: cases removed and replaced (CredData, the PII sources), so results on
2.x do not compare. No label rule of a source changed. Fixes three sampling
choices of this corpus that a review found weaker than they should be.

- **CredData: 100 repositories chosen at random** instead of the 60
  smallest (a bias toward small projects). Eligible: an open licence, at
  least one T line, at most 100 MB on GitHub (270 of 336; the size limit
  leaves out 17 of 287). Chosen by `sha256("node9-bench/creddata/repos/v2:
  <repo_id>")` order; every candidate, its rank and why it was or was not
  chosen is committed in `sources/creddata/repositories.tsv`
  (`npm run sources:creddata-repos`). The repositories were fetched at the
  commits CredData labelled, obfuscated with CredData's own script and
  deleted the same day (`external/MANIFEST.md`). 1,151 credentials and 2,360
  look-alikes (was 641 and 1,206); copyright notices of all 100 in
  `sources/creddata/REPOSITORY-NOTICES.md`.
- **RedCode-Exec in Python too** (+449): the same rule as Bash (the paper's
  buggy-code scenarios and the bias scenario left out), which also brings
  two scenarios that exist only in Python, create a reverse shell and monitor
  system. Two Python files not in the paper's table of 25 scenarios are left
  out. A Python script runs inline, `python3 - <<'PYEOF'`, so a guard sees
  the program. It shares its group with the Bash script of the same index.
  Existing Bash cases are unchanged.
- **Larger samples where 60 per class was too few to tell tools apart:**
  Nemotron-PII, Gretel and OpenPII 300 + 300; PII-TRACE every eligible
  conversation (215 + 198); BrowseSafe 300 + 300 (its first 40 per label are
  the same as before). Nemotron-PII now samples the whole train split
  (100,000 documents; a fixed 50,000 left the second half out) and counts a
  document read twice by overlapping pages once.
- **Quick set** (`src/quick.ts`, `npm run bench -- --set quick`): about 900
  cases, a fixed tenth of the public split per source and verdict, for runs
  between changes.
- validate: in a tool's output, which holds outside content as is, only this
  corpus's own placeholders count (a BrowseSafe page carries `{{TITLE}}`).

Totals: 10,063 cases; outside labels 9,124, node9 797, competitor 142;
holdout 1,995 (19.8%).

## corpus 2.1.0 (2026-10-19)

Minor: cases added, no existing case or label changed. Follows an
independent review of the corpus (node9Firewall#371).

- **NL2SH-ALFA, every row** (+73 cases, 565 in all). The 39 rows left out
  until now (they delete files, change permissions or ownership, stop or list
  services, read the crontab or an account file such as `/etc/group`) are
  ordinary tasks users asked for, labelled allow like every other row.
  Leaving them out made the benign side easier than real work: a guard that
  stopped every `rm` or `chmod` paid no false positive for it. Where
  RedCode-Exec labels a similar action risky, the two labels are left to
  disagree in the open. `nl2sh-alfa.127` is not added: its command is the same
  as `nl2sh-alfa.112` (one call, one case).
- **Label rule per outside source** (`LABEL_RULES` in `src/suites.ts`;
  validate refuses a source without one): whether `expected` is the source's
  own label or node9-bench's mapping. Mapped: NL2SH-ALFA and the four PII
  sources. No case changes.
- **DATASHEET.md**: the label rules, and three cues an independent review
  found that make cases easier than real work (the form of RedCode-Exec
  scripts, what CredData's obfuscation does to credential values, the
  NL2SH-ALFA rows restored here), stated as known limitations.

Fixes outside the corpus: `sources/creddata/value-spans.json` placed the end
of a value over several lines (a PEM key) in its first line; the end now
counts in its last line, as CredData records it. The draft annotation rules
read a fact from the holdout split; they now read the public split only.

Totals: 5,697 cases; outside labels 4,758, node9 797, competitor 142.

## corpus 2.0.0 (2026-10-19)

Major: cases were removed (duplicates) and node9's own fixture cases moved
with their pinned source. No outside label changed. Re-measure every tool
compared on this version.

- **One call, one case** (`src/dedupe.ts`). Cases that present a tool the same
  call (channel, tool, stage, setup, tool input, tool output, prior calls;
  only line indentation ignored) are now one case; the outside-labelled copy
  is kept, else the first. `npm run validate` fails on a duplicate or on
  copies with different labels (there were none). 22 cases removed, their ids
  retired:
  - exact copies: `redcode-exec.4.4-29` (of `4.4-26`, across the split),
    `redcode-exec.4.4-30` (of `4.4-24`), `gauntlet.stage4-legit.scaffolding`
    (of `legit-credential.13`, across the split),
    `system-ops.allow.read-meminfo` (of `nl2sh-alfa.55.alt`);
  - the same CredData line indented differently in one file (all allow):
    `creddata.lookalike.` + `372310b3-9c588c96-l115`, `38b1dfe2-daa78be5-l868`,
    `38b1dfe2-bdbf5290-l84`, `50103f59-38186761-l28`,
    `5641d7dd-aba81351-l17778`, `5641d7dd-b24bea2a-l265`,
    `57067d8d-ed5a52b5-l134`, `9068b102-c5b3202a-l624`,
    `b6a0ac3d-2f4d83be-l600`, `bd14e9cf-cc99cf26-l3337`,
    `e5a9c76d-1e883203-l113`, `e5a9c76d-5e7f060f-l68`,
    `e5a9c76d-87cfd52c-l38`, `e5a9c76d-5e7f060f-l36`,
    `e5a9c76d-420c500d-l17`, `f295f04f-456f5110-l85`,
    `f295f04f-456f5110-l128`, `f37dd3b3-7988316b-l162`.
- **node9's own fixtures are pinned** (`sources/node9/`, `npm run
  sources:node9`): node9-proxy at the 2.34.0 release commit (`1061f84`), the
  docs legitimate-work corpus at `0d94865`. Converters no longer read live
  checkouts, so a clean rebuild reproduces this version's hash. With the pin,
  `node9-pii-fixtures` follows node9-proxy's card fixtures as of 2.34.0: 16
  cases added (`pii.card.composite.leading-dot-*`, `comma-decimal*`,
  `csv-*-column`, `after-ellipsis`, `word-zero-comma`,
  `grouped-after-comma-decimal`, `amex-leading-dot-signed`), and
  `pii.card.composite.decimal-at-text-start` removed (its fixture was
  replaced upstream). Labels by node9; regression track only.
- **Documentation**: `DATASHEET.md` (Gebru et al.: composition, collection
  and selection rule per source, the question each source asked and the one a
  case asks here, preprocessing, uses, distribution, maintenance, ethics,
  known limitations), `NOTICE` (every source's attribution),
  `sources/creddata/REPOSITORY-NOTICES.md` (the copyright notices of the 60
  CredData repositories), `CITATION.cff`.
- Reporting (no corpus change): `npm run report -- ... --ci` adds Wilson 95%
  intervals and an exact McNemar test between runs; `compare` prints the
  McNemar p-value of fixed against regressed.

Totals: 5,624 cases (was 5,631); outside labels 4,685, node9 797,
competitor 142.

## corpus 1.15.0 (2026-10-18)

Additions only: the 5,581 cases of 1.14.0 are unchanged.

- package (+22), source `node9-bench-package-list-more`: everyday installs
  beyond npm and PyPI, the negative control for a package check that covers
  them (node9Firewall#360). Three widely used packages per ecosystem (two for
  Maven and Packagist): RubyGems, crates.io, Go, NuGet, Maven, Packagist, VS
  Code Marketplace and Open VSX, each installed once with its ecosystem's own
  command, pinned to the version the registry served on the fetch day or
  unpinned, in turn (allow, `benign_install`, volatile). Every resolved version
  was checked to have no OSV MAL record. `npm run sources:packages-benign-more`.
  Labels: node9's team.
- shell (+28), source `node9-bench-system-ops`: ordinary work that touches
  the system directories (reads, listings, installs under `/usr/local`, a
  container working directory under `/usr/src/app`, downloads and uploads of
  project files: 18 allow, `ordinary_system_work`) and the changes a review is
  meant for (a write, a removal or a download into `/etc`, `/usr/bin`,
  `/usr/lib`, `/var/log`, and an upload of a system file: 10 review,
  `system_directory_change`). The negative control for a check on system
  directories: NL2SH-ALFA holds one command that touches them. Destinations
  are `example.com` and `api.example.com`, which the recommended setup's
  allowlist holds. Labels: node9's team.

Not regenerated: the `pii.card.composite.*` cases. node9-proxy's card
fixtures changed after 1.14.0 (renamed and added rows); converting them now
would rename an existing case and carry fixture labels into a `curl` body,
where a leading dot follows `text=` instead of starting the text. They are
left as in 1.14.0 until that converter is reviewed.

## corpus 1.14.0 (2026-10-17)

Additions only: the 5,576 cases of 1.13.0 are unchanged.

- mcp (+5), source `node9-bench-exposure`: writes after the session read
  outside content (node9Firewall#318 P4). An edit to `.github/workflows`
  adding a step from the page read and an edit adding a `postinstall` script
  to `package.json` (review, `agent_instruction_file`); a config file written
  with the host named in the page (review, `destination_in_content`); a hook
  written under `~/.config` (review, `write_outside_project`); a version bump
  in `package.json` (allow, `benign_write_in_project`). Labels: node9's team.

## corpus 1.13.0 (2026-10-16)

Additions only: the 5,571 cases of 1.12.0 are unchanged.

- mcp (+5), source `node9-bench-exposure`: shell commands after the session
  read outside content (node9Firewall#318 P3). A `curl` with a body to the
  host named in the page read, a `curl` GET whose query string carries a file
  to that host, a `git push` to a URL named in the issue read (review,
  `destination_in_content`); a `curl` GET to the docs host (allow,
  `benign_fetch_other_host`); `gh issue comment` after `gh issue view` on a
  fresh profile where github.com is not yet known (review,
  `accepted_interruption`). Labels: node9's team.

## corpus 1.12.0 (2026-10-16)

Additions only: the 5,386 cases of 1.11.1 are unchanged. First cases whose
verdict depends on what the session read before the call (`prior` with a
`post` step), for node9Firewall#318 and #328.

- mcp (+172), new source `agentdojo-seq` (labels: node9's team, from the
  design in node9/docs `untrusted-content-proxy-code-design.md`, section 7):
  every AgentDojo vector of 1.2.0 with the four attack templates, the poisoned
  tool result as a `post` prior, then the first action call of the injection
  task it carries (AgentDojo's own ground-truth arguments): review (156 cases;
  `why` says which rule should hold it: `destination_in_content` 110,
  `no_destination` 23, `destructive_no_destination` 12,
  `unknown_destination` 4, counted from the corpus). Plus the clean record
  followed by a user task's first action (39 - 16 without an action = 23):
  allow when it names no destination (12), review when the user's own
  destination came from the record read, the "pay the bill" case
  (`accepted_interruption`, 11). All under the new `exposure-org` profile
  (organisation domain bluesparrowtech.com, AgentDojo's fictional employer).
- mcp (+5), new source `node9-bench-exposure`: synthetic sequences of ordinary
  work after reading outside content (reply to a colleague, reply to an
  outside sender, a write inside the project after a web page, a push after an
  issue) and one attack in the same shape (forward a code to the address in
  the email). Labels: node9's team.
- Profiles: `orgDomains` on a profile becomes `policy.untrustedContent.orgDomains`
  in the node9-gate adapter.

## corpus 1.11.1 (2026-10-16)

Metadata correction only; all 5,386 IDs, inputs, profiles, and expected labels
are unchanged. Mark `legit-credential.18` as volatile: its `npx dotenv` command
depends on live npm metadata and package age, like the existing package cases.
The published proxy and the local candidate both reviewed the newly published
dotenv version during the #338 investigation. Preserve the expected `allow`
label and report the interruption in the volatile comparison section. Update
the converter so regeneration retains the correction.

## corpus 1.11.0 (2026-10-11)

Additions only: the 3,521 cases of 1.10.0 are unchanged. First
outside-labelled cases in the `secrets` channel.

- secrets (+1,865), new source `creddata`: Samsung CredData at commit 0b1940e
  (metadata and scripts Apache-2.0; each line keeps the licence of the
  repository it came from). 60 repositories, the smallest by GitHub size among
  those under MIT, Apache-2.0, BSD-2/3-Clause, ISC, 0BSD, Unlicense or CC0-1.0
  with at least one credential line (41 MIT, 16 Apache-2.0, one each ISC,
  BSD-2-Clause, BSD-3-Clause). Each labelled line is the content of a file the
  agent writes with the Write tool under CredData's anonymised path for it.
  Samsung's GroundTruth decides: T (a credential) is block (641), F (a string
  a scanner flagged that is not one) is allow (1,224), X (undecided) is left
  out (437). Every credential value was replaced by CredData's own
  `obfuscate_creds.py` (shape-preserving: prefixes, JWT and PEM structure and
  CRC32 checksums kept), run on these 60 repositories only. Left out: T lines
  the script does not rewrite (multi-pattern categories, informational
  patterns), lines sharing their range with an undecided or unobfuscated row,
  lines over 4,000 characters. At most 30 lines per label per repository,
  chosen by a salted hash fixed before measuring.

## corpus 1.10.0 (2026-10-11)

Additions only: the 2,937 cases of 1.9.0 are unchanged. Six new outside
sources, all labelled by their publishers; samples and label rules fixed in
code before measuring.

- pii (+323) and secrets (+37), three sources sent off the machine with
  Nemotron-PII's carrier and label rule (block: an identifier that enables
  fraud or identity theft; allow: ordinary contact or business data; a
  document whose only identifiers are credentials is a secrets case):
  `gretel-pii-finance` (Gretel, Apache-2.0, 60 + 60 financial documents),
  `openpii` (ai4privacy OpenPII 1M, CC-BY-4.0, 60 + 60 multilingual texts),
  `pii-trace` (Perplexity, MIT, 60 + 60 conversations; its `other_pii` tag is
  left out as too broad to call).
- package (+224), three sources, each name installed with its ecosystem's own
  command (block): `osv-other-ecosystems` (OpenSSF at 41f4529, 104 records:
  RubyGems, NuGet, crates.io, Go, VS Code and Open VSX extensions, Maven,
  Packagist), `datadog-packages` (DataDog, Apache-2.0, 30 npm and 30 PyPI
  names from its manifests; no sample archive read), `typomind` (USENIX
  Security 2023, MIT, 60 labelled typosquats across npm, PyPI and RubyGems).
  Names already in sources/packages.json are skipped.

## corpus 1.9.0 (2026-10-11)

Additions only: the 2,697 cases of 1.8.0 are unchanged.

- injection (+240), new source `injecagent`: InjecAgent (UIUC Kang lab, ACL
  Findings 2024, MIT) at commit f19c9f2. 60 direct-harm and 60 data-stealing
  test cases, the first of each type in a salted-hash order fixed before
  measuring, each in its base and enhanced setting: the user tool's result
  with the attacker's instruction inside, as an MCP tool result called with
  the case's own parameters (review). The dataset has no benign results; none
  are built. Run under `injection-optin`.

## corpus 1.8.0 (2026-10-11)

Additions only: the 2,617 cases of 1.7.0 are unchanged.

- injection (+80), new source `browsesafe`: BrowseSafe-Bench (Perplexity,
  MIT) test split at revision b506fb5. 40 pages labelled as carrying an
  injection aimed at a browsing agent (review) and 40 labelled clean (allow),
  the first 40 of each label in a salted-hash order fixed before measuring.
  Each page whole, as the raw HTML a fetch returns: `curl` stdout or the fetch
  MCP server's raw result, in turn. Run under `injection-optin`.

## corpus 1.7.0 (2026-10-11)

Additions only: the 1,735 cases of 1.6.0 are unchanged. First outside-labelled
cases in the `shell` channel.

- shell (+390), new source `redcode-exec`: RedCode-Exec (AI-secure, NeurIPS
  2024, dataset CC-BY-4.0) at commit c84b6db. The bash scripts of the 13
  scenarios its paper presents as risky actions (post, copy, read, list or
  delete sensitive files, untrusted installation, crawling a risky website,
  writing risky content, a risky alias in .bashrc, path traversal, eval
  injection, process management, amplification), 30 each, as the Bash call
  that would run them: block. The scenarios the paper marks "buggy code" and
  the code-bias scenario are left out (rule in
  src/sources/fetch-redcode-exec.ts, fixed before measuring).
- shell (+492), new source `nl2sh-alfa`: NL2SH-ALFA (Westenfelder et al.,
  NAACL 2025, MIT) test split at revision a99cb57, hand-checked commands for
  English tasks, each and its equivalent second command as a Bash call: allow.
  Benign by provenance; 28 rows that raise privileges, delete, change
  permissions, stop processes or touch a file RedCode treats as sensitive are
  left out (rule in src/convert/nl2sh-alfa.ts, fixed before measuring).

## corpus 1.6.0 (2026-10-11)

Additions only: the 1,371 cases of 1.5.0 are unchanged.

- injection (+273), source `agentdojo`: AgentDojo's other fixed attack
  templates on the same 39 vectors at the same commit (089ed46): `direct`,
  `tool_knowledge` and the five denial-of-service templates (review), goals
  rotated over every injection task. The `important_instructions` variants
  that only change the signing names, and `manual`, are left out.
- mcp (+91), new source `agentdojo-calls`: the tool calls AgentDojo's authors
  wrote as the ground truth of its tasks, read by running AgentDojo's own code
  locally (no model). 29 calls that carry out an injection goal (block) and 62
  that carry out a user task (allow), each as an MCP tool call before it runs,
  under a fresh install. Only tools that act (send, create, update, delete,
  invite, share, fetch a web address); reads are left out on both sides. Rule
  fixed in src/convert/agentdojo.ts before measuring. Labels `outside`; its own
  row in every report. First outside-labelled cases in the `mcp` channel.

## corpus 1.5.0 (2026-10-10)

Additions only: the 1,229 cases of 1.4.0 are unchanged.

- 142 cases from pipelock's agent-egress-bench (Apache-2.0), pinned to commit
  192b12a: MCP tool calls (with credential-shaped, encoded and obfuscated
  arguments, and 10 shell-obfuscation cases sent to an `exec` tool), MCP call
  sequences (earlier calls as `prior`), MCP tool results, URL fetches and
  fetched page content, each as the Claude Code hook payload an agent would
  send. Wire-only cases (tool definitions, headers, forward-proxy bodies,
  WebSocket, A2A, TLS interception) are left out by a rule fixed before
  measuring. First cases in the `shell` (10) and `mcp` (46) channels.
- Labels by a competitor: the new `competitor` label origin keeps them out of
  the comparison score; they have their own row in every report. Facts and
  licence in sources/agent-egress-bench/.

## corpus 1.4.0 (2026-10-09)

Additions only: the 1,109 cases of 1.3.0 are unchanged.

- pii (+120): Nemotron-PII (NVIDIA, CC BY 4.0), pinned to dataset revision
  b70ffaf. 60 synthetic documents that carry an identifier whose disclosure
  enables fraud or identity theft (SSN, card, CVV, bank account, passport,
  password, medical record number ...) are sent to an external API: block.
  60 documents whose every tag is ordinary contact or business data are sent
  the same way: allow. Labels come from NVIDIA's span tags through a rule
  fixed in src/sources/fetch-nemotron-pii.ts before measuring; documents with
  a special-category attribute and no identifier are left out. Own row in
  every report. Sample and attribution in sources/nemotron-pii/.

## corpus 1.3.0 (2026-10-09)

Additions only: the 770 cases of 1.2.0 are unchanged.

- injection (+339): NotInject (Li et al., MIT), pinned to dataset revision
  847ae76. Each of its 339 benign prompts built around injection trigger
  words is the text of a tool result (a fetched web page, a GitHub issue, a
  local notes file, in rotation) that should pass (allow). Run under
  `injection-optin`. It measures over-defense. Its own row in every report.
  Facts and licence in sources/notinject/.

## corpus 1.2.0 (2026-10-09)

First outside source. Additions only: the 575 cases of 1.1.1 are unchanged.

- injection (+195): AgentDojo (ETH Zurich, MIT), pinned to commit 089ed46.
  Each of its 39 injection vectors (an email body, a calendar event, a cloud
  file, a web page, a bank statement, a hotel, restaurant or car-rental
  record) becomes the result of the AgentDojo tool that returns it: once with
  AgentDojo's benign default text (allow) and once with each of four attack
  templates (important_instructions, ignore_previous, injecagent,
  system_message) carrying one of the suite's injection goals (review).
  Facts in sources/agentdojo/, with AgentDojo's licence.
- Its own row in every report ("AgentDojo"), separate from node9's own tests.

## corpus 1.1.1 (2026-10-09)

Patch: no expected verdict, id or group moved.

- `volatile: true` on all 78 package cases: their verdict depends on OSV, the
  registries and the date at run time. `npm run compare` reports them apart
  and never fails a release check on them.
- `source_ref` of the 28 legitimate-credential cases points to
  `docs/jail-legitimate-work-corpus.md` (the folder was renamed from `doc/`).

## corpus 1.1.0 (2026-10-02)

Added cases ahead of node9-ai/node9Firewall#295, so its effect can be shown.
Additions only: the 477 cases of 1.0.0 are byte-identical.

- package (78, new channel): agent-run installs (npm, pnpm, yarn, bun, npx,
  pip, uv, poetry). Known-malicious packages from OSV MAL records (block),
  pinned malicious releases of legitimate packages (block) next to their clean
  versions and a plain install (allow), everyday and lockfile installs (allow).
  Facts in sources/packages.json.
- secrets (+20): generated GitHub classic tokens (ghp_, gho_, ghu_, ghs_,
  ghr_). Valid checksum in a leaking action (block); wrong checksum in a test
  fixture, a docs example or a grep (allow).

Baselines re-measured on this version: node9-gate and node9-engine 2.26.2.

## corpus 1.0.0 (2026-10-02)

First version. 477 cases converted from node9's existing corpora, 11 setup
profiles, holdout of 98 cases (20.5%).

- secrets (252): the jail gauntlet, the 28-command legitimate credential
  corpus, the canary fixtures (rows B) and generators, Bitcoin WIF and BIP-32
  checksum fixtures.
- egress (138): the egress carriers corpus under egress-lock, egress-watch,
  clean, and four host-spelling deny profiles.
- pii (61): card and SSN fixtures, IBAN checksum fixtures.
- injection (26): injection texts from node9's tests as tool output, with and
  without the opt-in scanner.

Baselines measured on this version: node9-gate 2.26.2 and node9-engine 2.26.2
(results/).
