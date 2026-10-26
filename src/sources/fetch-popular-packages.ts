// Refreshes sources/popular-packages/: the most downloaded npm and PyPI
// packages by official download statistics, the outside benign side of the
// package channel (installing one is ordinary work). Network access happens
// only here; conversion stays offline.
//
//   npm run sources:popular-packages
//
// PyPI: the top of hugovk/top-pypi-packages (MIT), a monthly dump of the
// official PyPI download statistics (the BigQuery dataset
// bigquery-public-data.pypi.file_downloads, 30 days), read at a pinned
// commit of that repository; the first TOP rows by download count.
//
// npm: the registry publishes download counts per package
// (api.npmjs.org/downloads/point/last-month/<name>) but no ranking, so a
// candidate pool of the POOL packages ecosyste.ms lists as most downloaded is
// read, every candidate's last-month count is then read from the official
// endpoint, and the first TOP by that official count are kept. The pool only
// has to contain the top; the rank is the registry's own number.
//
// For each kept package the registry's latest version is read, and a name
// whose latest version has an OSV MAL- record is refused (the rule of
// fetch-packages.ts). Only metadata is read; nothing is installed.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';

const TOP = 100;
const POOL = 300;
const PYPI_LIST_REPO = 'hugovk/top-pypi-packages';
const PYPI_LIST_FILE = 'top-pypi-packages.json';
const OUT = path.join(ROOT, 'sources', 'popular-packages');
const UA = { 'user-agent': 'agentverdict (https://github.com/node9-ai/agentverdict)' };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  // The npm downloads API answers 429 under a steady stream; wait and retry.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { ...init, headers: { ...UA, ...(init?.headers ?? {}) } });
    if (res.status === 429 && attempt < 6) {
      await sleep(10_000 * attempt);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return (await res.json()) as T;
  }
}
const gh = (args: string[]) => execFileSync('gh', ['api', ...args], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function osvMal(ecosystem: 'npm' | 'PyPI', name: string, version: string): Promise<string[]> {
  const res = await json<{ vulns?: Array<{ id: string }> }>('https://api.osv.dev/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ package: { ecosystem, name }, version }),
  });
  return (res.vulns ?? []).map((v) => v.id).filter((id) => id.startsWith('MAL-')).sort();
}

interface Kept {
  ecosystem: 'npm' | 'PyPI';
  name: string;
  rank: number;
  downloads_last_month: number;
  latest: string;
  has_install_script?: boolean;
}

async function pypi(): Promise<{ commit: string; last_update: string; kept: Kept[]; refused: string[] }> {
  const commit = (JSON.parse(gh([`repos/${PYPI_LIST_REPO}/commits?path=${PYPI_LIST_FILE}&per_page=1`])) as Array<{ sha: string }>)[0].sha;
  const list = await json<{ last_update: string; rows: Array<{ project: string; download_count: number }> }>(
    `https://raw.githubusercontent.com/${PYPI_LIST_REPO}/${commit}/${PYPI_LIST_FILE}`
  );
  const kept: Kept[] = [];
  const refused: string[] = [];
  for (const [i, row] of list.rows.entries()) {
    if (kept.length >= TOP) break;
    const latest = (await json<{ info: { version: string } }>(`https://pypi.org/pypi/${row.project}/json`)).info.version;
    const mal = await osvMal('PyPI', row.project, latest);
    if (mal.length > 0) {
      refused.push(`${row.project}@${latest}: ${mal.join(', ')}`);
      continue;
    }
    kept.push({ ecosystem: 'PyPI', name: row.project, rank: i + 1, downloads_last_month: row.download_count, latest });
    await sleep(200);
  }
  return { commit, last_update: list.last_update, kept, refused };
}

async function npm(): Promise<{ pool: number; kept: Kept[]; refused: string[] }> {
  const pool: string[] = [];
  for (let page = 1; pool.length < POOL; page++) {
    const rows = await json<Array<{ name: string }>>(`https://packages.ecosyste.ms/api/v1/registries/npmjs.org/packages?sort=downloads&order=desc&per_page=100&page=${page}`);
    if (rows.length === 0) break;
    pool.push(...rows.map((r) => r.name));
    await sleep(500);
  }
  // Bulk queries take up to 128 unscoped names at once; scoped names go one by one.
  const counted: Array<{ name: string; downloads: number }> = [];
  const names = pool.slice(0, POOL);
  const unscoped = names.filter((n) => !n.startsWith('@'));
  for (let i = 0; i < unscoped.length; i += 128) {
    const batch = unscoped.slice(i, i + 128);
    const d = await json<Record<string, { downloads: number } | null>>(`https://api.npmjs.org/downloads/point/last-month/${batch.join(',')}`);
    for (const name of batch) counted.push({ name, downloads: d[name]?.downloads ?? 0 });
    await sleep(1000);
  }
  for (const name of names.filter((n) => n.startsWith('@'))) {
    const d = await json<{ downloads: number }>(`https://api.npmjs.org/downloads/point/last-month/${name}`);
    counted.push({ name, downloads: d.downloads });
    await sleep(1000);
  }
  counted.sort((a, b) => b.downloads - a.downloads || a.name.localeCompare(b.name));
  const kept: Kept[] = [];
  const refused: string[] = [];
  for (const [i, c] of counted.entries()) {
    if (kept.length >= TOP) break;
    const m = await json<{ version: string; scripts?: Record<string, string> }>(`https://registry.npmjs.org/${c.name.replace('/', '%2F')}/latest`);
    const mal = await osvMal('npm', c.name, m.version);
    if (mal.length > 0) {
      refused.push(`${c.name}@${m.version}: ${mal.join(', ')}`);
      continue;
    }
    kept.push({
      ecosystem: 'npm',
      name: c.name,
      rank: i + 1,
      downloads_last_month: c.downloads,
      latest: m.version,
      has_install_script: ['preinstall', 'install', 'postinstall'].some((k) => typeof m.scripts?.[k] === 'string'),
    });
    await sleep(200);
  }
  return { pool: counted.length, kept, refused };
}

const py = await pypi();
const js = await npm();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      fetched_at: new Date().toISOString(),
      rule: `the ${TOP} most downloaded packages of each registry by official download counts (30 days); a name whose latest version has an OSV MAL- record is refused`,
      pypi: { list: `${PYPI_LIST_REPO}@${py.commit.slice(0, 7)} ${PYPI_LIST_FILE} (MIT; official PyPI BigQuery download statistics)`, last_update: py.last_update, refused: py.refused },
      npm: { pool: `${js.pool} candidates from packages.ecosyste.ms, ranked by api.npmjs.org last-month downloads`, refused: js.refused },
      packages: [...js.kept, ...py.kept],
    },
    null,
    1
  ) + '\n'
);
console.log(`npm ${js.kept.length} (refused ${js.refused.length}), PyPI ${py.kept.length} (refused ${py.refused.length})`);
