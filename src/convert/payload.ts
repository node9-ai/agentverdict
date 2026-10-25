// Hook payload builders. The envelopes copy the field set of node9-proxy's
// captured fixtures (src/__tests__/fixtures/gate-inputs/*.json): real payloads
// recorded from live agent sessions, ids normalised. Only `tool_name`,
// `tool_input` and `cwd` vary per case.
//
// Tool results (`output`) use the shapes Claude Code itself records for each
// tool, measured from the key sets of `toolUseResult` in local transcripts
// (Bash {stdout, stderr, interrupted, isImage, noOutputExpected}; WebFetch
// {bytes, code, codeText, durationMs, result, url}; MCP an array of
// {type: "text", text} blocks). No transcript value was copied.

import type { Template } from '../types.ts';

const SESSION = '00000000-0000-4000-8000-000000000001';

export function claudePre(tool: string, toolInput: Template, cwd = '{{CWD}}'): Template {
  return {
    session_id: SESSION,
    transcript_path: `{{HOME}}/.claude/projects/-bench/${SESSION}.jsonl`,
    cwd,
    prompt_id: SESSION,
    permission_mode: 'bypassPermissions',
    effort: { level: 'high' },
    hook_event_name: 'PreToolUse',
    tool_name: tool,
    tool_input: toolInput,
    tool_use_id: 'toolu_bench_0001',
  };
}

/**
 * A PostToolUse payload without its `tool_response`: the record keeps the tool
 * result in `output` and the adapter attaches it, so the result is stored once.
 */
export function claudePost(tool: string, toolInput: Template, cwd = '{{CWD}}'): Template {
  const p = claudePre(tool, toolInput, cwd) as Record<string, Template>;
  return { ...p, hook_event_name: 'PostToolUse' };
}

export const claudeOutput = {
  bash: (stdout: Template): Template => ({
    stdout,
    stderr: '',
    interrupted: false,
    isImage: false,
    noOutputExpected: false,
  }),
  webFetch: (url: string, result: Template): Template => ({
    bytes: 2048,
    code: 200,
    codeText: 'OK',
    durationMs: 412,
    result,
    url,
  }),
  mcpText: (text: Template): Template => [{ type: 'text', text }],
};
