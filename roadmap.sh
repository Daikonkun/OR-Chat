#!/bin/bash
# Regenerate docs and show roadmap view

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

"$PROJECT_ROOT/scripts/regenerate-docs.sh" >/dev/null
cat "$PROJECT_ROOT/docs/ROADMAP.md"
