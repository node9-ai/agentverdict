// Refreshes sources/osv-other-ecosystems/, sources/datadog-packages/ and
// sources/typomind/: package names others have labelled malicious, beyond the
// npm and PyPI sample of sources/packages.json. Network access happens only
// here; conversion stays offline. Only names and versions are read: no
// package, archive or sample is downloaded.
//
//   npm run sources:packages-more
//
//   osv-other-ecosystems  OpenSSF malicious-packages (Apache-2.0) at one
//                         pinned commit: every ecosystem other than npm and
//                         PyPI, up to PER_ECOSYSTEM records each, by salted
//                         hash of the record path
//   datadog-packages      DataDog malicious-software-packages-dataset
//                         (Apache-2.0): the npm and PyPI manifests (name ->
//                         every version, or the compromised versions), up to
//                         PER_MANIFEST names each by salted hash, skipping
//                         names already in sources/packages.json
//   typomind              "Beyond Typosquatting" (USENIX Security 2023, MIT):
//                         labelled typosquats with the package each imitates,
//                         up to PER_ECOSYSTEM per ecosystem by salted hash
// Every name is labelled malicious by its publisher; the converter installs
// it (block). Fixed before measuring.
//
//   npm run sources:packages-more -- --held-extra   (full build only)
//
// draws the held-out names of corpus 7.0.0 in secret from the names the
// samples did not take, per ecosystem (src/sources/held-extra.ts); the
// samples are untouched.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { SECTIONS } from '../holdout/sections.ts';
import { drawSecret } from './selection-salt.ts';
import { HELD_EXTRA, checkPool, selectionSalt, wantsHeldExtra, writeHeldExtra } from './held-extra.ts';

const OSV = { repo: 'ossf/malicious-packages', commit: '41f452910af01bb0497142c392f0412db763f61c' };
const DATADOG = { repo: 'DataDog/malicious-software-packages-dataset', commit: '805fcd72db525244cae8dd32056efbd50b8b0e19' };
const TYPOMIND = { repo: 'ldklab/typomind-release', commit: 'f1f5cdf184e75d21275903ffa701262af9767ffb' };
const PER_ECOSYSTEM = 20;
const PER_MANIFEST = 30;
const ECO: Record<string, string> = { npm: 'npm', pip: 'PyPI', pypi: 'PyPI', rubygems: 'RubyGems', gem: 'RubyGems' };

const rank = (salt: string, s: string) => createHash('sha256').update(`node9-bench/${salt}/v1:${s}`).digest('hex');
const byRank = <T>(salt: string, xs: T[], key: (x: T) => string) =>
  xs.map((x) => [rank(salt, key(x)), x] as const).sort((a, b) => a[0].localeCompare(b[0])).map(([, x]) => x);
const raw = (repo: string, commit: string, p: string): string =>
  execFileSync('curl', ['-sfL', `https://raw.githubusercontent.com/${repo}/${commit}/${p.split('/').map(encodeURIComponent).join('/')}`], {
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
const gh = (p: string): string => execFileSync('gh', ['api', p], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
const write = (name: string, data: unknown, license: string, notice: string) => {
  const out = path.join(ROOT, 'sources', name);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'LICENSE'), license);
  fs.writeFileSync(path.join(out, 'NOTICE'), notice);
  fs.writeFileSync(path.join(out, 'snapshot.json'), JSON.stringify({ ...(data as object), fetched_at: new Date().toISOString() }, null, 1) + '\n');
};

const existing = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'packages.json'), 'utf-8')) as {
  malicious: Array<{ ecosystem: string; name: string }>;
  typosquats: Array<{ ecosystem: string; name: string }>;
};
const taken = new Set([...existing.malicious, ...existing.typosquats].map((m) => `${m.ecosystem.toLowerCase()}:${m.name.toLowerCase()}`));

/** The group the cut gives a row of this snapshot list (src/holdout/sections.ts), so the drawn groups are exactly the cut's. */
const groupOf = (file: string, list: string, row: Record<string, unknown>): string => {
  const section = SECTIONS.find((x) => x.file === file && x.list === list);
  if (!section) throw new Error(`no section for ${file} ${list}`);
  return section.group(row, [list]);
};

