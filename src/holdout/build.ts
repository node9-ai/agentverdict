// Assembles a full checkout from the public repository (this one) and the
// holdout repository beside it, and converts it: the full corpus, holdout
// included, in a build directory where `npm run bench` measures both splits.
//
//   npm run holdout:build -- [<holdout repo>] [<build dir>]
//
// <holdout repo> defaults to ../agentverdict-holdout, the
// build directory to <holdout repo>/build (git-ignored there). The build
// directory gets this checkout's code, node_modules as a link, the sources
// merged with the holdout's rows (merge.ts), and the holdout's salt; then
// convert and validate run in it, and the full corpus hash must equal the
// `sha256` pinned in corpus-version.json. Nothing is written to this
// checkout, so its public tree can never take a holdout row. A rebuild keeps
// the build's results/ (the runs measured there, holdout cases included).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { mergeSources } from './merge.ts';

export function buildFull(holdoutRepo: string, buildDir: string): { sha256: string; pinned: string } {
  if (!fs.existsSync(path.join(holdoutRepo, 'salt'))) throw new Error(`${holdoutRepo}/salt not found: not a holdout repository`);
  // The runs measured in the build (results/, with the holdout cases) are the
  // only copy of the held-out per-case results: a rebuild keeps them.
  const kept = path.join(path.dirname(buildDir), `.build-results-${process.pid}`);
  const results = path.join(buildDir, 'results');
  if (fs.existsSync(results)) fs.renameSync(results, kept);
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });
  if (fs.existsSync(kept)) fs.renameSync(kept, results);
  for (const d of ['src', 'adapters', 'test']) fs.cpSync(path.join(ROOT, d), path.join(buildDir, d), { recursive: true });
  for (const f of ['package.json', 'tsconfig.json', 'corpus-version.json']) fs.copyFileSync(path.join(ROOT, f), path.join(buildDir, f));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(buildDir, 'node_modules'));
  // The competitor adapters find their binaries under <ROOT>/external
  // (git-ignored downloads, external/MANIFEST.md); in the build ROOT is the
  // build directory, so it gets the same folder as a link.
  if (fs.existsSync(path.join(ROOT, 'external'))) fs.symlinkSync(path.join(ROOT, 'external'), path.join(buildDir, 'external'));
  mergeSources(path.join(ROOT, 'sources'), path.join(holdoutRepo, 'sources'), path.join(buildDir, 'sources'));
  const env = { ...process.env, BENCH_HOLDOUT_DIR: path.resolve(holdoutRepo) };
  execFileSync('npx', ['tsx', 'src/convert/index.ts'], { cwd: buildDir, env, stdio: ['ignore', 'ignore', 'inherit'] });
  const sha256 = execFileSync('npx', ['tsx', '-e', 'import { corpusHash } from "./src/corpus.ts"; console.log(corpusHash())'], { cwd: buildDir, env, encoding: 'utf-8' }).trim();
  const pinned = (JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus-version.json'), 'utf-8')) as { sha256: string }).sha256;
  return { sha256, pinned };
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const holdoutRepo = path.resolve(process.argv[2] ?? path.join(ROOT, '..', 'agentverdict-holdout'));
  const buildDir = path.resolve(process.argv[3] ?? path.join(holdoutRepo, 'build'));
  const { sha256, pinned } = buildFull(holdoutRepo, buildDir);
  console.log(`full checkout in ${buildDir}`);
  console.log(`full corpus ${sha256.slice(0, 12)}, pinned ${pinned.slice(0, 12)}: ${sha256 === pinned ? 'match' : 'MISMATCH'}`);
  console.log(`measure both splits with: cd ${buildDir} && BENCH_HOLDOUT_DIR=${holdoutRepo} npm run bench`);
  process.exit(sha256 === pinned ? 0 : 1);
}
