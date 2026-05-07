# Estado atual

Branch atual:
main

Ultimo commit:
fc97112 docs: atualizar status e estado atual para nova demanda

Arquivos modificados:
M PROJECT_STATUS.md
M .codex/context/CURRENT_STATE.md
M docs/TODO.md
M docs/REVIEW.md
M src/app/admin/modules/[moduleId]/lessons/page.tsx
M src/server/actions/admin-actions.ts

Objetivo atual:
- Planejar e executar os ajustes solicitados em 2026-05-07 para login separado, landing page, markdown nos cadernos, correcoes de UX no admin e capa de curso.

Status desta atividade:
- Tarefa 1 concluida: formulario de aula no admin agora limpa apos salvamento com sucesso.
- Validacao executada com sucesso: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

Pendencias imediatas:
- Criar landing page inicial com botoes separados para login de cliente e admin.
- Separar fluxos visuais de login em paginas distintas.
- Migrar exibicao do caderno para markdown seguro.
- Adicionar campo de capa de curso e exibir capa na area do aluno.
- Executar lint, typecheck, testes e build apos cada etapa funcional.

Riscos:
- Ambiguidade de produto sobre armazenamento/upload de imagem de capa.
- Possivel regressao de autorizacao ao separar fluxos de login.
- Risco de XSS se markdown nao for sanitizado corretamente.
