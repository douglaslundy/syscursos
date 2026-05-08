# Decisões Evidentes no Código

## 1) Stack principal em Next.js + TypeScript
Evidência:
- Dependências e scripts em `package.json` (`next`, `react`, `typescript`).

## 2) Persistência com Prisma sobre PostgreSQL
Evidência:
- `prisma/schema.prisma` com `provider = "postgresql"` e Prisma Client.

## 3) Autenticação integrada ao Supabase
Evidência:
- Dependências `@supabase/ssr` e `@supabase/supabase-js`.
- Arquivos em `src/lib/supabase/*` e middleware de sessão.

## 4) Backend organizado por camadas (actions/services/repositories/validators)
Evidência:
- Estrutura `src/server/actions`, `src/server/services`, `src/server/repositories`, `src/server/validators`.

## 5) Separação explícita de áreas por rotas
Evidência:
- Rotas em `src/app/admin/*` e `src/app/app/*`.

## 6) Estratégia de testes em níveis
Evidência:
- Scripts `test:unit`, `test:integration`, `test:e2e` no `package.json`.
- Estrutura `src/tests/unit`, `src/tests/integration`, `src/tests/e2e`.

## 7) Pipeline local de qualidade
Evidência:
- Scripts de lint/typecheck/build/test em `package.json`.
- Hooks com Husky + lint-staged.

Decisões de produto não explicitamente refletidas em código atual: não identificado no repositório.
## 2026-05-08 - Base de tenancy por organizacao para evolucao SaaS

Decisao:

Introduzir a entidade `Organization` e vincular `User` e `Course` por `organizationId`, usando esse identificador para escopo de operacoes administrativas e metricas de consumo por aluno.

Motivo:

O requisito exige que cada administrador gerencie somente seus alunos e cursos, com suporte a cadastro de outros administradores no mesmo contexto de tenant.

Alternativas consideradas:

- Isolamento apenas por filtros em memoria sem chave de tenant no banco.
- Isolamento apenas por role sem segmentacao de dados.

Impacto:

- Passa a existir base estrutural para isolamento multi-admin por tenant.
- Seed e provisionamento foram adaptados para garantir tenant padrao em ambiente local.
- Novas telas de cadastro de usuario e meus dados usam esse contexto.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260508110000_multi_tenant_organizations/migration.sql`
- `prisma/seed.ts`
- `prisma/provision-auth-users.ts`
- `src/server/auth/session.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
