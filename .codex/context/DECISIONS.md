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
