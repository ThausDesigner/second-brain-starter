# Second Brain Starter: delivery and setup handoff

This is a new, generic English-language second brain. It contains no personal notes, customer data, credentials or prefilled work history. The visual guide defaults to English and includes a Portuguese translation; the vault, installer and templates are English.

## Inside this download

- `index.html`: standalone setup guide with an English/Portuguese toggle. Open it in a browser.
- `vault/`: your ready-to-open, fully customizable Obsidian vault. This is the folder to open as a vault.
- `installer/`: complete Node.js installer source, scripts, documentation and tests.
- `LICENSE`: MIT license for this starter's original files. Third-party apps have their own terms.

## What this system does

Store ideas, identity, goals, decisions, research and learning in Markdown. Work threads and append-only handoffs let you continue with a different AI or device without depending on a particular chat history. An AI must have authorized access to the folder and read the relevant context. No model training, background agent or automatic account connection is included.

## Pick a starting profile

Personal, student/researcher, creator, professional, business owner or custom. Profiles suggest areas and questions. Nothing prevents combining or changing them later. The ZIP vault starts with Custom; tell your AI to run onboarding to select a profile.

## Quick manual setup

1. Extract the ZIP into a new folder. Keep personal notes out of the public starter repository.
2. Install Obsidian, open **Open folder as vault**, and select `vault/`.
3. If you want Drive sync, place the vault in a specific My Drive folder through Drive for desktop on Windows/macOS. Mark just that folder available offline and wait for sync.
4. Install one folder-aware AI, open that exact folder and sign in. Say: **Read AGENTS.md and run onboarding. Ask one question at a time.**
5. Confirm the AI can read/write the folder before relying on saved handoffs.
6. End useful sessions with **run end-session**. Review the actual saved handoff.

## Install faster

With Node.js 22+ already installed (npm/npx are included):

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.1.tar.gz create-second-brain ./My-Second-Brain --profile custom
```

Prepare system apps and one selected AI in the same run (Windows/macOS):

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.1.tar.gz create-second-brain ./My-Second-Brain --profile custom --install-tools --ai codex
```

The GitHub archive URL means no npm account or npm-registry publication is required. The installer does not need Git to download itself. It can install Git afterward through the system package manager.

Windows bootstrap, including Node.js LTS if needed (PowerShell, WinGet required):

```powershell
& ([scriptblock]::Create((Invoke-RestMethod "https://raw.githubusercontent.com/ThausDesigner/second-brain-starter/v1.0.1/scripts/install.ps1"))) -Profile custom
```

macOS bootstrap (Homebrew must be installed first):

```sh
curl -fsSL https://raw.githubusercontent.com/ThausDesigner/second-brain-starter/v1.0.1/scripts/install.sh -o /tmp/second-brain-install.sh && bash /tmp/second-brain-install.sh --profile custom
```

Review public scripts before running. OS permissions, login, MFA, cloud sync completion and organization policies cannot be bypassed. CLI AI packages are installed only if selected. You do not need all three AI providers.

From the included `installer/` folder you can also run `node bin/create-second-brain.mjs` directly, or install it with `npm install --global .` and run `create-second-brain`.

## Requirements and limits

Obsidian for note navigation. One file-aware AI for AI workflows. Node.js 22+ for installer/helper scripts. Git, GitHub CLI and a GitHub account for private versioned backups. Google Drive desktop and a Google account if using Drive sync. Windows automation requires WinGet; macOS automation requires Homebrew. Linux requires manually installed prerequisites; Google Drive has no official Linux desktop client. Mobile needs a separately suitable sync method, and Drive alone is not officially supported for Obsidian vault sync on iOS.

No web frameworks, database or runtime npm dependencies are required. Community plugins are not installed. AI plans, storage quotas and service terms are provided by the vendors and may change. Accounts and subscriptions are not included.

## Private GitHub backup

In your vault terminal:

```sh
gh auth login --hostname github.com --git-protocol https --web
npm run doctor
npm run backup -- YOUR-USERNAME/my-second-brain
```

The command creates a new private repo if needed. It refuses public repos and unrelated backup identities. The first successful backup remembers the destination; use `npm run backup` later. Keep the separate local Git working copy at `~/.second-brain-backups/` outside all cloud-sync services. If home is synced, set `SECOND_BRAIN_BACKUP_ROOT` to an unsynced local folder. No `.git` directory is created inside the vault.

Backup includes allowlisted text notes and system files only, up to 2 MiB per file. It skips binaries, attachments, code projects, local Obsidian settings, symlinks and credential-like filenames. Basic secret checks are not comprehensive privacy detection. Review your notes before uploading. Back up media separately.

To test recovery into a new, empty folder:

```sh
npx --yes --package=https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.1.tar.gz create-second-brain ./Recovered-Brain --restore YOUR-USERNAME/my-second-brain --yes
```

No existing vault is overwritten. Restore checks file hashes from the snapshot manifest. A failed or diverging Git push stops; there is no force-push. Deleted paths are not automatically purged from Git history. Account failures after generation preserve the vault; retry backup from inside it rather than rerunning the generator.

## Switch computers

Finish the session and save a handoff. Close the editing session, wait for Drive to finish uploading, then wait for download on the next computer. Open the same folder in Obsidian and the AI and say **Read AGENTS.md and run sync.** Install tools and authenticate on each machine. Your AI chat history and secrets are not synced; the portable context is in the notes.

Do not edit concurrently from multiple computers. Avoid overlapping bidirectional sync services. The thread ownership field coordinates people but is not a distributed file lock. If Drive is unavailable, recover the last GitHub snapshot into a separate folder.

## Grow deliberately

Start with one goal and one thread. Add useful meeting, reading, project or content templates. Add workflows for repeated tasks. Later, connect calendars, email or documents only with explicit authorization. Keep indexes and current state short and archive finished threads. Change language, categories and profiles whenever the user's needs change.

## Maintainer notes

Source: https://github.com/ThausDesigner/second-brain-starter

Run `npm test`, `npm run check` and `npm run package` in `installer/`. `npm run preview` serves the local guide. `dist/` is the Vercel output: guide, ZIP, checksum and release metadata. No secrets or account configuration belong in the download. See `docs/MAINTAINER.md` for release steps and verified limits.
