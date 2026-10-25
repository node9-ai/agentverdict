// Release check for node9: run the gate on a node9-proxy checkout and compare
// it with the newest published baseline.
//
//   npm run release-check -- --proxy-dir PATH [--base SPEC] [--strict-tier]
//
// The checkout must be built (dist/cli.js). Its run is written under
// results/node9-gate/<version>+<commit>[-dirty]/, which git ignores: a
// candidate build is not a baseline. The base defaults to the newest released
// version under results/node9-gate/ (a directory name without "+"). The
// comparison is printed and saved next to the candidate's results as
// compare.md.
//
// The run measures one build. A rebuild of the checkout during the run (a
// test suite's pretest, a commit hook, a watcher) would mix two builds, so
// dist/cli.js is fingerprinted before the run, every 25 cases and after it:
// content, size, modification time and inode. A rebuild that writes the same
// bytes still changes the time and inode, and a call that found no
// dist/cli.js at all (a rebuild mid-call) is caught from the error it leaves.
// Either one stops the run and reports it invalid instead of a verdict.
//
// On a loaded machine a node9 process can take longer than the adapter's
// 15-second limit to start, which reads as an error or as "held for a human".
// Those cases are run once more at the end, and only a second failure counts;
// the report says how many were retried.
//
// Exit codes: 0 pass, 1 a stable case regressed, 2 the check itself failed,
// 3 the run is invalid (the build changed under it); run it again.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, loadProfiles } from './corpus.ts';
import { buildSummary, makeAdapter, resultsDir, retryTransient, runCases, writeResults } from './runner.ts';
export { isTransient } from './runner.ts';
import { compareDirs, renderMarkdown, resolveRun, semverCmp } from './compare.ts';
import type { CaseResult } from './types.ts';

/** The newest released node9-gate run: highest version directory without a "+" build suffix. */
export function latestReleasedRun(): string {
  const dir = path.join(ROOT, 'results', 'node9-gate');
  const versions = fs
    .readdirSync(dir)
    .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
    .sort(semverCmp)
    .reverse();
  for (const v of versions) {
    try {
      return resolveRun(path.join('node9-gate', v));
    } catch {
      /* no run for this version, try the previous one */
    }
  }
  throw new Error('no released node9-gate run under results/; run npm run bench first');
}

export interface BuildFingerprint {
  sha256: string;
  size: number;
  mtimeMs: number;
  ino: number;
}

/** Fingerprint of a built file, or null when it does not exist (mid-rebuild). */
export function fingerprint(file: string): BuildFingerprint | null {
  try {
    const st = fs.statSync(file);
    return {
      sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
      size: st.size,
      mtimeMs: st.mtimeMs,
      ino: st.ino,
    };
  } catch {
    return null;
  }
}

/** Why two fingerprints of the same file are not the same build, or null when they are. */
export function buildChange(before: BuildFingerprint | null, after: BuildFingerprint | null): string | null {
  if (!before) return 'dist/cli.js was missing when the run started';
  if (!after) return 'dist/cli.js disappeared during the run';
  if (before.sha256 !== after.sha256) return 'dist/cli.js was rebuilt with different content';
  if (before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || before.size !== after.size) {
    return 'dist/cli.js was rebuilt (same content, new file)';
  }
  return null;
}

/** A case whose error shows the CLI itself was not there: the build moved under the call. */
export function missingBuildErrors(results: CaseResult[]): CaseResult[] {
  return results.filter((r) => r.actual === 'error' && /Cannot find module|ENOENT/.test(r.detail ?? '') && /dist[/\\]cli\.js/.test(r.detail ?? ''));
}

async function main(): Promise<void> {
  const { values: opt } = parseArgs({
    options: {
      'proxy-dir': { type: 'string' },
      base: { type: 'string' },
      'strict-tier': { type: 'boolean', default: false },
    },
  });
  const proxyDir = opt['proxy-dir'] ?? process.env.NODE9_PROXY_DIR;
  if (!proxyDir) throw new Error('--proxy-dir is required (a built node9-proxy checkout)');
  const base = opt.base ? resolveRun(opt.base) : latestReleasedRun();
  const cli = path.join(proxyDir, 'dist', 'cli.js');

  const adapter = await makeAdapter('node9-gate', 'local', proxyDir);
  const before = fingerprint(cli);
  if (buildChange(before, before)) throw new Error(`${cli} not found: build the checkout first`);
  console.error(`candidate ${adapter.toolVersion} (build ${before!.sha256.slice(0, 12)}), base ${path.relative(ROOT, base)}`);

  let changed: string | null = null;
  const results = await runCases(
    adapter,
    loadCorpus(),
    loadProfiles(),
    (done, total) => {
      if (done % 25 === 0) changed ??= buildChange(before, fingerprint(cli));
      if (done % 50 === 0) process.stderr.write(`  ${done}/${total}\n`);
    },
    () => changed !== null
  );
  changed ??= buildChange(before, fingerprint(cli));

  // One more try for cases the host may have failed, on the same build.
  let retryNote = '';
  let retried = { count: 0, recovered: 0 };
  if (!changed) {
    retried = await retryTransient(adapter, results, loadCorpus(), loadProfiles(), () => changed !== null);
    changed ??= buildChange(before, fingerprint(cli));
    if (retried.count > 0) {
      retryNote = `\n\nRetried ${retried.count} case(s) that errored or timed out on the first pass (host load); ${retried.recovered} recovered, ${retried.count - retried.recovered} failed again and are scored as they are.`;
    }
  }
  const missing = missingBuildErrors(results);
  if (!changed && missing.length > 0) changed = `${missing.length} call(s) found no dist/cli.js (rebuilt mid-call)`;

  const summary = buildSummary(adapter, results, retried);
  const head = resultsDir(summary, false);
  writeResults(head, results, summary);

  if (changed) {
    const msg =
      `# INVALID RUN: ${adapter.toolVersion}\n\n` +
      `${changed}, after ${results.length} of ${loadCorpus().length} cases. ` +
      `The results mix two builds, so no verdict is given. Run the check again while nothing builds the checkout ` +
      `(no tests, no build, no git commit hook).`;
    fs.writeFileSync(path.join(head, 'compare.md'), msg + '\n');
    console.log(msg);
    process.exit(3);
  }

  const report = compareDirs(base, head, opt['strict-tier']);
  const md = renderMarkdown(report) + `\n\nBuild unchanged during the run (dist/cli.js ${before!.sha256.slice(0, 12)}).` + retryNote;
  fs.writeFileSync(path.join(head, 'compare.md'), md + '\n');
  console.log(md);
  process.exit(report.pass ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
