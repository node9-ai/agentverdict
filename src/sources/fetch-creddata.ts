// Refreshes sources/creddata/: a deterministic sample of labelled lines from
// Samsung CredData (https://github.com/Samsung/CredData), the one outside
// source of real-world secret and non-secret lines with a published verdict.
//
//   npm run sources:creddata
//
// Offline. It needs the layout external/MANIFEST.md describes (the CredData
// checkout at the pinned commit, selected.tsv, the chosen repositories
// fetched under CredData/tmp/, a Python venv with pybase62) and runs
// src/sources/creddata_extract.py first, which applies CredData's own file
// selection and obfuscation to the chosen repositories only. Everything this
// script reads is the obfuscated copy under external/creddata/work/data/.
//
// Labels are Samsung's GroundTruth: T (a credential) becomes block, F (looks
// like one, is not) becomes allow, X (undecided) is left out. Rules fixed
// before any tool was measured on these lines:
//   - repositories: N chosen at random (a salted hash order) among those
//     under an open licence with at least one T line and at most MAX_KB on
//     GitHub, by src/sources/select-creddata-repos.ts (npm run
//     sources:creddata-repos), which also commits every candidate and why it
//     was or was not chosen to sources/creddata/repositories.tsv. Until
//     corpus 3.0.0: the 60 smallest such repositories;
//   - a T line is used only if CredData's obfuscate_creds.py rewrote its
//     value (it leaves multi-pattern categories and informational patterns
//     alone), and no line of a case may share its range with an X row or an
//     unobfuscated T row; an F line may share its range with F rows only;
//   - blank lines, lines over MAX_CHARS, lines with control characters and
//     texts that appear under both labels are left out;
//   - at most PER_REPO lines per label per repository, chosen by a salted
//     hash, so one large repository cannot dominate.
// Nothing here prints a line's content; the output is counts.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect, reveal } from '../hygiene.ts';
import { drawSecret } from './selection-salt.ts';
import { HELD_EXTRA, checkPool, selectionSalt, wantsHeldExtra, writeHeldExtra } from './held-extra.ts';
import { metaById, spanOf } from './fetch-creddata-spans.ts';
import { noticeOf } from './fetch-creddata-notices.ts';

const PIN = '0b1940e171725ad8937311120b191602608a4801';
const PER_REPO = 30;
const MAX_CHARS = 4000;
const EXTERNAL = path.join(ROOT, 'external', 'creddata');
const WORK = path.join(EXTERNAL, 'work');
const OUT = path.join(ROOT, 'sources', 'creddata');

interface Repo {
  repo: string;
  url: string;
  commit: string;
  license: string;
  size_kb: number;
}
interface Row {
  id: number;
  repo: string;
  file_id: string;
  path: string;
  line_start: number;
  line_end: number;
  label: 'T' | 'F' | 'X';
  category: string;
  pattern: string;
  changed: boolean;
  obfuscated: boolean;
}
interface Line extends Row {
  text: string;
  rank: string;
}

const rank = (x: string) => createHash('sha256').update(`node9-bench/creddata/v1:${x}`).digest('hex');

/**
 * The sampling rules above, over one extraction (index.json and the obfuscated
 * files under `work`): every eligible line, one per text, at most PER_REPO per
 * label per repository in the order `rankOf` gives. The held-out draw runs the
 * same rules with a secret order (--held-extra below).
 */
