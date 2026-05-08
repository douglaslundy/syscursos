# Current State

## Branch
- `main`

## Ultimo commit identificado
- `c887092 feat(admin): add module cover image url field`

## Escopo desta atualizacao
- Cadastro de capa por modulo (`coverImageUrl`) na camada administrativa.
- Cadastro publico separado por audiencia de login (`admin` e `client`) com criacao de tenant por organizacao.

## Arquivos de contexto atualizados nesta tarefa
- `.codex/context/CURRENT_STATE.md`
- `.codex/context/DECISIONS.md`

## Arquivos modificados no workspace (git status)
- `prisma/schema.prisma`
- `prisma/migrations/20260508153000_module_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `src/server/auth/schemas.ts`
- `src/server/actions/auth-actions.ts`
- `src/components/shared/login-form.tsx`
- `src/components/shared/register-form.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/register/page.tsx`
- `src/app/(auth)/login/client/register/page.tsx`
- `src/tests/integration/admin-service.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## Status geral inferido
- Projeto permanece em arquitetura em camadas com segregacao por tenant.
- Login e cadastro passam a oferecer fluxos publicos separados por publico.

## Itens nao identificados no repositorio
- Papel de usuario distinto para "produtor" alem de `ADMIN` e `STUDENT`.
- Fluxo de aprovacao manual para cadastro publico de administrador.
