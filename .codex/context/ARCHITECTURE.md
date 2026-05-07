# Arquitetura Identificada

## Visao geral
- Aplicacao monorepo unica (frontend + backend) em Next.js App Router.
- Separacao clara entre camadas de interface (`src/app`, `src/components`) e backend (`src/server`).
- Persistencia relacional com Prisma + PostgreSQL.
- Autenticacao e sessao com Supabase.

## Camadas e responsabilidades observadas
- `src/app`: rotas, layouts, paginas e composicao por contexto (auth, admin, aluno).
- `src/components`: componentes de interface (admin, student, shared, ui).
- `src/server/actions`: funcoes de entrada de operacoes do servidor.
- `src/server/services`: regras de negocio e orquestracao.
- `src/server/repositories`: queries e persistencia.
- `src/server/auth` e `src/server/permissions`: sessao, guards e RBAC.
- `src/server/validators`: validacao de entrada com Zod.
- `src/lib/db` e `src/lib/supabase`: infraestrutura compartilhada.

## Rotas principais identificadas
- Publico/auth: `src/app/(auth)/login/page.tsx`, `src/app/page.tsx`.
- Admin: `src/app/admin/*`.
- Aluno: `src/app/app/*`.

## Modelo de dados identificado (Prisma)
Entidades: `User`, `StudentProfile`, `Course`, `Module`, `Lesson`, `Enrollment`, `LessonNote`, `LessonProgress`.

Evidencias de regras de integridade:
- unicidade por email de usuario;
- unicidade de posicao por curso/modulo e modulo/aula;
- unicidade de matricula (`studentId`, `courseId`);
- unicidade de anotacao e progresso por aluno/aula.

## Seguranca e acesso (evidencias)
- Middleware presente (`middleware.ts`).
- Modulos de auth/permissions (`src/server/auth/*`, `src/server/permissions/rbac.ts`).
- Documento de seguranca e RLS em `docs/SECURITY.md` e migracao `20260504130000_auth_rls_policies`.

## Padrões aparentes
- Validacao server-side antes de persistencia.
- Separacao entre regra de negocio e acesso a dados.
- Testes divididos por nivel (unit, integration, e2e).

## Pontos nao identificados claramente
- Eventuais integracoes externas adicionais alem de Supabase/YouTube: nao identificado no repositorio.
- Topologia de deploy detalhada (infra completa): nao identificado no repositorio.
