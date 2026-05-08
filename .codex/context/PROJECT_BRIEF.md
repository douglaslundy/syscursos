# Project Brief

## Objetivo identificado
Plataforma SaaS de cursos online (LMS) com area administrativa e area do aluno.

Evidencias:
- Rotas admin em `src/app/admin/*`
- Rotas aluno em `src/app/app/*`
- Entidades de dominio em `prisma/schema.prisma`

## Stack identificada
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- Supabase Auth (`@supabase/ssr` e `@supabase/supabase-js`)
- Vitest (unit/integration) e Playwright (e2e)
- ESLint + Prettier + Husky + lint-staged

Evidencias:
- `package.json`
- `prisma/schema.prisma`
- `src/lib/supabase/*`
- `src/tests/*`

## Dominios funcionais identificados
- Organizacoes/tenants (`Organization`)
- Usuarios e papeis (`User`, `UserRole`)
- Perfil de aluno (`StudentProfile`)
- Cursos, modulos e aulas (`Course`, `Module`, `Lesson`)
- Matriculas (`Enrollment`)
- Progresso de aula (`LessonProgress`)
- Anotacoes por aula (`LessonNote`)

Evidencia:
- `prisma/schema.prisma`

## Regras aparentes no repositorio
- Segregacao de acesso por papel (`ADMIN` e `STUDENT`) com middleware e guards server-side.
- Autorizacao critica no servidor (nao confiar apenas no frontend).
- Isolamento por tenant via `organizationId` nas operacoes administrativas.
- Fluxo administrativo e do aluno separados por rotas.

Evidencias:
- `middleware.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`
- `src/server/services/admin-service.ts`

## Itens nao identificados no repositorio
- SLO/SLA formal
- Processo oficial de release/versionamento
- Estrategia de observabilidade centralizada
