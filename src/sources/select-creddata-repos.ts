// Chooses the CredData repositories the corpus samples lines from, and writes
// the list both where creddata_extract.py reads it (external/creddata/
// selected.tsv) and, with every candidate and the reason it was or was not
// chosen, to sources/creddata/repositories.tsv, which is committed so the
// choice can be checked and repeated.
//
//   npm run sources:creddata-repos
//
// The rule (since corpus 3.0.0), fixed before measuring:
//   eligible  a repository in CredData's snapshot at the pinned commit, under
//             an open licence (OPEN), with at least one line CredData labels
//             T, and at most MAX_KB on GitHub (so one download stays bounded;
//             this leaves out 17 of 287 otherwise eligible repositories)
//   chosen    the first N eligible repositories in sha256(SALT:repo_id) order
// Until 2.x the corpus took the 60 smallest eligible repositories, which
// biased it toward small projects.
//
// Reads external/creddata/sizes.tsv (each repository's GitHub size and
// licence, read from the GitHub API on 2026-10-11) and CredData's meta CSVs
// in external/creddata/meta/ (T counts). Offline; downloads nothing.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';

export const OPEN = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0']);
export const MAX_KB = 100 * 1024;
export const N = 100;
const SALT = 'node9-bench/creddata/repos/v2';

const EXTERNAL = path.join(ROOT, 'external', 'creddata');

/** CredData's repository id for its meta file name (download_data.py get_new_repo_id). */
export function crcOf(repoId: string): string {
  // CRC-32 (IEEE) of the raw bytes of the hex id.
  let c = 0xffffffff;
  for (const byte of Buffer.from(repoId, 'hex')) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

export const rankOf = (repoId: string) => createHash('sha256').update(`${SALT}:${repoId}`).digest('hex');

function tCount(crc: string): number {
  const file = path.join(EXTERNAL, 'meta', `${crc}.csv`);
  if (!fs.existsSync(file)) return 0;
  const [head, ...lines] = fs.readFileSync(file, 'utf-8').trim().split('\n');
  const col = head.split(',').indexOf('GroundTruth');
  return lines.filter((l) => l.split(',')[col] === 'T').length;
}

function main(): void {
  const snapshot = JSON.parse(fs.readFileSync(path.join(EXTERNAL, 'snapshot.json'), 'utf-8')) as Record<string, string>;
  const sizes = fs
    .readFileSync(path.join(EXTERNAL, 'sizes.tsv'), 'utf-8')
    .split('\n')
    .map((l) => l.split('\t'))
    .filter((r) => r.length >= 4);
  const rows = sizes.map(([repoId, , sizeKb, licence]) => {
    const crc = crcOf(repoId);
    const t = tCount(crc);
    const size = Number(sizeKb);
    const why = !OPEN.has(licence) ? 'licence' : t === 0 ? 'no T line' : size > MAX_KB ? 'over MAX_KB' : '';
    return { repoId, url: snapshot[repoId], crc, licence, size, t, why, rank: rankOf(repoId) };
  });
  const eligible = rows.filter((r) => r.why === '').sort((a, b) => a.rank.localeCompare(b.rank));
  const chosen = new Set(eligible.slice(0, N).map((r) => r.repoId));

  fs.writeFileSync(
    path.join(EXTERNAL, 'selected.tsv'),
    eligible
      .filter((r) => chosen.has(r.repoId))
      .map((r) => [r.repoId, r.url, r.crc, r.licence, r.size].join('\t'))
      .join('\n') + '\n'
  );
  const out = [
    ['repo_id', 'url', 'crc', 'licence', 'size_kb', 't_lines', 'rank', 'chosen', 'not_eligible_because'].join('\t'),
    ...rows
      .sort((a, b) => a.rank.localeCompare(b.rank))
      .map((r) => [r.repoId, r.url, r.crc, r.licence, r.size, r.t, r.rank, chosen.has(r.repoId) ? 'yes' : 'no', r.why].join('\t')),
  ];
  fs.writeFileSync(path.join(ROOT, 'sources', 'creddata', 'repositories.tsv'), out.join('\n') + '\n');
  const kb = eligible.filter((r) => chosen.has(r.repoId)).reduce((n, r) => n + r.size, 0);
  console.log(`${rows.length} repositories, ${eligible.length} eligible, ${chosen.size} chosen (${(kb / 1024 / 1024).toFixed(2)} GB on GitHub)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
