// The runner CLI: replays every corpus record through one adapter and writes
// per-case results plus a summary.
//
//   npm run bench -- [--adapter node9-gate|node9-engine|pipelock|pipelock-hook|hol-guard|hol-guard-native|numbat|numbat-enforce|calibration-allow|calibration-block|hook]
//                    [--source npm|local] [--proxy-dir PATH] [--no-daemon]
//                    [--config default|recommended] [--mode audit|soft|standard|strict|block-all]
//                    [--hook-name NAME --hook-cmd CMD [--hook-post-cmd CMD] [--hook-version V]]
//                    [--channel CH] [--id PREFIX] [--set quick|official|extended] [--out DIR]
//                    [--no-sandbox] [--sandbox-net] [--sandbox-ro DIR ...]
//
// --mode sets node9's own level (`mode` in its config, the Protection page's
// "How strict"); a level other than standard is recorded as node9-gate-<mode>.
//
// --adapter hook runs any tool that works as a Claude Code hook from its
// command line (adapters/generic-hook): no adapter code needed.
//
// --set quick runs the quick set (src/quick.ts): a fixed tenth of the
// official set's public split with every source and verdict represented,
// for runs between changes. --set official runs the official set only (the
// benchmark; the extended set adds hours and the report leaves it out by
// default); --set extended the excluded cases only. Like any filtered run
// these write to results/<adapter>/partial; a release is measured on the
// full corpus, so a run carries both sets and every report can be built
// from it.
//
// Every tool, node9's included, runs in the sandbox of src/sandbox.ts: no
// network, the home directory, /run/user (the desktop keyring) and the temp
// directories hidden. node9-gate keeps the network, for its package check's
// lookups (OSV and the registries); node9-engine (in process), node9-forecast
// (not on the board) and the calibration adapters run no tool there.
// --sandbox-net keeps the network for a tool that needs an online lookup;
// --sandbox-ro DIR gives a hook command a directory it needs to read (its
// install directory when that is under the home); --no-sandbox runs the tool
// directly, and the summary's method line says which.
//
// The loop itself lives in runner.ts.

import path from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, loadProfiles } from './corpus.ts';
import { toMarkdown } from './score.ts';
import { buildSummary, makeAdapter, resultsDir, retryTransient, runCases, writeResults } from './runner.ts';
import { recommendedProfiles } from './recommended.ts';
import { quickSet } from './quick.ts';
import { NODE9_MODES } from '../adapters/node9-gate/index.ts';
import { startSandbox } from './sandbox.ts';

const { values: opt } = parseArgs({
  options: {
    adapter: { type: 'string', default: 'node9-gate' },
    source: { type: 'string', default: 'npm' },
    'proxy-dir': { type: 'string' },
    channel: { type: 'string' },
    id: { type: 'string' },
    out: { type: 'string' },
    'no-daemon': { type: 'boolean' },
    config: { type: 'string', default: 'default' },
    set: { type: 'string' },
    'hook-name': { type: 'string' },
    'hook-cmd': { type: 'string' },
    'hook-post-cmd': { type: 'string' },
    'hook-version': { type: 'string' },
    mode: { type: 'string' },
    'no-sandbox': { type: 'boolean' },
    'sandbox-net': { type: 'boolean' },
    'sandbox-ro': { type: 'string', multiple: true },
  },
});

async function main(): Promise<void> {
  if (opt.config !== 'default' && opt.config !== 'recommended') throw new Error(`unknown --config ${opt.config}`);
  const recommended = opt.config === 'recommended';
  if (recommended && opt.adapter !== 'node9-gate') throw new Error('--config recommended is defined for node9-gate only');
  const hook =
    opt.adapter === 'hook'
      ? (() => {
          if (!opt['hook-name'] || !opt['hook-cmd']) throw new Error('--adapter hook needs --hook-name and --hook-cmd');
          return { name: opt['hook-name'], command: opt['hook-cmd'], postCommand: opt['hook-post-cmd'], version: opt['hook-version'], readable: opt['sandbox-ro'] };
        })()
      : undefined;
  const MODES = NODE9_MODES;
  if (opt.mode !== undefined && !MODES.includes(opt.mode as never)) throw new Error(`unknown --mode ${opt.mode}; one of ${MODES.join(', ')}`);
  if (opt.mode !== undefined && opt.adapter !== 'node9-gate') throw new Error('--mode is defined for node9-gate only');
  // In-process or calibration adapters run no tool process; node9-forecast is not on the board.
  const direct = ['node9-engine', 'node9-forecast', 'calibration-allow', 'calibration-block'].includes(opt.adapter!);
  if (direct && (opt['sandbox-net'] || opt['sandbox-ro'] || opt['no-sandbox'])) throw new Error(`${opt.adapter} runs no tool in a sandbox; the sandbox options do not apply`);
  // node9's package check queries OSV and the package registries: it keeps the network, the rest stays hidden.
  if (!direct && !opt['no-sandbox']) await startSandbox({ net: opt['sandbox-net'] === true || opt.adapter === 'node9-gate' });
  const adapter = await makeAdapter(
    opt.adapter!,
    opt.source === 'local' ? 'local' : 'npm',
    opt['proxy-dir'],
    opt['no-daemon'] ? false : undefined,
    recommended,
    hook,
    opt.mode as (typeof MODES)[number] | undefined
  );
  const corpus = loadCorpus();
  let records = corpus;
  if (opt.channel) records = records.filter((r) => r.channel === opt.channel);
  if (opt.id) records = records.filter((r) => r.id.startsWith(opt.id!));
  if (opt.set !== undefined) {
    if (opt.set === 'quick') {
      const quick = quickSet(corpus);
      records = records.filter((r) => quick.has(r.id));
    } else if (opt.set === 'official' || opt.set === 'extended') {
      const set = opt.set;
      records = records.filter((r) => r.set === set);
    } else throw new Error(`unknown --set ${opt.set}; one of quick, official, extended`);
  }
  if (records.length === 0) throw new Error('no cases selected');

  // The allowlist comes from the whole corpus, so a filtered run uses the same one.
  const profiles = recommended ? recommendedProfiles(loadProfiles(), corpus) : loadProfiles();
  const started = Date.now();
  const results = await runCases(adapter, records, profiles, (done, total) => {
    if (done % 50 === 0) process.stderr.write(`  ${done}/${total}\n`);
  });
  const retried = await retryTransient(adapter, results, records, profiles);
  if (retried.count > 0) process.stderr.write(`  retried ${retried.count} case(s), ${retried.recovered} recovered\n`);
  const summary = buildSummary(adapter, results, retried);
  const out = opt.out ?? resultsDir(summary, opt.channel !== undefined || opt.id !== undefined || opt.set !== undefined);
  writeResults(out, results, summary);
  console.log(toMarkdown(summary));
  console.log(`${records.length} cases in ${((Date.now() - started) / 1000).toFixed(0)} s -> ${path.relative(ROOT, out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