if (wantsHeldExtra()) {
  const salt = selectionSalt();
  const read = (name: string) => JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', name, 'snapshot.json'), 'utf-8'));
  const osvSnap = read('osv-other-ecosystems') as { records: Array<{ ecosystem: string; name: string }> };
  const ddSnap = read('datadog-packages') as { packages: Array<{ ecosystem: string; name: string }> };
  const tmSnap = read('typomind') as { typosquats: Array<{ ecosystem: string; name: string }> };
  for (const r of [...osvSnap.records, ...ddSnap.packages, ...tmSnap.typosquats]) taken.add(`${r.ecosystem.toLowerCase()}:${r.name.toLowerCase()}`);
  const key = (eco: string, name: string) => `${eco.toLowerCase()}:${name.toLowerCase()}`;

  // OpenSSF: record files of the two ecosystems with records left.
  const rootTree = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${OSV.commit}?recursive=0`)) as { tree: Array<{ path: string; sha: string }> };
  const osvTreeX = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${rootTree.tree.find((t) => t.path === 'osv')!.sha}`)) as { tree: Array<{ path: string; sha: string }> };
  const malX = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${osvTreeX.tree.find((t) => t.path === 'malicious')!.sha}`)) as { tree: Array<{ path: string; sha: string; type: string }> };
  const osvAdded: Array<{ ecosystem: string; name: string; mal_id: string; affected: string[] | 'all'; path: string }> = [];
  const osvPool: Record<string, number> = {};
  for (const [dir, n] of Object.entries(HELD_EXTRA['osv-other-ecosystems'])) {
    const eco = malX.tree.find((t) => t.type === 'tree' && t.path === dir)!;
    const tree = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${eco.sha}?recursive=1`)) as { tree: Array<{ path: string; type: string }>; truncated: boolean };
    if (tree.truncated) throw new Error(`osv: tree of ${dir} is truncated`);
    const takenFiles = new Set((osvSnap.records as Array<{ path?: string }>).map((r) => r.path));
    const files = tree.tree.filter((t) => t.type === 'blob' && /(^|\/)MAL-[^/]+\.json$/.test(t.path)).map((t) => `osv/malicious/${dir}/${t.path}`).filter((f) => !takenFiles.has(f));
    osvPool[dir] = files.length;
    checkPool('osv-other-ecosystems', dir, files.length, n);
    let got = 0;
    for (const file of drawSecret(files, (f) => f, files.length, salt, `osv-other:${dir}`)) {
      if (got === n) break;
      const rec = JSON.parse(raw(OSV.repo, OSV.commit, file)) as Osv;
      const a = rec.affected?.[0];
      if (!a?.package) continue;
      if (taken.has(key(a.package.ecosystem, a.package.name))) continue;
      const versions = a.versions && a.versions.length > 0 && !(a.ranges && a.ranges.length > 0) ? a.versions : 'all';
      osvAdded.push({ ecosystem: a.package.ecosystem, name: a.package.name, mal_id: rec.id, affected: versions, path: file });
      taken.add(key(a.package.ecosystem, a.package.name));
      got++;
    }
    if (got < n) throw new Error(`osv-other-ecosystems ${dir}: ${got} names left, ${n} wanted`);
  }

  // DataDog: manifest names the samples did not take.
  const ddAdded: Array<{ ecosystem: 'npm' | 'PyPI'; name: string; affected: string[] | 'all' }> = [];
  const ddPool: Record<string, number> = {};
  for (const [dir, ecosystem] of [['npm', 'npm'], ['pypi', 'PyPI']] as const) {
    const manifest = JSON.parse(raw(DATADOG.repo, DATADOG.commit, `samples/${dir}/manifest.json`)) as Record<string, string[] | null>;
    const free = Object.keys(manifest).filter((nm) => !taken.has(key(ecosystem, nm)));
    ddPool[dir] = free.length;
    const n = HELD_EXTRA['datadog-packages'][dir];
    checkPool('datadog-packages', dir, free.length, n);
    for (const name of drawSecret(free, (x) => x, n, salt, `datadog:${dir}`)) {
      const v = manifest[name];
      ddAdded.push({ ecosystem, name, affected: v && v.length > 0 ? v : 'all' });
      taken.add(key(ecosystem, name));
    }
  }

  // typomind: rows the sample did not take, per ecosystem.
  const [hdr, ...rowsX] = csvRows(raw(TYPOMIND.repo, TYPOMIND.commit, 'data/clean_package_data.csv'));
  const ix = (n: string) => hdr.indexOf(n);
  const [xName, xOrig, xEco, xCat] = ['Malicious Package Name', 'Original Package Name', 'Ecosystem', 'Categories'].map(ix);
  const tmAdded: Array<{ ecosystem: string; name: string; imitates: string; categories: string }> = [];
  const tmPool: Record<string, number> = {};
  for (const [eco, n] of Object.entries(HELD_EXTRA.typomind)) {
    const free = rowsX.filter((r) => ECO[r[xEco].trim().toLowerCase()] === eco && !taken.has(key(eco, r[xName].trim())));
    const distinctFree = [...new Map(free.map((r) => [r[xName].trim().toLowerCase(), r])).values()];
    tmPool[eco] = distinctFree.length;
    checkPool('typomind', eco, distinctFree.length, n);
    for (const r of drawSecret(distinctFree, (x) => x[xName].trim().toLowerCase(), n, salt, `typomind:${eco}`)) {
      tmAdded.push({ ecosystem: eco, name: r[xName].trim(), imitates: r[xOrig].trim(), categories: r[xCat].trim() });
      taken.add(key(eco, r[xName].trim()));
    }
  }

  const finish = (name: string, list: string, snap: Record<string, unknown>, rows: Array<Record<string, unknown>>, rule: string, drawn: Record<string, number>, pool: Record<string, number>) => {
    (snap[list] as unknown[]).push(...rows);
    writeHeldExtra(name, path.join(ROOT, 'sources', name, 'snapshot.json'), snap, { rule, drawn, pool }, rows.map((r) => groupOf(`${name}/snapshot.json`, list, r)));
  };
  finish('osv-other-ecosystems', 'records', osvSnap, osvAdded, 'record files the sample did not take, in rubygems and nuget, in sha256(selection salt:osv-other:<ecosystem>:path) order, one record per package name', { ...HELD_EXTRA['osv-other-ecosystems'] }, osvPool);
  finish('datadog-packages', 'packages', ddSnap, ddAdded, 'manifest names the samples did not take, per manifest, in sha256(selection salt:datadog:<manifest>:name) order', { ...HELD_EXTRA['datadog-packages'] }, ddPool);
  finish('typomind', 'typosquats', tmSnap, tmAdded, 'typosquats the samples did not take, per ecosystem, in sha256(selection salt:typomind:<ecosystem>:name) order', { ...HELD_EXTRA.typomind }, tmPool);
  console.log(`held-out draw: osv-other-ecosystems ${osvAdded.length}, datadog-packages ${ddAdded.length}, typomind ${tmAdded.length}`);
  process.exit(0);
}

