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
