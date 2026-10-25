// Writes sources/reference-system/readable.json: for every path a RedCode-Exec
// read, listing or traversal script targets, whether an unprivileged user
// (`nobody`) can read it (a file) or list it (a directory: readable and
// searchable) on a stock Debian system. The image is pinned by digest and run
// without network; RedCode's own environment builds on a Debian image
// (continuumio/miniconda3), so the reference is the same family.
//
//   npm run sources:reference-system
//
// Needs Docker and the pinned image locally (`docker pull` of the digest).
// A path the image does not have is recorded as missing, and the annotation
// rules treat missing as not readable: an unknown is never counted as
// harmless.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadCorpus } from '../corpus.ts';
import { reveal } from '../hygiene.ts';
import { READ_FAMILIES, redcodeTarget, type Target } from '../decidable/redcode-paths.ts';

export const IMAGE = 'debian@sha256:04634311a8d5fc442b6eb06d792293c4f3e2268652ca7634e00ce8ef5cc0a28a';
export const OUT = path.join(ROOT, 'sources', 'reference-system', 'readable.json');

export type Access = 'readable' | 'not-readable' | 'missing';

function targets(): Target[] {
  const seen = new Map<string, Target>();
  for (const r of loadCorpus()) {
    if (r.source !== 'redcode-exec' || !READ_FAMILIES.has(r.family)) continue;
    const input = r.input as { tool_input: { command: string | { $join: string[] } } };
    const t = redcodeTarget(r.family, reveal(input.tool_input.command));
    if (t) seen.set(`${t.kind}:${t.path}`, t);
  }
  return [...seen.values()].sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind));
}

function main(): void {
  const list = targets();
  const script = [
    'cat /etc/debian_version',
    ...list.map((t) => {
      const q = `'${t.path.replace(/'/g, `'\\''`)}'`;
      const test = t.kind === 'dir' ? `test -r ${q} && test -x ${q}` : `test -r ${q}`;
      return `if su nobody -s /bin/sh -c "${test.replace(/"/g, '\\"')}" 2>/dev/null; then echo readable; elif [ -e ${q} ]; then echo not-readable; else echo missing; fi`;
    }),
  ].join('\n');
  const out = execFileSync('docker', ['run', '--rm', '--network', 'none', IMAGE, 'sh', '-c', script], { encoding: 'utf-8' })
    .trim()
    .split('\n');
  const [debian, ...answers] = out;
  if (answers.length !== list.length) throw new Error(`expected ${list.length} answers, got ${answers.length}`);
  const paths: Record<string, Access> = {};
  list.forEach((t, i) => (paths[`${t.kind}:${t.path}`] = answers[i] as Access));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        image: IMAGE,
        debian_version: debian,
        user: 'nobody',
        rule: 'file: test -r as nobody; dir: test -r and test -x as nobody; a path the image lacks is missing',
        paths,
      },
      null,
      2
    ) + '\n'
  );
  console.log(`${list.length} paths checked on Debian ${debian}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
