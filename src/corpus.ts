// Corpus and profile I/O, plus the structural checks every record must pass.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGENTS, CHANNELS, SECTIONS, SETS, VERDICTS, type BenchRecord, type Profile } from './types.ts';
import { hasHoldout, isHoldout } from './split.ts';
import { isExtendedReason } from './scope/reasons.ts';
import { isAsiId } from './scope/owasp.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CORPUS_DIR = path.join(ROOT, 'corpus');
export const PROFILES_DIR = path.join(ROOT, 'profiles');

export const VERSION_FILE = path.join(ROOT, 'corpus-version.json');

/**
 * SHA-256 over every corpus and profile file, in name order. Any change to a
 * case, a label or a profile changes it; corpus-version.json pins it to a
 * version number (see README, Versioning).
 */
export function corpusHash(): string {
  const h = createHash('sha256');
  for (const dir of [CORPUS_DIR, PROFILES_DIR]) {
    for (const f of fs.readdirSync(dir).sort()) {
      h.update(`${path.basename(dir)}/${f}\0`);
      h.update(fs.readFileSync(path.join(dir, f)));
    }
  }
  return h.digest('hex');
}

/**
 * SHA-256 over the public cases alone: every corpus file in name order, its
 * public lines in file order, profiles left out (the canary profile carries
 * the values of the cases present, so it differs between a full and a public
 * checkout). A public checkout, which holds the public cases only, computes
 * the same value as the full one.
 */
export function publicCorpusHash(): string {
  const h = createHash('sha256');
  for (const f of fs.readdirSync(CORPUS_DIR).filter((x) => x.endsWith('.jsonl')).sort()) {
    h.update(`corpus/${f}\0`);
    for (const line of fs.readFileSync(path.join(CORPUS_DIR, f), 'utf-8').split('\n')) {
      if (line.trim() === '') continue;
      if ((JSON.parse(line) as BenchRecord).private) continue;
      h.update(line + '\n');
    }
  }
  return h.digest('hex');
}

export interface CorpusVersion {
  version: string;
  /** Hash of corpus/ and profiles/ with the holdout present (corpusHash). */
  sha256: string;
  /** Hash of the public cases alone (publicCorpusHash). */
  public_sha256: string;
}

export function readCorpusVersion(file = VERSION_FILE): CorpusVersion {
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as CorpusVersion;
}

/**
 * True when the cases in this checkout are the pinned version: the full hash
 * where the holdout is present, the public hash where it is not.
 */
export function corpusIsPinned(v: CorpusVersion = readCorpusVersion()): boolean {
  return hasHoldout() ? corpusHash() === v.sha256 : publicCorpusHash() === v.public_sha256;
}

/** The version label for results: the pinned version, or a marker when the corpus has moved past it. */
export function corpusVersionLabel(): string {
  const v = readCorpusVersion();
  return corpusIsPinned(v) ? v.version : `${v.version}+unreleased`;
}

/** Install directory of a pinned dependency (its exports map hides package.json). */
export function packageDir(name: string): string {
  return path.join(ROOT, 'node_modules', ...name.split('/'));
}

export function readJsonl<T>(file: string): T[] {
  return fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l, i) => {
      try {
        return JSON.parse(l) as T;
      } catch (e) {
        throw new Error(`${file}:${i + 1}: ${(e as Error).message}`);
      }
    });
}

export function writeJsonl(file: string, rows: unknown[]): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

export function loadCorpus(dir = CORPUS_DIR): BenchRecord[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
  return files.flatMap((f) => readJsonl<BenchRecord>(path.join(dir, f)));
}

export function loadProfiles(): Map<string, Profile> {
  const out = new Map<string, Profile>();
  for (const f of fs.readdirSync(PROFILES_DIR).filter((x) => x.endsWith('.json')).sort()) {
    const p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), 'utf-8')) as Profile;
    if (`${p.name}.json` !== f) throw new Error(`profiles/${f}: name "${p.name}" does not match the file name`);
    out.set(p.name, p);
  }
  return out;
}

const REQUIRED: Array<keyof BenchRecord> = [
  'id', 'channel', 'agent', 'tool', 'stage', 'input', 'setup', 'expected', 'why',
  'family', 'group', 'source', 'source_ref', 'license', 'private', 'set', 'owasp',
];

/** Structural problems with a record set; empty when the set is valid. */
export function checkRecords(records: BenchRecord[], profiles: Map<string, Profile>): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const r of records) {
    const at = `case ${r.id ?? '<no id>'}`;
    for (const k of REQUIRED) if (r[k] === undefined) problems.push(`${at}: missing ${k}`);
    if (ids.has(r.id)) problems.push(`${at}: duplicate id`);
    ids.add(r.id);
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(r.id)) problems.push(`${at}: id must be lowercase [a-z0-9.-]`);
    if (!CHANNELS.includes(r.channel)) problems.push(`${at}: unknown channel ${r.channel}`);
    if (!AGENTS.includes(r.agent)) problems.push(`${at}: unknown agent ${r.agent}`);
    if (!VERDICTS.includes(r.expected)) problems.push(`${at}: unknown expected ${r.expected}`);
    if (r.stage !== 'pre' && r.stage !== 'post') problems.push(`${at}: stage must be pre or post`);
    if (r.stage === 'post' && r.output === undefined) problems.push(`${at}: post case without output`);
    if (!profiles.has(r.setup)) problems.push(`${at}: unknown setup profile ${r.setup}`);
    if (r.private !== isHoldout(r.group)) problems.push(`${at}: private flag disagrees with its group`);
    if (r.volatile !== undefined && r.volatile !== true) problems.push(`${at}: volatile must be true or absent`);
    if (!SETS.includes(r.set)) problems.push(`${at}: unknown set ${r.set}`);
    if (!isAsiId(r.owasp)) problems.push(`${at}: unknown owasp risk ${r.owasp} (src/scope/owasp.ts)`);
    if (r.set === 'official') {
      if (r.section === undefined || !SECTIONS.includes(r.section)) problems.push(`${at}: an official case needs a section (${SECTIONS.join(', ')})`);
      if (r.extended_reason !== undefined) problems.push(`${at}: an official case carries no extended_reason`);
    } else if (r.set === 'extended') {
      if (r.extended_reason === undefined || !isExtendedReason(r.extended_reason))
        problems.push(`${at}: unknown extended_reason ${r.extended_reason}; add it to src/scope/reasons.ts first`);
      if (r.section !== undefined) problems.push(`${at}: an extended case has no section`);
    }
    if (r.tags !== undefined && (!Array.isArray(r.tags) || r.tags.some((t) => typeof t !== 'string' || !/^[a-z]+:.+/.test(t))))
      problems.push(`${at}: tags must be "<namespace>:<value>" strings`);
    const input = r.input as Record<string, unknown>;
    if (typeof input !== 'object' || input === null || input.tool_name !== r.tool) {
      problems.push(`${at}: input.tool_name must equal tool`);
    }
  }
  return problems;
}
