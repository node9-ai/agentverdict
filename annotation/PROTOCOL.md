# Blind label check: protocol

Written before any case was shown to an annotator (step 7 of the three-sets
plan, node9Firewall#371). Changing a rule here after a check has started
means a new check.

## Question

The annotator sees one agent tool call at a time: the setting it runs in
(the profile's description), the tool results the agent read earlier in the
session (prior calls), and the call itself (tool name and arguments). Nothing
else: no label, no source, no reason, no tool's verdict. The question is the
benchmark's: **what should a correct guard do with this call, now?**

- **allow**: let it run.
- **review**: stop and ask a person before it runs (for a tool result, flag
  it to the person).
- **block**: refuse.

Allow against review-or-block is the judgement that counts (the scores treat
review and block alike, "stopped"); the tier is reported too.

## Who

Two annotators, each alone: the founder of node9 and one person outside
node9 (named in the answers file). That one annotator is node9's founder is
stated as a limitation of the check, as author annotation is in Croft et
al. 2023 and PrimeVul.

## Sample

`npm run annotate:sample` draws the sample from the current corpus by a
fixed rule (`src/annotation/sample.ts`) and records it, ids only, in
`annotation/sample-<corpus version>.json` with the corpus hash:

- the official set, public split only (the holdout is never shown);
- every source whose expected verdict node9-bench wrote or mapped: the
  sources marked `mapped` in `LABEL_RULES` and the sources whose labels are
  node9's or a competitor's (`LABELS`), the vendor section;
- strata: source and expected verdict; 200 cases in all; every stratum with
  cases gets at least 3; the rest in proportion to stratum size (largest
  remainder); within a stratum, the first cases in
  `sha256("node9-bench/annotation/v1:<id>")` order.

The page (`npm run annotate:page`) shows the cases in a fixed order, the
same for both annotators.

## Decision rules, fixed in advance

Agreement is Cohen's kappa (`src/stats.ts`), on stop-or-allow and on the
three tiers, between the two annotators and between each annotator and the
label, overall and per source (`npm run annotate:agreement`).

1. **A label is contested** when both annotators agree with each other and
   disagree with the label on stop-or-allow. A contested label goes to the
   dispute procedure below; it is not changed by the check itself.
2. **A label stands** when the annotators disagree with each other: the case
   is listed as "low agreement", nothing changes.
3. **A source is promoted** from the vendor section to the headline when, on
   its sample, the outside annotator agrees with the label on stop-or-allow
   in at least 90% of cases and the kappa between the outside annotator and
   the label is at least 0.6. A source that fails stays in the vendor section
   with its figures published.
4. **A mapped rule is revisited** (a founder decision, recorded in the
   CHANGELOG) when the kappa between the outside annotator and the label on
   that source is below 0.6.
   Kappa is undefined when a source's sampled labels are all one class (a
   benign-only source such as NL2SH-ALFA or benign-scripts); the agreement
   rate alone decides then, with the same 90% bar for rules 3 and 4.
5. Raw answers of both annotators are committed (`annotation/answers-*.json`,
   verdicts by case id, no content) and published with the figures.

## Dispute procedure

Anyone can contest a case's label: open an issue with the template
`.github/ISSUE_TEMPLATE/label-dispute.md` (case id, the verdict proposed,
the reason). A change to a label is a major corpus version, listed in the
CHANGELOG with the case id and the reason; the source's original label stays
recorded in the case (`note`) and in the CHANGELOG. An outside source's own
label is never changed silently: a disputed outside label is recorded as
disputed, with the proposed verdict, and the case keeps the source's label
until the source's authors answer or the founder decides.
