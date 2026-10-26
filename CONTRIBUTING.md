# Contributing

This benchmark measures tools that sit between an AI coding agent and its
tools. Three kinds of contribution are welcome: a result for your tool, a
dispute of a label, and new cases. Every one goes through a pull request or
an issue and is answered in public.

## 1. Put your tool on the board

There are two doors. Pick the one that fits your tool. Either way you run
the benchmark yourself, on your own machine.

**One command, no code.** If your tool works as a Claude Code hook (it
reads the hook payload on stdin and answers with an exit code or a
`permissionDecision`):

```bash
npm ci --ignore-scripts
npm run bench -- --adapter hook --hook-name mytool --hook-cmd "mytool hook" --hook-version 1.2.3
```

Add `--hook-post-cmd "mytool post-hook"` if your tool also reads tool
results (PostToolUse). Each case runs in a fresh HOME; the setting the case
describes (paths the user declared off-limits, an outbound policy, planted
decoys, the user's organisation, actions the user wants to approve) is
written to `$HOME/.agentverdict/profile.json` for your command to read. A
tool that ignores it is measured as it is, and the result says so.

**An adapter.** For a tool with its own configuration or an MCP proxy,
write one TypeScript file under `adapters/<name>/`, implementing
`src/adapter.ts`. The existing adapters show the shape: `node9-gate`,
`pipelock-hook`, `pipelock-mcp`. An adapter translates each case's profile
into your tool's own settings and reports a setting it cannot express
instead of guessing.

What a submission contains: the adapter or the hook command, the tool's
exact version, and the results directory `npm run bench` wrote. Check it
first:

```bash
npm run check-results -- results/<adapter>/<version>/corpus-<corpus>
```

How it is scored: we re-run your tool on the public split and on the
holdout split ourselves, in an isolated machine with no secrets and no
network beyond the registries the package cases need. Both numbers are
published; the holdout number is the one on the board, because nobody can
tune a tool on cases they have not seen.

Rules for every tool, node9 included: the documented default setup of the
tool's current release, the same profiles, the same runner, false positives
counted as hard as catches. Before a result is published, the tool's maker
gets it and at least two weeks to answer.

## 2. Dispute a label

Every case says what a correct guard should do with the call (`expected`).
If you think a case is wrong, open an issue with the template
**Label dispute** (`.github/ISSUE_TEMPLATE/label-dispute.md`): the case id,
the verdict you propose, and why. A label that changes is a new corpus
version, listed in `CHANGELOG.md` with the reason; an outside source's own
label is never changed silently, and it stays recorded beside ours.

How the labels were written and checked: `DATASHEET.md` (who wrote each
source's labels, which ones AgentVerdict mapped) and
`annotation/PROTOCOL.md` (the blind check by two annotators).

## 3. Add cases

New cases come from a source with a licence that permits use, change and
redistribution, converted by a script, never typed by hand:

- a fetch script `src/sources/fetch-<name>.ts` that writes a snapshot under
  `sources/<name>/` with the licence and a NOTICE;
- a converter `src/convert/<name>.ts` that turns the snapshot into cases,
  with its label rule stated in its header and in `LABEL_RULES`
  (`src/suites.ts`);
- a section in `src/holdout/sections.ts` that names the snapshot's rows and
  the group each row's cases get, so the holdout can be cut from it;
- each case derived from rows of one section, with nothing in it that
  depends on another row being present (no running counters, no positional
  picks): `npm run holdout:check` fails otherwise;
- `npm run convert`, `npm run validate` and `npm test` pass.

**Open the pull request with the fetch script, the converter and the
section, and without the snapshot.** About a fifth of every new source is
held out, and nobody without the holdout can tell which rows: a snapshot
committed here would publish them. The maintainers fetch the source in the
full build and split it into this repository and the holdout one
(`npm run holdout:sync`, the steps in its header), then lock a new corpus
version.

Maintainers: never run a fetch script or edit `sources/` in this
repository directly, for the same reason. Work in the full build
(`npm run holdout:build`) and bring the rows back with `npm run holdout:sync`.

No real secret or real personal data, ever: credential- and card-shaped
values are stored in parts (`{"$join": [...]}`), and `validate` fails on
anything node9's detectors would flag in a committed file.

## Code

TypeScript, Node 22. `npm run typecheck`, `npm run validate` and `npm test`
before a pull request. Code, comments and commit messages in English.
