# PROJECT_STATUS

## Objetivo

Planejar e executar os ajustes solicitados em 2026-05-07 no SysCursos, com separacao de login admin/cliente, landing page inicial, melhoria de UX no cadastro de aulas, cadernos em markdown e capa de curso no cadastro/exibicao.

## Decisoes

- Tratar a demanda em etapas pequenas com commit por tarefa para reduzir risco de regressao.
- Preservar regras atuais de seguranca (RBAC, validacoes server-side e filtros por matricula ativa).
- Manter alteracoes focadas no escopo funcional solicitado, sem refatoracao ampla.

## Tarefas concluidas

- Leitura obrigatoria de contexto (`AGENTS.md`, `.codex/context/PACK.md`, `docs/PROJECT_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`, `docs/REVIEW.md`).
- Verificacao do estado atual do repositorio e do ultimo commit.
- Consolidacao dos novos requisitos funcionais, nao funcionais, implicitos, ambiguidades, riscos e dependencias para execucao.
- Correcao da limpeza do formulario de aulas no admin apos salvar.
- Validacao completa executada com `lint`, `typecheck`, `test` e `build`.
- Landing page inicial criada em `/` com botoes para login cliente e admin.
- Logins separados em `/login/client` e `/login/admin`.
- Fluxo de cliente ajustado para aceitar usuario admin na area `/app` quando existir perfil de aluno.
- Cadernos migrados para renderizacao markdown segura com titulo da aula em heading.
- Cadastro de curso ampliado com `coverImageUrl` e exibicao de capa nos cards da area do aluno.
- Migration criada: `20260507195500_course_cover_image`.

## Tarefas pendentes (foco atual)

- Aplicar migration de capa no Supabase de producao.
- Validar manualmente os fluxos atualizados em navegador com dados reais.

## Arquivos alterados

- `PROJECT_STATUS.md`
- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/components/shared/login-form.tsx`
- `middleware.ts`
- `src/server/actions/auth-actions.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`
- `src/app/app/layout.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/components/student/markdown-content.tsx`
- `prisma/schema.prisma`
- `prisma/migrations/20260507195500_course_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/components/student/course-card.tsx`
- `src/app/admin/courses/page.tsx`

## Riscos

- Ambiguidade sobre estrategia de armazenamento da imagem de capa (URL externa vs upload no storage).
- Separacao de login por rota pode conflitar com regra historica de redirecionamento automatico por role.
- Renderizacao markdown exige sanitizacao para prevenir XSS e preservar isolamento de dados.
- Alteracoes de formulario admin podem quebrar fluxo de edicao existente se reset ocorrer no momento errado.

## Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Ultimo commit

- `5b0c0cc feat(courses): adicionar capa no cadastro e exibicao do aluno`

## Proximos passos

1. Aplicar migration no ambiente Supabase.
2. Executar validacao manual em browser para login admin/cliente e cards com capa.
3. Caso necessario, evoluir de URL de capa para upload em storage em etapa dedicada.
