# Decisoes Evidentes no Codigo

## 1) Stack principal em Next.js + TypeScript
Evidencia:
- Dependencias e scripts em `package.json` (`next`, `react`, `typescript`).

## 2) Persistencia com Prisma sobre PostgreSQL
Evidencia:
- `prisma/schema.prisma` com `provider = "postgresql"` e client Prisma.

## 3) Autenticacao integrada ao Supabase
Evidencia:
- Dependencias `@supabase/ssr` e `@supabase/supabase-js`.
- Arquivos em `src/lib/supabase/*` e middleware de sessao.

## 4) Separacao de backend por camadas (actions/services/repositories/validators)
Evidencia:
- Estrutura `src/server/actions`, `src/server/services`, `src/server/repositories`, `src/server/validators`.

## 5) Separacao de area administrativa e area do aluno por rotas
Evidencia:
- Rotas em `src/app/admin/*` e `src/app/app/*`.

## 6) Estrategia de testes em tres niveis
Evidencia:
- Scripts `test:unit`, `test:integration`, `test:e2e`.
- Pastas `src/tests/unit`, `src/tests/integration`, `src/tests/e2e`.

## 7) Pipeline local de qualidade com lint/typecheck/test/build
Evidencia:
- Scripts dedicados em `package.json`.
- Husky/lint-staged configurados.

Decisoes de produto nao explicitamente refletidas em codigo atual: nao identificado no repositorio.
