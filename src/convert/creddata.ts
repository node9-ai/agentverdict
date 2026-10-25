// Source: sources/creddata/ (refresh with npm run sources:creddata), a sample
// of labelled lines from Samsung CredData, obfuscated by CredData's own script
// and chosen by the rule in src/sources/fetch-creddata.ts.
//
// Carrier: the agent writes a file that contains the labelled line, with the
// Claude Code Write tool, under CredData's anonymised path for that file. A
// line Samsung labels T (a credential) is a block; a line labelled F (a
// string its scanner flagged that is not a credential: a hash, a placeholder,
// an example, a public identifier) is an allow. The licence of a case is the
// licence of the repository its line came from.

import fs from 'node:fs';
import path from 'node:path';
import { claudePre } from './payload.ts';
import { mk, slug } from './record.ts';
import { ROOT } from '../corpus.ts';
import { TAG } from '../scope/pii-types.ts';
import type { BenchRecord, Joined, Verdict } from '../types.ts';

interface Repo {
  repo: string;
  url: string;
  commit: string;
  license: string;
}
interface Line {
  id: number;
  repo: string;
  file_id: string;
  path: string;
  line_start: number;
  line_end: number;
  category: string;
  pattern: string;
  content: string | Joined;
}
interface Snapshot {
  dataset: string;
  revision: string;
  repos: Repo[];
  block: Line[];
  allow: Line[];
}

export function convertCredData(): BenchRecord[] {
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'creddata', 'snapshot.json'), 'utf-8')) as Snapshot;
  const repos = new Map(snap.repos.map((r) => [r.repo, r]));
  const rev = snap.revision.slice(0, 7);
  const out: BenchRecord[] = [];
  const emit = (l: Line, expected: Verdict) => {
    const repo = repos.get(l.repo)!;
    // CredData puts files it cannot place in a scope under "_": drop that segment.
    const file = l.path.replace(/^_\//, '');
    const kind = expected === 'block' ? 'credential' : 'lookalike';
    const lines = l.line_end !== l.line_start ? `${l.line_start}-${l.line_end}` : `${l.line_start}`;
    out.push(
      mk({
        id: `creddata.${kind}.${l.repo}-${l.file_id}-l${lines}`,
        channel: 'secrets',
        tool: 'Write',
        input: claudePre('Write', { file_path: `{{CWD}}/${file}`, content: l.content }),
        setup: 'clean',
        expected,
        why: expected === 'block' ? 'credential_written_to_file' : 'not_a_credential',
        family: expected === 'block' ? `creddata_${slug(l.category.split(':')[0])}` : 'creddata_lookalike',
        group: `creddata.${l.repo}.${l.file_id}`,
        source: 'creddata',
        source_ref: `${snap.dataset}@${rev} meta/${l.repo}.csv Id ${l.id} (${l.path}:${lines})`,
        license: repo.license,
        // CredData's own categories of the line ("Password:Secret" lists two); the scope rules read them.
        tags: l.category.split(':').map((c) => TAG.creddata(c)),
        note: `CredData ${expected === 'block' ? 'T' : 'F'}, category ${l.category}${l.pattern ? `, pattern ${l.pattern}` : ''}; from ${repo.url} at ${repo.commit.slice(0, 7)} (${repo.license}); value obfuscated by CredData`,
      })
    );
  };
  for (const l of snap.block) emit(l, 'block');
  for (const l of snap.allow) emit(l, 'allow');
  return out;
}
