// The sandbox an outside tool runs in. A guard under test is someone else's
// code, run thousands of times as the user who runs the benchmark; nothing
// it does should reach that user's files, secrets or network.
//
// Two layers. One private network namespace for the whole run (`unshare`,
// loopback only, no route out), and inside it one bubblewrap per call:
//
//   - the user's home, /home, /run/user (the session bus, so the desktop
//     keyring, and the ssh and gpg agents), /tmp and /var/tmp are hidden
//     behind empty directories;
//   - the rest of the filesystem is read-only;
//   - the case's HOME is the only place left to write, plus an empty TMPDIR;
//   - the tool's own install directory comes back read-only.
//
// The network namespace is shared by every call of the run, so a daemon a
// tool starts on loopback in one call is reachable by its next call, as it
// is on a real machine. Process ids stay the host's, so a tool's own
// liveness checks hold, and the adapter's release() still finds and stops a
// daemon a case left behind.
//
// The sandbox is off unless the runner starts it (run.ts does, for every
// outside tool, unless --no-sandbox), so unit tests run tools directly.
// --sandbox-net keeps the host network for a tool that needs an online
// lookup; everything else stays hidden. Needs Linux with bubblewrap and
// unprivileged user namespaces.

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Mode = 'off' | 'sandbox' | 'sandbox-net';

let mode: Mode = 'off';
let holder: ChildProcess | null = null;

const IP = '/usr/sbin/ip';

function need(bin: string): void {
  const r = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`${bin} not found: the sandbox needs bubblewrap (bwrap), unshare and nsenter on Linux; or run with --no-sandbox`);
}

/** Start the sandbox for this run. `net` keeps the host network. */
export async function startSandbox(opts: { net: boolean }): Promise<void> {
  need('bwrap');
  if (opts.net) {
    mode = 'sandbox-net';
    return;
  }
  need('unshare');
  need('nsenter');
  // The holder keeps the network namespace alive and ends with this process.
  const child = spawn('unshare', ['-U', '-r', '-n', 'sh', '-c', `${IP} link set lo up && echo ready && while kill -0 ${process.pid} 2>/dev/null; do sleep 5; done`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    let err = '';
    child.stderr!.on('data', (d) => (err += String(d)));
    child.stdout!.once('data', (d) => (String(d).includes('ready') ? resolve() : reject(new Error(`sandbox: ${String(d)}`))));
    child.once('exit', (code) => reject(new Error(`sandbox: the network namespace did not start (exit ${code}): ${err.trim().slice(0, 200)}`)));
  });
  // Nothing more comes from the holder; its pipes must not keep the run alive.
  child.stdout!.destroy();
  child.stderr!.destroy();
  child.unref();
  process.once('exit', () => child.kill('SIGKILL'));
  holder = child;
  mode = 'sandbox';
}

/** For the adapter's method line. */
export function sandboxNote(): string {
  if (mode === 'off') return 'not sandboxed';
  const net = mode === 'sandbox' ? 'no network' : 'host network';
  return `sandboxed (bubblewrap: ${net}, the home, /run/user and temp directories hidden, read-only elsewhere but the case HOME)`;
}

export function sandboxOn(): boolean {
  return mode !== 'off';
}

const isUnder = (p: string, dir: string) => p === dir || p.startsWith(dir.endsWith('/') ? dir : dir + '/');

/** The directories hidden from the tool. */
function hidden(): string[] {
  const dirs = [os.homedir(), '/home', '/root', '/run/user', '/tmp', '/var/tmp'];
  return [...new Set(dirs)].filter((d) => {
    try {
      return fs.statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * The command line that runs `cmd args` in the sandbox, for spawn or
 * spawnSync; unchanged when the sandbox is off. `ro` are directories the
 * tool needs to read (its install directory); `home` is the case HOME, the
 * one writable place.
 */
export function sandboxed(cmd: string, args: string[], opts: { home: string; cwd?: string; ro?: string[] }): { cmd: string; args: string[] } {
  if (mode === 'off') return { cmd, args };
  const hide = hidden();
  const b = [
    '--unshare-user',
    '--uid', String(process.getuid?.() ?? 1000),
    '--gid', String(process.getgid?.() ?? 1000),
    '--unshare-ipc',
    '--unshare-uts',
    '--unshare-cgroup-try',
    '--die-with-parent',
    '--new-session',
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
  ];
  for (const d of hide) b.push('--tmpfs', d);
  const tmp = os.tmpdir();
  if (hide.some((d) => isUnder(tmp, d))) b.push('--dir', tmp);
  for (const dir of opts.ro ?? []) {
    if (!fs.existsSync(dir)) continue;
    const real = fs.realpathSync(dir);
    for (const p of new Set([real, path.resolve(dir)])) if (hide.some((d) => isUnder(p, d))) b.push('--ro-bind', real, p);
  }
  b.push('--bind', opts.home, opts.home);
  if (opts.cwd) b.push('--chdir', opts.cwd);
  b.push('--', cmd, ...args);
  if (mode === 'sandbox-net') return { cmd: 'bwrap', args: b };
  return { cmd: 'nsenter', args: ['-t', String(holder!.pid), '--user', '--net', '--preserve-credentials', 'bwrap', ...b] };
}

/** The install directory of the Node.js running this process, for a tool that runs a Node script. */
export function nodePrefix(): string {
  return path.dirname(path.dirname(fs.realpathSync(process.execPath)));
}

/** The directory a tool is installed in: its Python venv when it has one, else the binary's own directory. */
export function installRoot(file: string): string {
  for (let d = path.dirname(path.resolve(file)); d !== path.dirname(d); d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'pyvenv.cfg'))) return d;
  }
  return path.dirname(path.resolve(file));
}

/** Run `fn` with a fresh, empty HOME that is removed afterwards (a version check before any case). */
export function withScratchHome<T>(fn: (home: string) => T): T {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agentverdict-tool-'));
  try {
    return fn(home);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}
