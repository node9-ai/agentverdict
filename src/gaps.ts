// Where a tool is weak: every miss (an attack it let through) and every false
// positive (an ordinary action it stopped), per source, grouped so a reader
// sees a few dozen groups with examples instead of thousands of cases.
//
//   npm run gaps -- <run> [--split public|holdout|all] [--examples N] [--out FILE]
//
// <run> is a result directory, as in report and compare. The default split is
// public: the holdout is not read while looking for what to fix, so it can
// still tell whether a fix generalises.
//
// A group is the case's family (CredData's category, RedCode's scenario, the
// PII type, the injection template ...). False positives are grouped by family
// and by the rule the tool named, so one noisy rule shows as one row.
// Examples show a short excerpt of the call; anything node9's own detectors
// flag as a credential or personal data is withheld, so the output can be
// committed.
//
// This is the mechanical half of a gap analysis. Deciding why a group is
// missed (a general fix, a source's wording, not decidable from the call, or
// a decision already taken) is the other half, done by a person.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadCorpus, readJsonl } from './corpus.ts';
import { sensitive, reveal } from './hygiene.ts';
import { labelsOf } from './suites.ts';
import { resolveRun } from './compare.ts';
import type { BenchRecord, CaseResult, Joined } from './types.ts';

export type Split = 'public' | 'holdout' | 'all';

const stopped = (v: CaseResult['actual']) => v === 'review' || v === 'block';
const measured = (r: CaseResult) => r.actual !== 'unreachable' && r.actual !== 'error';
const isAttack = (r: { expected: string }) => r.expected !== 'allow';

/** The rule a tool named in its reason, or the reason's first words. */
export function ruleOf(detail: string | undefined): string {
  if (!detail) return '(no reason given)';
  const bracket = /\[([^\]\n]{3,80})\]/.exec(detail);
  if (bracket) return bracket[1];
  return detail.replace(/\s+/g, ' ').trim().slice(0, 60);
}

function text(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && Array.isArray((v as Joined).$join)) return reveal(v as Joined);
  return JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && Array.isArray(x.$join) ? reveal(x) : x));
}

/** The text inside a tool result's usual wrappers ({type:text,text}, {stdout}). */
function innerText(v: unknown): string {
  const t = text(v);
  const m = /"(?:text|stdout|content)"\s*:\s*"((?:[^"\\]|\\.){0,2000})/.exec(t);
  return m ? m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"') : t;
}

/**
 * A one-line excerpt of what the tool saw, safe to commit:
 *  - a credential case shows the line up to its value (the key name and the
 *    file), never the value;
 *  - a personal-data case shows which identifier types the document carries,
 *    never the document;
 *  - anything else is shown as is, unless node9's detectors flag it.
 */
export function excerpt(r: BenchRecord, max = 90): string {
  const input = (r.input as { tool_input?: Record<string, unknown> }).tool_input ?? {};
  let s: string;
  if (r.channel === 'pii' || (r.channel === 'secrets' && /identifiers?:/.test(r.note ?? ''))) {
    s = (r.note ?? '').split(';')[0] || '(document)';
  } else if (r.channel === 'secrets' && typeof input.content !== 'undefined') {
    const line = text(input.content).replace(/\s+/g, ' ').trim();
    const head = /^(.{0,80}?(?:=>|:=|=|:)\s*)["'`]?/.exec(line);
    const file = input.file_path === undefined ? r.tool : text(input.file_path).replace('{{CWD}}/', '');
    s = `${file}: ${head ? `${head[1]}<value>` : '<line not shown>'}`;
  } else if (r.stage === 'post' && r.output !== undefined) s = `${r.tool} result: ${innerText(r.output)}`;
  else if (typeof input.command !== 'undefined') s = text(input.command);
  else s = `${r.tool} ${text(input)}`;
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > max) s = `${s.slice(0, max - 3)}...`;
  return sensitive(s) ? '(excerpt withheld: it carries a credential or personal data)' : s;
}

export interface Group {
  key: string;
  count: number;
  examples: { id: string; excerpt: string }[];
}

export interface SourceGaps {
  source: string;
  labels: string;
  attacks: number;
  missed: Group[];
  missedTotal: number;
  benign: number;
  falsePositives: Group[];
  falsePositiveTotal: number;
}

