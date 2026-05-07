# Commands

## Pré-requisitos identificados
- Node.js `20.x`
- npm `>=9.0.0`

Evidência: campo `engines` em `package.json`.

## Desenvolvimento
- `npm run dev`: iniciar ambiente local Next.js.
- `npm run build`: gerar Prisma Client e build de produção.
- `npm run start`: iniciar app após build.

## Qualidade
- `npm run lint`: lint com Next/ESLint.
- `npm run typecheck`: checagem TypeScript sem emissão.

## Testes
- `npm run test`: suíte Vitest completa.
- `npm run test:unit`: testes unitários.
- `npm run test:integration`: testes de integração.
- `npm run test:e2e`: testes ponta a ponta (Playwright).
- `npm run test:watch`: Vitest em modo watch.

## Banco/Prisma
- `npm run prisma:validate`: validar schema Prisma.
- `npm run prisma:migrate`: criar/aplicar migration em ambiente de desenvolvimento.
- `npm run prisma:seed`: popular base com seed.

## Provisionamento de auth
- `npm run auth:provision`: provisionar usuários de autenticação conforme script.

## Comandos de produção não identificados
- Comando dedicado no `package.json` para `prisma migrate deploy`: não identificado no repositório.
- Script CI/CD oficial: não identificado no repositório.
