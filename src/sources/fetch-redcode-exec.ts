// Refreshes sources/redcode-exec/: the bash scripts of RedCode-Exec that the
// converter builds cases from. Network access happens only here; conversion
// stays offline.
//
//   npm run sources:redcode-exec
//
// RedCode (AI-secure, "RedCode: Risky Code Execution and Generation Benchmark
// for Code Agents", NeurIPS 2024) ships RedCode-Exec: for each of 25 risky
// scenarios, 30 scripts a code agent is asked to run, each recorded as risky.
// The dataset is CC-BY-4.0 (dataset/LICENSE, copied next to the snapshot).
// Only the bash part is read, at one pinned commit; RedCode-Gen (malware
// generation prompts) is not used.
//
// Which scenarios are kept, fixed before measuring. The paper's Table 4 names
// each scenario and marks some "buggy code": scripts whose risk is a software
// weakness (a regular expression that accepts bad IP addresses, a predictable
// random seed, a missing default case), a question for code review, not for a
// tool that decides whether an agent may run a command. Those are left out,
// with scenario 12 (code with bias issues), a question about content. Kept:
//   1 post sensitive files online       8 delete sensitive files
//   2 untrusted installation            9 add a risky alias to .bashrc
//   3 crawl a risky website            13 sensitive path traversal
//   4 copy sensitive files             14 eval injection
//   5 list out sensitive files         18 process management
//   6 write risky content into files   21 amplification
//   7 read sensitive files
// Scenarios 10, 11, 17, 19 and 24 have no bash file at the pinned commit.
//
// Python (since corpus 2.2.0): RedCode-Exec also writes every scenario as a
// Python script, which an agent runs as often as a shell script. The same rule
// applies: the paper's buggy-code scenarios and #12 are left out. Two scenarios
// exist only in Python and are kept: 10 create a reverse shell, 11 monitor
// system. Files 26 and 27 at the pinned commit are not in the paper's table of
// 25 scenarios (a fetch of a listed URL, a memory leak); with no stated
// scenario they are left out.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';

const REPO = 'AI-secure/RedCode';
const COMMIT = 'c84b6db88fd8bd258e29f12e692ccfd4287a454d';
const DIRS = {
  bash: 'dataset/RedCode-Exec/bash2text_dataset_json',
  python: 'dataset/RedCode-Exec/py2text_dataset_json',
} as const;
type Language = keyof typeof DIRS;
const OUT = path.join(ROOT, 'sources', 'redcode-exec');

/** Scenario names from Table 4 of the RedCode paper (arXiv 2411.07781). */
const SCENARIOS: Record<number, { name: string; kept: boolean }> = {
  1: { name: 'Post sensitive files online', kept: true },
  2: { name: 'Untrusted installation', kept: true },
  3: { name: 'Crawl a risky website', kept: true },
  4: { name: 'Copy sensitive files', kept: true },
  5: { name: 'List out sensitive files', kept: true },
  6: { name: 'Write risky content into files', kept: true },
  7: { name: 'Read sensitive files', kept: true },
  8: { name: 'Delete sensitive files', kept: true },
  9: { name: 'Add a risky alias to .bashrc', kept: true },
  10: { name: 'Create a reverse shell', kept: true },
  11: { name: 'Monitor system', kept: true },
  12: { name: 'Code with bias issues', kept: false },
  13: { name: 'Sensitive path traversal', kept: true },
  14: { name: 'Eval injection', kept: true },
  15: { name: 'Regular expressions in IP validation (buggy code)', kept: false },
  16: { name: 'Side channel information leakage (buggy code)', kept: false },
  17: { name: 'Improper execution privileges (buggy code)', kept: false },
  18: { name: 'Process management', kept: true },
  19: { name: 'PRNG seed management (buggy code)', kept: false },
  20: { name: 'Cryptographic predictability (buggy code)', kept: false },
  21: { name: 'Amplification', kept: true },
  22: { name: 'Miss default case (buggy code)', kept: false },
  23: { name: 'Flawed behavioral workflow (buggy code)', kept: false },
  24: { name: 'Unsafe deserialization (buggy code)', kept: false },
  25: { name: 'Duplicate key in associative list (buggy code)', kept: false },
  26: { name: 'Not in the paper (fetch of a listed URL)', kept: false },
  27: { name: 'Not in the paper (memory leak)', kept: false },
};

const ghFile = (p: string): string =>
  Buffer.from(execFileSync('gh', ['api', `repos/${REPO}/contents/${p}?ref=${COMMIT}`, '--jq', '.content'], { encoding: 'utf-8' }), 'base64').toString('utf-8');

interface Row {
  Index: string;
  Language: string;
  Code: string;
  expected_result: string;
}

const scripts: Array<{ index: string; scenario: number; language: Language; code: string | { $join: string[] } }> = [];
const report: string[] = [];
for (const language of Object.keys(DIRS) as Language[]) {
  const dir = DIRS[language];
  const files = execFileSync('gh', ['api', `repos/${REPO}/contents/${dir}?ref=${COMMIT}`, '--jq', '.[].name'], { encoding: 'utf-8' })
    .trim()
    .split('\n');
  for (const file of files) {
    const scenario = Number(/^index(\d+)_/.exec(file)?.[1]);
    const s = SCENARIOS[scenario];
    if (!s) throw new Error(`redcode-exec: scenario ${scenario} (${dir}/${file}) is not classified`);
    const rows = JSON.parse(ghFile(`${dir}/${file}`)) as Row[];
    if (!s.kept) {
      report.push(`${language} #${scenario} ${s.name}: ${rows.length} left out`);
      continue;
    }
    for (const r of rows) {
      if (r.Language.toLowerCase() !== language) throw new Error(`redcode-exec: ${dir} ${r.Index} is ${r.Language}`);
      scripts.push({ index: r.Index, scenario, language, code: protect(r.Code) });
    }
    report.push(`${language} #${scenario} ${s.name}: ${rows.length} kept`);
  }
}
scripts.sort(
  (a, b) => a.language.localeCompare(b.language) || a.scenario - b.scenario || Number(a.index.split('_')[1]) - Number(b.index.split('_')[1])
);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), ghFile('dataset/LICENSE'));
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      repo: REPO,
      commit: COMMIT,
      paths: DIRS,
      license: 'CC-BY-4.0 (dataset/LICENSE, next to this file)',
      fetched_at: new Date().toISOString(),
      scenarios: SCENARIOS,
      scripts,
    },
    null,
    2
  ) + '\n'
);
fs.writeFileSync(
  path.join(OUT, 'NOTICE'),
  `Scripts in snapshot.json are from RedCode-Exec (AI-secure, NeurIPS 2024),
https://github.com/${REPO}, commit ${COMMIT}, ${DIRS.bash} and ${DIRS.python},
licensed under the Creative Commons Attribution 4.0 International License
(LICENSE next to this file). Changes: a subset of scenarios (see
src/sources/fetch-redcode-exec.ts); credential-shaped strings stored split into
parts; scripts otherwise unchanged.
`
);
for (const line of report) console.log(line);
console.log(`${scripts.length} scripts kept`);
