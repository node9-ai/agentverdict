// Recompute the per-suite section, the comparison score and the headline
// score of committed summaries from their own cases.jsonl, without running
// any tool again. Only summary.json (the `suites`, `comparison` and
// `headline` fields) and summary.md are rewritten; cases.jsonl, the measured numbers and every other summary field
// stay as they were.
//
//   npm run resummarize
//
// Needed once for results written before suites, label origins or sets
// existed, and again whenever suites.ts regroups or reclassifies sources or
// the scope rules move a category.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJsonl } from './corpus.ts';
import { summarizeComparison, summarizeHeadline, summarizeSuites, toMarkdown, type Summary } from './score.ts';
import { originsFromCorpus, withOrigins } from './compare.ts';
import type { CaseResult } from './types.ts';

const origins = originsFromCorpus();
const resultsRoot = path.join(ROOT, 'results');
let n = 0;
for (const adapter of fs.readdirSync(resultsRoot)) {
  const adir = path.join(resultsRoot, adapter);
  if (!fs.statSync(adir).isDirectory()) continue;
  for (const version of fs.readdirSync(adir)) {
    // Candidate builds (version+commit) and partial runs are git-ignored scratch; leave them.
    if (version.includes('+') || version === 'partial') continue;
    const vdir = path.join(adir, version);
    for (const corpus of fs.readdirSync(vdir).filter((d) => d.startsWith('corpus-'))) {
      const dir = path.join(vdir, corpus);
      const casesFile = path.join(dir, 'cases.jsonl');
      if (!fs.existsSync(casesFile)) continue;
      const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf-8')) as Summary;
      const cases = withOrigins(readJsonl<CaseResult>(casesFile), origins);
      summary.suites = summarizeSuites(cases);
      summary.comparison = summarizeComparison(cases);
      summary.headline = summarizeHeadline(cases);
      fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
      fs.writeFileSync(path.join(dir, 'summary.md'), toMarkdown(summary) + '\n');
      console.log(path.relative(ROOT, dir));
      n++;
    }
  }
}
console.log(`${n} summaries updated`);
