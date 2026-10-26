// The labelling page for the blind check (annotation/PROTOCOL.md): one
// static HTML file, generated from a sample, that shows one case at a time
// (the setting, the prior tool results, the call) and three buttons. It
// shows nothing that would reveal the label: no source, no id prefix, no
// reason, no tool's verdict. Answers are kept in the browser (localStorage)
// and exported as a JSON file of verdicts by case id, which is committed as
// annotation/answers-<annotator>.json; no case content leaves the page.
//
//   npm run annotate:page -- annotation/sample-<version>.json [--out annotation/page/<version>.html]
//
// The generated file carries materialised case content (documents, keys in
// parts joined), so it lives under annotation/page/, which git ignores.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, corpusHash, loadCorpus, loadProfiles } from '../corpus.ts';
import { materialize } from '../template.ts';
import type { BenchRecord, Profile } from '../types.ts';
import type { Sample } from './sample.ts';

const ENV = { home: '/home/user', cwd: '/home/user/project' };

interface Shown {
  n: number;
  id: string;
  setting: string;
  prior: Array<{ tool: string; input: string; output: string }>;
  stage: string;
  tool: string;
  input: string;
  output?: string;
}

const pretty = (v: unknown) => JSON.stringify(v, null, 2);
const toolInput = (payload: unknown) => (payload as { tool_input?: unknown }).tool_input;
const resultText = (v: unknown): string => {
  // Show a tool result the way the agent saw it: the text of MCP blocks, a shell's stdout, a fetch result; else the JSON.
  if (Array.isArray(v) && v.every((b) => b && typeof b === 'object' && 'text' in (b as object))) return v.map((b) => String((b as { text: unknown }).text)).join('\n');
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.stdout === 'string') return o.stdout + (typeof o.stderr === 'string' && o.stderr ? `\n[stderr]\n${o.stderr}` : '');
    if (typeof o.result === 'string') return o.result;
  }
  return pretty(v);
};

export function shownCases(sample: Sample, corpus: BenchRecord[], profiles: Map<string, Profile>): Shown[] {
  const byId = new Map(corpus.map((r) => [r.id, r]));
  return sample.cases.map((id, i) => {
    const r = byId.get(id);
    if (!r) throw new Error(`sample case ${id} is not in the corpus`);
    const profile = profiles.get(r.setup);
    if (!profile) throw new Error(`unknown profile ${r.setup}`);
    return {
      n: i + 1,
      id,
      setting: materialize(profile.description, ENV) as string,
      prior: (r.prior ?? []).map((p) => ({
        tool: String((p.input as { tool_name?: string }).tool_name ?? ''),
        input: pretty(toolInput(materialize(p.input, ENV))),
        output: p.output === undefined ? '' : resultText(materialize(p.output, ENV)),
      })),
      stage: r.stage,
      tool: r.tool,
      input: pretty(toolInput(materialize(r.input, ENV))),
      output: r.output === undefined ? undefined : resultText(materialize(r.output, ENV)),
    };
  });
}

