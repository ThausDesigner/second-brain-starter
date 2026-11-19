#!/usr/bin/env bash
# Second Brain Starter: macOS bootstrap. Review before running.
set -euo pipefail
archive='https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.0.tar.gz'
if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' ; then
  if [[ "$(uname -s)" != 'Darwin' ]]; then
    printf '%s\n' 'Install Node.js 22+ using https://nodejs.org/en/download or your distribution package manager, then rerun this script.' >&2
    exit 1
  fi
  if ! command -v brew >/dev/null 2>&1; then
    printf '%s\n' 'Install Homebrew from https://brew.sh first, then rerun this script.' >&2
    exit 1
  fi
  brew install node@24
  export PATH="$(brew --prefix node@24)/bin:$PATH"
fi
if ! command -v npx >/dev/null 2>&1; then
  printf '%s\n' 'npm/npx is missing. Reinstall Node.js LTS, reopen the terminal and retry.' >&2
  exit 1
fi
printf '%s\n' 'Starting the Second Brain setup wizard. Sign-ins are completed by you.'
exec npx --yes "--package=$archive" create-second-brain "$@"