function sample(index: { repos: Repo[]; rows: Row[] }, work: string, rankOf: (x: string) => string) {
  const byFile = new Map<string, Row[]>();
  for (const r of index.rows) {
    const xs = byFile.get(r.path) ?? [];
    xs.push(r);
    byFile.set(r.path, xs);
  }
  const overlaps = (a: Row, b: Row) => a.line_start <= b.line_end && b.line_start <= a.line_end;

  const candidates: Line[] = [];
  const leftOut = { unobfuscated: 0, shared_range: 0, blank: 0, long: 0, control: 0, both_labels: 0, x: 0 };
  for (const [file, rows] of byFile) {
    const lines = fs.readFileSync(path.join(work, file), 'utf-8').split('\n');
    for (const r of rows) {
      if (r.label === 'X') {
        leftOut.x++;
        continue;
      }
      const others = rows.filter((o) => o !== r && overlaps(o, r));
      if (r.label === 'T' && !r.obfuscated) {
        leftOut.unobfuscated++;
        continue;
      }
      const clean = r.label === 'T' ? others.every((o) => o.label === 'F' || (o.label === 'T' && o.obfuscated)) : others.every((o) => o.label === 'F');
      if (!clean) {
        leftOut.shared_range++;
        continue;
      }
      const text = lines.slice(r.line_start - 1, r.line_end).join('\n');
      if (text.trim() === '') leftOut.blank++;
      else if (text.length > MAX_CHARS) leftOut.long++;
      else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) leftOut.control++;
      else candidates.push({ ...r, text, rank: rankOf(`${r.repo}:${r.file_id}:${r.line_start}`) });
    }
  }

  // One text, one label: a text that CredData labels T somewhere and F elsewhere
  // (or twice under one label) is kept once, or not at all when the labels differ.
  const byText = new Map<string, Line[]>();
  for (const c of candidates) {
    const xs = byText.get(c.text) ?? [];
    xs.push(c);
    byText.set(c.text, xs);
  }
  const unique: Line[] = [];
  for (const xs of byText.values()) {
    if (new Set(xs.map((x) => x.label)).size > 1) {
      leftOut.both_labels += xs.length;
      continue;
    }
    unique.push(xs.sort((a, b) => a.rank.localeCompare(b.rank))[0]);
  }

  const kept: Line[] = [];
  const perRepo = index.repos.map((repo) => {
    const mine = unique.filter((l) => l.repo === repo.repo).sort((a, b) => a.rank.localeCompare(b.rank));
    const t = mine.filter((l) => l.label === 'T').slice(0, PER_REPO);
    const f = mine.filter((l) => l.label === 'F').slice(0, PER_REPO);
    kept.push(...t, ...f);
    const all = index.rows.filter((r) => r.repo === repo.repo);
    return {
      ...repo,
      t_labelled: all.filter((r) => r.label === 'T').length,
      f_labelled: all.filter((r) => r.label === 'F').length,
      x_labelled: all.filter((r) => r.label === 'X').length,
      t_eligible: mine.filter((l) => l.label === 'T').length,
      f_eligible: mine.filter((l) => l.label === 'F').length,
      t_kept: t.length,
      f_kept: f.length,
    };
  });
  return { kept, perRepo, leftOut, unique };
}

