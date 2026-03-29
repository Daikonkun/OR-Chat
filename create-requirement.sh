#!/bin/bash
# Create a new requirement and optionally start a worktree for it

set -e

REQ_NAME="${1:?Error: requirement name required}"
REQ_DESCRIPTION="${2:?Error: requirement description required}"
REQ_PRIORITY="${3:-MEDIUM}"

# Generate requirement ID
REQ_ID="REQ-$(date +%s)"
SLUG=$(echo "$REQ_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//; s/-$//')

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "📝 Creating requirement: $REQ_ID"
echo "   Name: $REQ_NAME"
echo "   Priority: $REQ_PRIORITY"

# Ensure manifest exists
if [ ! -f "$PROJECT_ROOT/.requirement-manifest.json" ]; then
  cat > "$PROJECT_ROOT/.requirement-manifest.json" << 'JSON'
{
  "$schema": ".requirement-manifest.schema.json",
  "version": "1.0",
  "projectName": "Vibe Project",
  "requirements": []
}
JSON
fi

# Add to manifest using jq
jq --arg id "$REQ_ID" \
   --arg name "$REQ_NAME" \
   --arg desc "$REQ_DESCRIPTION" \
   --arg priority "$REQ_PRIORITY" \
   --arg ts "$TIMESTAMP" \
   '.requirements += [{
     "id": $id,
     "name": $name,
     "description": $desc,
     "status": "PROPOSED",
     "priority": $priority,
     "createdAt": $ts,
     "updatedAt": $ts
   }]' \
   "$PROJECT_ROOT/.requirement-manifest.json" > "$PROJECT_ROOT/.requirement-manifest.json.tmp" && \
   mv "$PROJECT_ROOT/.requirement-manifest.json.tmp" "$PROJECT_ROOT/.requirement-manifest.json"

# Create detailed spec file
mkdir -p "$PROJECT_ROOT/docs/requirements"
cat > "$PROJECT_ROOT/docs/requirements/${REQ_ID}-${SLUG}.md" << EOF
# $REQ_NAME

**ID**: $REQ_ID  
**Status**: PROPOSED  
**Priority**: $REQ_PRIORITY  
**Created**: $TIMESTAMP  

## Description

$REQ_DESCRIPTION

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

(Add implementation notes here)

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
EOF

git -C "$PROJECT_ROOT" add \
  .requirement-manifest.json \
  REQUIREMENTS.md \
  docs/STATUS.md \
  docs/ROADMAP.md \
  docs/DEPENDENCIES.md \
  docs/requirements/ 2>/dev/null || true

git -C "$PROJECT_ROOT" commit -m "chore: create requirement $REQ_ID" --no-verify 2>/dev/null || true

echo "✅ Requirement created: $REQ_ID"
echo "📄 Spec: docs/requirements/${REQ_ID}-${SLUG}.md"
echo ""
echo "Next steps:"
echo "  1. Review the specification file"
echo "  2. Run: /start-work $REQ_ID"
echo "  3. This will create a git worktree for isolated development"
