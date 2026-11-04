// Builds the config snapshots the engine adapter feeds to evaluatePolicy.
//
// @node9/policy-engine takes its config from the host; the shipped defaults,
// shields and jail rules are assembled by node9-proxy's getConfig(). So for
// each profile this script prepares a temporary home exactly as the gate
// adapter does (same CLI, same files), runs node9-proxy's own getConfig()
// against it in a child process, and stores the result. Nothing about
// node9's config logic is reimplemented here.
//
// The home is a fixed path, SNAPSHOT_HOME, recorded in _meta.json. node9
// compiles a protected path into its rules (a regex with separators
// rewritten, and a slug in the rule name), so a snapshot cannot be
// re-templated onto another home by string substitution. The engine is pure
// and never touches the disk, so the engine adapter instead materialises
// every case against this same fixed home.
//
//   npm run snapshot                      -> configs/<version>/, from the pinned
//                                            @node9/proxy CLI plus the checkout's
//                                            getConfig (versions must match)
//   npm run snapshot -- --source local    -> configs/local/ (git-ignored), from the
//                                            checkout only

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadProfiles } from '../../src/corpus.ts';
import { materialize, type Env } from '../../src/template.ts';
import { Node9GateAdapter, gateEnv } from '../node9-gate/index.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');

export const SNAPSHOT_HOME = '/tmp/node9-bench-home';

export interface SnapshotMeta {
  home: string;
  proxy_version: string;
  proxy_commit: string;
  cli: string;
  generated_at: string;
}

export function checkoutInfo(proxyDir: string): { version: string; commit: string } {
  const version = JSON.parse(fs.readFileSync(path.join(proxyDir, 'package.json'), 'utf-8')).version as string;
  const commit = spawnSync('git', ['-C', proxyDir, 'rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim();
  const dirty = spawnSync('git', ['-C', proxyDir, 'status', '--porcelain'], { encoding: 'utf-8' }).stdout.trim() !== '';
  return { version, commit: dirty ? `${commit}-dirty` : commit };
}

export async function buildSnapshots(opts: { source: 'npm' | 'local'; proxyDir: string; outDir: string }): Promise<void> {
  const gate = new Node9GateAdapter({ source: opts.source, proxyDir: opts.proxyDir });
  const info = checkoutInfo(opts.proxyDir);
  if (opts.source === 'npm' && info.version !== gate.toolVersion) {
    throw new Error(
      `node9-proxy checkout is ${info.version} but the pinned package is ${gate.toolVersion}: ` +
        'check out the matching tag before snapshotting, or use --source local'
    );
  }
  fs.mkdirSync(opts.outDir, { recursive: true });
  for (const profile of loadProfiles().values()) {
    const home = SNAPSHOT_HOME;
    const env: Env = { home, cwd: path.join(home, 'project') };
    try {
      fs.rmSync(home, { recursive: true, force: true });
      fs.mkdirSync(env.cwd, { recursive: true });
      for (const f of profile.files ?? []) {
        const file = materialize(f.path, env) as string;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, materialize(f.content, env) as string);
      }
      await gate.prepare(profile, env, new Set());
      const r = spawnSync(TSX, [path.join(HERE, 'dump-config.ts'), env.cwd], {
        encoding: 'utf-8',
        cwd: home,
        timeout: 120_000,
        env: { ...gateEnv(home), NODE9_PROXY_DIR: opts.proxyDir },
      });
      if (r.status !== 0) throw new Error(`dump-config failed for ${profile.name}: ${r.stderr}`);
      // Canary values never enter a snapshot: getConfig does not read the
      // canary registry, and validate.ts scans committed snapshots anyway.
      fs.writeFileSync(path.join(opts.outDir, `${profile.name}.json`), JSON.stringify(JSON.parse(r.stdout), null, 2) + '\n');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  }
  const meta: SnapshotMeta = {
    home: SNAPSHOT_HOME,
    proxy_version: info.version,
    proxy_commit: info.commit,
    cli: opts.source === 'npm' ? `@node9/proxy@${gate.toolVersion}` : `${opts.proxyDir}/dist/cli.js`,
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(opts.outDir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values } = parseArgs({ options: { source: { type: 'string', default: 'npm' }, 'proxy-dir': { type: 'string' } } });
  const proxyDir = values['proxy-dir'] ?? process.env.NODE9_PROXY_DIR ?? path.resolve(ROOT, '..', 'node9-proxy');
  const source = values.source === 'local' ? 'local' : 'npm';
  const version = checkoutInfo(proxyDir).version;
  const outDir = path.join(ROOT, 'configs', source === 'npm' ? version : 'local');
  await buildSnapshots({ source, proxyDir, outDir });
  console.log(`snapshots written to ${path.relative(ROOT, outDir)}`);
}
