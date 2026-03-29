#!/bin/bash
# Generate all documentation from requirement and worktree manifests

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REQ_MANIFEST="$PROJECT_ROOT/.requirement-manifest.json"
WORKTREE_MANIFEST="$PROJECT_ROOT/.worktree-manifest.json"

if [ ! -f "$REQ_MANIFEST" ]; then
  echo "❌ Error: .requirement-manifest.json not found"
  exit 1
fi

mkdir -p "$PROJECT_ROOT/docs"

echo "🔨 Regenerating documentation..."

# Sync per-requirement spec status lines with manifest so detailed docs don't drift.
echo "🧩 Syncing docs/requirements status fields..."
while IFS=$'\t' read -r REQ_ID REQ_STATUS; do
  [ -z "$REQ_ID" ] && continue

  SPEC_FILE="$(find "$PROJECT_ROOT/docs/requirements" -maxdepth 1 -type f -name "${REQ_ID}-*.md" | head -1)"
  [ -z "$SPEC_FILE" ] && continue

  awk -v status="$REQ_STATUS" '
    BEGIN { replaced = 0 }
    {
      if (!replaced && $0 ~ /^\*\*Status\*\*:/) {
        print "**Status**: " status "  "
        replaced = 1
      } else {
        print $0
      }
    }
  ' "$SPEC_FILE" > "$SPEC_FILE.tmp" && mv "$SPEC_FILE.tmp" "$SPEC_FILE"
done < <(jq -r '.requirements[] | [.id, .status] | @tsv' "$REQ_MANIFEST")

# Generate REQUIREMENTS.md summary
echo "📄 Generating REQUIREMENTS.md..."
{
  echo "# Product Requirements"
  echo ""
  echo "Auto-generated summary of all product requirements. For detailed specs, see individual files in \`docs/requirements/\`."
  echo ""
  echo "| ID | Name | Status | Priority | Worktree | Created | Updated |"
  echo "|---|---|---|---|---|---|---|"
  
  jq -r '.requirements[] | 
    "| \(.id) | \(.name) | \(.status) | \(.priority) | \(.worktreeId // "—") | \(.createdAt | split("T")[0]) | \(.updatedAt | split("T")[0]) |"' \
    "$REQ_MANIFEST"
  
  echo ""
  echo "## Status Breakdown"
  echo "- **Proposed**: $(jq '[.requirements[] | select(.status == "PROPOSED")] | length' "$REQ_MANIFEST")"
  echo "- **In Progress**: $(jq '[.requirements[] | select(.status == "IN_PROGRESS")] | length' "$REQ_MANIFEST")"
  echo "- **Code Review**: $(jq '[.requirements[] | select(.status == "CODE_REVIEW")] | length' "$REQ_MANIFEST")"
  echo "- **Merged**: $(jq '[.requirements[] | select(.status == "MERGED")] | length' "$REQ_MANIFEST")"
  echo "- **Deployed**: $(jq '[.requirements[] | select(.status == "DEPLOYED")] | length' "$REQ_MANIFEST")"
  echo "- **Blocked**: $(jq '[.requirements[] | select(.status == "BLOCKED")] | length' "$REQ_MANIFEST")"
  echo "- **Backlog**: $(jq '[.requirements[] | select(.status == "BACKLOG")] | length' "$REQ_MANIFEST")"
  echo "- **Cancelled**: $(jq '[.requirements[] | select(.status == "CANCELLED")] | length' "$REQ_MANIFEST")"
  echo ""
  echo "## Next Steps"
  echo "Use \`/add-requirement \"Feature name\" \"Description\"\` to submit requirements."
  echo ""
  echo "---"
  echo ""
  echo "* Last updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "* Structured data: See \`.requirement-manifest.json\`"
  echo "* Worktree mapping: See \`.worktree-manifest.json\`"
} > "$PROJECT_ROOT/REQUIREMENTS.md"

# Generate STATUS.md (Kanban board)
echo "📊 Generating docs/STATUS.md..."
{
  echo "# Project Status"
  echo ""
  echo "Kanban-style view of all requirements and their current state."
  echo ""
  
  for STATUS in PROPOSED IN_PROGRESS CODE_REVIEW MERGED DEPLOYED BLOCKED BACKLOG CANCELLED; do
    COUNT=$(jq "[.requirements[] | select(.status == \"$STATUS\")] | length" "$REQ_MANIFEST")
    echo "## $STATUS ($COUNT)"
    echo ""
    jq -r ".requirements[] | select(.status == \"$STATUS\") | 
      \"* \(.id): \(.name) (priority: \(.priority))\n  - Worktree: \(.worktreeId // \"none\")\"" \
      "$REQ_MANIFEST"
    echo ""
  done
  
  TOTAL=$(jq '.requirements | length' "$REQ_MANIFEST")
  DEPLOYED=$(jq '[.requirements[] | select(.status == "DEPLOYED")] | length' "$REQ_MANIFEST")
  if [ "$TOTAL" -eq 0 ]; then
    PCT=0
  else
    PCT=$((DEPLOYED * 100 / TOTAL))
  fi
  
  echo "## Stats"
  echo "- Total Requirements: $TOTAL"
  echo "- Deployed: $DEPLOYED ($PCT%)"
  echo "- In Progress: $(jq '[.requirements[] | select(.status == "IN_PROGRESS")] | length' "$REQ_MANIFEST")"
  echo "- Blocked: $(jq '[.requirements[] | select(.status == "BLOCKED")] | length' "$REQ_MANIFEST")"
} > "$PROJECT_ROOT/docs/STATUS.md"

# Generate ROADMAP.md (timeline)
echo "📈 Generating docs/ROADMAP.md..."
{
  echo "# Roadmap"
  echo ""
  echo "Timeline view of all requirements organized by status and priority."
  echo ""
  echo "## Critical Items"
  jq -r '.requirements[] | select(.priority == "CRITICAL") | "* [\(.status)] \(.id): \(.name)"' "$REQ_MANIFEST"
  echo ""
  echo "## High Priority"
  jq -r '.requirements[] | select(.priority == "HIGH") | "* [\(.status)] \(.id): \(.name)"' "$REQ_MANIFEST"
  echo ""
  echo "## Medium Priority"
  jq -r '.requirements[] | select(.priority == "MEDIUM") | "* [\(.status)] \(.id): \(.name)"' "$REQ_MANIFEST"
  echo ""
  echo "## Low Priority"
  jq -r '.requirements[] | select(.priority == "LOW") | "* [\(.status)] \(.id): \(.name)"' "$REQ_MANIFEST"
} > "$PROJECT_ROOT/docs/ROADMAP.md"

# Generate DEPENDENCIES.md
echo "🔗 Generating docs/DEPENDENCIES.md..."
{
  echo "# Requirement Dependencies"
  echo ""
  echo "Graph of requirement dependencies and relationships."
  echo ""
  jq -r '.requirements[] | 
    if .dependsOn and (.dependsOn | length) > 0 then
      "\(.id): \(.name)\n  └─ Depends on: \(.dependsOn | join(", "))\n"
    else
      "\(.id): \(.name) (no dependencies)\n"
    end' "$REQ_MANIFEST"
} > "$PROJECT_ROOT/docs/DEPENDENCIES.md"

echo ""
echo "✅ Documentation regenerated successfully!"
echo ""
echo "Generated files:"
echo "  - REQUIREMENTS.md (summary table)"
echo "  - docs/STATUS.md (kanban board)"
echo "  - docs/ROADMAP.md (timeline)"
echo "  - docs/DEPENDENCIES.md (dependency graph)"
