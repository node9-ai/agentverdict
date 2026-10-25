// Refreshes sources/agentdojo/calls.json: the AgentDojo facts that exist only
// when its code runs (the ground-truth tool calls of every task) and the
// attack templates corpus 1.2.0 did not use. Conversion reads the snapshot and
// stays offline.
//
//   npm run sources:agentdojo-calls
//
// Needs the local clone external/agentdojo at the pinned commit and its
// Python environment external/agentdojo-venv (README, Sources). The clone's
// commit is checked against the pin before anything runs. The Python side is
// src/sources/agentdojo_extract.py: it loads the four v1 suites with their
// default environment and prints each task's ground_truth() calls. No model is
// called and nothing leaves the machine.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../corpus.ts';
import { protect } from '../hygiene.ts';
import type { Template } from '../types.ts';

const COMMIT = '089ed468cf3ed0322acc66b0211f26d9d90dbf60';
const CLONE = path.join(ROOT, 'external', 'agentdojo');
const PYTHON = path.join(ROOT, 'external', 'agentdojo-venv', 'bin', 'python');
const OUT = path.join(ROOT, 'sources', 'agentdojo', 'calls.json');

/** Every string of a JSON value stored with protect(), the rule for committed files. */
function protectDeep(v: unknown): Template {
  if (typeof v === 'string') return protect(v);
  if (Array.isArray(v)) return v.map(protectDeep);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, protectDeep(x)]));
  return v as Template;
}

const head = execFileSync('git', ['-C', CLONE, 'rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim();
if (head !== COMMIT) throw new Error(`external/agentdojo is at ${head}, expected ${COMMIT}`);

const raw = execFileSync(PYTHON, [path.join(ROOT, 'src', 'sources', 'agentdojo_extract.py')], {
  encoding: 'utf-8',
  maxBuffer: 64 * 1024 * 1024,
});
const facts = JSON.parse(raw) as { templates: Record<string, string>; suites: Record<string, unknown> };

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      repo: 'ethz-spylab/agentdojo',
      commit: COMMIT,
      license: 'MIT (see LICENSE next to this file)',
      templates: facts.templates,
      suites: protectDeep(facts.suites),
    },
    null,
    1
  ) + '\n'
);
for (const [s, v] of Object.entries(facts.suites) as Array<[string, { injection_tasks: unknown[]; user_tasks: unknown[] }]>)
  console.log(`${s}: ${v.injection_tasks.length} injection tasks, ${v.user_tasks.length} user tasks`);
console.log(`templates: ${Object.keys(facts.templates).join(', ')}`);
