#!/bin/bash
# Regenerate docs and show requirement dependency graph

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

"$PROJECT_ROOT/scripts/regenerate-docs.sh" >/dev/null
cat "$PROJECT_ROOT/docs/DEPENDENCIES.md"
