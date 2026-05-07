# Estado atual

Branch atual:
main

Ultimo commit:
3b9a660 chore: add codex context layer

Arquivos modificados:
M PROJECT_STATUS.md
M .codex/context/CURRENT_STATE.md

Objetivo atual:
- Planejar e executar os ajustes solicitados em 2026-05-07 para login separado, landing page, markdown nos cadernos, correcoes de UX no admin e capa de curso.

Status desta atividade:
- Contexto obrigatorio lido (`AGENTS.md`, `.codex/context/PACK.md`, `docs/PROJECT_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`, `docs/REVIEW.md`).
- Status persistente atualizado em `PROJECT_STATUS.md`.
- Requisitos e plano prontos para execucao por tarefas pequenas com commit por tarefa.

Pendencias imediatas:
- Corrigir limpeza do formulario de cadastro de aula no admin.
- Criar landing page inicial com botoes separados para login de cliente e admin.
- Separar fluxos visuais de login em paginas distintas.
- Migrar exibicao do caderno para markdown seguro.
- Adicionar campo de capa de curso e exibir capa na area do aluno.
- Executar lint, typecheck, testes e build apos cada etapa funcional.

Riscos:
- Ambiguidade de produto sobre armazenamento/upload de imagem de capa.
- Possivel regressao de autorizacao ao separar fluxos de login.
- Risco de XSS se markdown nao for sanitizado corretamente.
