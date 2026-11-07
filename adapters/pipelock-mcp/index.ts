// pipelock as a Claude Code user runs it: its PreToolUse hook for every tool
// call, `pipelock mcp proxy` wrapped around each MCP server, and its fetch
// proxy for web pages, which is where pipelock scans what a tool returns.
//
//   stage pre             -> the hook, as in pipelock-hook (shell egress is
//                            unreachable there; see that file). An MCP call
//                            the hook lets through then goes through the MCP
//                            proxy too, as it does in Claude Code, and the
//                            proxy may refuse it.
//   stage post, mcp__*    -> `pipelock mcp proxy --config <file> -- node stub-server.mjs`
//                            The runner acts as the MCP client: initialize,
//                            tools/list, then tools/call with the case's
//                            arguments. The stub answers with the case's
//                            recorded output, so pipelock sees exactly that
//                            text come back. No model is involved.
//
// One proxy per MCP server for the whole case, started at the case's first
// call to that server and stopped when the case ends: every step of a chain
// goes through the same proxy, so pipelock keeps the session state it uses to
// catch tool chains, as it does in a real session.
//   stage post, WebFetch  -> pipelock's fetch proxy (`pipelock run`, GET
//                            /fetch?url=<case url>) in a private network
//                            namespace, where a one-page site at the case's
//                            host serves the recorded result (fetch-driver.mjs).
//                            The same config file as the hook. Claude Code's
//                            WebFetch result is the text the agent saw, so it
//                            is served as the page. As deployed, Claude Code's
//                            WebFetch reaches pipelock through its forward
//                            proxy, where the same response scanner reads the
//                            page only with TLS interception switched on; the
//                            fetch proxy is that scanner without the TLS step.
//   stage post, other     -> unreachable: a command's output (Bash) reaches
//                            pipelock only through its forward proxy, when the
//                            command runs, and the benchmark runs no command.
//
// Earlier calls (`prior`) go through the same paths. The runner ends a case
// at the first step pipelock stops (src/runner.ts); otherwise what pipelock
// did to an earlier WebFetch result is added to the final call's detail.
//
// Verdicts for MCP output: a JSON-RPC error in place of the result is block;
// a result whose content pipelock changed (stripped or redacted) is review;
// the result passed through unchanged is allow. An error pipelock raises
// because it could not read the exchange, or because the stub's tool was
// withheld before any content was seen, is a measurement error.
//
// Verdicts for a WebFetch result: the fetch proxy refusing the page (HTTP 403,
// `blocked: true`) is block; a page returned with its text changed is review;
// returned unchanged is allow. Any other failure (the proxy did not start,
// the site was not reached) is a measurement error.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { ruleNotGiven, type Decision } from '../../src/adapter.ts';
import type { BenchRecord, Profile, Verdict } from '../../src/types.ts';
import { materialize, type Env } from '../../src/template.ts';
import { PipelockHookAdapter, minimalEnv } from '../pipelock-hook/index.ts';
import { nodePrefix, sandboxNote, sandboxed } from '../../src/sandbox.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STUB = path.join(HERE, 'stub-server.mjs');
const FETCH_DRIVER = path.join(HERE, 'fetch-driver.mjs');
const FETCH_TIMEOUT_MS = 30_000;
const TIMEOUT_MS = 15_000;

/** Errors that say the exchange itself failed, not that a response was judged. */
const EXCHANGE_FAILURES = /parse|malformed|unknown tool|not found|withheld|admission|config error|timed out/i;

type Json = Record<string, any>;

export class PipelockAdapter extends PipelockHookAdapter {
  override readonly name: string = 'pipelock';
  override readonly method: string;

  constructor(bin?: string) {
    super(bin);
    this.method = `pipelock ${this.toolVersion}: claude hook for PreToolUse, mcp proxy around a stub MCP server for MCP tool output; preset claude-code plus each profile translated into pipelock settings, fresh HOME per case, minimal environment, ${sandboxNote()}`;
  }

