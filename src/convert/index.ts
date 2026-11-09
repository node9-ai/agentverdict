// Regenerates corpus/*.jsonl and profiles/*.json from the snapshots in
// sources/ (node9's own cases included, as rows in sources/node9-bench/,
// written by npm run sources:node9-bench from the fixtures in sources/node9/
// and the benchmark's own lists). Offline and
// deterministic: running it twice produces byte-identical files, so a diff
// after a run is a real change in a source.

import fs from 'node:fs';
import path from 'node:path';
import { CORPUS_DIR, PROFILES_DIR, checkRecords, writeJsonl } from '../corpus.ts';
import { CHANNELS, type BenchRecord, type Profile } from '../types.ts';
import { convertNode9Bench } from './node9-bench.ts';
import { convertPackages } from './packages.ts';
import { convertAgentDojo, convertAgentDojoCalls, convertAgentDojoTemplates } from './agentdojo.ts';
import { convertNotInject } from './notinject.ts';
import { convertNemotronPii } from './nemotron-pii.ts';
import { convertAgentEgressBench } from './agent-egress-bench.ts';
import { convertRedCodeExec } from './redcode-exec.ts';
import { convertNl2shAlfa } from './nl2sh-alfa.ts';
import { convertBrowseSafe } from './browsesafe.ts';
import { convertInjecAgent } from './injecagent.ts';
import { convertPiiSets } from './pii-sets.ts';
import { convertPackagesMore } from './packages-more.ts';
import { convertCredData } from './creddata.ts';
import { convertAgentDojoSequences } from './agentdojo-seq.ts';
import { convertAgentDojoAgents } from './agentdojo-agents.ts';
import { convertPackagesBenignMore } from './packages-benign-more.ts';
import { convertDangerousActions } from './dangerous-actions.ts';
import { convertNotInjectSequences } from './notinject-seq.ts';
import { convertBenignScripts } from './benign-scripts.ts';
import { convertPopularPackages } from './popular-packages.ts';
import { convertAgentGuardBench } from './agent-guard-bench.ts';
import { convertAgenticSecurityBenchmark } from './agentic-security-benchmark.ts';
import { buildProfiles } from './profiles.ts';
import { dropDuplicates } from '../dedupe.ts';
import { applyScope, scopeCounts } from '../scope/rules.ts';

async function main(): Promise<void> {
  const profiles = await buildProfiles();
  const built: BenchRecord[] = [
    ...convertNode9Bench('legit'),
    ...convertNode9Bench('gauntlet'),
    ...convertNode9Bench('egress'),
    ...convertNode9Bench('dlp'),
    ...convertNode9Bench('injection'),
    ...convertNode9Bench('tokens'),
    ...convertPackages(),
    ...convertAgentDojo(),
    ...convertNotInject(),
    ...convertNemotronPii(),
    ...convertAgentEgressBench(),
    ...convertAgentDojoTemplates(),
    ...convertAgentDojoCalls(),
    ...convertRedCodeExec(),
    ...convertNl2shAlfa(),
    ...convertBrowseSafe(),
    ...convertInjecAgent(),
    ...convertPiiSets(),
    ...convertPackagesMore(),
    ...convertCredData(),
    ...convertAgentDojoSequences(),
    ...convertAgentDojoAgents(),
    ...convertNode9Bench('exposure'),
    ...convertPackagesBenignMore(),
    ...convertNode9Bench('system-ops'),
    ...convertDangerousActions(),
    ...convertNotInjectSequences(),
    ...convertBenignScripts(),
    ...convertPopularPackages(),
    ...convertAgentGuardBench(),
    ...convertAgenticSecurityBenchmark(),
  ];
  const { records, sets } = dropDuplicates(built);
  applyScope(records);

  const byName = new Map<string, Profile>(profiles.map((p) => [p.name, p]));
  const problems = checkRecords(records, byName);
  if (problems.length > 0) {
    for (const p of problems) console.error(p);
    process.exit(1);
  }

  fs.rmSync(PROFILES_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
  for (const p of profiles) {
    fs.writeFileSync(path.join(PROFILES_DIR, `${p.name}.json`), JSON.stringify(p, null, 2) + '\n');
  }

  for (const f of fs.existsSync(CORPUS_DIR) ? fs.readdirSync(CORPUS_DIR) : []) {
    if (f.endsWith('.jsonl')) fs.rmSync(path.join(CORPUS_DIR, f));
  }
  for (const ch of CHANNELS) {
    const rows = records.filter((r) => r.channel === ch);
    if (rows.length > 0) writeJsonl(path.join(CORPUS_DIR, `${ch}.jsonl`), rows);
  }

  const held = records.filter((r) => r.private).length;
  const groups = new Set(records.map((r) => r.group)).size;
  console.log(`${records.length} cases in ${groups} groups, ${profiles.length} profiles`);
  if (sets.length > 0) {
    console.log(`duplicates dropped (src/dedupe.ts): ${sets.reduce((n, s) => n + s.dropped.length, 0)}`);
    for (const s of sets) console.log(`  kept ${s.kept.id}; dropped ${s.dropped.map((r) => r.id).join(', ')}`);
  }
  for (const ch of CHANNELS) {
    const rows = records.filter((r) => r.channel === ch);
    if (rows.length === 0) continue;
    const exp = (v: string) => rows.filter((r) => r.expected === v).length;
    console.log(`  ${ch.padEnd(9)} ${String(rows.length).padStart(4)}  block ${exp('block')}  review ${exp('review')}  allow ${exp('allow')}  holdout ${rows.filter((r) => r.private).length}`);
  }
  console.log(`holdout: ${held}/${records.length} (${((100 * held) / records.length).toFixed(1)}%)`);
  const scope = scopeCounts(records);
  const extended = Object.values(scope.extended).reduce((n, x) => n + x, 0);
  console.log(`official: ${scope.headline} headline, ${scope.vendor} vendor; extended: ${extended}`);
  for (const [code, n] of Object.entries(scope.extended).sort((a, b) => b[1] - a[1])) console.log(`  ${code.padEnd(24)} ${String(n).padStart(5)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
