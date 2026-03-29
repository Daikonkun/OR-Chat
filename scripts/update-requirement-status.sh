#!/bin/bash
# Update a requirement's status with lifecycle transition validation.

set -euo pipefail

REQ_ID="${1:-}"
NEW_STATUS_RAW="${2:-}"
FORCE="false"
REFRESH_DOCS="true"

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REQ_MANIFEST="$PROJECT_ROOT/.requirement-manifest.json"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

usage() {
  cat << 'EOF'
Usage: ./scripts/update-requirement-status.sh REQ-<timestamp> <new-status> [--force] [--no-refresh]

Valid statuses:
  PROPOSED, IN_PROGRESS, CODE_REVIEW, MERGED, DEPLOYED, BLOCKED, BACKLOG, CANCELLED

Flags:
  --force       Bypass transition validation
  --no-refresh  Skip docs regeneration
EOF
}

if [ "$REQ_ID" = "-h" ] || [ "$REQ_ID" = "--help" ]; then
  usage
  exit 0
fi

for arg in "${@:3}"; do
  case "$arg" in
    --force)
      FORCE="true"
      ;;
    --no-refresh)
      REFRESH_DOCS="false"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$REQ_ID" ] || [ -z "$NEW_STATUS_RAW" ]; then
  usage >&2
  exit 1
fi

if [[ ! "$REQ_ID" =~ ^REQ-[0-9]{10,}$ ]]; then
  echo "Error: Invalid requirement ID format: $REQ_ID" >&2
  exit 1
fi

NEW_STATUS="$(echo "$NEW_STATUS_RAW" | tr '[:lower:]' '[:upper:]')"

is_valid_status() {
  case "$1" in
    PROPOSED|IN_PROGRESS|CODE_REVIEW|MERGED|DEPLOYED|BLOCKED|BACKLOG|CANCELLED)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if ! is_valid_status "$NEW_STATUS"; then
  echo "Error: Invalid status: $NEW_STATUS" >&2
  exit 1
fi

if [ ! -f "$REQ_MANIFEST" ]; then
  echo "Error: .requirement-manifest.json not found" >&2
  exit 1
fi

CURRENT_STATUS="$(jq -r --arg reqId "$REQ_ID" '
  .requirements[] | select(.id == $reqId) | .status
' "$REQ_MANIFEST")"

if [ -z "$CURRENT_STATUS" ] || [ "$CURRENT_STATUS" = "null" ]; then
  echo "Error: Requirement not found: $REQ_ID" >&2
  exit 1
fi

allowed_transitions() {
  case "$1" in
    PROPOSED)
      echo "IN_PROGRESS BACKLOG CANCELLED"
      ;;
    IN_PROGRESS)
      echo "CODE_REVIEW BLOCKED BACKLOG CANCELLED"
      ;;
    CODE_REVIEW)
      echo "MERGED BLOCKED CANCELLED"
      ;;
    MERGED)
      echo "DEPLOYED CANCELLED"
      ;;
    DEPLOYED)
      echo "CANCELLED"
      ;;
    BLOCKED)
      echo "IN_PROGRESS BACKLOG CANCELLED"
      ;;
    BACKLOG)
      echo "PROPOSED IN_PROGRESS CANCELLED"
      ;;
    CANCELLED)
      echo ""
      ;;
    *)
      echo ""
      ;;
  esac
}

can_transition() {
  local from_status="$1"
  local to_status="$2"
  [ "$from_status" = "$to_status" ] && return 0
  [ "$to_status" = "CANCELLED" ] && return 0

  for candidate in $(allowed_transitions "$from_status"); do
    if [ "$candidate" = "$to_status" ]; then
      return 0
    fi
  done

  return 1
}

if [ "$FORCE" != "true" ] && ! can_transition "$CURRENT_STATUS" "$NEW_STATUS"; then
  echo "Error: Invalid transition: $CURRENT_STATUS -> $NEW_STATUS" >&2
  echo "Allowed from $CURRENT_STATUS: $(allowed_transitions "$CURRENT_STATUS")" >&2
  echo "Use --force to bypass validation." >&2
  exit 1
fi

if [ "$CURRENT_STATUS" = "$NEW_STATUS" ]; then
  echo "No change: $REQ_ID is already $NEW_STATUS"
  exit 0
fi

# Validate updatedAt >= createdAt
CREATED_AT="$(jq -r --arg reqId "$REQ_ID" '.requirements[] | select(.id == $reqId) | .createdAt' "$REQ_MANIFEST")"
if [ -n "$CREATED_AT" ] && [ "$CREATED_AT" != "null" ] && [[ "$TIMESTAMP" < "$CREATED_AT" ]]; then
  echo "Error: updatedAt ($TIMESTAMP) would be before createdAt ($CREATED_AT)" >&2
  exit 1
fi

jq --arg reqId "$REQ_ID" \
   --arg newStatus "$NEW_STATUS" \
   --arg ts "$TIMESTAMP" \
   '.requirements |= map(
     if .id == $reqId then
       .status = $newStatus
       | .updatedAt = $ts
       | if $newStatus == "DEPLOYED" then .deployedAt = $ts else . end
     else
       .
     end
   )' \
   "$REQ_MANIFEST" > "$REQ_MANIFEST.tmp" && mv "$REQ_MANIFEST.tmp" "$REQ_MANIFEST"

if [ "$REFRESH_DOCS" = "true" ]; then
  "$PROJECT_ROOT/scripts/regenerate-docs.sh" >/dev/null
fi

git -C "$PROJECT_ROOT" add \
  .requirement-manifest.json \
  REQUIREMENTS.md \
  docs/STATUS.md \
  docs/ROADMAP.md \
  docs/DEPENDENCIES.md \
  docs/requirements/ 2>/dev/null || true

git -C "$PROJECT_ROOT" commit -m "chore: update $REQ_ID status to $NEW_STATUS" --no-verify 2>/dev/null || true

echo "✅ Updated $REQ_ID"
echo "   $CURRENT_STATUS -> $NEW_STATUS"
if [ "$REFRESH_DOCS" = "true" ]; then
  echo "   Docs regenerated"
else
  echo "   Docs regeneration skipped (--no-refresh)"
fi
