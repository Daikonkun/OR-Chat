#!/bin/bash
# Merge a feature branch, clean worktree, and update manifests

set -euo pipefail

BRANCH="${1:-}"
BASE_BRANCH="${2:-main}"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REQ_MANIFEST="$PROJECT_ROOT/.requirement-manifest.json"
WORKTREE_MANIFEST="$PROJECT_ROOT/.worktree-manifest.json"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ -z "$BRANCH" ]; then
  echo "Usage: $0 <branch> [base-branch]" >&2
  exit 1
fi

if [ ! -f "$REQ_MANIFEST" ] || [ ! -f "$WORKTREE_MANIFEST" ]; then
  echo "Error: requirement/worktree manifest missing" >&2
  exit 1
fi

if [ -n "$(git -C "$PROJECT_ROOT" status --porcelain)" ]; then
  echo "Error: Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

if ! git -C "$PROJECT_ROOT" rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "Error: Base branch not found locally: $BASE_BRANCH" >&2
  exit 1
fi

if ! git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Error: Feature branch not found locally: $BRANCH" >&2
  exit 1
fi

WORKTREE_PATH="$(jq -r --arg branch "$BRANCH" '
  .worktrees[]? | select(.branch == $branch or .id == $branch) | .path
' "$WORKTREE_MANIFEST" | head -1)"
REQ_IDS="$(jq -r --arg branch "$BRANCH" '
  .worktrees[]? | select(.branch == $branch or .id == $branch) | .requirementIds[]
' "$WORKTREE_MANIFEST")"

echo "Merging $BRANCH into $BASE_BRANCH..."
git -C "$PROJECT_ROOT" checkout "$BASE_BRANCH"
git -C "$PROJECT_ROOT" merge --no-ff "$BRANCH" -m "Merge $BRANCH"

if [ -n "$WORKTREE_PATH" ] && [ -d "$WORKTREE_PATH" ]; then
  git -C "$PROJECT_ROOT" worktree remove "$WORKTREE_PATH"
fi

git -C "$PROJECT_ROOT" branch -d "$BRANCH"

jq --arg branch "$BRANCH" \
   --arg ts "$TIMESTAMP" \
   '.worktrees |= map(
     if .branch == $branch or .id == $branch
     then .status = "MERGED" | .mergedAt = $ts
     else .
     end
   )' \
   "$WORKTREE_MANIFEST" > "$WORKTREE_MANIFEST.tmp" && mv "$WORKTREE_MANIFEST.tmp" "$WORKTREE_MANIFEST"

if [ -n "$REQ_IDS" ]; then
  while IFS= read -r reqId; do
    [ -z "$reqId" ] && continue
    jq --arg reqId "$reqId" \
       --arg ts "$TIMESTAMP" \
       '.requirements |= map(
         if .id == $reqId
         then .status = "MERGED" | .updatedAt = $ts
         else .
         end
       )' \
       "$REQ_MANIFEST" > "$REQ_MANIFEST.tmp" && mv "$REQ_MANIFEST.tmp" "$REQ_MANIFEST"
  done <<< "$REQ_IDS"
fi

"$PROJECT_ROOT/scripts/regenerate-docs.sh" >/dev/null

git -C "$PROJECT_ROOT" add \
  .requirement-manifest.json \
  .worktree-manifest.json \
  REQUIREMENTS.md \
  docs/STATUS.md \
  docs/ROADMAP.md \
  docs/DEPENDENCIES.md \
  docs/requirements/ 2>/dev/null || true

git -C "$PROJECT_ROOT" commit -m "chore: update manifests and docs after merging $BRANCH" --no-verify 2>/dev/null || true

echo "✅ Merged $BRANCH"
if [ -n "$WORKTREE_PATH" ]; then
  echo "Removed worktree: $WORKTREE_PATH"
fi
if [ -n "$REQ_IDS" ]; then
  echo "Updated requirements to MERGED: $(echo "$REQ_IDS" | tr '\n' ' ' | xargs)"
fi
