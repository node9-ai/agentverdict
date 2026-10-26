// The case viewer: one static page, generated from the corpus, where anyone
// can see each case (its label, source and line, set and the reason when it
// is out of the official set) without the corpus files. No secret or
// personal value is shown: each case is summarised by the same excerpt rule
// as the gap reports (src/gaps.ts, excerpt: a credential line shows its key
// name, a document its identifier types, anything node9's detectors flag is
// withheld), and the call itself is not embedded.
//
//   npm run viewer [-- --out viewer/index.html]
//
// The page is committed (viewer/index.html) and regenerated with every
// corpus version; validate scans it like every other committed file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ROOT, loadCorpus, readCorpusVersion } from './corpus.ts';
import { excerpt } from './gaps.ts';
import { EXTENDED_REASONS } from './scope/reasons.ts';
import { labelsOf } from './suites.ts';
import type { BenchRecord } from './types.ts';

export interface ViewerRow {
  id: string;
  source: string;
  labels: string;
  channel: string;
  tool: string;
  stage: string;
  expected: string;
  why: string;
  set: string;
  section?: string;
  reason?: string;
  owasp: string;
  setup: string;
  split: 'public' | 'holdout';
  volatile?: true;
  prior?: number;
  license: string;
  ref: string;
  excerpt: string;
}

export function viewerRows(records: BenchRecord[]): ViewerRow[] {
  return records.map((r) => ({
    id: r.id,
    source: r.source,
    labels: labelsOf(r.source) ?? 'unknown',
    channel: r.channel,
    tool: r.tool,
    stage: r.stage,
    expected: r.expected,
    why: r.why,
    set: r.set,
    ...(r.section ? { section: r.section } : {}),
    ...(r.extended_reason ? { reason: r.extended_reason } : {}),
    owasp: r.owasp,
    setup: r.setup,
    split: r.private ? 'holdout' : 'public',
    ...(r.volatile ? { volatile: true as const } : {}),
    ...(r.prior?.length ? { prior: r.prior.length } : {}),
    license: r.license,
    ref: r.source_ref,
    excerpt: excerpt(r, 160),
  }));
}

