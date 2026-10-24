#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

git rev-parse --is-inside-work-tree >/dev/null

git sparse-checkout init --no-cone

cat > .git/info/sparse-checkout <<'EOF'
/*
!/.claude/
!/.cursorignore
!/.zed/
!/AGENTS.md
!/CLAUDE.md
!/fff.code-workspace
!/rlottie_with_printf/
!/snapshot-server/

/public/
/public/**
!/public/*-*.css
!/public/*-*.js
!/public/*-*.js.map
!/public/*-*.svg
!/public/index.html
EOF

git sparse-checkout reapply

printf '%s\n' 'Web-only sparse checkout is active.'
