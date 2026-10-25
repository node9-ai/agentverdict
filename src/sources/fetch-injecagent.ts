// Refreshes sources/injecagent/: the InjecAgent test cases the converter
// builds cases from. Network access happens only here; conversion stays
// offline.
//
//   npm run sources:injecagent
//
// InjecAgent (UIUC Kang lab, "InjecAgent: Benchmarking Indirect Prompt
// Injections in Tool-Integrated LLM Agents", ACL Findings 2024, MIT) gives,
// for 17 user tools, the result such a tool returns with an attacker's
// instruction placed inside it. Two attack types: direct harm (dh: the
// instruction asks for a harmful action) and data stealing (ds: it asks to
// read private data and send it to the attacker). Two settings: base, and
// enhanced, which prefixes a fixed "hacking prompt". Every case is an attack;
// the dataset has no benign results, and none are built here.
//
// Sample, fixed before measuring: the base cases of each attack type in the
// order of a salted hash of their position, first PER_TYPE kept, each with
// its enhanced twin (same position; checked to be the same case).

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import type { Template } from '../types.ts';

const REPO = 'uiuc-kang-lab/InjecAgent';
const COMMIT = 'f19c9f2c79a41046eb13c03c51a24c567a8ffa07';
const PER_TYPE = 60;
const SALT = 'node9-bench:injecagent:v1';
const OUT = path.join(ROOT, 'sources', 'injecagent');

interface Row {
  'User Tool': string;
  'Tool Parameters': string;
  'Tool Response': string;
  'Attacker Tools': string[];
  'Attacker Instruction': string;
  'Attack Type': string;
}

const raw = (p: string): string =>
  execFileSync('curl', ['-sfL', `https://raw.githubusercontent.com/${REPO}/${COMMIT}/${p}`], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });

/** Tool Parameters are written as a Python dict literal; the simple ones read as JSON once quoted. */
function params(text: string): Template | null {
  for (const candidate of [text, text.replace(/'/g, '"')]) {
    try {
      const v = JSON.parse(candidate) as unknown;
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Template;
    } catch {
      // try the next reading
    }
  }
  return null;
}

const rank = (s: string) => createHash('sha256').update(`${SALT}:${s}`).digest('hex');
const cases: Array<Record<string, Template>> = [];
let unparsed = 0;
for (const type of ['dh', 'ds'] as const) {
  const base = JSON.parse(raw(`data/test_cases_${type}_base.json`)) as Row[];
  const enhanced = JSON.parse(raw(`data/test_cases_${type}_enhanced.json`)) as Row[];
  if (base.length !== enhanced.length) throw new Error(`injecagent: ${type} base and enhanced differ in length`);
  const order = base.map((_, i) => i).sort((a, b) => (rank(`${type}:${a}`) < rank(`${type}:${b}`) ? -1 : 1));
  for (const i of order.slice(0, PER_TYPE)) {
    const b = base[i];
    const e = enhanced[i];
    if (b['User Tool'] !== e['User Tool'] || b['Attacker Instruction'] !== e['Attacker Instruction'])
      throw new Error(`injecagent: ${type} case ${i} is not the same in base and enhanced`);
    const p = params(b['Tool Parameters']);
    if (!p) unparsed++;
    cases.push({
      type,
      position: i,
      user_tool: b['User Tool'],
      tool_parameters: p ?? {},
      attacker_tools: b['Attacker Tools'],
      attack_type: b['Attack Type'],
      base: protect(b['Tool Response']),
      enhanced: protect(e['Tool Response']),
    });
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'LICENSE'), raw('LICENCE'));
fs.writeFileSync(
  path.join(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      repo: REPO,
      commit: COMMIT,
      license: 'MIT (LICENSE next to this file)',
      sample: `first ${PER_TYPE} base cases per attack type in sha256("${SALT}:<type>:<position>") order, with their enhanced twins`,
      fetched_at: new Date().toISOString(),
      cases,
    },
    null,
    1
  ) + '\n'
);
console.log(`${cases.length} cases kept (${unparsed} with parameters that did not parse, stored as {})`);