const emit = (l: Line) => ({
  id: l.id,
  repo: l.repo,
  file_id: l.file_id,
  // CredData's anonymised path, relative to the repository: <scope>/<file id>.<ext>
  path: l.path.replace(/^data\/[0-9a-f]{8}\//, ''),
  line_start: l.line_start,
  line_end: l.line_end,
  category: l.category,
  pattern: l.pattern,
  content: protect(l.text),
});
const byRepoThenRank = (a: Line, b: Line) => a.repo.localeCompare(b.repo) || a.rank.localeCompare(b.rank);

if (wantsHeldExtra()) {
  // The held-out draw of corpus 7.0.0: repositories the sample did not take,
  // chosen in secret among the eligible ones (sources/creddata/repositories.tsv),
  // fetched and obfuscated in a work folder of their own, sampled by the same
  // rules in a secret order. Their lines, value positions and notices go into
  // the snapshot's held-out rows and held_extra only; the public files
  // (repositories.tsv, value-spans.json, REPOSITORY-NOTICES.md) are untouched.
  const salt = selectionSalt();
  const want = HELD_EXTRA.creddata;
  const snapFile = path.join(OUT, 'snapshot.json');
  const snap = JSON.parse(fs.readFileSync(snapFile, 'utf-8')) as {
    repos: Array<{ repo: string }>;
    block: Array<{ id: number; content: unknown }>;
    allow: Array<{ id: number; content: unknown }>;
  };
  const takenIds = new Set([...snap.block, ...snap.allow].map((l) => String(l.id)));
  // The converter writes a line to `{{CWD}}/<path without "_/">`, and src/dedupe.ts
  // counts two calls as one when the path and the content agree line by line,
  // trimmed: a drawn line that would be such a copy is skipped here, so every
  // drawn line makes a case.
  const callKeyOf = (p: string, text: string) => `${p.replace(/^_\//, '')}\n${text.split('\n').map((x) => x.trim()).join('\n')}`;
  const takenKeys = new Set([...snap.block, ...snap.allow].map((l) => callKeyOf((l as unknown as { path: string }).path, reveal(l.content as never))));
  const takenRepos = new Set(snap.repos.map((r) => r.repo));
  const [head, ...tsv] = fs.readFileSync(path.join(OUT, 'repositories.tsv'), 'utf-8').trim().split('\n').map((l) => l.split('\t'));
  const col = (n: string) => head.indexOf(n);
  const eligible = tsv
    .filter((r) => r[col('not_eligible_because')] === '' && r[col('chosen')] !== 'yes' && !takenRepos.has(r[col('crc')]))
    .map((r) => ({ repo_id: r[col('repo_id')], url: r[col('url')], crc: r[col('crc')], license: r[col('licence')], size_kb: Number(r[col('size_kb')]) }));
  const order = drawSecret(eligible, (r) => r.repo_id, eligible.length, salt, 'creddata:repos');
  const HELD_WORK = path.join(EXTERNAL, 'work-held');
  const SELECTED_HELD = path.join(EXTERNAL, 'selected-held.tsv');
  const TMP = path.join(EXTERNAL, 'CredData', 'tmp');
  const BATCH = 8;
  const secretRank = (x: string) => createHash('sha256').update(`${salt}:creddata:lines:${x}`).digest('hex');
  const chosen: typeof eligible = [];
  const fetched: string[] = [];
  let pool: Line[] = [];
  let stats: ReturnType<typeof sample>['perRepo'] = [];
  const count = (label: string) => pool.filter((l) => l.label === label).length;
  try {
    // A margin over the counts, since a few lines are copies of each other (see callKeyOf).
    while (count('T') < want.T * 1.05 || count('F') < want.F * 1.05) {
      const next = order.slice(chosen.length, chosen.length + BATCH);
      if (next.length === 0) throw new Error(`creddata: eligible repositories ran out at ${count('T')} T and ${count('F')} F lines`);
      for (const r of next) {
        const dir = path.join(TMP, r.repo_id);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          fetched.push(dir);
          const git = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'] });
          git(['init', '-q']);
          git(['config', 'advice.detachedHead', 'false']);
          git(['remote', 'add', 'origin', r.url]);
          git(['fetch', '-q', '--depth', '1', 'origin', r.repo_id.slice(0, 40)]);
          git(['checkout', '-q', r.repo_id.slice(0, 40)]);
        }
        chosen.push(r);
      }
      fs.writeFileSync(SELECTED_HELD, chosen.map((r) => [r.repo_id, r.url, r.crc, r.license, r.size_kb].join('\t')).join('\n') + '\n');
      execFileSync(path.join(EXTERNAL, 'venv', 'bin', 'python'), [path.join(ROOT, 'src', 'sources', 'creddata_extract.py')], {
        stdio: 'inherit',
        env: { ...process.env, CREDDATA_WORK: HELD_WORK, CREDDATA_SELECTED: SELECTED_HELD },
      });
      const idx = JSON.parse(fs.readFileSync(path.join(HELD_WORK, 'index.json'), 'utf-8')) as { repos: Repo[]; rows: Row[] };
      const out = sample(idx, HELD_WORK, secretRank);
      pool = out.kept.filter((l) => !takenIds.has(String(l.id)) && !takenKeys.has(callKeyOf(emit(l).path, l.text)));
      stats = out.perRepo;
      console.log(`held-out draw: ${chosen.length} repositories, ${count('T')} T and ${count('F')} F lines available`);
    }
    checkPool('creddata', 'repositories', eligible.length, chosen.length);
    // The counts are cases; each line is one case.
    const seenKeys = new Set<string>();
    const pick = (label: 'T' | 'F', n: number) => {
      const out: Line[] = [];
      for (const l of pool.filter((x) => x.label === label).sort((a, b) => a.rank.localeCompare(b.rank))) {
        if (out.length === n) break;
        const k = callKeyOf(emit(l).path, l.text);
        if (seenKeys.has(k)) continue;
        seenKeys.add(k);
        out.push(l);
      }
      if (out.length < n) throw new Error(`creddata ${label}: ${out.length} distinct lines, ${n} wanted`);
      return out;
    };
    const lines = [...pick('T', want.T), ...pick('F', want.F)];
    const used = new Set(lines.map((l) => l.repo));
    const content = (l: Line) => l.text;
    const block = lines.filter((l) => l.label === 'T').sort(byRepoThenRank).map((l) => {
      const meta = metaById(l.repo).get(String(l.id));
      if (!meta) throw new Error(`creddata: no meta row for a drawn line of ${l.repo}`);
      return { ...emit(l), value_span: spanOf(meta, content(l)) };
    });
    const allow = lines.filter((l) => l.label === 'F').sort(byRepoThenRank).map(emit);
    // Per repository: kept counts after the final cut to the drawn numbers.
    const newRepos = stats
      .filter((r) => used.has(r.repo))
      .map((r) => ({ ...r, t_kept: lines.filter((l) => l.repo === r.repo && l.label === 'T').length, f_kept: lines.filter((l) => l.repo === r.repo && l.label === 'F').length }));
    snap.repos.push(...(newRepos as never[]));
    snap.block.push(...(block as never[]));
    snap.allow.push(...(allow as never[]));
    writeHeldExtra(
      'creddata',
      snapFile,
      snap as unknown as Record<string, unknown>,
      {
        rule:
          'eligible repositories the sample did not take, in sha256(selection salt:creddata:repos:repo_id) order, fetched in batches until enough lines; the sample rules, lines in sha256(selection salt:creddata:lines:repo:file:line) order; lines whose id or text the snapshot already has left out; then the first lines per label in that order',
        drawn: { ...want },
        pool: { eligible_repositories: eligible.length, fetched_repositories: chosen.length, repositories_used: newRepos.length },
        notices: newRepos.flatMap((r) => noticeOf(r)),
        repositories: newRepos.map((r) => r.repo),
      } as never,
      [...new Set(lines.map((l) => `creddata.${l.repo}.${l.file_id}`))]
    );
    console.log(`held-out draw: ${block.length} block, ${allow.length} allow lines from ${newRepos.length} repositories`);
  } finally {
    // The fetched repositories and CredData's obfuscated copies hold real
    // values (X-labelled and unlabelled lines): deleted as in external/MANIFEST.md.
    for (const dir of fetched) fs.rmSync(dir, { recursive: true, force: true });
    for (const p of ['data', 'log.txt', 'tmp']) fs.rmSync(path.join(HELD_WORK, p), { recursive: true, force: true });
  }
  process.exit(0);
}

