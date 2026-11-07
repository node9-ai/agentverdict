// A stub MCP server over stdio for one benchmark case. It offers the case's
// tools of one server and answers each call with the output the runner put in
// the "next" file just before the call, so the tool under test (sitting
// between client and server) sees exactly that text come back. One stub (and
// one proxy around it) serves every step of a case. No model and no real
// service is involved.
//
//   node stub-server.mjs <case.json>
//   case.json: { "tools": ["<name>", ...], "next": "<path of next.json>" }
//   next.json: { "tool": "<name>", "content": [ { "type": "text", "text": "..." } ] }

import fs from 'node:fs';
import readline from 'node:readline';

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }
  if (req.id === undefined) return; // a notification needs no answer
  switch (req.method) {
    case 'initialize':
      send({
        id: req.id,
        result: {
          protocolVersion: req.params?.protocolVersion ?? '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'agentverdict-stub', version: '1.0.0' },
        },
      });
      break;
    case 'tools/list':
      send({
        id: req.id,
        result: { tools: spec.tools.map((name) => ({ name, description: `Benchmark stub for ${name}.`, inputSchema: { type: 'object' } })) },
      });
      break;
    case 'tools/call': {
      const next = JSON.parse(fs.readFileSync(spec.next, 'utf-8'));
      if (req.params?.name !== next.tool) send({ id: req.id, error: { code: -32602, message: `unknown tool ${req.params?.name}` } });
      else send({ id: req.id, result: { content: next.content, isError: false } });
      break;
    }
    default:
      send({ id: req.id, error: { code: -32601, message: `method not found: ${req.method}` } });
  }
});
rl.on('close', () => process.exit(0));
