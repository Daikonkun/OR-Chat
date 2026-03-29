#!/bin/bash
# Show active worktrees and linked requirements from manifest

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
WORKTREE_MANIFEST="$PROJECT_ROOT/.worktree-manifest.json"

if [ ! -f "$WORKTREE_MANIFEST" ]; then
  echo "Error: .worktree-manifest.json not found" >&2
  exit 1
fi

echo "=== Active Worktrees ==="
COUNT="$(jq '[.worktrees[] | select(.status == "ACTIVE")] | length' "$WORKTREE_MANIFEST")"

if [ "$COUNT" -eq 0 ]; then
  echo "No active worktrees found."
  exit 0
fi

jq -r '.worktrees[]
  | select(.status == "ACTIVE")
  | "- ID: \(.id)\n  Branch: \(.branch)\n  Base: \(.baseBranch)\n  Path: \(.path)\n  Requirements: \(.requirementIds | join(", "))\n"' "$WORKTREE_MANIFEST"

echo "Count: $COUNT"
