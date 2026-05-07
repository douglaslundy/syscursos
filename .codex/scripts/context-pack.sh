#!/usr/bin/env bash
set -euo pipefail

OUT=".codex/context/PACK.md"

{
  echo "# Codex Context Pack"
  echo
  echo "## Git"
  git branch --show-current 2>/dev/null || true
  git status --short 2>/dev/null || true

  echo
  echo "## Arquivos relevantes"
  find . -maxdepth 3 \
    -type f \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./dist/*" \
    ! -path "./build/*" \
    ! -path "./.next/*" \
    | sort \
    | head -300

  for f in \
    AGENTS.md \
    package.json \
    README.md \
    .env.example \
    .codex/context/PROJECT_BRIEF.md \
    .codex/context/ARCHITECTURE.md \
    .codex/context/DECISIONS.md \
    .codex/context/CURRENT_STATE.md \
    .codex/context/COMMANDS.md \
    .codex/context/GLOSSARY.md
  do
    [ -f "$f" ] && echo -e "\n--- $f ---\n" && cat "$f"
  done
} > "$OUT"

echo "Gerado: $OUT"
