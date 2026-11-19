import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { scaffold, profiles } from '../lib/template.mjs';
import { collectSnapshot, backup, restore, safePath, validateRepo, assertPrivateRepository } from '../lib/runtime.mjs';

const temp = await fs.mkdtemp(join(tmpdir(), 'second-brain-tests-'));
process.env.SECOND_BRAIN_BACKUP_ROOT = join(temp, 'local-backups');
test.after(async () => { await fs.rm(temp, { recursive: true, force: true }); });

test('all six profiles generate English files and independent identities without personal history', async () => {
  const ids = new Set();
  for (const profile of Object.keys(profiles)) {
    const destination = join(temp, profile);
    await scaffold(destination, { profile, name: 'Example User', focus: 'Finish one meaningful project' });
    const config = JSON.parse(await fs.readFile(join(destination, 'brain.config.json')));
    assert.equal(config.profile, profile);
    assert.equal(config.language, 'en');
    assert.equal(config.githubRepo, null);
    ids.add(config.id);
    assert.match(await fs.readFile(join(destination, '_knowledge/about-me.md'), 'utf8'), /Example User/);
    assert.match(await fs.readFile(join(destination, '_knowledge/goals.md'), 'utf8'), /Finish one meaningful project/);
    assert.match(await fs.readFile(join(destination, 'AGENTS.md'), 'utf8'), /fully customizable/);
    assert.equal((await fs.readdir(join(destination, '_system/workflows'))).length, 6);
    assert.equal((await fs.readdir(join(destination, '_templates'))).length, 6);
    assert.deepEqual((await fs.readdir(join(destination, '_sync/threads'))).sort(), ['README.md', 'completed'].sort());
    const names = (await collectSnapshot(destination)).map(file => file.path);
    assert.ok(names.includes('index.html'));
    assert.ok(names.includes('_system/scripts/runtime.mjs'));
    assert.ok(!names.some(name => name.startsWith('.obsidian/')));
  }
  assert.equal(ids.size, 6);
});

test('generation refuses nonempty destinations and preserves their contents', async () => {
  const destination = join(temp, 'existing');
  await fs.mkdir(destination);
  await fs.writeFile(join(destination, 'important.md'), 'keep this');
  await assert.rejects(scaffold(destination), /new or empty/);
  assert.equal(await fs.readFile(join(destination, 'important.md'), 'utf8'), 'keep this');
  assert.deepEqual(await fs.readdir(destination), ['important.md']);
});

