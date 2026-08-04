#!/usr/bin/env bash
# Non-interactive, fail-fast and pipeline-safe bash options
set -euo pipefail

echo "============================================="
echo "   Mivora Workspace Setup Script             "
echo "============================================="

# 1. Validate Node.js 22 compatibility
NODE_VERSION=$(node -v)
echo "Checking Node.js version: ${NODE_VERSION}"
if [[ ! "${NODE_VERSION}" =~ ^v22\. ]]; then
  echo "Error: This repository requires Node.js 22 (detected ${NODE_VERSION})." >&2
  exit 1
fi
echo "Node.js 22 validation passed."

# 2. Require the committed lockfile
if [[ ! -f "pnpm-lock.yaml" ]]; then
  echo "Error: pnpm-lock.yaml is required. Restore the committed lockfile before setup." >&2
  exit 1
fi

# 3. Enable Corepack
echo "Enabling Corepack..."
corepack enable

# 4. Prepare and pin the exact pnpm version
echo "Preparing pnpm@10.30.3..."
corepack prepare pnpm@10.30.3 --activate

# 5. Install dependencies from the committed lockfile
echo "Installing dependencies with --frozen-lockfile..."
pnpm install --frozen-lockfile

echo "============================================="
echo "   Workspace setup completed successfully!   "
echo "============================================="
