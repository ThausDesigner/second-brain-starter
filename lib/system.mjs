import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.error?.code}).`);
  return result;
}
export function available(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore', shell: false }).status === 0;
}
export function npm(args) {
  const candidates = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')];
  if (process.platform === 'win32') {
    const found = spawnSync('where.exe', ['npm.cmd'], { encoding: 'utf8' });
    for (const path of (found.stdout || '').trim().split(/\r?\n/)) candidates.push(join(dirname(path), 'node_modules/npm/bin/npm-cli.js'));
  }
  const cli = candidates.find(path => path && existsSync(path) && path.endsWith('npm-cli.js'));
  if (cli) return run(process.execPath, [cli, ...args]);
  if (process.platform !== 'win32') return run('npm', args);
  throw new Error('npm-cli.js not found. Reinstall Node.js LTS from https://nodejs.org/en/download');
}
export function refreshWindowsPath() {
  if (process.platform !== 'win32') return;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"], { encoding: 'utf8' });
  if (result.status === 0) process.env.PATH = `${result.stdout.trim()};${process.env.PATH}`;
}
export function installTools() {
  if (process.platform === 'win32') {
    if (!available('winget')) throw new Error('Install Microsoft App Installer (WinGet), then run again: https://aka.ms/getwinget');
    for (const [command, id] of [['git', 'Git.Git'], ['gh', 'GitHub.cli'], ['obsidian', 'Obsidian.Obsidian'], ['GoogleDriveFS', 'Google.GoogleDrive']]) {
      // WinGet also checks GUI packages that may not expose a CLI.
      if (['git', 'gh'].includes(command) && available(command)) continue;
      const result = spawnSync('winget', ['install', '--id', id, '--exact', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity'], { stdio: 'inherit' });
      if (result.status !== 0) {
        const installed = spawnSync('winget', ['list', '--id', id, '--exact', '--accept-source-agreements'], { stdio: 'ignore' });
        if (installed.status !== 0) throw new Error(`Cannot install ${id}. Install it manually and run again.`);
      }
      refreshWindowsPath();
    }
  } else if (process.platform === 'darwin') {
    if (!available('brew')) throw new Error('Install Homebrew first: https://brew.sh . Then run this installer again.');
    run('brew', ['install', 'git', 'gh']);
    run('brew', ['install', '--cask', 'obsidian', 'google-drive']);
  } else {
    throw new Error('Linux: install Git and GitHub CLI with your distribution package manager and Obsidian from https://obsidian.md/download . Google Drive has no official Linux desktop client; use GitHub restore or your chosen sync provider. Run again without --install-tools.');
  }
}
export const aiPackages = { codex: '@openai/codex', claude: '@anthropic-ai/claude-code', gemini: '@google/gemini-cli' };
export function installAI(choice) {
  const names = choice === 'all' ? Object.keys(aiPackages) : [choice];
  for (const name of names) {
    if (!aiPackages[name]) continue;
    if (!available(name)) npm(['install', '--global', aiPackages[name]]);
  }
  refreshWindowsPath();
}
