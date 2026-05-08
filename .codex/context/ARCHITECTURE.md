# Architecture

## Visao geral
Aplicacao monolitica Next.js (App Router) com renderizacao server-side e Server Actions para mutacoes.

Fluxo tecnico identificado:
1. UI em `src/app/*` e `src/components/*`.
2. Mutacoes por Server Actions em `src/server/actions/*`.
3. Regras de negocio em `src/server/services/*`.
4. Persistencia em `src/server/repositories/*`.
5. Banco via Prisma em `src/lib/db/prisma.ts`.

## Camadas
- `src/app`: rotas, layouts, paginas.
- `src/components`: componentes visuais (admin/student/shared/ui).
- `src/server/actions`: entrada de mutacoes acionadas pela UI.
- `src/server/services`: regras, autorizacao e orquestracao.
- `src/server/repositories`: queries/mutacoes no Prisma.
- `src/server/validators`: validacao com Zod.
- `src/server/auth` e `src/server/permissions`: sessao, guards e RBAC.
- `src/lib/supabase`: clientes Supabase (server/middleware/admin).

## Dados e tenancy
- Banco PostgreSQL com Prisma.
- Modelo multi-tenant por `Organization`.
- `User` e `Course` vinculados por `organizationId`.
- Operacoes administrativas passam `organizationId` para restringir escopo.

Evidencias:
- `prisma/schema.prisma`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`

## Autenticacao e autorizacao
- Sessao via Supabase Auth.
- Middleware para bloquear rotas por contexto de usuario.
- Guards server-side com redirecionamento para login em erro/autorizacao.
- Regras de rota por papel: `/admin` e `/app`.

Evidencias:
- `middleware.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`

## Qualidade e testes
- Lint: `next lint`
- Typecheck: `tsc --noEmit`
- Testes: Vitest (unit/integration), Playwright (e2e)
- Build: `prisma generate && next build`

Evidencia:
- `package.json`

## Itens nao identificados no repositorio
- Arquitetura de microservicos
- Mensageria/event bus
- Cache distribuido dedicado
