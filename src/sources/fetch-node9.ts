// Refreshes sources/node9/: the files node9's own cases are built from (the
// regression track). Like every other source they are read from a pinned
// snapshot, not from a live checkout, so a clean rebuild of the corpus
// reproduces the hash in corpus-version.json.
//
//   npm run sources:node9
//
// Each file is taken with `git show <commit>:<path>` from a local clone at the
// commit pinned below (NODE9_PROXY_DIR and NODE9_DOC_DIR override the clone
// paths); the working tree of the clone is never read. To move a pin, change
// the commit here, run this script, then convert, and record the change in
// CHANGELOG.md.
//
// node9-proxy is pinned to the node9 2.34.0 release commit. The docs file is
// node9's internal write-up of legitimate credential work (licence
// node9-internal; see node9Firewall#368 for whether it is published).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';

export interface PinnedRepo {
  repo: string;
  commit: string;
  license: string;
  files: string[];
}

export const PINS: Record<'node9-proxy' | 'docs', PinnedRepo> = {
  'node9-proxy': {
    repo: 'https://github.com/node9-ai/node9-proxy',
    commit: '1061f84ff4bd7db99067e19b79fe229b223fb2c5',
    license: 'Apache-2.0',
    files: [
      'packages/policy-engine/src/dlp/canary.fixtures.ts',
      'packages/policy-engine/src/dlp/checksum.fixtures.ts',
      'packages/policy-engine/src/scan/pii.fixtures.ts',
      'src/__tests__/fixtures/egress-carriers-corpus.ts',
    ],
  },
  docs: {
    repo: 'node9-ai/docs (private)',
    commit: '0d9486514cf398485c82f1ae71eba80db6048bc6',
    license: 'node9-internal',
    files: ['jail-legitimate-work-corpus.md'],
  },
};

export const NODE9_SOURCES = path.join(ROOT, 'sources', 'node9');
export const PIN_FILE = path.join(NODE9_SOURCES, 'pin.json');

const CLONES: Record<keyof typeof PINS, string> = {
  'node9-proxy': process.env.NODE9_PROXY_DIR ?? path.resolve(ROOT, '..', 'node9-proxy'),
  docs: process.env.NODE9_DOC_DIR ?? path.resolve(ROOT, '..', 'docs'),
};

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function main(): void {
  fs.rmSync(NODE9_SOURCES, { recursive: true, force: true });
  const pin: Record<string, PinnedRepo & { sha256: Record<string, string> }> = {};
  for (const [name, p] of Object.entries(PINS) as [keyof typeof PINS, PinnedRepo][]) {
    const hashes: Record<string, string> = {};
    for (const file of p.files) {
      const text = execFileSync('git', ['-C', CLONES[name], 'show', `${p.commit}:${file}`], {
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
      });
      const out = path.join(NODE9_SOURCES, name, file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, text);
      hashes[file] = sha256(text);
    }
    pin[name] = { ...p, sha256: hashes };
  }
  fs.writeFileSync(PIN_FILE, JSON.stringify(pin, null, 2) + '\n');
  console.log(`sources/node9: ${Object.values(PINS).reduce((n, p) => n + p.files.length, 0)} files pinned`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
