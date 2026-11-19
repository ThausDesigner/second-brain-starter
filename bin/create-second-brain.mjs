#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { scaffold } from '../lib/template.mjs';
import { installTools, installAI } from '../lib/system.mjs';
import { backup, restore, doctor } from '../lib/runtime.mjs';

const help = `Second Brain Starter 1.0.0

create-second-brain [folder] [options]
  --name "Your name"       Personalize the initial profile
  --profile personal|student|creator|professional|business|custom
  --focus "Your focus"     Optional initial priority, editable later
  --ai none|codex|claude|gemini|all   Install selected AI CLI (default: none)
  --install-tools         Install Git, GitHub CLI, Obsidian and Drive (Windows/macOS)
  --github OWNER/REPO     Create/use PRIVATE personal backup; requires gh login
  --restore OWNER/REPO    Restore a private backup into a NEW/EMPTY folder
  --yes                   Noninteractive; system/account prompts can still occur
  --help                  Show help

Without --yes, the wizard offers system tools and account setup.
An existing nonempty folder is NEVER overwritten. No npm registry publication is required.
Linux: manual prerequisites; no official Drive desktop client. Node.js >=22 required.
`;

try {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22+ required: https://nodejs.org/en/download');
  const { values: opts, positionals } = parseArgs({ allowPositionals: true, options: {
    name: { type: 'string' }, profile: { type: 'string' }, focus: { type: 'string' }, ai: { type: 'string' }, github: { type: 'string' },
    restore: { type: 'string' }, 'install-tools': { type: 'boolean' }, yes: { type: 'boolean' }, help: { type: 'boolean' }
  }});
  if (opts.help) { console.log(help); process.exit(0); }
  if (positionals.length > 1) throw new Error('Only one destination folder is allowed. Quote paths containing spaces.');
  if (opts.restore && opts.github) throw new Error('Use --restore or --github, not both.');
  const rl = !opts.yes && stdin.isTTY ? createInterface({ input: stdin, output: stdout }) : null;
  const ask = async (question, fallback = '') => rl ? (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback : fallback;
  try {
    const folder = resolve(positionals[0] || await ask('New folder (can be inside Drive; use a local path)', 'My-Second-Brain'));
    if (existsSync(folder) && readdirSync(folder).length) throw new Error('Folder is not empty. Choose a new or empty folder.');
    const name = opts.name || (opts.restore ? '' : await ask('What should we call you?'));
    if (name.length > 120 || /[\r\n\x00-\x1f]/.test(name)) throw new Error('Name must be one line, up to 120 characters.');
    const profile = opts.profile || (opts.restore ? 'personal' : await ask('Starting profile: personal, student, creator, professional, business, custom', 'personal'));
    if (!['personal', 'student', 'creator', 'professional', 'business', 'custom'].includes(profile)) throw new Error('Unknown profile.');
    const focus = opts.focus || (opts.restore ? '' : await ask('What would you like this brain to help with first?'));
    if (focus.length > 300 || /[\r\n\x00-\x1f]/.test(focus)) throw new Error('Focus must be one line, up to 300 characters.');
    const ai = opts.ai || await ask('AI CLI to install: none, codex, claude, gemini, all', 'none');
    if (!['none', 'codex', 'claude', 'gemini', 'all'].includes(ai)) throw new Error('Invalid --ai selection.');
    const tools = opts['install-tools'] || ['y', 'yes'].includes((await ask('Install Git, GitHub CLI, Obsidian and Drive? (y/n)', 'n')).toLowerCase());
    if (tools) installTools();
    if (ai !== 'none') installAI(ai);
    if (opts.restore) {
      await restore({ repo: opts.restore, destination: folder });
    } else {
      await scaffold(folder, { name, ai, profile, focus });
      console.log(`\nVault created: ${folder}`);
      const repo = opts.github || await ask('PRIVATE GitHub backup (OWNER/REPO; Enter to skip)');
      if (repo) await backup({ vault: folder, repo });
    }
    await doctor(folder);
    console.log('\nOpen index.html in your browser. In Obsidian: Open folder as vault. Sign in to Drive and make this folder available offline. Open your AI in this folder and say: read AGENTS.md and run onboarding. Sign-ins and permissions are manual.');
  } finally { rl?.close(); }
} catch (error) {
  console.error(`\n${error.message}\nA created vault is kept if a later account/backup step fails.`);
  process.exitCode = 1;
}