export function renderViewer(version: string, rows: ViewerRow[]): string {
  const data = JSON.stringify(rows).replace(/</g, '\\u003c');
  const reasons = JSON.stringify(Object.fromEntries(Object.entries(EXTENDED_REASONS).map(([k, v]) => [k, v.definition]))).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AgentVerdict corpus ${version}: cases</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; margin: 0 auto; padding: 12px 16px; color: #222; background: #fff; max-width: 1400px; }
  h1 { font-size: 1.2rem; margin: 8px 0; }
  .filters { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin: 10px 0; }
  select, input { font-size: 0.95rem; padding: 4px 6px; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
  th, td { border-bottom: 1px solid #e3e3e3; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f4f4f4; position: sticky; top: 0; }
  td.ex { font-family: ui-monospace, monospace; white-space: pre-wrap; word-break: break-word; max-width: 46ch; }
  .muted { color: #666; font-size: 0.9rem; }
  .tag { display: inline-block; padding: 0 6px; border-radius: 8px; background: #eef; margin-right: 4px; }
  .tag.ext { background: #fee; }
  .tag.vendor { background: #efe; }
  details { margin: 8px 0; }
</style>
</head>
<body>
<h1>AgentVerdict corpus ${version}: every case</h1>
<p class="muted">Each row is one agent tool call with its expected verdict. The excerpt shows what a reader needs to place the case and never a credential or personal value (a credential line shows its key name, a document its identifier types). <b>official</b> is the benchmark (headline: outside labels; vendor: node9's and pipelock's own suites); <b>extended</b> keeps every excluded case with its reason.</p>
<details><summary>Reasons a case is out of the official set</summary><ul id="reasons"></ul></details>
<div class="filters">
  <label>Set <select id="f-set"><option value="">all</option><option value="official/headline">official, headline</option><option value="official/vendor">official, vendor</option><option value="extended">extended</option></select></label>
  <label>Reason <select id="f-reason"><option value="">all</option></select></label>
  <label>Source <select id="f-source"><option value="">all</option></select></label>
  <label>Channel <select id="f-channel"><option value="">all</option></select></label>
  <label>Verdict <select id="f-expected"><option value="">all</option><option>allow</option><option>review</option><option>block</option></select></label>
  <label>OWASP <select id="f-owasp"><option value="">all</option></select></label>
  <label>Split <select id="f-split"><option value="">all</option><option>public</option><option>holdout</option></select></label>
  <label>Search <input id="f-q" type="search" placeholder="id, tool, excerpt, why"></label>
  <span id="count" class="muted"></span>
</div>
<table><thead><tr><th>Id</th><th>Source (labels by)</th><th>Set</th><th>Channel / tool</th><th>Verdict, why</th><th>Setup</th><th>Excerpt</th><th>Source line</th></tr></thead><tbody id="rows"></tbody></table>
<p class="muted" id="more"></p>
<script>
const ROWS = ${data};
const REASONS = ${reasons};
const PAGE = 300;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function fill(id, values) { const sel = $(id); for (const v of values) { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); } }
fill('f-source', [...new Set(ROWS.map((r) => r.source))].sort());
fill('f-channel', [...new Set(ROWS.map((r) => r.channel))].sort());
fill('f-reason', Object.keys(REASONS));
fill('f-owasp', [...new Set(ROWS.map((r) => r.owasp))].sort());
for (const [k, v] of Object.entries(REASONS)) { const li = document.createElement('li'); li.innerHTML = '<code>' + esc(k) + '</code>: ' + esc(v); $('reasons').appendChild(li); }
let shown = PAGE;
function matches(r) {
  const set = $('f-set').value;
  if (set === 'extended' && r.set !== 'extended') return false;
  if (set.startsWith('official/') && (r.set !== 'official' || r.section !== set.slice(9))) return false;
  if ($('f-reason').value && r.reason !== $('f-reason').value) return false;
  if ($('f-source').value && r.source !== $('f-source').value) return false;
  if ($('f-channel').value && r.channel !== $('f-channel').value) return false;
  if ($('f-expected').value && r.expected !== $('f-expected').value) return false;
  if ($('f-split').value && r.split !== $('f-split').value) return false;
  if ($('f-owasp').value && r.owasp !== $('f-owasp').value) return false;
  const q = $('f-q').value.trim().toLowerCase();
  if (q && !(r.id + ' ' + r.tool + ' ' + r.excerpt + ' ' + r.why + ' ' + r.setup).toLowerCase().includes(q)) return false;
  return true;
}
function render() {
  const list = ROWS.filter(matches);
  $('count').textContent = list.length + ' of ' + ROWS.length + ' cases';
  const html = list.slice(0, shown).map((r) => {
    const setTag = r.set === 'official' ? '<span class="tag' + (r.section === 'vendor' ? ' vendor' : '') + '">' + esc(r.section) + '</span>' : '<span class="tag ext" title="' + esc(REASONS[r.reason] || '') + '">' + esc(r.reason) + '</span>';
    return '<tr><td><code>' + esc(r.id) + '</code></td><td>' + esc(r.source) + '<br><span class="muted">' + esc(r.labels) + '</span></td><td>' + setTag + '<br><span class="muted">' + esc(r.owasp) + '</span>' + (r.split === 'holdout' ? '<br><span class="muted">holdout</span>' : '') + (r.volatile ? '<br><span class="muted">volatile</span>' : '') + '</td><td>' + esc(r.channel) + '<br><code>' + esc(r.tool) + '</code> ' + esc(r.stage) + (r.prior ? ' (+' + r.prior + ' prior)' : '') + '</td><td><b>' + esc(r.expected) + '</b><br><span class="muted">' + esc(r.why) + '</span></td><td>' + esc(r.setup) + '</td><td class="ex">' + esc(r.excerpt) + '</td><td class="muted">' + esc(r.ref) + '<br>' + esc(r.license) + '</td></tr>';
  }).join('');
  $('rows').innerHTML = html;
  $('more').innerHTML = list.length > shown ? '<a href="#" id="more-link">show ' + Math.min(PAGE, list.length - shown) + ' more</a>' : '';
  const link = $('more-link');
  if (link) link.addEventListener('click', (e) => { e.preventDefault(); shown += PAGE; render(); });
}
for (const id of ['f-set', 'f-reason', 'f-source', 'f-channel', 'f-expected', 'f-split', 'f-owasp']) $(id).addEventListener('change', () => { shown = PAGE; render(); });
$('f-q').addEventListener('input', () => { shown = PAGE; render(); });
render();
</script>
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values } = parseArgs({ options: { out: { type: 'string' } } });
  const version = readCorpusVersion().version;
  const rows = viewerRows(loadCorpus());
  const out = values.out ?? path.join(ROOT, 'viewer', 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderViewer(version, rows));
  console.log(`${rows.length} cases -> ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}
