#!/usr/bin/env bash
set -euo pipefail

cat > .codex/context/CURRENT_STATE.md <<STATE
# Estado atual

Branch atual:
$(git branch --show-current 2>/dev/null || echo "Não detectado")

Último commit:
$(git log -1 --oneline 2>/dev/null || echo "Sem commit detectado")

Arquivos modificados:
$(git status --short 2>/dev/null || echo "Git não detectado")

Arquivos alterados recentemente:
$(git diff --name-only HEAD 2>/dev/null || true)

Pendências:
- Preencher contexto com base no código existente.
- Validar comandos oficiais.
- Registrar decisões arquiteturais já presentes no projeto.

Riscos:
- Contexto inicial pode estar incompleto.
- Algumas regras podem existir apenas implicitamente no código.
STATE

echo "Atualizado: .codex/context/CURRENT_STATE.md"
