import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { installRoot, sandboxNote, sandboxOn, sandboxed, startSandbox } from '../src/sandbox.ts';

/** bubblewrap and unprivileged user namespaces, both needed by the sandbox. */
function canSandbox(): boolean {
  const ok = (cmd: string, args: string[]) => spawnSync(cmd, args, { encoding: 'utf-8' }).status === 0;
  return ok('bwrap', ['--ro-bind', '/', '/', 'true']) && ok('unshare', ['-U', '-r', '-n', 'true']);
}

test('with the sandbox off, a command runs as given', () => {
  assert.equal(sandboxOn(), false);
  assert.equal(sandboxNote(), 'not sandboxed');
  assert.deepEqual(sandboxed('tool', ['hook'], { home: '/tmp/h' }), { cmd: 'tool', args: ['hook'] });
});

test('installRoot finds the venv of a Python tool and the directory of a binary', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-root-'));
  fs.mkdirSync(path.join(dir, 'venv', 'bin'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'venv', 'pyvenv.cfg'), '');
  assert.equal(installRoot(path.join(dir, 'venv', 'bin', 'python')), path.join(dir, 'venv'));
  assert.equal(installRoot(path.join(dir, 'tool')), dir);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('in the sandbox a tool sees no home, no session bus, no network, and writes only to its case HOME', { skip: !canSandbox() && 'needs bubblewrap and user namespaces' }, async () => {
  // A listener on the host's loopback: reachable from the host, not from the sandbox.
  const server = net.createServer((s) => s.end('host'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as net.AddressInfo).port;
  await startSandbox({ net: false });
  assert.match(sandboxNote(), /no network/);

  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'av-sbx-'));
  const probe = [
    `echo home=$(ls -A ${JSON.stringify(os.homedir())} 2>/dev/null | wc -l)`,
    'echo bus=$(ls -A /run/user 2>/dev/null | wc -l)',
    `echo net=$( (exec 3<>/dev/tcp/127.0.0.1/${port}) 2>/dev/null && echo open || echo closed)`,
    'touch "$HOME/written" && echo case-home=ok',
  ].join('; ');
  const s = sandboxed('bash', ['-c', probe], { home, cwd: home });
  const r = spawnSync(s.cmd, s.args, { encoding: 'utf-8', env: { HOME: home, PATH: '/usr/bin:/bin' } });
  server.close();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /home=0/);
  assert.match(r.stdout, /bus=0/);
  assert.match(r.stdout, /net=closed/);
  assert.match(r.stdout, /case-home=ok/);
  assert.ok(fs.existsSync(path.join(home, 'written')), 'the case HOME is the real directory, written through');
  fs.rmSync(home, { recursive: true, force: true });
});
