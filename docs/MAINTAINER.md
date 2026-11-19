# Maintaining this starter

## Architecture

The npm package has no runtime dependencies. `bin/create-second-brain.mjs` handles the wizard; `lib/template.mjs` generates a new English vault; `lib/system.mjs` installs explicitly selected system tools and AI CLIs; `lib/runtime.mjs` provides diagnosis and snapshot backup/recovery. The runtime is copied into generated vaults so their helper scripts do not require a global starter installation.

`index.html` is a standalone, buildless setup guide. All content is bundled; no remote fonts, analytics or application backend are used. It defaults to English and remembers a manually selected Portuguese translation in browser local storage. Changing the guide language never changes a user's notes.

`scripts/package.mjs` generates a neutral Custom-profile vault, copies the complete installer source and creates a ZIP with a dependency-free ZIP writer. `.git`, `.vercel`, personal notes, dependencies and local account state are not part of its source allowlist. `dist/` contains only public distribution artifacts.

The Vercel configuration builds this static output with `npm run package`. It is a public handoff/download page. It is not where users store their personal vaults.

## Release procedure

1. Make changes in a separate Git checkout. Update package version, bootstrap URLs, guide release constant and text install commands together.
2. Run `npm ci --ignore-scripts`, `npm test`, `npm run check` and `npm run package`.
3. Inspect the ZIP, verify CRC/hash, extract it, and run an included offline installer from the extracted `installer/`. Inspect the generated vault for personal-data leakage.
4. Preview `dist/` locally. Check English/Portuguese, profiles, platform commands, copy controls, responsive layout and the ZIP download.
5. Commit source and push a new immutable release tag. Never force-update an existing release tag.
6. Verify the exact remote npx tarball command generates a new vault successfully. No npm publication is required for this distribution path. A short registry command would require a separately authenticated npm release; do not document it as live before publishing it.
7. Deploy the verified commit/output to the intended Vercel team/project, then verify the public page, ZIP and checksum. Confirm anonymous access: a shareable starter page must not require the maintainer's Vercel login.

## Required validation

Tests cover six profiles, neutral/English output, separate vault identities, destination overwrite protection, CLI validation, snapshot allowlisting, local Git backup and manifest-based recovery, modified snapshot detection, simulated credential leakage and traversal rejection. Integration checks should exercise the packed npm archive and public GitHub archive path. UI checks cover the bilingual guide and platform/profile controls.

This does not prove WinGet/Homebrew installation on a clean machine, every AI provider's login, Google Drive synchronization, mobile behavior or an actual personal GitHub account's backup permissions. Do not claim those were live-tested unless they were. OS/account steps are intentionally user-controlled.

## Privacy and recovery limits

Snapshots include only allowed text paths and extensions, at most 2 MiB per file. They exclude media, nested code projects, `.obsidian`, symlinks and known credential filenames. The secret pattern check catches several token/private-key forms; it cannot detect all personal information. Private repositories are access control, not an assurance that uploading a given document is appropriate.

The backup working directory must be local and outside every file-sync service. The default is `~/.second-brain-backups/`; a user with a synced home directory should override `SECOND_BRAIN_BACKUP_ROOT`. Conflicting history stops the push. No force-push or automatic merge is attempted. Current snapshot manifests determine restore coverage; old deleted paths can remain in Git history. Back up excluded attachments separately.

## Useful extensions

New profiles should remain suggestions with editable area names. New workflows should define inputs, expected output, user approvals and what evidence counts as completion. Do not add web frameworks, paid integrations, scheduled agents or telemetry to the default installation. Ship such integrations as explicit optional choices if users actually need them.