  override unreachable(record: BenchRecord, profile?: Profile): string | null {
    const rule = ruleNotGiven(record, profile, 'pipelock');
    if (rule) return rule;
    const reachable = (tool: string) => tool.startsWith('mcp__') || tool === 'WebFetch';
    const shell = "a command's output reaches pipelock only through its forward proxy, when the command runs; the benchmark runs no command";
    if (record.stage === 'post' && !reachable(record.tool)) return record.tool === 'Bash' ? shell : `${record.tool} output reaches pipelock through no proxy the benchmark can drive`;
    // A case whose verdict depends on what the agent read earlier is out of
    // reach when pipelock could never have seen that earlier result.
    for (const p of record.prior ?? []) {
      const tool = String((p.input as { tool_name?: string }).tool_name ?? '');
      if (p.stage === 'post' && !reachable(tool)) return `${tool === 'Bash' ? shell : `${tool} output is out of reach`} (an earlier ${tool} result)`;
    }
    return record.stage === 'pre' ? super.unreachable(record, profile) : null;
  }

  /** What pipelock did to earlier WebFetch results of the current case, for its detail. */
  private earlier: string[] = [];

  /** The case's MCP tools, by server: every step's, so one stub can offer them all. */
  private caseTools = new Map<string, Set<string>>();
  /** The case's open proxies, by MCP server. */
  private sessions = new Map<string, McpSession>();

  override async prepare(profile: Profile, env: Env, secrets: Set<string>, record?: BenchRecord): Promise<void> {
    this.earlier = [];
    this.caseTools = new Map();
    const names = [record?.tool, ...(record?.prior ?? []).map((p) => (p.input as { tool_name?: string }).tool_name)];
    for (const name of names) {
      const m = /^mcp__(.+?)__(.+)$/.exec(String(name ?? ''));
      if (!m) continue;
      if (!this.caseTools.has(m[1])) this.caseTools.set(m[1], new Set());
      this.caseTools.get(m[1])!.add(m[2]);
    }
    await super.prepare(profile, env, secrets);
  }

  /** Stop the case's proxies. */
  async release(): Promise<void> {
    for (const session of this.sessions.values()) session.close();
    this.sessions.clear();
  }

