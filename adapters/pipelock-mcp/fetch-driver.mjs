// One WebFetch result through pipelock's fetch proxy, inside a private
// network namespace. Run as
//
//   unshare -rn -m node fetch-driver.mjs <spec.json>
//
// spec.json: { "bin", "config", "home", "url", "status", "contentType",
//              "body" (base64), "workDir" }
//
// Inside the namespace (user, network and mount namespaces; no privilege on
// the host): loopback comes up, a dummy interface takes 203.0.113.10
// (TEST-NET-3, documentation only, never routed), a hosts file bind-mounted
// over /etc/hosts maps the case's host to it, a one-page site answers there
// with the case's recorded content (over TLS with a certificate made for
// that host, trusted through SSL_CERT_FILE), and `pipelock run` serves its
// fetch proxy on loopback. One GET /fetch?url=<case url>, and the proxy's
// answer goes to stdout as JSON. Nothing leaves the machine: the namespace
// has no route out, and it disappears with this process.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';

const STUB_ADDRESS = '203.0.113.10';
const PROXY = '127.0.0.1:8888';
const READY_MS = 10_000;

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}: ${(r.stderr || r.error?.message || '').trim().slice(0, 200)}`);
}

async function main() {
  const url = new URL(spec.url);
  const host = url.hostname;
  const tls = url.protocol === 'https:';
  const port = Number(url.port || (tls ? 443 : 80));

  run('/usr/sbin/ip', ['link', 'set', 'lo', 'up']);
  run('/usr/sbin/ip', ['link', 'add', 'av0', 'type', 'dummy']);
  run('/usr/sbin/ip', ['addr', 'add', `${STUB_ADDRESS}/24`, 'dev', 'av0']);
  run('/usr/sbin/ip', ['link', 'set', 'av0', 'up']);
  const hosts = path.join(spec.workDir, 'hosts');
  fs.writeFileSync(hosts, `127.0.0.1 localhost\n::1 localhost\n${STUB_ADDRESS} ${host}\n`);
  run('/usr/bin/mount', ['--bind', hosts, '/etc/hosts']);

  const env = { HOME: spec.home, PATH: '/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR: spec.workDir };
  const body = Buffer.from(spec.body, 'base64');
  const handler = (_req, res) => {
    res.writeHead(spec.status, { 'content-type': spec.contentType, 'content-length': body.length });
    res.end(body);
  };
  let server;
  if (tls) {
    const key = path.join(spec.workDir, 'site.key');
    const cert = path.join(spec.workDir, 'site.crt');
    run('/usr/bin/openssl', [
      'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
      '-keyout', key, '-out', cert, '-days', '2', '-subj', `/CN=${host}`, '-addext', `subjectAltName=DNS:${host}`,
    ]);
    env.SSL_CERT_FILE = cert;
    server = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, handler);
  } else {
    server = http.createServer(handler);
  }
  await new Promise((resolve, reject) => server.once('error', reject).listen(port, STUB_ADDRESS, resolve));

  let stderr = '';
  const proxy = spawn(spec.bin, ['run', '--config', spec.config, '--listen', PROXY], { env, cwd: spec.workDir, stdio: ['ignore', 'pipe', 'pipe'] });
  const keep = (d) => (stderr = (stderr + String(d)).slice(-4000));
  proxy.stdout.on('data', keep);
  proxy.stderr.on('data', keep);
  const exited = new Promise((resolve) => proxy.once('exit', (code) => resolve(code)));
  try {
    const deadline = Date.now() + READY_MS;
    for (;;) {
      if (Date.now() > deadline) throw new Error(`pipelock fetch proxy not ready; stderr: ${stderr.slice(-300)}`);
      if (proxy.exitCode !== null) throw new Error(`pipelock run exited ${proxy.exitCode}; stderr: ${stderr.slice(-300)}`);
      try {
        const r = await fetch(`http://${PROXY}/health`);
        if (r.ok) break;
      } catch {
        /* not listening yet */
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    const r = await fetch(`http://${PROXY}/fetch?url=${encodeURIComponent(spec.url)}`);
    out({ status: r.status, body: await r.text(), log: stderr.slice(-1500) });
  } finally {
    proxy.kill('SIGTERM');
    await Promise.race([exited, new Promise((r) => setTimeout(r, 2000))]);
    if (proxy.exitCode === null) proxy.kill('SIGKILL');
    server.close();
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    out({ error: String(e?.message ?? e).slice(0, 400) });
    process.exit(0);
  }
);
