# Estado atual

Branch atual:
main

Ultimo commit:
5b0c0cc feat(courses): adicionar capa no cadastro e exibicao do aluno

Arquivos modificados:
M PROJECT_STATUS.md
M .codex/context/CURRENT_STATE.md
M docs/TODO.md
M docs/DECISIONS.md
M docs/REVIEW.md

Objetivo atual:
- Planejar e executar os ajustes solicitados em 2026-05-07 para login separado, landing page, markdown nos cadernos, correcoes de UX no admin e capa de curso.

Status desta atividade:
- Tarefas 1 a 7 concluidas.
- Landing page em `/` com entradas separadas para cliente e admin.
- Logins separados em `/login/client` e `/login/admin`.
- Fluxo cliente agora permite acesso de usuario admin em `/app` quando houver perfil de aluno.
- Cadernos renderizados em markdown com titulo de aula como heading.
- Cadastro de curso com `coverImageUrl` e exibicao elegante de capa na area do aluno.
- Migration criada para coluna `cover_image_url`.
- Validacao executada com sucesso em todas as etapas com `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

Pendencias imediatas:
- Aplicar migration `20260507195500_course_cover_image` no banco de producao (Supabase).
- Validar manualmente no browser os novos fluxos de login separado e capa de curso com dados reais.

Riscos:
- Nesta iteracao a capa foi definida como URL HTTPS validada; upload binario via storage permanece fora do escopo.
- Acesso de admin ao fluxo cliente depende de `studentProfileId` vinculado ao usuario.