export function renderPage(sample: Sample, cases: Shown[]): string {
  const data = JSON.stringify(cases).replace(/</g, '\\u003c');
  const key = `agentverdict-annotation-${sample.corpus_version}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AgentVerdict label check (corpus ${sample.corpus_version})</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 16px; color: #222; background: #fff; }
  h1 { font-size: 1.2rem; } h2 { font-size: 1rem; margin: 18px 0 6px; }
  pre { background: #f4f4f4; padding: 10px; overflow: auto; white-space: pre-wrap; word-break: break-word; max-height: 40vh; }
  .box { border: 1px solid #ddd; padding: 10px 14px; margin: 10px 0; }
  .prior { border-left: 4px solid #bbb; }
  .call { border-left: 4px solid #27c; }
  button { font-size: 1rem; padding: 10px 18px; margin: 6px 8px 6px 0; cursor: pointer; }
  button.chosen { outline: 3px solid #27c; }
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  .muted { color: #666; font-size: 0.9rem; }
  input[type=text] { font-size: 1rem; padding: 6px; }
</style>
</head>
<body>
<h1>AgentVerdict label check</h1>
<p class="muted">Corpus ${sample.corpus_version}, ${cases.length} cases. The question for each: <b>what should a correct guard do with this call, now?</b>
allow (let it run), review (stop and ask a person first; for a tool result, flag it), block (refuse). Keys: 1 allow, 2 review, 3 block, arrows to move. Answers stay in this browser until you export them.</p>
<div class="bar">
  <label>Your name: <input type="text" id="who" placeholder="annotator"></label>
  <span id="progress" class="muted"></span>
  <button id="export">Export answers</button>
</div>
<div id="case"></div>
<div class="bar">
  <span><button id="prev">&larr; previous</button><button id="next">next &rarr;</button></span>
  <span><button data-v="allow">1 allow</button><button data-v="review">2 review</button><button data-v="block">3 block</button></span>
</div>
<script>
const CASES = ${data};
const KEY = ${JSON.stringify(key)};
let state = { i: 0, who: '', answers: {} };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function render() {
  const c = CASES[state.i];
  const parts = [];
  parts.push('<h2>Case ' + c.n + ' of ' + CASES.length + '</h2>');
  parts.push('<div class="box"><b>Setting:</b> ' + esc(c.setting) + '</div>');
  for (const p of c.prior) {
    parts.push('<div class="box prior"><b>Earlier in the session, the agent called</b> <code>' + esc(p.tool) + '</code> with<pre>' + esc(p.input) + '</pre><b>and read this result:</b><pre>' + esc(p.output) + '</pre></div>');
  }
  parts.push('<div class="box call"><b>' + (c.stage === 'post' ? 'The call ran and returned a result. The agent called' : 'The agent is about to call') + '</b> <code>' + esc(c.tool) + '</code> with<pre>' + esc(c.input) + '</pre>' + (c.output !== undefined ? '<b>Result the agent now reads:</b><pre>' + esc(c.output) + '</pre>' : '') + '</div>');
  document.getElementById('case').innerHTML = parts.join('');
  const v = state.answers[c.id];
  for (const b of document.querySelectorAll('button[data-v]')) b.classList.toggle('chosen', b.dataset.v === v);
  const done = Object.keys(state.answers).filter((id) => CASES.some((x) => x.id === id)).length;
  document.getElementById('progress').textContent = done + ' of ' + CASES.length + ' answered';
  document.getElementById('who').value = state.who;
  window.scrollTo(0, 0);
}
function answer(v) { state.answers[CASES[state.i].id] = v; save(); if (state.i < CASES.length - 1) state.i++; render(); }
document.querySelectorAll('button[data-v]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.v)));
document.getElementById('prev').addEventListener('click', () => { state.i = Math.max(0, state.i - 1); save(); render(); });
document.getElementById('next').addEventListener('click', () => { state.i = Math.min(CASES.length - 1, state.i + 1); save(); render(); });
document.getElementById('who').addEventListener('input', (e) => { state.who = e.target.value; save(); });
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === '1') answer('allow'); else if (e.key === '2') answer('review'); else if (e.key === '3') answer('block');
  else if (e.key === 'ArrowLeft') document.getElementById('prev').click(); else if (e.key === 'ArrowRight') document.getElementById('next').click();
});
document.getElementById('export').addEventListener('click', () => {
  const out = { sample: ${JSON.stringify(`sample-${sample.corpus_version}.json`)}, corpus_version: ${JSON.stringify(sample.corpus_version)}, corpus_sha256: ${JSON.stringify(sample.corpus_sha256)}, annotator: state.who || 'annotator', exported_at: new Date().toISOString(), answers: {} };
  for (const c of CASES) if (state.answers[c.id]) out.answers[c.id] = state.answers[c.id];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2) + '\\n'], { type: 'application/json' }));
  a.download = 'answers-' + (state.who || 'annotator').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
  a.click();
});
render();
</script>
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' } } });
  if (positionals.length !== 1) {
    console.error('usage: npm run annotate:page -- annotation/sample-<version>.json [--out FILE]');
    process.exit(2);
  }
  const sample = JSON.parse(fs.readFileSync(positionals[0], 'utf-8')) as Sample;
  if (corpusHash() !== sample.corpus_sha256) throw new Error(`the sample was drawn from corpus ${sample.corpus_version}, which is not the corpus checked out`);
  const html = renderPage(sample, shownCases(sample, loadCorpus(), loadProfiles()));
  const out = values.out ?? path.join(ROOT, 'annotation', 'page', `${sample.corpus_version}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${sample.cases.length} cases -> ${path.relative(ROOT, out)} (git-ignored: it carries case content)`);
}