test('CLI rejects invalid profile before generating files', () => {
  const destination = join(temp, 'invalid-profile');
  const result = spawnSync(process.execPath, ['bin/create-second-brain.mjs', destination, '--yes', '--profile', 'invalid'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown profile/);
});

test('CLI supports a path with spaces, prints real doctor results and works without installations', async () => {
  const destination = join(temp, 'A new brain');
  const result = spawnSync(process.execPath, ['bin/create-second-brain.mjs', destination, '--yes', '--profile', 'custom', '--name', 'Test Person'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Vault: OK/);
  assert.equal(JSON.parse(await fs.readFile(join(destination, 'brain.config.json'))).profile, 'custom');
  const helper = spawnSync(process.execPath, ['_system/scripts/brain.mjs', 'doctor'], { cwd: destination, encoding: 'utf8' });
  assert.equal(helper.status, 0, helper.stderr);
  assert.match(helper.stdout, /verify manually/);
});

test('snapshot excludes media, code folders, hidden config and credential-like files', async () => {
  const destination = join(temp, 'allowlist');
  await scaffold(destination);
  await fs.mkdir(join(destination, 'Projects/source'), { recursive: true });
  await fs.writeFile(join(destination, 'Projects/source/private.md'), 'not a note');
  await fs.writeFile(join(destination, '_knowledge/credentials.json'), '{"demo":true}');
  await fs.writeFile(join(destination, '_knowledge/photo.png'), 'not a real png');
  await fs.writeFile(join(destination, '.env'), 'not a real env');
  const files = (await collectSnapshot(destination)).map(file => file.path);
  assert.ok(!files.some(file => /Projects|credentials|\.png|\.env|\.obsidian/.test(file)));
});

test('snapshot stops for likely secrets and unresolved conflict copies', async () => {
  const destination = join(temp, 'sensitive');
  await scaffold(destination);
  const note = join(destination, '_knowledge/draft.md');
  // Construct a synthetic token at runtime; no real credential is used.
  await fs.writeFile(note, ['ghp', 'X'.repeat(40)].join('_'));
  await assert.rejects(collectSnapshot(destination), /Possible secret/);
  await fs.writeFile(note, 'safe note');
  await fs.writeFile(join(destination, '_knowledge/draft (conflict).md'), 'conflict copy');
  await assert.rejects(collectSnapshot(destination), /Resolve sync conflicts/);
});

test('local Git snapshots restore exact current notes, preserve history and resist vault mixing', async () => {
  const destination = join(temp, 'roundtrip');
  await scaffold(destination, { name: 'Round Trip' });
  const snapshot = await backup({ vault: destination, repo: 'example/roundtrip', localOnly: true });
  assert.ok(!snapshot.startsWith(destination));
  const savedFile = join(destination, '_knowledge/context.md');
  await fs.writeFile(savedFile, 'A real update\n');
  await backup({ vault: destination, repo: 'example/roundtrip', localOnly: true });
  const restored = join(temp, 'restored');
  await restore({ destination: restored, source: snapshot });
  assert.equal(await fs.readFile(join(restored, '_knowledge/context.md'), 'utf8'), 'A real update\n');
  assert.equal(JSON.parse(await fs.readFile(join(restored, 'brain.config.json'))).id, JSON.parse(await fs.readFile(join(destination, 'brain.config.json'))).id);
  // A deleted note is removed from the current manifest, while its Git history remains.
  await fs.unlink(savedFile);
  await backup({ vault: destination, repo: 'example/roundtrip', localOnly: true });
  const restoredLatest = join(temp, 'restored-latest');
  await restore({ destination: restoredLatest, source: snapshot });
  await assert.rejects(fs.access(join(restoredLatest, '_knowledge/context.md')));
  const other = join(temp, 'other-brain');
  await scaffold(other);
  await assert.rejects(backup({ vault: other, repo: 'example/roundtrip', localOnly: true }), /another vault/);
  await assert.rejects(restore({ destination: restored, source: snapshot }), /new or empty/);
});

test('restore validates all hashes before writing a destination', async () => {
  const destination = join(temp, 'integrity');
  await scaffold(destination);
  const snapshot = await backup({ vault: destination, repo: 'example/integrity', localOnly: true });
  await fs.appendFile(join(snapshot, '_knowledge/goals.md'), '\nmodified after snapshot');
  const restored = join(temp, 'damaged-restore');
  await assert.rejects(restore({ destination: restored, source: snapshot }), /integrity/);
  await assert.rejects(fs.access(restored));
});

test('paths and repository identifiers reject traversal, credential URLs and option injection', () => {
  for (const value of ['../escape', '/absolute', '.', '..']) assert.throws(() => safePath(resolve(temp), value), /Unsafe/);
  for (const value of ['https://user:token@github.com/a/b', '--public', '../a', 'a/b.git', 'a/b/c']) assert.throws(() => validateRepo(value), /OWNER\/REPO/);
  assert.equal(validateRepo('someone/my-second-brain'), 'someone/my-second-brain');
});

test('personal backups reject public repositories, forks and archived destinations', () => {
  assert.throws(() => assertPrivateRepository({ private: false, fork: false }), /PRIVATE/);
  assert.throws(() => assertPrivateRepository({ private: true, fork: true }), /PRIVATE/);
  assert.throws(() => assertPrivateRepository({ private: true, fork: false, archived: true }), /archived/);
  assert.doesNotThrow(() => assertPrivateRepository({ private: true, fork: false, archived: false }));
});
