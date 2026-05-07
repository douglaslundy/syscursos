# Comandos Identificados

## Ambiente
- Node: `20.x` (campo `engines` em `package.json`)
- npm: `>=9.0.0`

## Comandos principais (package.json)
- `npm run dev` - iniciar desenvolvimento com Next.js.
- `npm run build` - `prisma generate && next build`.
- `npm run start` - iniciar app buildada.
- `npm run lint` - lint com Next ESLint.
- `npm run typecheck` - `tsc --noEmit`.

## Testes
- `npm run test` - executar Vitest completo.
- `npm run test:unit` - unitarios em `src/tests/unit`.
- `npm run test:integration` - integracao em `src/tests/integration`.
- `npm run test:e2e` - E2E com Playwright.
- `npm run test:watch` - Vitest em watch.

## Prisma / banco
- `npm run prisma:validate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run auth:provision` (script `prisma/provision-auth-users.ts`)

## Hooks e qualidade
- `prepare` -> `husky`
- `postinstall` -> `prisma generate`
- `lint-staged` configurado para ESLint/Prettier em arquivos staged.

## Scripts auxiliares de contexto identificados
- `.codex/scripts/update-state.sh`
- `.codex/scripts/context-pack.sh`
- `.codex/scripts/update-state.ps1`
- `.codex/scripts/context-pack.ps1`

Uso oficial dos scripts PowerShell/Bash auxiliares: nao identificado no repositorio.
