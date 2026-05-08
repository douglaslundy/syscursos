# Commands

## Ambiente
- Node: `20.x`
- NPM: `>=9.0.0`

Evidencia:
- `package.json` (`engines`)

## Desenvolvimento
- `npm run dev`: inicia aplicacao Next em modo desenvolvimento
- `npm run build`: gera Prisma Client e executa build (`prisma generate && next build`)
- `npm run start`: inicia aplicacao em modo producao

## Qualidade
- `npm run lint`: lint com Next ESLint
- `npm run typecheck`: checagem de tipos (`tsc --noEmit`)

## Testes
- `npm run test`: suite completa Vitest
- `npm run test:unit`: testes unitarios
- `npm run test:integration`: testes de integracao
- `npm run test:e2e`: testes E2E com Playwright
- `npm run test:watch`: Vitest em watch mode

## Prisma / Banco
- `npm run prisma:validate`: valida schema Prisma
- `npm run prisma:migrate`: cria/aplica migration no fluxo `prisma migrate dev`
- `npm run prisma:seed`: executa seed (`tsx prisma/seed.ts`)

## Provisionamento / Auth
- `npm run auth:provision`: executa `prisma/provision-auth-users.ts`
- Script adicional identificado: `prisma/provision-saas-accounts.ts` (sem alias em `package.json`)

## Automacoes de install/commit
- `postinstall`: `prisma generate`
- `prepare`: `husky`
- `lint-staged`: ESLint em `*.{ts,tsx,js,jsx}` e Prettier em `*.{json,md,css}`

## Comandos nao identificados no repositorio
- Script oficial de reset completo de banco
- Script oficial de deploy automatizado de migrations em producao
