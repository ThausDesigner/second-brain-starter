# Second Brain Starter

**Your context. Your files. Your way.**

A fresh, customizable English-language second brain made of Markdown notes, reusable templates and AI workflows. Use Obsidian to navigate it, a folder-aware AI to work with it, Google Drive to sync the notes and a separate private GitHub repository for recoverable snapshots.

**[Open the setup & handoff page](https://second-brain-starter.vercel.app)** · **[Download the complete ZIP](https://second-brain-starter.vercel.app/second-brain-starter.zip)** · **[Full text installation guide](docs/HANDOFF.md)**

The visual guide defaults to English and offers a Portuguese toggle. The vault, CLI, templates and workflows are English. This is a clean starter, with no personal notes or customer information.

## What is a second brain?

A second brain is a durable place to capture ideas, keep goals visible, connect knowledge, record decisions and continue ongoing work. Here the memory lives in files you own. Work threads include current state, next actions and dated handoffs that another AI can read.

This does not train a model, grant an AI unlimited memory or run an assistant in the background. An AI must have authorized file access and read the relevant notes. No web-development frameworks or runtime npm dependencies are needed.

## Choose a profile, then make it yours

| Starting profile | Suggested focus |
|---|---|
| `personal` | Life admin, routines and goals |
| `student` | Courses, reading, research and assignments |
| `creator` | Ideas, content, publishing and audience |
| `professional` | Projects, meetings, career and skills |
| `business` | Strategy, customers, operations and marketing |
| `custom` | Your own areas and combination of needs |

Profiles only suggest areas and onboarding questions. They do not lock functionality. Combine profiles, rename folders, change language, edit instructions and add or remove templates. The ZIP vault starts with Custom; the CLI wizard lets you choose.

## Fast install with npm/npx

Already have **Node.js 22 or later**, including npm/npx?

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.0.tar.gz create-second-brain
```

The wizard asks for a new folder, name, profile, first focus, optional AI CLI, system tools and optional private GitHub backup. It never overwrites a nonempty destination. System prompts and account sign-ins may still be required.

One explicit command to create a custom brain, install system tools and install one AI on Windows/macOS:

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.0.tar.gz create-second-brain ./My-Second-Brain --profile custom --install-tools --ai codex
```

Replace `codex` with `claude`, `gemini` or `all`; use `none` to skip AI installation. You only need one AI. With `--yes`, unanswered wizard fields use defaults; OS approvals and explicit account authentication are not bypassed. Without flags, system tools and AI installs are opt-in choices.

**This downloads a versioned GitHub archive.** It does not require an npm account, npm registry publication or Git to bootstrap. No short npm-registry package name is claimed to be published.

### Starting without Node.js

Review scripts before running them. Bootstrap installs Node.js if missing or older than 22, then opens the same wizard.

**Windows 10/11, PowerShell, WinGet/App Installer required:**

```powershell
& ([scriptblock]::Create((Invoke-RestMethod "https://raw.githubusercontent.com/ThausDesigner/second-brain-starter/v1.0.0/scripts/install.ps1"))) -Profile custom
```

Optional Windows bootstrap arguments: `-Destination "G:\My Drive\My-Second-Brain" -AI codex -InstallTools`. Drive must already be signed in for a Drive destination to exist.

**macOS, Homebrew already installed:**

```sh
curl -fsSL https://raw.githubusercontent.com/ThausDesigner/second-brain-starter/v1.0.0/scripts/install.sh -o /tmp/second-brain-install.sh && bash /tmp/second-brain-install.sh --profile custom
```

The macOS bootstrap uses Homebrew `node@24` if an acceptable Node.js is missing. Update this maintained LTS floor as upstream support changes. Linux users install prerequisites manually, then use the direct npm command without `--install-tools`.

### From the ZIP, without a terminal

Download and extract into a new directory. Open **`vault/`** as a vault in Obsidian. Install your chosen apps manually. Open `index.html` in a browser for the bilingual guide. The included `installer/` directory contains the complete source for later use.

### From a local source checkout

```sh
node bin/create-second-brain.mjs
# Or install the executable locally on your machine:
npm install --global .
create-second-brain --help
```

## Everything you may need to install

| Requirement | Purpose | Automatic installation |
|---|---|---|
| Node.js 22+ with npm/npx | Installer and helper scripts; not needed to read Markdown | Bootstrap on Windows/macOS |
| Obsidian | Note navigation and native Templates plugin | `--install-tools` on Windows/macOS |
| Git | Version history for optional backups | `--install-tools` on Windows/macOS |
| GitHub CLI (`gh`) | Account authentication and private repository operations | `--install-tools` on Windows/macOS |
| Google Drive for desktop | Optional file synchronization across computers | `--install-tools` on Windows/macOS |
| One folder-aware AI | Onboarding, context-aware work and handoffs | Selected CLI via `--ai`; existing desktop/editor tools can also be used |
| WinGet / Homebrew | System package manager for automatic app installation | Must already be installed |

You also need your own Google account for Drive, GitHub account for remote backups and eligible account/API access for the AI provider. Sign-ins, MFA, licenses and OS permissions are completed by you. The installer does not buy subscriptions or change organization policies. Vendor usage limits and terms apply.

Windows automation uses the exact WinGet IDs `OpenJS.NodeJS.LTS`, `Git.Git`, `GitHub.cli`, `Obsidian.Obsidian` and `Google.GoogleDrive`. macOS uses Homebrew. Linux can generate and work with the vault, but prerequisites are manual and Google Drive has no official Linux desktop client. Mobile setup is separate; Google Drive alone is not officially supported for Obsidian vault sync on iOS.

## Connect Obsidian, Drive and your AI

1. In Google Drive for desktop, sign in and choose a specific folder in My Drive for the vault. Mark the vault **Available offline** and wait for sync. Do not mirror an entire large Drive just for this.
2. Create your vault in that new local folder, or extract the ZIP vault there.
3. In Obsidian, choose **Open folder as vault** and select that exact folder.
4. Open the same folder in your chosen AI tool, or run `codex`, `claude` or `gemini` from a terminal inside it. Sign in with the provider.
5. Say: **Read AGENTS.md and run onboarding. Ask one question at a time and suggest a profile based on my answers.**
6. Check that the AI can read your notes and save a harmless, user-approved test note.

Cloud chats do not automatically see local files. They need a connector, uploads or a local-access tool. Hosted GitHub agents cannot directly use your computer's Drive path. On another computer, install and authenticate the tools again, then open the existing synchronized vault. Do not generate a new empty vault over it.

Use one active editing computer at a time. Run end-session, verify the handoff, close the editing session and wait for sync on both ends before switching. Do not combine multiple bidirectional sync providers for one folder. Thread claims help coordinate but are not technical file locks.

## Included workflows and templates

Say `run onboarding`, `run sync`, `run capture`, `run daily-briefing`, `run weekly-review` or `run end-session` to your AI. It reads the matching Markdown workflow. These are natural-language instructions, not universal built-in slash commands.

Six note templates cover work threads, projects, decisions, learning, research and captures. The core Obsidian Templates plugin points to `_templates/`. No community plugins are installed.

```text
AGENTS.md                  Shared AI instructions
CLAUDE.md / GEMINI.md      Import the common rules
START-HERE.md              First-use guide
index.html                 Offline bilingual setup guide
brain.config.json          Profile and nonsecret settings
_knowledge/                About me, goals and profile
_memory/                   Short current state
_sync/threads/             Work threads and handoffs
_inbox/                    Rough ideas
_projects/                 Project notes (not source-code repos)
_research/                 Evidence and unreviewed findings
_decisions/                Decisions and reasoning
_learnings/                Lessons and application
_templates/                Reusable Markdown templates
_system/                   Workflows and Node helper scripts
```

## Private GitHub backup and recovery

The public repository is the distributable starter. **Never store your personal vault in it.** Use a separate private repository:

```sh
gh auth login --hostname github.com --git-protocol https --web
# In your vault:
npm run doctor
npm run backup -- YOUR-USERNAME/my-second-brain
```

The command creates a private repo if needed, rejects public/fork/unrelated destinations, and uses a separate local Git working copy under `~/.second-brain-backups/`. That folder must be outside Drive and all other sync services. If your home directory is synced, set `SECOND_BRAIN_BACKUP_ROOT` to an unsynced local folder. Git metadata does not live in the vault. The destination is remembered after success; later run `npm run backup`.

Backups cover allowlisted text notes and system files only, up to 2 MiB each. Attachments, binaries, source-code projects, symlinks, local `.obsidian` settings and credential-like filenames are excluded. Back up media separately. Basic secret checks are not comprehensive privacy detection. Review what you store before uploading it.

Test recovery into a separate, new/empty folder:

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.0.tar.gz create-second-brain ./Recovered-Brain --restore YOUR-USERNAME/my-second-brain --yes
```

Restore validates hashes in the snapshot manifest and never overwrites a nonempty folder. No force-push, silent conflict resolution or scheduled backup is used. Deleted files remain in Git history; only the manifest's current files are restored. A backup is a snapshot, not continuous sync. If backup fails after generation, keep the created vault and retry its backup command.

## Grow your system

Start with one goal and one thread. Add templates only for repeated tasks. Add meeting, reading or editorial workflows, topic indexes and domain-specific notes as needed. Later add authorized app connectors or search tooling with clear permissions. Keep summaries short, review stale notes and archive completed threads. Nothing requires staying with one AI, editor or cloud provider.

## Development and release

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run package
npm run preview
```

`dist/` contains the guide, ZIP, SHA-256 checksum and release metadata for Vercel. `npm run preview` serves the guide at localhost:4187. `SECOND_BRAIN_PREVIEW_DIR=dist` serves the packaged download for release checks. See [maintainer notes](docs/MAINTAINER.md) for publishing and test limits.

## Official setup references

[Obsidian synchronization](https://help.obsidian.md/sync-notes), [Drive streaming/mirroring](https://support.google.com/drive/answer/13401938), [Drive offline files](https://support.google.com/drive/answer/2375012), [Node.js](https://nodejs.org/en/download), [npm exec](https://docs.npmjs.com/cli/v11/commands/npm-exec/), [GitHub CLI login](https://cli.github.com/manual/gh_auth_login), [private repositories](https://cli.github.com/manual/gh_repo_create), [Codex CLI](https://developers.openai.com/codex/cli), [Claude Code](https://code.claude.com/docs/en/setup), [Gemini CLI](https://geminicli.com/docs/get-started/installation/).

MIT for this starter's original code and templates. Third-party products retain their own terms.
