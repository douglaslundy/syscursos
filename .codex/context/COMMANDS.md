# Commands

## Desenvolvimento
- `npm run dev`: sobe ambiente local Next.js.
- `npm run start`: executa build ja gerada.

## Qualidade
- `npm run lint`: executa ESLint.
- `npm run typecheck`: executa checagem de tipos TypeScript.

## Testes
- `npm run test`: suite completa Vitest.
- `npm run test:unit`: testes unitarios Vitest.
- `npm run test:integration`: testes de integracao Vitest.
- `npm run test:e2e`: testes E2E Playwright.
- `npm run test:watch`: modo watch do Vitest.

## Build
- `npm run build`: gera Prisma Client e build Next.js.

## Banco/Prisma
- `npm run prisma:validate`: valida schema Prisma.
- `npm run prisma:migrate`: cria/aplica migration em dev.
- `npm run prisma:seed`: executa seed.

## Auth/Supabase
- `npm run auth:provision`: provisiona usuarios auth via script.

## Observacao
Comandos acima foram extraidos de `package.json`.