  override async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    const d = await this.decideOne(record, payload, env);
    // The runner hands each earlier call of a chain with `prior` set to undefined.
    const isEarlier = 'prior' in record && record.prior === undefined;
    if (isEarlier && record.stage === 'post' && record.tool === 'WebFetch') {
      this.earlier.push(`earlier WebFetch result: ${d.verdict}${d.detail ? ` (${d.detail.slice(0, 120)})` : ''}`);
    }
    if (!isEarlier && this.earlier.length) {
      return { ...d, detail: [d.detail, ...this.earlier.map((e) => `[${e}]`)].filter(Boolean).join(' ') };
    }
    return d;
  }

  private async decideOne(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    const m = /^mcp__(.+?)__(.+)$/.exec(record.tool);
    if (record.stage !== 'post') {
      const hook = await super.decide(record, payload, env);
      if (!m || hook.verdict !== 'allow') return hook;
      // The call reaches the MCP server through the proxy, which may refuse it.
      const t0 = performance.now();
      const reply = await this.call(env, m[1], m[2], (payload.tool_input ?? {}) as Json, [{ type: 'text', text: 'ok' }]);
      const latencyMs = hook.latencyMs + (performance.now() - t0);
      if (!reply.error) return { ...hook, latencyMs };
      const msg = String(reply.error.message ?? '').slice(0, 240);
      const decided = /\bblocked\b|security finding|injection detected/i.test(msg);
      if (!decided && EXCHANGE_FAILURES.test(msg)) throw new Error(`pipelock mcp proxy exchange failed: ${msg}`);
      return { verdict: 'block', latencyMs, detail: `mcp proxy: ${msg || `JSON-RPC error ${reply.error.code}`}` };
    }
    if (record.tool === 'WebFetch') return this.decideFetch(payload, record, env);

    if (!m) throw new Error(`not an MCP tool name: ${record.tool}`);
    const out = materialize(record.output, env);
    const content = Array.isArray(out) ? out : [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out) }];

    const args = (payload.tool_input ?? {}) as Json;
    const t0 = performance.now();
    const reply = await this.call(env, m[1], m[2], args, content);
    const latencyMs = performance.now() - t0;

    if (reply.error) {
      const msg = String(reply.error.message ?? '').slice(0, 240);
      // A message that says pipelock blocked the response is a decision, even
      // when its reason mentions parsing (a media policy refusing a malformed
      // image, for example).
      const decided = /\bblocked\b|security finding|injection detected/i.test(msg);
      if (!decided && EXCHANGE_FAILURES.test(msg)) throw new Error(`pipelock mcp proxy exchange failed: ${msg}`);
      return { verdict: 'block', latencyMs, detail: msg || `JSON-RPC error ${reply.error.code}` };
    }
    const same = JSON.stringify(reply.result?.content) === JSON.stringify(content);
    return same ? { verdict: 'allow', latencyMs } : { verdict: 'review', latencyMs, detail: 'pipelock changed the tool result before the agent saw it' };
  }

  /** One WebFetch result through pipelock's fetch proxy, in a private network namespace. */
  private async decideFetch(payload: Record<string, unknown>, record: BenchRecord, env: Env): Promise<Decision> {
    const out = (materialize(record.output, env) ?? {}) as Json;
    const url = String(out.url ?? (payload.tool_input as Json | undefined)?.url ?? '');
    if (!/^https?:\/\//.test(url)) throw new Error(`WebFetch case without an http(s) URL: ${url.slice(0, 80)}`);
    const page = fetchPage(out, url);
    const workDir = fs.mkdtempSync(path.join(env.home, 'fetch-'));
    const specFile = path.join(workDir, 'spec.json');
    fs.writeFileSync(
      specFile,
      JSON.stringify({ bin: this.bin, config: path.join(env.home, 'pipelock.yaml'), home: env.home, url, status: page.status, contentType: page.contentType, body: page.body.toString('base64'), workDir })
    );
    const t0 = performance.now();
    const s = sandboxed('unshare', ['-rn', '-m', process.execPath, FETCH_DRIVER, specFile], { home: env.home, ro: this.nodeRo() });
    const r = spawnSync(s.cmd, s.args, { encoding: 'utf-8', timeout: FETCH_TIMEOUT_MS, env: minimalEnv(env.home) });
    const latencyMs = performance.now() - t0;
    if (r.error) throw r.error;
    let reply: Json;
    try {
      reply = JSON.parse((r.stdout ?? '').trim().split('\n').pop() ?? '');
    } catch {
      throw new Error(`fetch driver gave no answer (exit ${r.status}): ${(r.stderr ?? '').slice(0, 300)}`);
    }
    if (reply.error) throw new Error(`fetch driver: ${reply.error}`);
    return { ...fetchVerdict(reply.status, reply.body, page.body.toString('utf-8')), latencyMs };
  }

  /** pipelock's directory, plus Node.js and the stub server and fetch driver it runs. */
  private nodeRo(): string[] {
    return [...this.ro(), HERE, nodePrefix()];
  }

  /** One tools/call through the case's proxy for `server`, the stub answering with `content`. */
  private async call(env: Env, server: string, tool: string, args: Json, content: Json[]): Promise<Json> {
    let session = this.sessions.get(server);
    if (!session) {
      // A case prepared without its record (a unit test) still offers the tool it calls.
      if (!this.caseTools.has(server)) this.caseTools.set(server, new Set());
      this.caseTools.get(server)!.add(tool);
      const opened = await this.open(env, server);
      if ('failed' in opened) return opened.failed;
      session = opened.session;
      this.sessions.set(server, session);
    }
    fs.writeFileSync(session.next, JSON.stringify({ tool, content }));
    return session.request('tools/call', { name: tool, arguments: args });
  }

  /** Start `pipelock mcp proxy` around a stub offering the case's tools of `server`: initialize, then tools/list. */
  private async open(env: Env, server: string): Promise<{ session: McpSession } | { failed: Json }> {
    const dir = path.join(env.home, `stub-${server.replace(/[^A-Za-z0-9_-]/g, '_')}`);
    fs.mkdirSync(dir, { recursive: true });
    const next = path.join(dir, 'next.json');
    const caseFile = path.join(dir, 'case.json');
    const tools = [...(this.caseTools.get(server) ?? [])];
    fs.writeFileSync(caseFile, JSON.stringify({ tools, next }));
    const cfg = path.join(env.home, 'pipelock.yaml');
    const s = sandboxed(this.bin, ['mcp', 'proxy', '--config', cfg, '--', process.execPath, STUB, caseFile], { home: env.home, cwd: env.cwd, ro: this.nodeRo() });
    const child = spawn(s.cmd, s.args, {
      cwd: env.cwd,
      env: minimalEnv(env.home),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += String(d)));
    // An open proxy must not keep the process alive; a pending request's timer does.
    child.unref();
    for (const stream of [child.stdin, child.stdout, child.stderr]) (stream as unknown as { unref?: () => void }).unref?.();
    const pending = new Map<number, (msg: Json) => void>();
    readline.createInterface({ input: child.stdout }).on('line', (line) => {
      let msg: Json;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (typeof msg.id === 'number') pending.get(msg.id)?.(msg);
    });
    let id = 0;
    const request = (method: string, params: Json) =>
      new Promise<Json>((resolve) => {
        const n = ++id;
        const timer = setTimeout(() => resolve({ error: { code: -1, message: `timed out; stderr: ${stderr.slice(-200)}` } }), TIMEOUT_MS);
        pending.set(n, (msg) => {
          clearTimeout(timer);
          pending.delete(n);
          resolve(msg);
        });
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n');
      });
    const close = () => {
      child.stdin.end();
      child.kill('SIGTERM');
    };

    const init = await request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'agentverdict', version: '1.0.0' },
    });
    if (init.error) {
      close();
      return { failed: init };
    }
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const list = await request('tools/list', {});
    const listed = new Set((list.result?.tools ?? []).map((t: Json) => t.name));
    const missing = tools.filter((t) => !listed.has(t));
    if (missing.length) {
      close();
      return { failed: { error: { code: -1, message: `stub tool withheld from tools/list: ${missing.join(', ')}: ${JSON.stringify(list.error ?? list.result).slice(0, 200)}` } } };
    }
    return { session: { next, request, close } };
  }
}