execFileSync(path.join(EXTERNAL, 'venv', 'bin', 'python'), [path.join(ROOT, 'src', 'sources', 'creddata_extract.py')], { stdio: 'inherit' });

const index = JSON.parse(fs.readFileSync(path.join(WORK, 'index.json'), 'utf-8')) as { repos: Repo[]; rows: Row[] };
const { kept, perRepo, leftOut, unique } = sample(index, WORK, rank);


fs.mkdirSync(OUT, { recursive: true });
const license = fs.readFileSync(path.join(EXTERNAL, 'CredData', 'LICENSE'), 'utf-8');
if (!/Apache License/.test(license)) throw new Error('CredData LICENSE is not the Apache License as expected');
fs.writeFileSync(path.join(OUT, 'LICENSE'), license);
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  'Lines in snapshot.json are from CredData by Samsung, https://github.com/Samsung/CredData,\n' +
    `at commit ${PIN}. CredData's metadata and scripts are licensed under the\n` +
    'Apache License 2.0 (LICENSE next to this file). Each line of content keeps the licence of\n' +
    'the repository it came from; that repository, its commit and its licence are recorded in\n' +
    'snapshot.json (repos). Only repositories under MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause,\n' +
    'ISC, 0BSD, Unlicense or CC0-1.0 were used.\n' +
    "Changes: a sample of the lines CredData's meta/ labels, at the positions it records; every\n" +
    "value CredData labels as a credential was replaced by CredData's own obfuscate_creds.py\n" +
    '(shape-preserving random values), so no line holds a real credential; file paths are\n' +
    "CredData's anonymised paths. Lines labelled T became block cases, F allow cases, X were\n" +
    'left out.\n'
);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      dataset: 'Samsung/CredData',
      revision: PIN,
      license: "Apache-2.0 for CredData's metadata and scripts; each line keeps its repository's licence (repos[].license); see NOTICE and LICENSE next to this file",
      fetched_at: new Date().toISOString(),
      rule: {
        labels: { T: 'block', F: 'allow', X: 'left out' },
        repositories:
          '100 chosen by sha256("node9-bench/creddata/repos/v2:<repo_id>") order among those under MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense or CC0-1.0 with at least one T line and at most 100 MB on GitHub (sources/creddata/repositories.tsv)',
        per_repo_cap: PER_REPO,
        max_chars: MAX_CHARS,
        left_out:
          "a T line obfuscate_creds.py did not rewrite (multi-pattern categories, informational patterns); a line sharing its range with an X row or an unobfuscated T row (F lines: with any non-F row); blank lines; lines over max_chars; lines with control characters; a text labelled both T and F",
      },
      repos: perRepo,
      block: kept.filter((l) => l.label === 'T').sort(byRepoThenRank).map(emit),
      allow: kept.filter((l) => l.label === 'F').sort(byRepoThenRank).map(emit),
    },
    null,
    1
  ) + '\n'
);

const n = (label: string) => kept.filter((l) => l.label === label).length;
const e = (label: string) => unique.filter((l) => l.label === label).length;
console.log(
  `creddata: ${index.rows.length} labelled rows in ${index.repos.length} repositories; eligible ${e('T')} T, ${e('F')} F; ` +
    `kept ${n('T')} block + ${n('F')} allow (cap ${PER_REPO} per label per repository); left out ${JSON.stringify(leftOut)}`
);
