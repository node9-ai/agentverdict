# Results

Every published run of the benchmark. The board at
[node9.ai/ai-agent-security-benchmark](https://node9.ai/ai-agent-security-benchmark)
is built from the runs marked "on the board". A tool's run is added here
once its maker has reviewed it; its notes and the maker's statement are on
the board.

## The runs

| Tool | Setup | Version | Measured | Status | Summary |
|---|---|---|---|---|---|
| node9 | Standard, the default level | 2.55.3 | 2026-11-09 | **On the board** | [summary.md](node9-gate/2.55.3/corpus-7.0.0/summary.md) |
| pipelock | Claude Code hook, MCP proxy and fetch proxy; network layer not measured | 3.8.0 | 2026-11-10 | **On the board** | [summary.md](pipelock/3.8.0/corpus-7.0.0/summary.md) |
| HOL Guard | Claude Code hook, default settings | 3.59.0 | 2026-11-08 | **On the board** | [summary.md](hol-guard/3.59.0/corpus-7.0.0/summary.md) |
| numbat | Monitor mode as installed, the default | 0.3.0 | 2026-11-09 | **On the board** | [summary.md](numbat/0.3.0/corpus-7.0.0/summary.md) |
| numbat | Enforce mode, every shipped rule set to enforce | 0.3.0 | 2026-11-09 | **On the board** | [summary.md](numbat-enforce/0.3.0/corpus-7.0.0/summary.md) |
| node9 | Standard | 2.50.0 | 2026-11-03 | Replaced by 2.55.3 | [summary.md](node9-gate/2.50.0/corpus-7.0.0/summary.md) |
| node9 | Soft | 2.50.0 | 2026-11-04 | Earlier release and method | [summary.md](node9-gate-soft/2.50.0/corpus-7.0.0/summary.md) |
| node9 | Strict | 2.50.0 | 2026-11-04 | Earlier release and method | [summary.md](node9-gate-strict/2.50.0/corpus-7.0.0/summary.md) |

All runs are on corpus 7.0.0. The runs on the board follow the current method
(`docs/method.md`): every tool in the same sandbox, a chain of calls ending
at the first step the tool stops, and a case left out when its answer rests
on a user rule the tool has no setting for. The 2.50.0 runs came before
those three changes, so compare them with each other, not with 2.55.3.

## What is in a run

A run lives at `<adapter>/<tool version>/corpus-<corpus version>/`. The
adapter is the name the benchmark gives a tool and its setup: `node9-gate`
is node9 at Standard, `node9-gate-soft` and `node9-gate-strict` its other
levels; `numbat` is numbat as installed and `numbat-enforce` its enforce
mode.

| File | What |
|---|---|
| `summary.md` | The scores, readable: the headline, every channel and source, the public and holdout splits, and what was not measured and why |
| `cases.jsonl` | Every public case, one line each: the expected answer, the tool's answer and its reason |
| `summary.json` | The same as `summary.md`, as data |

The holdout (1,401 cases) appears as numbers only: its cases are never
published one by one.

Check a run before you submit it: `npm run check-results -- results/<adapter>/<version>/corpus-<corpus>`
(`CONTRIBUTING.md`).