// ---- OpenSSF, other ecosystems ----
interface Osv {
  id: string;
  affected: Array<{ package: { ecosystem: string; name: string }; versions?: string[]; ranges?: unknown[] }>;
}
const root = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${OSV.commit}?recursive=0`)) as { tree: Array<{ path: string; sha: string }> };
const osvDir = root.tree.find((t) => t.path === 'osv')!;
const osvTree = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${osvDir.sha}`)) as { tree: Array<{ path: string; sha: string }> };
const malDir = osvTree.tree.find((t) => t.path === 'malicious')!;
const ecosystems = (JSON.parse(gh(`repos/${OSV.repo}/git/trees/${malDir.sha}`)) as { tree: Array<{ path: string; sha: string; type: string }> }).tree.filter(
  // npm and PyPI are sampled in sources/packages.json; a `git` record names a
  // repository, which no package manager installs.
  (t) => t.type === 'tree' && !['npm', 'pypi', 'git'].includes(t.path)
);
const osvRecords: Array<{ ecosystem: string; name: string; mal_id: string; affected: string[] | 'all'; path: string }> = [];
const osvCounts: Record<string, number> = {};
for (const eco of ecosystems) {
  const tree = JSON.parse(gh(`repos/${OSV.repo}/git/trees/${eco.sha}?recursive=1`)) as { tree: Array<{ path: string; type: string }>; truncated: boolean };
  if (tree.truncated) throw new Error(`osv: tree of ${eco.path} is truncated`);
  const files = tree.tree.filter((t) => t.type === 'blob' && /(^|\/)MAL-[^/]+\.json$/.test(t.path)).map((t) => `osv/malicious/${eco.path}/${t.path}`);
  osvCounts[eco.path] = files.length;
  for (const file of byRank('osv-other', files, (f) => f).slice(0, PER_ECOSYSTEM)) {
    const rec = JSON.parse(raw(OSV.repo, OSV.commit, file)) as Osv;
    const a = rec.affected?.[0];
    if (!a?.package) throw new Error(`osv: ${file} has no affected package`);
    const versions = a.versions && a.versions.length > 0 && !(a.ranges && a.ranges.length > 0) ? a.versions : 'all';
    osvRecords.push({ ecosystem: a.package.ecosystem, name: a.package.name, mal_id: rec.id, affected: versions, path: file });
  }
}
write(
  'osv-other-ecosystems',
  { repo: OSV.repo, commit: OSV.commit, license: 'Apache-2.0 (LICENSE next to this file)', counts: osvCounts, records: osvRecords },
  raw(OSV.repo, OSV.commit, 'LICENSE'),
  `Records in snapshot.json are from OpenSSF malicious-packages, https://github.com/${OSV.repo},\ncommit ${OSV.commit}, licensed under the Apache License 2.0 (LICENSE next to this file).\nChanges: a sample of records; only the package name, ecosystem, MAL id and affected versions kept.\n`
);
for (const r of osvRecords) taken.add(`${r.ecosystem.toLowerCase()}:${r.name.toLowerCase()}`);

