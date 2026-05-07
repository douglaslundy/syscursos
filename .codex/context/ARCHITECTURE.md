# Architecture

## Visão geral
Aplicação monolítica Next.js (App Router) com renderização server-side e uso de Server Actions para operações de backend. O domínio é organizado em camadas no diretório `src/server`.

Fluxo principal identificado:
1. UI em `src/app/*` e `src/components/*`.
2. Chamadas para actions em `src/server/actions/*`.
3. Orquestração de regras em `src/server/services/*`.
4. Acesso a dados em `src/server/repositories/*`.
5. Persistência PostgreSQL via Prisma (`src/lib/db/prisma.ts`).

## Camadas e módulos
- `src/app`: rotas, layouts e páginas (admin, aluno e autenticação).
- `src/components`: componentes de interface por domínio (`admin`, `student`, `shared`, `ui`).
- `src/server/actions`: ponto de entrada do backend acionado pela UI.
- `src/server/services`: regras de negócio e orquestrações.
- `src/server/repositories`: consultas e mutações de dados.
- `src/server/validators`: validação de payloads e parâmetros.
- `src/server/auth` e `src/server/permissions`: sessão, guards e RBAC.
- `src/lib/supabase`: clientes e middleware de autenticação.

## Banco de dados
Modelo relacional com Prisma para:
- usuários e perfis de aluno;
- cursos, módulos e aulas;
- matrículas;
- progresso e anotações por aula.

Evidência: `prisma/schema.prisma`.

## Autenticação e autorização
- Integração com Supabase para sessão/auth.
- Guardas de autorização no backend e RBAC por papéis.
- Middleware de sessão na aplicação.

Evidências:
- `src/lib/supabase/middleware.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`

## Testes e qualidade
- Unitários e integração com Vitest.
- E2E com Playwright.
- Qualidade estática com ESLint + TypeScript.
- Hooks git com Husky/lint-staged.

Evidência: `package.json`, `src/tests/*`, `.husky/*`.

## Pontos não identificados no repositório
- Arquitetura de microserviços/eventos (não identificado no repositório).
- Mensageria assíncrona dedicada (não identificado no repositório).
- Cache distribuído explícito (não identificado no repositório).
