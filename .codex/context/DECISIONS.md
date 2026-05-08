# Decisions

## 2026-05-08 - Autenticacao com Supabase + autorizacao local por papel

Decisao evidente no codigo:
- A autenticacao e feita no Supabase Auth, e a autorizacao final depende do usuario local (`users`) com papel e status.

Evidencias:
- `src/server/actions/auth-actions.ts`
- `src/server/auth/session.ts`
- `middleware.ts`

## 2026-05-08 - App Router com separacao de areas por rota

Decisao evidente no codigo:
- O projeto usa Next.js App Router com areas separadas para autenticacao, painel admin/produtor e area do aluno.

Evidencias:
- `src/app/(auth)/login/*`
- `src/app/admin/*`
- `src/app/app/*`

## 2026-05-08 - Modelo multi-tenant por organizacao

Decisao evidente no codigo:
- O isolamento de dados e estruturado por `organizations`, com `users` e `courses` vinculados por `organization_id`.

Evidencias:
- `prisma/schema.prisma`
- `src/server/repositories/admin-repository.ts`

## 2026-05-08 - Ownership de produtor para cursos e alunos

Decisao evidente no codigo:
- Cursos pertencem a produtor (`producer_id`) e alunos podem ser vinculados a produtores via `producer_students`.

Evidencias:
- `prisma/schema.prisma`
- `src/server/repositories/admin-repository.ts`

## 2026-05-08 - Camadas server separadas (actions -> services -> repositories)

Decisao evidente no codigo:
- O backend interno esta organizado em camadas, com actions delegando para services e services delegando para repositories.

Evidencias:
- `src/server/actions/admin-actions.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`

## 2026-05-08 - Validacao de entradas com Zod

Decisao evidente no codigo:
- Entradas de autenticacao e modulos server usam schemas Zod.

Evidencias:
- `src/server/auth/schemas.ts`
- `src/server/validators/admin.ts`
- `src/server/validators/student.ts`
