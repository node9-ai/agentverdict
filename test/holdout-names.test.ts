// No public source, test or document may name a held-out case: a case id
// written in the public tree says which cases are held out. Runs only in a
// full build (the holdout present); in the public checkout there is nothing
// to compare against. Held-out names belong in the holdout repository's
// names.json (src/holdout/names.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadCorpus } from '../src/corpus.ts';
import { hasHoldout } from '../src/split.ts';

/** The files a public checkout carries besides the corpus and the snapshots, which the holdout cut already covers. */
function publicTextFiles(): string[] {
  const out: string[] = [];
  const skip = new Set(['node_modules', '.git', 'external', 'results', 'corpus', 'sources', 'page']);
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|mjs|js|json|md|cff|html|yml)$/.test(e.name)) out.push(p);
    }
  };
  walk(ROOT);
  return out;
}

test('no public file names a held-out case', { skip: !hasHoldout() && 'needs the holdout (a full build)' }, () => {
  const corpus = loadCorpus();
  const publicNames = new Set<string>();
  for (const r of corpus) if (!r.private) for (const n of [r.id, r.id.split('.').slice(1).join('.'), r.group]) publicNames.add(n);
  // A held-out case's id and its id without the source prefix (the upstream
  // record id), when no public case shares them.
  const held = new Map<string, string>();
  for (const r of corpus) {
    if (!r.private) continue;
    for (const n of [r.id, r.id.split('.').slice(1).join('.')]) if (n.length >= 8 && !publicNames.has(n)) held.set(n, r.id);
  }
  const found: string[] = [];
  for (const f of publicTextFiles()) {
    const text = fs.readFileSync(f, 'utf-8');
    for (const [name, id] of held) {
      let i = text.indexOf(name);
      while (i >= 0) {
        const before = text[i - 1];
        const after = text[i + name.length];
        if (!(before && /[\w-]/.test(before)) && !(after && /[\w-]/.test(after))) {
          found.push(`${path.relative(ROOT, f)}: ${name} (${id})`);
          break;
        }
        i = text.indexOf(name, i + 1);
      }
    }
  }
  assert.deepEqual(found, [], 'held-out case names in public files');
});
