# Decisions

## 2026-05-08 - Arquitetura em camadas com Server Actions

Decisao evidente no codigo:
- Mutacoes entram por `src/server/actions/*`, delegam para `services` e persistem via `repositories`.

Evidencias:
- `src/server/actions/admin-actions.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`

## 2026-05-08 - Autenticacao Supabase com autorizacao server-side

Decisao evidente no codigo:
- Sessao resolvida via Supabase e autorizacao reforcada por middleware + guards server-side.

Evidencias:
- `middleware.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`

## 2026-05-08 - Isolamento multi-tenant por organizacao

Decisao evidente no codigo:
- Modelo com `Organization` e escopo administrativo por `organizationId`.

Evidencias:
- `prisma/schema.prisma`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`

## 2026-05-08 - Validacao de entrada com Zod

Decisao evidente no codigo:
- Validadores em `src/server/validators/*` usados nas actions.

Evidencias:
- `src/server/validators/admin.ts`
- `src/server/validators/student.ts`
- `src/server/actions/admin-actions.ts`

## 2026-05-08 - Capa de modulo por URL HTTPS

Decisao evidente no codigo:
- `Module` recebeu `coverImageUrl` validado como URL HTTPS no fluxo administrativo.

Evidencias:
- `prisma/schema.prisma`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/app/admin/courses/[courseId]/modules/page.tsx`

## 2026-05-08 - Cadastro publico separado por audiencia

Decisao evidente no codigo:
- Cadastro publico separado para `admin` e `client`, com role determinada pela pagina de cadastro.

Evidencias:
- `src/server/actions/auth-actions.ts`
- `src/server/auth/schemas.ts`
- `src/app/(auth)/login/admin/register/page.tsx`
- `src/app/(auth)/login/client/register/page.tsx`

## 2026-05-08 - Role PRODUCER com escopo administrativo restrito

Decisao evidente no codigo:
- `PRODUCER` acessa gestao de cursos/modulos/aulas no `/admin`, sem acesso a usuarios/alunos/matriculas.

Evidencias:
- `prisma/schema.prisma`
- `src/server/permissions/rbac.ts`
- `src/server/services/admin-service.ts`
- `src/components/admin/admin-shell.tsx`
- `src/server/actions/auth-actions.ts`
