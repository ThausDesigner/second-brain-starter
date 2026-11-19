import { promises as fs } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join, dirname, relative, isAbsolute, extname } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const configName = 'brain.config.json';
const allowedFolders = new Set(['_inbox', '_knowledge', '_memory', '_sync', '_decisions', '_learnings', '_research', '_projects', '_templates', '_system']);
const allowedRoot = new Set(['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'START-HERE.md', 'README.md', 'index.html', 'package.json', configName]);
const allowedExtensions = new Set(['.md', '.json', '.mjs', '.html', '.css']);
const secretName = /(^|[._-])(credentials?|secrets?|tokens?|passwords?|private[-_]?keys?)([._-]|$)/i;
const secretBody = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/;

export function exec(command, args, cwd, { capture = true, allowFailure = false } = {}) {
  const result = spawnSync(command, args, { cwd, shell: false, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', maxBuffer: 10 * 1024 * 1024 });
  if ((result.error || result.status !== 0) && !allowFailure) throw new Error(`${command} failed. Check installation, login and network; command output is hidden to protect credentials.`);
  return { status: result.status, stdout: result.stdout?.trim() || '' };
}
export function validateRepo(repo) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repo || '') || repo.endsWith('.git')) throw new Error('Use OWNER/REPO, without URL, credentials or .git suffix.');
  return repo;
}
async function exists(path) { try { await fs.access(path); return true; } catch { return false; } }
export async function emptyDestination(destination) {
  if (await exists(destination)) {
    if ((await fs.lstat(destination)).isSymbolicLink()) throw new Error('Destination cannot be a symbolic link.');
    if ((await fs.readdir(destination)).length) throw new Error('Destination must be new or empty. No existing files will be overwritten.');
  }
}
export function safePath(base, path) {
  const result = resolve(base, path);
  const rel = relative(resolve(base), result);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Unsafe snapshot path.');
  return result;
}
export async function collectSnapshot(vault) {
  const files = [];
  async function walk(folder, prefix = '') {
    for (const item of await fs.readdir(folder, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${item.name}` : item.name;
      const path = join(folder, item.name);
      if (item.isSymbolicLink()) continue;
      if (!prefix && !allowedRoot.has(item.name) && !allowedFolders.has(item.name)) continue;
      if (item.name.startsWith('.') || secretName.test(item.name)) continue;
      if (item.isDirectory()) { await walk(path, rel); continue; }
      if (!item.isFile() || !allowedExtensions.has(extname(item.name))) continue;
      if (/conflict|conflito|conflicted copy/i.test(item.name)) throw new Error(`Resolve sync conflicts before backup: ${rel}`);
      const stat = await fs.stat(path);
      if (stat.size > 2 * 1024 * 1024) throw new Error(`File exceeds 2 MiB note limit: ${rel}`);
      const body = await fs.readFile(path);
      if (secretBody.test(body.toString('utf8'))) throw new Error(`Possible secret detected. Backup stopped: ${rel}. Remove it from notes; rotate exposed credentials.`);
      files.push({ path: rel, body, hash: createHash('sha256').update(body).digest('hex') });
    }
  }
  await walk(resolve(vault));
  if (!files.some(file => file.path === configName)) throw new Error('Not a Second Brain vault: brain.config.json missing.');
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
export function backupRoot(repo) {
  const base = process.env.SECOND_BRAIN_BACKUP_ROOT || join(homedir(), '.second-brain-backups');
  return join(resolve(base), createHash('sha256').update(repo.toLowerCase()).digest('hex').slice(0, 20));
}
export function assertPrivateRepository(metadata) {
  if (!metadata.private || metadata.fork) throw new Error('Backup requires a PRIVATE, non-fork repository. The public starter is not a backup destination.');
  if (metadata.archived) throw new Error('Backup repository is archived.');
}
async function privateRepository(repo, create) {
  if (exec('gh', ['auth', 'status'], undefined, { allowFailure: true }).status !== 0) {
    if (!process.stdin.isTTY) throw new Error('GitHub login required. Run: gh auth login --hostname github.com --git-protocol https --web . Then retry backup.');
    exec('gh', ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'], undefined, { capture: false });
  }
  const check = exec('gh', ['api', `repos/${repo}`], undefined, { allowFailure: true });
  if (check.status !== 0) {
    if (!create) throw new Error('Backup repository unavailable. Check access and spelling.');
    exec('gh', ['repo', 'create', repo, '--private', '--description', 'Private Markdown second-brain backup']);
  } else {
    const metadata = JSON.parse(check.stdout);
    assertPrivateRepository(metadata);
  }
}
export async function backup({ vault = process.cwd(), repo, localOnly = false }) {
  vault = resolve(vault);
  const config = JSON.parse(await fs.readFile(join(vault, configName), 'utf8'));
  repo = validateRepo(repo || config.githubRepo);
  const files = await collectSnapshot(vault); // Validate everything before remote mutations.
  const folder = backupRoot(repo);
  const between = relative(vault, folder);
  if (!between || (!between.startsWith('..') && !isAbsolute(between))) throw new Error('Backup working copy must be outside the vault and outside Google Drive.');
  if (!localOnly) await privateRepository(repo, true);
  if (!(await exists(folder))) {
    await fs.mkdir(dirname(folder), { recursive: true });
    if (localOnly) { await fs.mkdir(folder); exec('git', ['init', '-b', 'main'], folder); }
    else {
      exec('gh', ['repo', 'clone', repo, folder]);
      exec('git', ['config', 'credential.https://github.com.helper', '!gh auth git-credential'], folder);
    }
  }
  // Never adopt an unrelated working tree, or push a different remote.
  const gitDir = await fs.lstat(join(folder, '.git'));
  if (!gitDir.isDirectory() || gitDir.isSymbolicLink()) throw new Error('Invalid backup working tree.');
  if (!localOnly) {
    const origin = exec('git', ['remote', 'get-url', 'origin'], folder).stdout.toLowerCase();
    if (![ `https://github.com/${repo.toLowerCase()}.git`, `https://github.com/${repo.toLowerCase()}`, `git@github.com:${repo.toLowerCase()}.git` ].includes(origin)) throw new Error('Backup remote mismatch.');
    exec('git', ['fetch', 'origin'], folder);
    const hasRemote = exec('git', ['show-ref', '--verify', 'refs/remotes/origin/main'], folder, { allowFailure: true }).status === 0;
    if (hasRemote) exec('git', ['merge', '--ff-only', 'origin/main'], folder);
  }
  const manifestPath = join(folder, 'snapshot.json');
  if (await exists(manifestPath)) {
    const previous = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (previous.format !== 'second-brain-snapshot-v1' || previous.vaultId !== config.id) throw new Error('This repository belongs to another vault. Choose a separate private repository.');
    // Deliberately preserve old paths when notes disappear: deletion is never propagated automatically.
  } else {
    const otherFiles = (await fs.readdir(folder)).filter(name => name !== '.git');
    if (otherFiles.length) throw new Error('Use a new, empty private repository for your first backup.');
  }
  for (const file of files) {
    const destination = safePath(folder, file.path);
    // Reject symlinks in every parent of a destination to avoid writing outside the backup.
    for (let parent = dirname(destination); parent !== folder; parent = dirname(parent)) {
      if (await exists(parent) && (await fs.lstat(parent)).isSymbolicLink()) throw new Error('Symbolic link in backup destination.');
    }
    if (await exists(destination) && (await fs.lstat(destination)).isSymbolicLink()) throw new Error('Symbolic link in backup destination.');
    await fs.mkdir(dirname(destination), { recursive: true });
    await fs.writeFile(destination, file.body);
  }
  // Manifest contains exactly the current snapshot; old files may remain in Git history/working tree.
  const manifest = { format: 'second-brain-snapshot-v1', vaultId: config.id, files: files.map(({ path, hash }) => ({ path, hash })) };
  if (await exists(manifestPath) && (await fs.lstat(manifestPath)).isSymbolicLink()) throw new Error('Invalid snapshot manifest.');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  exec('git', ['add', '--', 'snapshot.json', ...files.map(file => file.path)], folder);
  if (exec('git', ['diff', '--cached', '--quiet'], folder, { allowFailure: true }).status !== 0) {
    exec('git', ['-c', 'user.name=Second Brain Backup', '-c', 'user.email=backup@localhost', 'commit', '-m', `Second Brain snapshot ${new Date().toISOString()}`], folder);
  }
  if (!localOnly) exec('git', ['push', '-u', 'origin', 'HEAD:main'], folder);
  // Store the destination only after a successful backup; no tokens are ever saved.
  if (config.githubRepo !== repo) {
    config.githubRepo = repo;
    await fs.writeFile(join(vault, configName), JSON.stringify(config, null, 2) + '\n');
  }
  console.log(`Backup ${localOnly ? '(local test)' : 'pushed'}: ${repo}\nLocal Git: ${folder}\nOnly allowlisted text notes/configuration. Attachments, projects, .obsidian and credentials are excluded.`);
  return folder;
}
export async function restore({ repo, destination, source }) {
  if (repo) validateRepo(repo);
  destination = resolve(destination);
  await emptyDestination(destination);
  let temp;
  if (!source) {
    await privateRepository(repo, false);
    temp = await fs.mkdtemp(join(tmpdir(), 'second-brain-restore-'));
    source = join(temp, 'repository');
    exec('gh', ['repo', 'clone', repo, source]);
  }
  try {
    const manifest = JSON.parse(await fs.readFile(join(source, 'snapshot.json'), 'utf8'));
    if (manifest.format !== 'second-brain-snapshot-v1' || !manifest.files?.length) throw new Error('Invalid backup manifest.');
    const validated = [];
    for (const file of manifest.files) {
      const root = file.path.split('/')[0];
      if (!allowedRoot.has(root) && !allowedFolders.has(root)) throw new Error('Unexpected path in backup.');
      const input = safePath(source, file.path);
      const stat = await fs.lstat(input);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2 * 1024 * 1024) throw new Error('Invalid backup file.');
      for (let parent = dirname(input); parent !== resolve(source); parent = dirname(parent)) {
        if ((await fs.lstat(parent)).isSymbolicLink()) throw new Error('Symbolic link in backup path.');
      }
      const body = await fs.readFile(input);
      if (createHash('sha256').update(body).digest('hex') !== file.hash) throw new Error('Backup integrity check failed.');
      safePath(destination, file.path);
      validated.push({ ...file, body });
    }
    if (!validated.some(file => file.path === configName)) throw new Error('Backup config missing.');
    await fs.mkdir(destination, { recursive: true });
    for (const file of validated) {
      const path = safePath(destination, file.path);
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, file.body, { flag: 'wx' });
    }
    const config = JSON.parse(await fs.readFile(join(destination, configName), 'utf8'));
    if (repo) { config.githubRepo = repo; await fs.writeFile(join(destination, configName), JSON.stringify(config, null, 2) + '\n'); }
    console.log(`Restored ${validated.length} files: ${destination}. No attachment/project backup; reinstall local tools on this machine.`);
  } finally {
    if (temp && resolve(temp).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/'))) await fs.rm(temp, { recursive: true, force: true });
  }
}
export async function doctor(vault = process.cwd()) {
  const config = await exists(join(vault, configName));
  console.log(`\nSecond Brain doctor\nNode: ${process.version}\nVault: ${config ? 'OK' : 'brain.config.json missing'}`);
  for (const command of ['git', 'gh', 'codex', 'claude', 'gemini']) console.log(`${command}: ${exec(command, ['--version'], undefined, { allowFailure: true }).status === 0 ? 'available' : 'not installed / not in PATH'}`);
  console.log('Drive login/offline status, Obsidian and AI account access: verify manually.');
  return config;
}
export async function runTool(args = process.argv.slice(2)) {
  const [command = 'doctor', value] = args;
  if (command === 'doctor') return doctor();
  if (command === 'backup') return backup({ repo: value });
  if (command === 'restore') {
    if (!args[2]) throw new Error('Usage: brain.mjs restore OWNER/REPO NEW_FOLDER');
    return restore({ repo: value, destination: args[2] });
  }
  throw new Error('Commands: doctor | backup [OWNER/REPO] | restore OWNER/REPO NEW_FOLDER');
}
