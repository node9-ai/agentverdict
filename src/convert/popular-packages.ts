// Source: sources/popular-packages/snapshot.json (refresh with
// npm run sources:popular-packages): the most downloaded npm and PyPI
// packages by official download statistics, the outside benign side of the
// package channel. Label: allow, AgentVerdict's mapping by provenance (the
// packages everyone installs are ordinary work; the statistics label
// nothing). The hand-chosen everyday installs of node9-bench-package-list
// stay in the vendor section.
//
// Each package is installed once, as one Bash call judged before it runs
// (nothing is installed), with the command forms of packages.ts in rotation,
// pinned to the version the registry served on the fetch day and unpinned in
// turn. volatile: a registry's latest moves, and an unpinned install
// resolves to it. A package that AgentVerdict's own everyday-install list
// already holds (sources/packages.json, benign) is left out here, so no
// existing case changes hands: the two lists complement each other.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk, slot, slug } from './record.ts';
import { command, spec } from './packages.ts';
import { ROOT } from '../corpus.ts';
import type { BenchRecord } from '../types.ts';

const SNAPSHOT = 'sources/popular-packages/snapshot.json';
export const SOURCE = 'popular-packages';

interface Snapshot {
  fetched_at: string;
  pypi: { list: string; last_update: string };
  npm: { pool: string };
  packages: Array<{ ecosystem: 'npm' | 'PyPI'; name: string; rank: number; downloads_last_month: number; latest: string; has_install_script?: boolean }>;
}

export function convertPopularPackages(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), 'utf-8')) as Snapshot;
  const own = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'packages.json'), 'utf-8')) as { benign: Array<{ ecosystem: string; name: string }> };
  const handPicked = new Set(own.benign.map((b) => `${b.ecosystem}:${b.name}`));
  return snap.packages.filter((p) => !handPicked.has(`${p.ecosystem}:${p.name}`)).map((p) => {
    // Form and pinning are a stable slot of the package's own key, so a
    // package removed from the snapshot changes no other case.
    const i = slot(`popular:${p.ecosystem}:${p.name}`, 1 << 30);
    const eco = p.ecosystem.toLowerCase();
    const pinned = slot(`popular:${p.ecosystem}:${p.name}:pinned`, 2) === 0;
    return mk({
      id: `${SOURCE}.${eco}.${slug(p.name)}`,
      channel: 'package',
      tool: 'Bash',
      input: claudePre('Bash', { command: command(p.ecosystem, i, spec(p.ecosystem, p.name, pinned ? p.latest : undefined)) }),
      setup: 'clean',
      expected: 'allow',
      why: 'benign_install',
      family: p.has_install_script ? `popular_install_${eco}_script` : `popular_install_${eco}`,
      group: `${SOURCE}.${eco}.${slug(p.name)}`,
      source: SOURCE,
      source_ref:
        p.ecosystem === 'npm'
          ? `api.npmjs.org last-month downloads, rank ${p.rank} (${snap.npm.pool}; ${snap.fetched_at.slice(0, 10)})`
          : `${snap.pypi.list}, rank ${p.rank} (statistics of ${snap.pypi.last_update.slice(0, 10)})`,
      license: 'MIT',
      volatile: true,
      note: `${p.downloads_last_month.toLocaleString('en-US')} downloads in 30 days; latest ${p.latest} on the fetch day${p.has_install_script ? '; has an install script' : ''}`,
    });
  });
}
