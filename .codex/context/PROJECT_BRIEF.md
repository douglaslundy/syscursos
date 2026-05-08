# Project Brief

## Objetivo identificado
Plataforma web de cursos (LMS) com separacao de acesso por perfil e areas distintas para autenticacao, painel administrativo/produtor e area do aluno.

Evidencias:
- Rotas em `src/app/admin/*`, `src/app/app/*` e `src/app/(auth)/login/*`
- Modelo de dominio em `prisma/schema.prisma`

## Stack identificada
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- Supabase Auth (`@supabase/ssr` e `@supabase/supabase-js`)
- Zod para validacao de entradas
- Vitest (unit/integration) e Playwright (e2e)

Evidencias:
- `package.json`
- `prisma/schema.prisma`
- `src/lib/supabase/*`
- `src/tests/*`

## Modulos principais identificados
- Autenticacao/login/cadastro: `src/server/actions/auth-actions.ts`, `src/app/(auth)/login/*`
- Painel admin/produtor (dashboard, cursos, modulos, aulas, alunos, matriculas, usuarios): `src/app/admin/*`, `src/server/services/admin-service.ts`
- Area do aluno (meus cursos, aula, cadernos, meus dados): `src/app/app/*`, `src/server/services/student-service.ts`
- Camada de dados/admin e aluno: `src/server/repositories/admin-repository.ts`, `src/server/repositories/student-repository.ts`

## Regras aparentes no repositorio
- Controle de acesso por papeis `ADMIN`, `PRODUCER`, `STUDENT`.
- Rotas protegidas por middleware e guards server-side.
- Escopo de dados por organizacao (`organizationId`) e ownership por produtor em cursos/alunos.
- Regras de acesso de aluno condicionadas a matricula e estado de curso/conteudo.

Evidencias:
- `middleware.ts`
- `src/server/permissions/rbac.ts`
- `src/server/auth/guards.ts`
- `src/server/services/admin-service.ts`
- `src/server/services/student-service.ts`

## Itens nao identificados no repositorio
- SLA/SLO formal
- Processo formal de release/versionamento
- Observabilidade centralizada (APM, tracing, metrics)
