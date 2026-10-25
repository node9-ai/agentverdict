// Refreshes sources/nl2sh-alfa/: the benign shell commands the converter
// builds cases from. Network access happens only here; conversion stays
// offline.
//
//   npm run sources:nl2sh-alfa
//
// NL2SH-ALFA (Westenfelder et al., "LLM-Supported Natural Language to Bash
// Translation", NAACL 2025, MIT) pairs an English task with a bash command
// that does it, and an equivalent second command. Its test split, 300 rows,
// was checked by hand by the authors. It carries no safety label: the
// commands are benign by provenance (ordinary tasks a user asks for), so the
// benchmark uses them for the interruption rate.
//
// Read from test.csv at one pinned dataset revision (50 KB). The licence text
// comes from the authors' code repository; the dataset card declares MIT.
// Every row is kept here; which commands become cases is decided in
// src/convert/nl2sh-alfa.ts, by a rule fixed before measuring.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const DATASET = 'westenfelder/NL2SH-ALFA';
const REVISION = 'a99cb5784cf5c2a42b1cc26c1903d9c3b35206ba';
const OUT = path.join(ROOT, 'sources', 'nl2sh-alfa');

/** RFC 4180 CSV: quoted fields may hold commas, quotes ("") and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const res = await fetch(`https://huggingface.co/datasets/${DATASET}/resolve/${REVISION}/test.csv`);
if (!res.ok) throw new Error(`${res.status} for test.csv`);
const [header, ...body] = parseCsv(await res.text());
const col = (name: string) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`nl2sh-alfa: no column ${name}`);
  return i;
};
const [nl, bash, bash2, difficulty] = ['nl', 'bash', 'bash2', 'difficulty'].map(col);
const rows = body
  .filter((r) => r.length === header.length)
  .map((r, index) => ({ index, nl: protect(r[nl]), bash: protect(r[bash]), bash2: protect(r[bash2]), difficulty: Number(r[difficulty]) }));
if (rows.length !== body.filter((r) => r.some((f) => f !== '')).length) throw new Error('nl2sh-alfa: malformed rows');

const licence = Buffer.from(execFileSync('gh', ['api', 'repos/westenfelder/NL2SH/license', '--jq', '.content'], { encoding: 'utf-8' }), 'base64').toString('utf-8');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), licence);
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      dataset: DATASET,
      revision: REVISION,
      file: 'test.csv',
      license: 'MIT (dataset card); licence text from github.com/westenfelder/NL2SH, next to this file',
      fetched_at: new Date().toISOString(),
      rows,
    },
    null,
    2
  ) + '\n'
);
console.log(`${rows.length} rows`);