/** A running `pipelock mcp proxy` for one MCP server of the current case. */
interface McpSession {
  /** Where the stub reads its next answer. */
  next: string;
  request(method: string, params: Json): Promise<Json>;
  close(): void;
}

/** The page a WebFetch result stands for: its text, or no body for a binary file the agent got no text from. */
export function fetchPage(out: Json, url: string): { status: number; contentType: string; body: Buffer } {
  const status = Number(out.code ?? 200);
  if (typeof out.result === 'string') return { status, contentType: 'text/plain; charset=utf-8', body: Buffer.from(out.result, 'utf-8') };
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  const types: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.pdf': 'application/pdf' };
  return { status, contentType: types[ext] ?? 'application/octet-stream', body: Buffer.alloc(0) };
}

const squash = (t: string) => t.replace(/\s+/g, ' ').trim();

/** pipelock's fetch-proxy answer as a verdict. */
export function fetchVerdict(status: number, text: string, served: string): { verdict: Verdict; detail?: string } {
  let j: Json | null = null;
  try {
    j = JSON.parse(text);
  } catch {
    /* handled below */
  }
  if (j && j.blocked === true) {
    const reason = String(j.block_reason ?? `HTTP ${status}`);
    // Our own site's address must never be what was refused.
    if (/203\.0\.113\.10/.test(reason)) throw new Error(`pipelock refused the benchmark's own site: ${reason.slice(0, 200)}`);
    return { verdict: 'block', detail: `fetch proxy: ${reason.slice(0, 240)}` };
  }
  // A binary page comes back with no text content: nothing to compare.
  if (status === 200 && j && j.blocked === false && (typeof j.content === 'string' || (j.content === undefined && served === ''))) {
    return squash(String(j.content ?? '')) === squash(served) ? { verdict: 'allow' } : { verdict: 'review', detail: 'fetch proxy: pipelock changed the page before the agent saw it' };
  }
  throw new Error(`fetch proxy answered HTTP ${status}: ${text.slice(0, 200)}`);
}
