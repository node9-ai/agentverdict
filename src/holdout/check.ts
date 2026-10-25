// The cut-invariance check: a public checkout, built from the cut sources
// without the salt, converts to exactly the public cases of this checkout.
//
//   npm run holdout:check
//
// It copies this checkout's code into a temporary directory (TMPDIR), puts
// the cut public sources there, no holdout/ directory, links node_modules,
// runs convert, and compares: every case id, every field, the count. Any
// difference is a row the cut kept or dropped wrongly, or a converter whose
// output still depends on another row, and the check fails with the ids.
// It also proves the public corpus hash: the temporary checkout's
// publicCorpusHash must equal this one's.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, loadCorpus, publicCorpusHash } from '../corpus.ts';
import type { BenchRecord } from '../types.ts';
import { cutSources } from './cut.ts';

const strip = (r: BenchRecord): string => {
  const { private: _p, ...rest } = r;
  return JSON.stringify(rest);
};

function main(): void {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-public-'));
  try {
    for (const d of ['src', 'adapters', 'profiles']) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
    for (const f of ['package.json', 'tsconfig.json', 'corpus-version.json']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'));
    const heldDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-holdout-'));
    const rep = cutSources(path.join(tmp, 'sources'), heldDir);
    console.log(`cut: ${rep.kept} rows kept, ${rep.removed} removed`);
    fs.rmSync(heldDir, { recursive: true, force: true });

    execFileSync('npx', ['tsx', 'src/convert/index.ts'], { cwd: tmp, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, BENCH_HOLDOUT_DIR: path.join(tmp, 'no-holdout') } });

    const full = loadCorpus();
    const want = new Map(full.filter((r) => !r.private).map((r) => [r.id, strip(r)]));
    const got = new Map<string, string>();
    for (const f of fs.readdirSync(path.join(tmp, 'corpus')).filter((x) => x.endsWith('.jsonl')).sort()) {
      for (const line of fs.readFileSync(path.join(tmp, 'corpus', f), 'utf-8').split('\n')) {
        if (line.trim() === '') continue;
        const r = JSON.parse(line) as BenchRecord;
        if (r.private) console.error(`public build: ${r.id} is private`);
        got.set(r.id, strip(r));
      }
    }
    const problems: string[] = [];
    for (const [id, s] of want) {
      const g = got.get(id);
      if (g === undefined) problems.push(`missing in the public build: ${id}`);
      else if (g !== s) problems.push(`differs in the public build: ${id}`);
    }
    for (const id of got.keys()) if (!want.has(id)) problems.push(`extra in the public build: ${id}`);

    const pubHash = execFileSync('npx', ['tsx', '-e', 'import { publicCorpusHash } from "./src/corpus.ts"; console.log(publicCorpusHash())'], { cwd: tmp, encoding: 'utf-8', env: { ...process.env, BENCH_HOLDOUT_DIR: path.join(tmp, 'no-holdout') } }).trim();
    if (pubHash !== publicCorpusHash()) problems.push(`public hash differs: ${pubHash.slice(0, 12)} in the public build, ${publicCorpusHash().slice(0, 12)} here`);

    const profilesHere = fs.readdirSync(path.join(ROOT, 'profiles')).sort();
    const profilesThere = fs.readdirSync(path.join(tmp, 'profiles')).sort();
    if (JSON.stringify(profilesHere) !== JSON.stringify(profilesThere)) problems.push(`profiles differ: ${profilesHere.length} here, ${profilesThere.length} in the public build`);

    for (const p of problems.slice(0, 40)) console.error(`problem: ${p}`);
    if (problems.length > 40) console.error(`... ${problems.length - 40} more`);
    console.log(`${want.size} public cases here, ${got.size} in the public build, ${problems.length} problem(s)`);
    process.exit(problems.length > 0 ? 1 : 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