// ---- DataDog manifests ----
const datadog: Array<{ ecosystem: 'npm' | 'PyPI'; name: string; affected: string[] | 'all' }> = [];
const ddCounts: Record<string, number> = {};
for (const [dir, ecosystem] of [['npm', 'npm'], ['pypi', 'PyPI']] as const) {
  const manifest = JSON.parse(raw(DATADOG.repo, DATADOG.commit, `samples/${dir}/manifest.json`)) as Record<string, string[] | null>;
  ddCounts[dir] = Object.keys(manifest).length;
  const names = byRank(`datadog-${dir}`, Object.keys(manifest), (n) => n).filter((n) => !taken.has(`${ecosystem.toLowerCase()}:${n.toLowerCase()}`));
  for (const name of names.slice(0, PER_MANIFEST)) {
    const v = manifest[name];
    datadog.push({ ecosystem, name, affected: v && v.length > 0 ? v : 'all' });
    taken.add(`${ecosystem.toLowerCase()}:${name.toLowerCase()}`);
  }
}
write(
  'datadog-packages',
  { repo: DATADOG.repo, commit: DATADOG.commit, license: 'Apache-2.0 (LICENSE next to this file)', counts: ddCounts, packages: datadog },
  raw(DATADOG.repo, DATADOG.commit, 'LICENSE'),
  `Package names in snapshot.json are from DataDog's malicious-software-packages-dataset,\nhttps://github.com/${DATADOG.repo}, commit ${DATADOG.commit}, samples/{npm,pypi}/manifest.json,\nlicensed under the Apache License 2.0 (LICENSE next to this file). No sample archive was read.\nChanges: a sample of names and their versions.\n`
);

// ---- typomind ----
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += ch;
  }
  if (field !== '' || row.length) row.push(field), rows.push(row);
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}
const [header, ...body] = csvRows(raw(TYPOMIND.repo, TYPOMIND.commit, 'data/clean_package_data.csv'));
const col = (n: string) => {
  const i = header.indexOf(n);
  if (i < 0) throw new Error(`typomind: no column ${n}`);
  return i;
};
const [cName, cOrig, cEco, cCat] = ['Malicious Package Name', 'Original Package Name', 'Ecosystem', 'Categories'].map(col);
const typos: Array<{ ecosystem: string; name: string; imitates: string; categories: string }> = [];
const tmCounts: Record<string, number> = {};
const byEco = new Map<string, string[][]>();
for (const r of body) {
  const eco = ECO[r[cEco].trim().toLowerCase()];
  if (!eco) throw new Error(`typomind: ecosystem "${r[cEco]}" is not mapped`);
  tmCounts[eco] = (tmCounts[eco] ?? 0) + 1;
  byEco.set(eco, [...(byEco.get(eco) ?? []), r]);
}
for (const [eco, rows] of [...byEco].sort()) {
  const fresh = byRank(`typomind-${eco}`, rows, (r) => r[cName]).filter((r) => !taken.has(`${eco.toLowerCase()}:${r[cName].trim().toLowerCase()}`));
  for (const r of fresh.slice(0, PER_ECOSYSTEM)) {
    typos.push({ ecosystem: eco, name: r[cName].trim(), imitates: r[cOrig].trim(), categories: r[cCat].trim() });
    taken.add(`${eco.toLowerCase()}:${r[cName].trim().toLowerCase()}`);
  }
}
write(
  'typomind',
  { repo: TYPOMIND.repo, commit: TYPOMIND.commit, license: 'MIT (LICENSE next to this file)', counts: tmCounts, typosquats: typos },
  raw(TYPOMIND.repo, TYPOMIND.commit, 'LICENSE'),
  `Package names in snapshot.json are from typomind ("Beyond Typosquatting", USENIX Security 2023),\nhttps://github.com/${TYPOMIND.repo}, commit ${TYPOMIND.commit}, data/clean_package_data.csv,\nlicensed under the MIT License (LICENSE next to this file). Changes: a sample of rows.\n`
);

console.log(`osv-other-ecosystems: ${osvRecords.length} records (${Object.entries(osvCounts).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`datadog-packages: ${datadog.length} names (${Object.entries(ddCounts).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`typomind: ${typos.length} typosquats (${Object.entries(tmCounts).map(([k, v]) => `${k} ${v}`).join(', ')})`);
