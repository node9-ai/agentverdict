// pipelock as a Claude Code user runs it with MCP servers: its PreToolUse hook
// for every tool call, plus `pipelock mcp proxy` wrapped around each MCP
// server, which is where pipelock scans what a tool returns.
//
//   stage pre             -> the hook, as in pipelock-hook
//   stage post, mcp__*    -> `pipelock mcp proxy --config <file> -- node stub-server.mjs`
//                            The runner acts as the MCP client: initialize,
//                            tools/list, then tools/call with the case's
//                            arguments. The stub answers with the case's
//                            recorded output, so pipelock sees exactly that
//                            text come back. No model is involved.
//   stage post, other     -> unreachable: built-in tool output (Bash, WebFetch)
//                            reaches pipelock only through its fetch or network
//                            proxy, which this adapter does not model.
//
// Verdicts for MCP output: a JSON-RPC error in place of the result is block;
// a result whose content pipelock changed (stripped or redacted) is review;
// the result passed through unchanged is allow. An error pipelock raises
// because it could not read the exchange, or because the stub's tool was
// withheld before any content was seen, is a measurement error.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import type { Decision } from '../../src/adapter.ts';
import type { BenchRecord } from '../../src/types.ts';
import { materialize, type Env } from '../../src/template.ts';
import { PipelockHookAdapter, minimalEnv } from '../pipelock-hook/index.ts';

const STUB = path.join(path.dirname(fileURLToPath(import.meta.url)), 'stub-server.mjs');
const TIMEOUT_MS = 15_000;

/** Errors that say the exchange itself failed, not that a response was judged. */
const EXCHANGE_FAILURES = /parse|malformed|unknown tool|not found|withheld|admission|config error|timed out/i;

type Json = Record<string, any>;

export class PipelockAdapter extends PipelockHookAdapter {
  override readonly name: string = 'pipelock';
  override readonly method: string;

  constructor(bin?: string) {
    super(bin);
    this.method = `pipelock ${this.toolVersion}: claude hook for PreToolUse, mcp proxy around a stub MCP server for MCP tool output; preset claude-code plus each profile translated into pipelock settings, fresh HOME per case, minimal environment`;
  }

  override unreachable(record: BenchRecord): string | null {
    const builtIn = 'built-in tool output reaches pipelock only through its fetch or network proxy, which is not modelled';
    if (record.stage === 'post' && !record.tool.startsWith('mcp__')) return builtIn;
    // A case whose verdict depends on what the agent read earlier is out of
    // reach when that earlier result came from a built-in tool: pipelock never
    // saw it, so its answer would say nothing about the exposure.
    for (const p of record.prior ?? []) {
      const tool = String((p.input as { tool_name?: string }).tool_name ?? '');
      if (p.stage === 'post' && !tool.startsWith('mcp__')) return `${builtIn} (an earlier ${tool} result)`;
    }
    return record.stage === 'pre' ? super.unreachable(record) : null;
  }

  override async decide(record: BenchRecord, payload: Record<string, unknown>, env: Env): Promise<Decision> {
    if (record.stage !== 'post') return super.decide(record, payload, env);

    const m = /^mcp__(.+?)__(.+)$/.exec(record.tool);
    if (!m) throw new Error(`not an MCP tool name: ${record.tool}`);
    const tool = m[2];
    const out = materialize(record.output, env);
    const content = Array.isArray(out) ? out : [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out) }];
    const caseFile = path.join(env.home, 'stub-case.json');
    fs.writeFileSync(caseFile, JSON.stringify({ tool, content }));

    const args = (payload.tool_input ?? {}) as Json;
    const t0 = performance.now();
    const reply = await this.exchange(env, caseFile, tool, args);
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

  /** initialize, tools/list, tools/call through `pipelock mcp proxy`; returns the tools/call reply. */
  private exchange(env: Env, caseFile: string, tool: string, args: Json): Promise<Json> {
    const cfg = path.join(env.home, 'pipelock.yaml');
    const child = spawn(this.bin, ['mcp', 'proxy', '--config', cfg, '--', process.execPath, STUB, caseFile], {
      cwd: env.cwd,
      env: minimalEnv(env.home),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += String(d)));
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
    const request = (id: number, method: string, params: Json) =>
      new Promise<Json>((resolve) => {
        pending.set(id, resolve);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });

    const run = async (): Promise<Json> => {
      const init = await request(1, 'initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'agentverdict', version: '1.0.0' },
      });
      if (init.error) return init;
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      const list = await request(2, 'tools/list', {});
      const listed = (list.result?.tools ?? []).some((t: Json) => t.name === tool);
      if (!listed) return { error: { code: -1, message: `stub tool withheld from tools/list: ${JSON.stringify(list.error ?? list.result).slice(0, 200)}` } };
      return request(3, 'tools/call', { name: tool, arguments: args });
    };

    const timeout = new Promise<Json>((resolve) =>
      setTimeout(() => resolve({ error: { code: -1, message: `timed out; stderr: ${stderr.slice(-200)}` } }), TIMEOUT_MS)
    );
    return Promise.race([run(), timeout]).finally(() => {
      child.stdin.end();
      child.kill('SIGTERM');
    });
  }
}