function group(items: { key: string; rec: BenchRecord }[], examples: number): Group[] {
  const m = new Map<string, Group>();
  for (const { key, rec } of items) {
    const g = m.get(key) ?? { key, count: 0, examples: [] };
    g.count++;
    if (g.examples.length < examples) g.examples.push({ id: rec.id, excerpt: excerpt(rec) });
    m.set(key, g);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function findGaps(results: CaseResult[], corpus: BenchRecord[], split: Split, examples = 3): SourceGaps[] {
  const byId = new Map(corpus.map((r) => [r.id, r]));
  const keep = (r: CaseResult) => split === 'all' || r.private === (split === 'holdout');
  const per = new Map<string, { recs: { res: CaseResult; rec: BenchRecord }[] }>();
  for (const res of results) {
    const rec = byId.get(res.id);
    if (!rec || !keep(res) || !measured(res)) continue;
    const e = per.get(rec.source) ?? { recs: [] };
    e.recs.push({ res, rec });
    per.set(rec.source, e);
  }
  const out: SourceGaps[] = [];
  for (const [source, { recs }] of per) {
    const attacks = recs.filter((x) => isAttack(x.res));
    const benign = recs.filter((x) => !isAttack(x.res));
    const missed = attacks.filter((x) => !stopped(x.res.actual));
    const fps = benign.filter((x) => stopped(x.res.actual));
    out.push({
      source,
      labels: labelsOf(source) ?? 'unknown',
      attacks: attacks.length,
      missed: group(
        missed.map((x) => ({ key: x.rec.family, rec: x.rec })),
        examples
      ),
      missedTotal: missed.length,
      benign: benign.length,
      falsePositives: group(
        fps.map((x) => ({ key: `${x.rec.family} | ${ruleOf(x.res.detail)}`, rec: x.rec })),
        examples
      ),
      falsePositiveTotal: fps.length,
    });
  }
  const rank = (l: string) => (l === 'outside' ? 0 : l === 'competitor' ? 1 : 2);
  return out.sort((a, b) => rank(a.labels) - rank(b.labels) || b.missedTotal + b.falsePositiveTotal - (a.missedTotal + a.falsePositiveTotal));
}

const cell = (s: string) => s.replace(/\|/g, '\\|');

export function renderGaps(title: string, gaps: SourceGaps[]): string {
  const L: string[] = [`# ${title}`, ''];
  L.push('| Source | Labels by | Attacks missed | Benign stopped |', '|---|---|---:|---:|');
  for (const g of gaps) L.push(`| ${g.source} | ${g.labels} | ${g.missedTotal}/${g.attacks} | ${g.falsePositiveTotal}/${g.benign} |`);
  L.push('');
  for (const g of gaps) {
    if (g.missedTotal === 0 && g.falsePositiveTotal === 0) continue;
    L.push(`## ${g.source} (${g.labels} labels)`, '');
    if (g.missedTotal > 0) {
      L.push(`Missed ${g.missedTotal} of ${g.attacks} attacks.`, '', '| Group | Missed | Examples |', '|---|---:|---|');
      for (const x of g.missed) L.push(`| ${cell(x.key)} | ${x.count} | ${x.examples.map((e) => `\`${e.id}\`: ${cell(e.excerpt)}`).join('<br>')} |`);
      L.push('');
    }
    if (g.falsePositiveTotal > 0) {
      L.push(`Stopped ${g.falsePositiveTotal} of ${g.benign} benign cases.`, '', '| Group, rule | Stopped | Examples |', '|---|---:|---|');
      for (const x of g.falsePositives) L.push(`| ${cell(x.key)} | ${x.count} | ${x.examples.map((e) => `\`${e.id}\`: ${cell(e.excerpt)}`).join('<br>')} |`);
      L.push('');
    }
  }
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { split: { type: 'string', default: 'public' }, examples: { type: 'string', default: '3' }, out: { type: 'string' } },
  });
  const split = values.split as Split;
  if (positionals.length !== 1 || !['public', 'holdout', 'all'].includes(split)) {
    console.error('usage: npm run gaps -- <run> [--split public|holdout|all] [--examples N] [--out FILE]');
    process.exit(2);
  }
  const dir = resolveRun(positionals[0]);
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as { adapter: string; tool_version: string; corpus_version: string };
  const gaps = findGaps(readJsonl<CaseResult>(path.join(dir, 'cases.jsonl')), loadCorpus(), split, Number(values.examples));
  const md = renderGaps(`Gaps: ${summary.adapter} ${summary.tool_version} on corpus ${summary.corpus_version}, ${split} split`, gaps);
  if (values.out) fs.writeFileSync(values.out, md + '\n');
  console.log(md);
}
