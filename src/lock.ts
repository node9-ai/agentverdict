// Pins the current corpus to a version number in corpus-version.json.
//
//   npm run corpus:lock -- <version>
//
// The version is chosen by a person, by the rules in README (Versioning);
// this script only refuses the choices that are always wrong: a version that
// does not move forward when the corpus changed, or a malformed one.

import fs from 'node:fs';
import { VERSION_FILE, corpusHash, publicCorpusHash, readCorpusVersion, type CorpusVersion } from './corpus.ts';
import { hasHoldout } from './split.ts';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function newer(a: string, b: string): boolean {
  const x = SEMVER.exec(a)!.slice(1).map(Number);
  const y = SEMVER.exec(b)!.slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

const next = process.argv[2];
if (!next || !SEMVER.test(next)) {
  console.error('usage: npm run corpus:lock -- <major.minor.patch>');
  process.exit(2);
}
if (!hasHoldout()) {
  console.error('a version is locked from the full checkout only (holdout/salt is missing here)');
  process.exit(1);
}
const current = readCorpusVersion();
const sha256 = corpusHash();
if (sha256 === current.sha256) {
  console.log(`corpus unchanged since v${current.version}; nothing to lock`);
  process.exit(0);
}
if (!newer(next, current.version)) {
  console.error(`corpus changed: ${next} must be newer than v${current.version}`);
  process.exit(1);
}
const v: CorpusVersion = { version: next, sha256, public_sha256: publicCorpusHash() };
fs.writeFileSync(VERSION_FILE, JSON.stringify(v, null, 2) + '\n');
console.log(`corpus locked at v${next}; add a CHANGELOG.md entry for it`);
