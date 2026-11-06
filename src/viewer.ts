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
import { COMPETITOR_MAKERS, LABEL_RULES, labelsOf } from './suites.ts';
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

/** Where an outside source's cases come from (the README's credits). */
const ORIGIN: Record<string, Array<[string, string]>> = {
  creddata: [['Samsung CredData', 'https://github.com/Samsung/CredData']],
  'redcode-exec': [['RedCode', 'https://github.com/AI-secure/RedCode']],
  browsesafe: [['BrowseSafe-Bench', 'https://huggingface.co/datasets/perplexity-ai/browsesafe-bench']],
  'nemotron-pii': [['Nemotron-PII', 'https://huggingface.co/datasets/nvidia/Nemotron-PII']],
  'gretel-pii-finance': [['Gretel synthetic PII finance', 'https://huggingface.co/datasets/gretelai/synthetic_pii_finance_multilingual']],
  openpii: [['OpenPII 1M', 'https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1m']],
  'agent-guard-bench': [['agent-guard-bench', 'https://github.com/CASEY-OS/agent-guard-bench']],
  'benign-scripts': [['MBPP', 'https://huggingface.co/datasets/google-research-datasets/mbpp'], ['Exercism Bash', 'https://github.com/exercism/bash']],
  'nl2sh-alfa': [['NL2SH-ALFA', 'https://huggingface.co/datasets/westenfelder/NL2SH-ALFA']],
  agentdojo: [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'agentdojo-calls': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'agentdojo-seq': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'dangerous-actions': [['AgentDojo', 'https://github.com/ethz-spylab/agentdojo']],
  'pii-trace': [['PII-TRACE', 'https://huggingface.co/datasets/perplexity-ai/PII-TRACE']],
  notinject: [['NotInject', 'https://huggingface.co/datasets/leolee99/NotInject']],
  'notinject-seq': [['NotInject', 'https://huggingface.co/datasets/leolee99/NotInject']],
  injecagent: [['InjecAgent', 'https://github.com/uiuc-kang-lab/InjecAgent']],
  'popular-packages': [['top-pypi-packages', 'https://github.com/hugovk/top-pypi-packages'], ['npm download counts', 'https://github.com/npm/registry/blob/main/docs/download-counts.md']],
  'agent-egress-bench': [['agent-egress-bench', 'https://github.com/luckyPipewrench/agent-egress-bench']],
  'osv-other-ecosystems': [['OpenSSF malicious-packages', 'https://github.com/ossf/malicious-packages']],
  'osv-malicious-packages': [['OpenSSF malicious-packages', 'https://github.com/ossf/malicious-packages']],
  'agentic-security-benchmark': [['agentic-security-benchmark', 'https://github.com/gitayg/agentic-security-benchmark']],
  'datadog-packages': [['DataDog malicious-software-packages', 'https://github.com/DataDog/malicious-software-packages-dataset']],
  typomind: [['typomind', 'https://github.com/ldklab/typomind-release']],
};

/** Who set a source's expected answers, in words. */
function answerBy(source: string, labels: string): string {
  if (labels === 'node9') return 'node9 (a tool maker)';
  if (labels === 'competitor') return `a tool maker (${COMPETITOR_MAKERS[source] ?? source})`;
  return LABEL_RULES[source]?.rule === 'mapped' ? "AgentVerdict's rule over the source" : 'the source itself';
}

/** Rows as columns of indexes into one string table: the page carries each repeated string once. */
const PACKED = ['id', 'source', 'channel', 'tool', 'stage', 'expected', 'why', 'set', 'section', 'reason', 'owasp', 'setup', 'split', 'license', 'ref', 'excerpt'] as const;
function pack(rows: ViewerRow[]): { strings: string[]; rows: Array<Array<number>> } {
  const strings: string[] = [];
  const index = new Map<string, number>();
  const at = (v: string | undefined) => {
    const k = v ?? '';
    let i = index.get(k);
    if (i === undefined) { i = strings.length; strings.push(k); index.set(k, i); }
    return i;
  };
  return { strings, rows: rows.map((r) => [...PACKED.map((k) => at(r[k] as string | undefined)), r.prior ?? 0, r.volatile ? 1 : 0]) };
}

export function renderViewer(version: string, rows: ViewerRow[]): string {
  const json = (x: unknown) => JSON.stringify(x).replace(/</g, '\\u003c');
  const sources = [...new Set(rows.map((r) => r.source))];
  const meta = Object.fromEntries(sources.map((s) => [s, {
    by: answerBy(s, rows.find((r) => r.source === s)?.labels ?? 'outside'),
    rule: LABEL_RULES[s]?.rule === 'mapped' ? (LABEL_RULES[s] as { mapping: string }).mapping : '',
    origin: (ORIGIN[s] ?? []).map(([name, url]) => ({ name, url })),
  }]));
  const reasons = Object.fromEntries(Object.entries(EXTENDED_REASONS).map(([k, v]) => [k, v.definition]));
  const packed = pack(rows);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgentVerdict cases</title>
<style>
:root {
  --bg: #f4f4f5; --surface: #ffffff; --muted-bg: #f4f4f5; --border: #e4e4e7;
  --text: #18181b; --muted: #71717a; --accent: #2563eb; --accent-soft: rgba(37,99,235,0.1);
  --stop: #dc2626; --stop-soft: rgba(220,38,38,0.1); --ask: #b45309; --ask-soft: rgba(180,83,9,0.12); --pass: #16a34a; --pass-soft: rgba(22,163,74,0.12);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #09090b; --surface: #18181b; --muted-bg: #27272a; --border: #27272a;
    --text: #fafafa; --muted: #a1a1aa; --accent: #60a5fa; --accent-soft: rgba(96,165,250,0.12);
    --stop: #f87171; --stop-soft: rgba(248,113,113,0.14); --ask: #fbbf24; --ask-soft: rgba(251,191,36,0.14); --pass: #4ade80; --pass-soft: rgba(74,222,128,0.14);
  }
}
:root[data-theme="dark"] {
  --bg: #09090b; --surface: #18181b; --muted-bg: #27272a; --border: #27272a;
  --text: #fafafa; --muted: #a1a1aa; --accent: #60a5fa; --accent-soft: rgba(96,165,250,0.12);
  --stop: #f87171; --stop-soft: rgba(248,113,113,0.14); --ask: #fbbf24; --ask-soft: rgba(251,191,36,0.14); --pass: #4ade80; --pass-soft: rgba(74,222,128,0.14);
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 Inter, system-ui, -apple-system, "Segoe UI", sans-serif; }
.wrap { max-width: 980px; margin: 0 auto; padding: 0 16px 80px; }
header { padding: 44px 0 18px; }
.eyebrow { color: var(--accent); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; }
.eyebrow a { color: inherit; text-decoration: none; }
h1 { font-size: clamp(1.7rem, 4vw, 2.3rem); line-height: 1.15; margin: 8px 0 12px; letter-spacing: -0.02em; }
.lede { color: var(--muted); max-width: 720px; margin: 0; }
.facts { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; padding: 0; list-style: none; }
.facts li { background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 5px 13px; font-size: 0.84rem; font-weight: 600; }
.legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 22px 0 0; }
.legend div { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; font-size: 0.86rem; color: var(--muted); }
.legend b { color: var(--text); display: block; margin-bottom: 2px; }
.panel { position: sticky; top: 0; z-index: 2; background: var(--bg); padding: 12px 0 10px; border-bottom: 1px solid var(--border); margin-top: 24px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0; }
.row .lbl { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); width: 74px; }
.chip { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 999px; padding: 4px 11px; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
.chip .n { color: var(--muted); font-weight: 500; margin-left: 4px; }
.chip[aria-pressed="true"] .n { color: rgba(255,255,255,0.8); }
select, input[type=search] { font: inherit; font-size: 0.85rem; padding: 5px 9px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface); color: var(--text); max-width: 100%; }
input[type=search] { flex: 1 1 220px; }
.count { color: var(--muted); font-size: 0.85rem; margin: 14px 0 10px; }
.cards { display: grid; gap: 10px; }
.case { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
.case .top { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.badge { font-size: 0.72rem; font-weight: 800; border-radius: 6px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.badge.block { background: var(--stop-soft); color: var(--stop); }
.badge.review { background: var(--ask-soft); color: var(--ask); }
.badge.allow { background: var(--pass-soft); color: var(--pass); }
.pill { font-size: 0.75rem; font-weight: 600; color: var(--muted); background: var(--muted-bg); border-radius: 6px; padding: 2px 8px; }
.pill.out { color: var(--ask); background: var(--ask-soft); }
.what { font-weight: 600; margin: 0 0 6px; }
.ex { font: 0.82rem/1.5 "JetBrains Mono", "Fira Code", ui-monospace, monospace; background: var(--muted-bg); border-radius: 8px; padding: 8px 10px; white-space: pre-wrap; word-break: break-word; margin: 0 0 8px; }
.meta { font-size: 0.82rem; color: var(--muted); display: grid; gap: 2px; }
.meta a { color: var(--accent); }
.id { font: 0.74rem "JetBrains Mono", ui-monospace, monospace; color: var(--muted); word-break: break-all; }
details.rule summary { cursor: pointer; }
#more { display: block; margin: 18px auto 0; }
.reasons li { margin: 4px 0; font-size: 0.88rem; color: var(--muted); }
.reasons code { color: var(--text); }
</style>
</head>
<body>
<div class="wrap">
<header>
  <div class="eyebrow"><a href="https://github.com/node9-ai/agentverdict">AgentVerdict</a> &middot; corpus ${version}</div>
  <h1>Every case, in the open</h1>
  <p class="lede">Each card is one tool call a coding agent makes, as Claude Code hands it to a guard, with the answer a good guard should give and who set that answer. No credential or personal value is shown: a credential line shows its key name, a document the kinds of identifiers it holds.</p>
  <ul class="facts" id="facts"></ul>
  <div class="legend">
    <div><b>Stop</b>The call does harm; a guard should block it.</div>
    <div><b>Ask a person</b>The call may be fine, but a person should approve it first.</div>
    <div><b>Let through</b>Ordinary work; stopping it is a false alarm, and it counts as hard as a miss.</div>
  </div>
</header>

<div class="panel">
  <div class="row"><span class="lbl">Area</span><span id="f-channel"></span></div>
  <div class="row"><span class="lbl">Answer</span><span id="f-expected"></span></div>
  <div class="row"><span class="lbl">Counts</span><span id="f-set"></span></div>
  <div class="row"><span class="lbl">Find</span><select id="f-source" aria-label="Source"></select><select id="f-owasp" aria-label="OWASP risk"></select><input id="f-q" type="search" placeholder="Search: a command, a file, a package, an id"></div>
</div>

<p class="count" id="count"></p>
<div class="cards" id="cards"></div>
<button class="chip" id="more" hidden></button>

<section>
  <h2 style="font-size:1.1rem;margin-top:40px">Why a case is left out of the score</h2>
  <ul class="reasons" id="reasons"></ul>
</section>
</div>
<script>
const PACKED = ${json(PACKED)};
const STR = ${json(packed.strings)};
const RAW = ${json(packed.rows)};
const META = ${json(meta)};
const REASONS = ${json(reasons)};
const ROWS = RAW.map((a) => { const r = {}; PACKED.forEach((k, i) => { r[k] = STR[a[i]]; }); r.prior = a[PACKED.length]; r.volatile = a[PACKED.length + 1] === 1; return r; });
const ORDER = { headline: 0, vendor: 1, extended: 2 };
ROWS.sort((x, y) => ORDER[x.set === 'official' ? x.section : 'extended'] - ORDER[y.set === 'official' ? y.section : 'extended']);
const PAGE = 60;
const AREAS = { secrets: 'Secrets', pii: 'Personal data', shell: 'Commands', package: 'Packages', injection: 'Poisoned content', egress: 'Data leaving', mcp: 'MCP tools' };
const ANSWERS = { block: 'Stop', review: 'Ask a person', allow: 'Let through' };
const SETS = { headline: 'In the score', vendor: "A maker's suite", extended: 'Left out' };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const setOf = (r) => (r.set === 'official' ? r.section : 'extended');
const state = { channel: '', expected: '', set: '', source: '', owasp: '', q: '' };
// Filters from the address (?owasp=ASI01&channel=shell...), so a link can open a filtered view.
const PARAMS = new URLSearchParams(location.search);
for (const k of Object.keys(state)) if (PARAMS.has(k)) state[k] = k === 'q' ? PARAMS.get(k).trim().toLowerCase() : PARAMS.get(k);
function syncUrl() {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) if (v) p.set(k, v);
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}
let shown = PAGE;
const n = (x) => x.toLocaleString('en-US');

$('facts').innerHTML = [n(ROWS.length) + ' cases', Object.keys(META).length + ' sources', n(ROWS.filter((r) => setOf(r) === 'headline').length) + ' in the score'].map((x) => '<li>' + x + '</li>').join('');
function chips(id, key, labels) {
  const counts = {};
  for (const r of ROWS) { const v = key === 'set' ? setOf(r) : r[key]; counts[v] = (counts[v] || 0) + 1; }
  const keys = Object.keys(labels).filter((k) => counts[k]);
  $(id).innerHTML = ['<button class="chip" data-v="" aria-pressed="' + (state[key] === '') + '">All</button>'].concat(keys.map((k) => '<button class="chip" data-v="' + k + '" aria-pressed="' + (state[key] === k) + '">' + esc(labels[k]) + '<span class="n">' + n(counts[k]) + '</span></button>')).join('');
  for (const b of $(id).querySelectorAll('button')) b.onclick = () => { state[key] = b.dataset.v; shown = PAGE; chips(id, key, labels); render(); };
}
chips('f-channel', 'channel', AREAS);
chips('f-expected', 'expected', ANSWERS);
chips('f-set', 'set', SETS);
function options(id, key, first, label) {
  const vals = [...new Set(ROWS.map((r) => r[key]))].sort();
  $(id).innerHTML = '<option value="">' + first + '</option>' + vals.map((v) => '<option value="' + esc(v) + '">' + esc(label(v)) + '</option>').join('');
  $(id).value = state[key];
  $(id).onchange = () => { state[key] = $(id).value; shown = PAGE; render(); };
}
options('f-source', 'source', 'Every source', (v) => (META[v] && META[v].origin.length ? META[v].origin[0].name : v));
options('f-owasp', 'owasp', 'Every OWASP risk', (v) => v);
$('f-q').value = state.q;
$('f-q').oninput = () => { state.q = $('f-q').value.trim().toLowerCase(); shown = PAGE; render(); };
$('reasons').innerHTML = Object.entries(REASONS).map(([k, v]) => '<li><code>' + esc(k) + '</code>: ' + esc(v) + '</li>').join('');

function matches(r) {
  if (state.channel && r.channel !== state.channel) return false;
  if (state.expected && r.expected !== state.expected) return false;
  if (state.set && setOf(r) !== state.set) return false;
  if (state.source && r.source !== state.source) return false;
  if (state.owasp && r.owasp !== state.owasp) return false;
  if (state.q && !(r.id + ' ' + r.tool + ' ' + r.excerpt + ' ' + r.why + ' ' + r.source).toLowerCase().includes(state.q)) return false;
  return true;
}
function card(r) {
  const m = META[r.source] || { by: '', rule: '', origin: [] };
  const where = r.stage === 'post' ? 'what ' + esc(r.tool) + ' returned' : esc(r.tool) + ', before it runs';
  const set = setOf(r);
  const setPill = set === 'extended' ? '<span class="pill out" title="' + esc(REASONS[r.reason] || '') + '">Left out: ' + esc(r.reason) + '</span>' : '<span class="pill">' + esc(SETS[set]) + '</span>';
  const origin = m.origin.length ? m.origin.map((o) => '<a href="' + esc(o.url) + '">' + esc(o.name) + '</a>').join(', ') : esc(r.source);
  return '<article class="case"><div class="top"><span class="badge ' + r.expected + '">' + ANSWERS[r.expected] + '</span><span class="pill">' + esc(AREAS[r.channel] || r.channel) + '</span>' + setPill + '<span class="pill">' + esc(r.owasp) + '</span>' + (r.split === 'holdout' ? '<span class="pill">held out</span>' : '') + (r.volatile ? '<span class="pill" title="depends on a live registry">live registry</span>' : '') + '</div>' +
    '<p class="what">' + where + (r.prior ? ' <span class="pill">after ' + r.prior + ' earlier call' + (r.prior > 1 ? 's' : '') + '</span>' : '') + '</p>' +
    (r.excerpt ? '<pre class="ex">' + esc(r.excerpt.replace(/\{\{HOME\}\}/g, '~').replace(/\{\{CWD\}\}/g, '~/project')) + '</pre>' : '') +
    '<div class="meta"><div>Why: ' + esc(r.why.replace(/_/g, ' ')) + (r.setup && r.setup !== 'clean' ? ' &middot; setting: ' + esc(r.setup) : '') + '</div>' +
    '<div>Source: ' + origin + ' &middot; answer set by ' + esc(m.by) + (m.rule ? ' <details class="rule"><summary>the rule</summary>' + esc(m.rule) + '</details>' : '') + '</div>' +
    '<div class="id">' + esc(r.id) + ' &middot; ' + esc(r.ref) + ' &middot; ' + esc(r.license) + '</div></div></article>';
}
function render() {
  const list = ROWS.filter(matches);
  $('count').textContent = n(list.length) + ' of ' + n(ROWS.length) + ' cases';
  $('cards').innerHTML = list.slice(0, shown).map(card).join('');
  const left = list.length - shown;
  $('more').hidden = left <= 0;
  $('more').textContent = 'Show ' + Math.min(PAGE, left) + ' more';
  syncUrl();
}
$('more').onclick = () => { shown += PAGE; render(); };
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
