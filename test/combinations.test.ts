import { test } from 'node:test';
import { hasHoldout } from '../src/split.ts';
import assert from 'node:assert/strict';
import { ACTIONS } from '../src/convert/agentdojo.ts';
import { CATEGORY_OF, PROFILE, SOURCE, convertDangerousActions } from '../src/convert/dangerous-actions.ts';
import { SUMMARY_FILE, SUMMARY_TEXT, convertNotInjectSequences } from '../src/convert/notinject-seq.ts';
import { convertNotInject } from '../src/convert/notinject.ts';
import { JAILED_SYSTEM_DIRS } from '../src/convert/profiles.ts';
import { convertRedCodeExec } from '../src/convert/redcode-exec.ts';
import { convertNl2shAlfa } from '../src/convert/nl2sh-alfa.ts';
import { convertBenignScripts } from '../src/convert/benign-scripts.ts';
import { convertPopularPackages } from '../src/convert/popular-packages.ts';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadProfiles } from '../src/corpus.ts';
import { reveal, sensitive } from '../src/hygiene.ts';
import { DANGER_CATEGORIES, type Joined } from '../src/types.ts';

test('every state-changing AgentDojo tool is classified, and every category in the list is used', () => {
  assert.deepEqual(Object.keys(CATEGORY_OF).sort(), [...ACTIONS].sort());
  const used = new Set(Object.values(CATEGORY_OF).filter((c) => c !== null));
  assert.deepEqual([...used].sort(), [...DANGER_CATEGORIES].sort());
});

test('dangerous actions: one case per distinct call, labelled by the tool alone, none with flagged content', () => {
  const cases = convertDangerousActions();
  assert.ok(cases.length >= 80 && cases.length <= 91, `${cases.length} cases`);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) {
    const fn = c.tool.replace(/^mcp__agentdojo-[a-z]+__/, '');
    const category = CATEGORY_OF[fn];
    assert.equal(c.expected, category ? 'review' : 'allow', c.id);
    assert.equal(c.setup, PROFILE);
    assert.equal(c.source, SOURCE);
    assert.equal(c.stage, 'pre');
    assert.equal(c.prior, undefined);
    const args = JSON.stringify((c.input as { tool_input: unknown }).tool_input);
    assert.equal(sensitive(args), null, `${c.id} carries flagged content`);
  }
  assert.ok(cases.some((c) => c.expected === 'review') && cases.some((c) => c.expected === 'allow'));
});

test('the ask-before-dangerous-actions profile holds every category', () => {
  const p = loadProfiles().get(PROFILE);
  assert.ok(p);
  assert.deepEqual(p.holdActions, [...DANGER_CATEGORIES]);
});

test('NotInject combination: one case per text, same group and carrier as the text-only case, then the fixed write', () => {
  const texts = convertNotInject();
  const seqs = convertNotInjectSequences();
  assert.equal(seqs.length, texts.length);
  const byGroup = new Map(texts.map((t) => [t.group, t]));
  for (const s of seqs) {
    const t = byGroup.get(s.group);
    assert.ok(t, `${s.id} has no text-only twin`);
    assert.equal(s.expected, 'allow');
    assert.equal(s.tool, 'Write');
    assert.equal(s.setup, 'exposure-org');
    assert.deepEqual((s.input as { tool_input: unknown }).tool_input, { file_path: SUMMARY_FILE, content: SUMMARY_TEXT });
    assert.equal(s.prior?.length, 1);
    assert.deepEqual(s.prior?.[0].input, t.input);
    assert.deepEqual(s.prior?.[0].output, t.output);
    assert.equal(s.private, t.private);
  }
});

test('the jailed-agent profile lists the system directories in general; RedCode runs under it, NL2SH-ALFA stays clean', () => {
  const p = loadProfiles().get('jailed-agent');
  assert.ok(p);
  assert.deepEqual(p.protectedPaths?.map((x) => x.path), JAILED_SYSTEM_DIRS);
  for (const x of p.protectedPaths ?? []) assert.deepEqual([x.scope, x.verdict], ['user', 'block']);
  assert.ok(!JAILED_SYSTEM_DIRS.includes('/home') && !JAILED_SYSTEM_DIRS.includes('/tmp') && !JAILED_SYSTEM_DIRS.includes('/'));
  for (const d of JAILED_SYSTEM_DIRS) assert.match(d, /^\/[a-z]+$/);
  for (const r of convertRedCodeExec()) assert.equal(r.setup, 'jailed-agent', r.id);
  for (const r of convertNl2shAlfa()) assert.equal(r.setup, 'clean', r.id);
});

test('benign scripts: every MBPP row and Exercism example, allow, under jailed-agent, in RedCode\'s form', () => {
  const cases = convertBenignScripts();
  const py = cases.filter((c) => c.id.startsWith('benign-scripts.py.'));
  const sh = cases.filter((c) => c.id.startsWith('benign-scripts.sh.'));
  // One case per snapshot row: 500 and 100 in the full checkout, the public rows in a public one.
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'benign-scripts', 'snapshot.json'), 'utf-8')) as { python: { rows: unknown[] }; bash: { scripts: unknown[] } };
  assert.equal(py.length, snap.python.rows.length);
  assert.equal(sh.length, snap.bash.scripts.length);
  if (hasHoldout()) assert.deepEqual([py.length, sh.length], [500, 100]);
  for (const c of cases) {
    assert.equal(c.expected, 'allow', c.id);
    assert.equal(c.setup, 'jailed-agent', c.id);
    assert.equal(c.tool, 'Bash');
    const cmd = reveal((c.input as { tool_input: { command: string | Joined } }).tool_input.command);
    if (c.id.startsWith('benign-scripts.py.')) assert.match(cmd, /^python3 - <<'PYEOF'\n[\s\S]*\nPYEOF$/);
    else assert.match(cmd, /^#!/);
  }
});

test('popular packages: the most downloaded of each registry, allow, volatile, forms in rotation, none from the hand list', () => {
  const cases = convertPopularPackages();
  const own = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'packages.json'), 'utf-8')) as { benign: Array<{ ecosystem: string; name: string }> };
  const hand = new Set(own.benign.map((b) => b.name));
  // One case per snapshot row not on the hand list: 180 to 200 in the full checkout.
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources', 'popular-packages', 'snapshot.json'), 'utf-8')) as { packages: Array<{ ecosystem: string; name: string }> };
  assert.equal(cases.length, snap.packages.filter((p) => !own.benign.some((b) => b.ecosystem === p.ecosystem && b.name === p.name)).length);
  if (hasHoldout()) assert.ok(cases.length >= 180 && cases.length <= 200, `${cases.length} cases`);
  for (const c of cases) {
    assert.equal(c.expected, 'allow', c.id);
    assert.equal(c.volatile, true);
    assert.equal(c.setup, 'clean');
    assert.ok(!hand.has(c.id.split('.').slice(2).join('.')), `${c.id} is in the hand list`);
  }
  const cmds = cases.map((c) => reveal((c.input as { tool_input: { command: string | Joined } }).tool_input.command));
  assert.ok(cmds.some((x) => x.startsWith('npm install ')) && cmds.some((x) => x.startsWith('pip install ')));
  assert.ok(cmds.some((x) => /@\d/.test(x)) && cmds.some((x) => /==\d/.test(x)), 'pinned forms present');
});
