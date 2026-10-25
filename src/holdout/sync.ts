// Brings new or changed source rows into the two repositories without
// leaking the holdout. The only safe way to add cases.
//
//   npm run holdout:sync -- [<holdout repo>] [--lock <version>] [--force]
//
// The work happens in a full build, never in this repository's sources/:
//
//   1. npm run holdout:build -- ../ai-agent-security-benchmark-holdout
//   2. in ../ai-agent-security-benchmark-holdout/build: run the fetch script
//      (or edit a snapshot) so build/sources/ holds the new rows, all of
//      them; code changes (a converter, a section in src/holdout/sections.ts)
//      are made here, in this repository, first
//   3. npm run holdout:sync -- ../ai-agent-security-benchmark-holdout --lock <version>
//
// Step 3 cuts build/sources/ with the salt (src/holdout/cut.ts) and writes
// the public rows to this repository's sources/ and the held-out rows to the
// holdout repository's sources/; rebuilds this repository's corpus, profiles
// and viewer without the salt; rebuilds the full build from the two trees;
// checks that the public corpus equals the public cases of the full one; and
// with --lock, pins the new version (both hashes) from the full build and
// copies corpus-version.json here. Then: a CHANGELOG entry (npm run
// corpus:diff -- <ref>), a commit in each repository.
//
// It refuses to run when sources/, corpus/ or profiles/ here have changes not
// committed (they would be overwritten), unless --force.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT } from '../corpus.ts';
import type { BenchRecord } from '../types.ts';

function readCorpus(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of fs.readdirSync(path.join(dir, 'corpus')).filter((x) => x.endsWith('.jsonl')).sort())
    for (const l of fs.readFileSync(path.join(dir, 'corpus', f), 'utf-8').split('\n')) {
      if (l.trim() === '') continue;
      const r = JSON.parse(l) as BenchRecord;
      out.set(r.id, JSON.stringify({ ...r, private: r.private }));
    }
  return out;
}

function main(): void {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { lock: { type: 'string' }, force: { type: 'boolean' } } });
  const holdoutRepo = path.resolve(positionals[0] ?? path.join(ROOT, '..', 'ai-agent-security-benchmark-holdout'));
  const buildDir = path.join(holdoutRepo, 'build');
  if (!fs.existsSync(path.join(holdoutRepo, 'salt'))) throw new Error(`${holdoutRepo}/salt not found: not a holdout repository`);
  if (!fs.existsSync(path.join(buildDir, 'sources'))) throw new Error(`${buildDir}/sources not found: run npm run holdout:build first, then change the sources there`);
  const dirty = execFileSync('git', ['status', '--porcelain', '--', 'sources', 'corpus', 'profiles'], { cwd: ROOT, encoding: 'utf-8' }).trim();
  if (dirty && !values.force) throw new Error(`uncommitted changes here would be overwritten (sources/, corpus/, profiles/):\n${dirty}\ncommit them, or pass --force`);

  const withSalt = { ...process.env, BENCH_HOLDOUT_DIR: holdoutRepo };
  const noSalt = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-no-holdout-'));
  const withoutSalt = { ...process.env, BENCH_HOLDOUT_DIR: noSalt };
  const tmpPub = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-sync-public-'));
  const tmpHeld = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-sync-holdout-'));
  try {
    // 1. Cut the full build's sources with this repository's sections and the salt.
    const cut = execFileSync('npx', ['tsx', 'src/holdout/cut.ts', tmpPub, tmpHeld, path.join(buildDir, 'sources')], { cwd: ROOT, env: withSalt, encoding: 'utf-8' });
    console.log(cut.trim().split('\n').pop());

    // 2. The two trees take the cut.
    fs.rmSync(path.join(ROOT, 'sources'), { recursive: true, force: true });
    fs.cpSync(tmpPub, path.join(ROOT, 'sources'), { recursive: true });
    fs.rmSync(path.join(holdoutRepo, 'sources'), { recursive: true, force: true });
    fs.cpSync(tmpHeld, path.join(holdoutRepo, 'sources'), { recursive: true });

    // 3. This repository's corpus, profiles and viewer, without the salt.
    execFileSync('npx', ['tsx', 'src/convert/index.ts'], { cwd: ROOT, env: withoutSalt, stdio: ['ignore', 'ignore', 'inherit'] });
    execFileSync('npx', ['tsx', 'src/viewer.ts'], { cwd: ROOT, env: withoutSalt, stdio: ['ignore', 'ignore', 'inherit'] });

    // 4. A fresh full build from the two trees (its hash check may fail: the data changed).
    try {
      execFileSync('npx', ['tsx', 'src/holdout/build.ts', holdoutRepo, buildDir], { cwd: ROOT, env: withoutSalt, stdio: ['ignore', 'ignore', 'inherit'] });
    } catch {
      /* a new hash until --lock pins it */
    }

    // 5. The public corpus equals the public cases of the full one.
    const pub = readCorpus(ROOT);
    const full = readCorpus(buildDir);
    const problems: string[] = [];
    for (const [id, s] of full) {
      const r = JSON.parse(s) as BenchRecord;
      if (r.private) {
        if (pub.has(id)) problems.push(`holdout case ${id} is in the public corpus`);
        continue;
      }
      const p = pub.get(id);
      if (p === undefined) problems.push(`public case ${id} is missing here`);
      else if (p !== s) problems.push(`public case ${id} differs here`);
    }
    for (const id of pub.keys()) if (!full.has(id)) problems.push(`${id} is here but not in the full corpus`);
    const held = [...full.values()].filter((s) => (JSON.parse(s) as BenchRecord).private).length;
    console.log(`full corpus ${full.size} cases (${held} held out), public corpus here ${pub.size}`);
    if (problems.length > 0) {
      for (const p of problems.slice(0, 30)) console.error(`problem: ${p}`);
      throw new Error(`${problems.length} problem(s): the cut and the converters disagree; nothing is locked`);
    }

    // 6. Pin the version from the full build, and copy it here.
    if (values.lock) {
      execFileSync('npx', ['tsx', 'src/lock.ts', values.lock], { cwd: buildDir, env: withSalt, stdio: ['ignore', 'inherit', 'inherit'] });
      fs.copyFileSync(path.join(buildDir, 'corpus-version.json'), path.join(ROOT, 'corpus-version.json'));
      execFileSync('npx', ['tsx', 'src/validate.ts'], { cwd: ROOT, env: withoutSalt, stdio: ['ignore', 'inherit', 'inherit'] });
    } else {
      console.log('not locked: if the corpus changed, run again with --lock <version> (README, Versioning)');
    }
    console.log('next: a CHANGELOG entry (npm run corpus:diff -- <ref>), then a commit here and one in the holdout repository');
  } finally {
    for (const d of [noSalt, tmpPub, tmpHeld]) fs.rmSync(d, { recursive: true, force: true });
  }
}

main();
