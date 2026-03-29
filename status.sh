#!/bin/bash
# Show project requirement status with optional doc refresh

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REQ_MANIFEST="$PROJECT_ROOT/.requirement-manifest.json"
REFRESH="${1:-}"

if [ ! -f "$REQ_MANIFEST" ]; then
  echo "Error: .requirement-manifest.json not found" >&2
  exit 1
fi

if [ "$REFRESH" != "--no-refresh" ]; then
  "$PROJECT_ROOT/scripts/regenerate-docs.sh" >/dev/null
fi

echo "=== Project Status ==="
echo "Manifest: $REQ_MANIFEST"

TOTAL_COUNT="$(jq '.requirements | length' "$REQ_MANIFEST")"
OUTSTANDING_COUNT="$(jq '[.requirements[] | select(.status != "DEPLOYED" and .status != "CANCELLED" and .status != "MERGED")] | length' "$REQ_MANIFEST")"
MERGED_COUNT="$(jq '[.requirements[] | select(.status == "MERGED")] | length' "$REQ_MANIFEST")"
DEPLOYED_COUNT="$(jq '[.requirements[] | select(.status == "DEPLOYED")] | length' "$REQ_MANIFEST")"
COMPLETED_COUNT="$((MERGED_COUNT + DEPLOYED_COUNT))"

echo "Total: $TOTAL_COUNT"
echo "Outstanding: $OUTSTANDING_COUNT"
echo "Completed: $COMPLETED_COUNT"

echo ""
echo "Outstanding REQ IDs:"
OUTSTANDING_LINES="$(jq -r '
  . as $root |
  ["PROPOSED", "BACKLOG", "IN_PROGRESS", "CODE_REVIEW", "BLOCKED"]
  | .[] as $status
  | [$root.requirements[] | select(.status == $status)] as $items
  | select(($items | length) > 0)
  | "- " + $status + ": " + ($items | map(.id) | join(", "))
' "$REQ_MANIFEST")"

if [ -n "$OUTSTANDING_LINES" ]; then
  echo "$OUTSTANDING_LINES"
else
  echo "- None"
fi

echo ""
echo "Outstanding details:"
DETAIL_LINES="$(jq -r '.requirements[]
  | select(.status != "DEPLOYED" and .status != "CANCELLED" and .status != "MERGED")
  | "- \(.id) [\(.status)]: \(.name) (priority: \(.priority))"' "$REQ_MANIFEST")"

if [ -n "$DETAIL_LINES" ]; then
  echo "$DETAIL_LINES"
else
  echo "- None"
fi

echo ""
echo "Completed (MERGED + DEPLOYED):"
echo "- MERGED: $MERGED_COUNT"
echo "- DEPLOYED: $DEPLOYED_COUNT"
echo "- TOTAL COMPLETED: $COMPLETED_COUNT"

echo ""
echo "Status board: docs/STATUS.md"
