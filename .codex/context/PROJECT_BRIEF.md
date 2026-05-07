# Project Brief - SysCursos

## Objetivo
Plataforma SaaS de cursos online com area administrativa (`/admin`) e area do aluno (`/app`), conforme `docs/PROJECT_CONTEXT.md`.

## Stack identificada
- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- Backend no mesmo app: Server Actions + services/repositories em `src/server`.
- Banco: PostgreSQL via Prisma ORM (`prisma/schema.prisma`).
- Autenticacao: Supabase Auth (`src/lib/supabase/*`, `middleware.ts`).
- Validacao: Zod.
- Testes: Vitest (unitario/integracao) e Playwright (E2E).

## Dominios principais identificados
- Cursos (`Course`)
- Modulos (`Module`)
- Aulas (`Lesson`)
- Alunos (`User` + `StudentProfile`)
- Matriculas (`Enrollment`)
- Anotacoes (`LessonNote`)
- Progresso (`LessonProgress`)

## Estrutura funcional principal identificada
- `src/app/admin/*`: area administrativa.
- `src/app/app/*`: area do aluno.
- `src/server/actions/*`: entrada de mutacoes server-side.
- `src/server/services/*`: regras de negocio.
- `src/server/repositories/*`: acesso a dados via Prisma.
- `src/server/validators/*`: schemas/validacoes.

## Estado geral observado
- Repositorio em desenvolvimento ativo.
- `docs/TODO.md` e `PROJECT_STATUS.md` indicam varias etapas ja concluidas e ajustes recentes em CRUD/admin e experiencia do aluno.
- Pendencias operacionais especificas: nao identificado no repositorio de forma definitiva (existem listas de pendencias em `PROJECT_STATUS.md` e `docs/TODO.md`).
