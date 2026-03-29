#!/bin/bash
# Initialize a new vibe project with this orchestrator template

set -e

echo "🚀 Vibe Agent Orchestrator - Project Initialization"
echo "===================================================="
echo ""

PROJECT_ROOT="$(pwd)"
PROJECT_NAME="${1:-My Vibe Project}"

echo "📦 Project: $PROJECT_NAME"
echo "📍 Location: $PROJECT_ROOT"
echo ""

# Initialize git if needed
if [ ! -d .git ]; then
  echo "🔧 Initializing git repository..."
  git init
  git config user.email "ai@vibe.local"
  git config user.name "Vibe Agent"
fi

# Initialize manifests
echo "📋 Initializing requirement manifest..."
cat > .requirement-manifest.json << 'JSON'
{
  "$schema": ".requirement-manifest.schema.json",
  "version": "1.0",
  "projectName": "",
  "requirements": []
}
JSON

jq --arg name "$PROJECT_NAME" '.projectName = $name' .requirement-manifest.json > .requirement-manifest.json.tmp && \
  mv .requirement-manifest.json.tmp .requirement-manifest.json

echo "📋 Initializing worktree manifest..."
cat > .worktree-manifest.json << 'JSON'
{
  "$schema": ".worktree-manifest.schema.json",
  "version": "1.0",
  "worktrees": []
}
JSON

# Make scripts executable
chmod +x scripts/*.sh

# Create docs/requirements directory
mkdir -p docs/requirements

# Create initial commit
git add -A
git commit -m "chore: init project" --no-verify 2>/dev/null || true

echo "✅ Initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Create your first requirement: /add-requirement \"Feature\" \"Description\""
echo "  2. Check status: /status"
echo "  3. Start work: /start-work REQ-XXXXX"
echo ""
echo "Configuration complete. Open in VS Code to begin!"
