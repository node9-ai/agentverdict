// Hand-written lines that name a held-out case live in the holdout
// repository, never in this public tree: a case id written here would say
// which cases are held out. This module reads them from
// `<holdout dir>/names.json` when the holdout is present (a full build);
// in the public checkout the file is absent and every list is empty, which
// is right, since the held-out cases are absent too.
//
//   names.json: {
//     "documentationExampleCases": ["<case id>", ...],   (src/scope/rules.ts)
//     "asbV5": { "<record id>": <CASES_V5 line>, ... }     (src/convert/agentic-security-benchmark.ts)
//   }
//
// test/holdout-names.test.ts fails, in a full build, on any public source
// or test file that names a held-out case.

import fs from 'node:fs';
import path from 'node:path';
import { HOLDOUT_DIR } from '../split.ts';

export interface HoldoutNames {
  documentationExampleCases: string[];
  asbV5: Record<string, unknown>;
}

export const NAMES_FILE = path.join(HOLDOUT_DIR, 'names.json');

export function holdoutNames(): HoldoutNames {
  if (!fs.existsSync(NAMES_FILE)) return { documentationExampleCases: [], asbV5: {} };
  const j = JSON.parse(fs.readFileSync(NAMES_FILE, 'utf-8')) as Partial<HoldoutNames>;
  return { documentationExampleCases: j.documentationExampleCases ?? [], asbV5: j.asbV5 ?? {} };
}
