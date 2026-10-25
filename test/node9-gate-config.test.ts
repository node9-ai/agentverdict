import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Node9GateAdapter } from '../adapters/node9-gate/index.ts';
import { loadProfiles } from '../src/corpus.ts';

const profiles = loadProfiles();

/** The config file node9-gate writes for a profile, or null when it writes none. */
async function configFor(profile: string, mode?: 'strict'): Promise<Record<string, unknown> | null> {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-config-'));
  try {
    const adapter = new Node9GateAdapter({ source: 'npm', daemon: false, mode });
    await adapter.prepare(profiles.get(profile)!, { home, cwd: path.join(home, 'project') }, new Set());
    const file = path.join(home, '.node9', 'config.json');
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, unknown>) : null;
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

test('a profile that asks for nothing, at the shipped level, gets no config file', async () => {
  assert.equal(await configFor('clean'), null);
});

test('the level is written as mode in a v2 file', async () => {
  assert.deepEqual(await configFor('clean', 'strict'), { version: '2', mode: 'strict' });
});

test('the user asked to be consulted: the categories node9 has a check for are held for review', async () => {
  const file = await configFor('ask-before-dangerous-actions');
  assert.equal(file?.version, '2');
  assert.deepEqual(file?.checks, { 'actions.money': 'review', 'actions.access': 'review', 'actions.publish': 'review' });
  assert.equal(file?.mode, undefined);
});

test('an outbound policy reaches node9 through its own translation (config migrate)', async () => {
  const p = profiles.get('egress-watch')!;
  const file = await configFor('egress-watch');
  assert.equal(file?.version, '2');
  assert.equal(file?.settings, undefined, 'no legacy keys left');
  assert.equal(file?.policy, undefined, 'no legacy keys left');
  const unknownHost = (file?.tuning as Record<string, { allow?: string[] }> | undefined)?.['network.unknown-host'];
  assert.deepEqual(unknownHost?.allow ?? [], p.egress?.allow ?? []);
});
