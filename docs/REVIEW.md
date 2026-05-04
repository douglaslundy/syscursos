# Review Tecnico

Este arquivo deve ser atualizado ao final de cada etapa.

## Modelo de preenchimento

### Etapa executada

### Arquivos criados ou alterados

### O que foi implementado

### Testes executados

### Resultado dos testes

### Riscos encontrados

### Pendencias

### Proxima etapa recomendada

---

## Historico

### 2026-05-04 - Fase 1: Planejamento

### Arquivos criados ou alterados

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Nao houve implementacao de codigo. Foram documentados:

- analise completa do escopo;
- validacao da stack;
- proposta de arquitetura;
- riscos tecnicos;
- riscos de seguranca;
- estrutura de pastas;
- plano de execucao por fases;
- decisoes tecnicas iniciais.

### Testes executados

Nao aplicavel nesta etapa, pois somente documentacao foi alterada e o projeto Next.js ainda nao foi criado.

### Resultado dos testes

Nao aplicavel.

### Riscos encontrados

- Necessidade de definir cedo o mapeamento entre Supabase Auth e entidades locais.
- Risco de acesso horizontal entre alunos se services, RLS e testes nao forem implementados em conjunto.
- Risco de Server Actions concentrarem regra demais se nao delegarem para services.
- Risco de performance em listagens sem paginacao e indices.
- Risco de excesso de writes no autosave de anotacoes.

### Pendencias

- Criar projeto e configurar stack base.
- Definir schema Prisma e policies RLS nas proximas fases.
- Implementar testes de autorizacao assim que auth e banco existirem.
- Executar lint, typecheck, testes e build a partir da Fase 2, quando houver codigo e scripts.

### Proxima etapa recomendada

Iniciar Fase 2 - Setup do projeto Next.js e ferramentas de qualidade.

---

### 2026-05-04 - Fase 2: Setup inicial

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `next-env.d.ts`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `.eslintrc.json`
- `.prettierrc.json`
- `.prettierignore`
- `.gitignore`
- `.env.example`
- `components.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `.husky/pre-commit`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/lib/utils.ts`
- `src/tests/setup.ts`
- `src/tests/unit/smoke.test.ts`
- estrutura inicial em `src/components`, `src/features`, `src/server`, `src/types` e `src/tests`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Setup inicial da aplicacao, sem autenticacao, banco ou telas funcionais:

- projeto Next.js com App Router;
- TypeScript strict;
- Tailwind CSS;
- configuracao base de shadcn/ui;
- ESLint;
- Prettier;
- Husky;
- lint-staged;
- `.env.example`;
- Vitest com Testing Library;
- Playwright;
- estrutura de pastas prevista na arquitetura;
- pagina raiz minima apenas para validar o setup.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
- `npm audit`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 1 teste unitario.
- `npm run build`: aprovado com Next.js 14.2.35.
- `npm audit --omit=dev`: encontrou 2 vulnerabilidades em dependencias de producao, relacionadas a Next.js e PostCSS interno do Next.
- `npm audit`: encontrou 16 vulnerabilidades no total, incluindo dependencias de desenvolvimento.

### Riscos encontrados

- O ambiente local usa Node 18.17.1. Next.js 15 falhou por exigir Node mais recente, entao foi adotado Next.js 14.2.35.
- O npm recomenda resolver vulnerabilidades principais com `npm audit fix --force`, que instalaria Next.js 16.2.4 e representaria mudanca quebravel para o runtime atual.
- Husky informou `.git can't be found` durante `npm install`, pois o workspace atual nao e um repositorio Git; o hook foi criado em `.husky/pre-commit` e funcionara quando o projeto estiver sob Git.
- O Vitest emitiu aviso de deprecacao sobre CJS build da API do Vite; nao bloqueia testes nesta fase.

### Pendencias

- Decidir upgrade de Node antes de migrar para Next.js 15/16 ou resolver completamente o audit de Next.js.
- Inicializar repositorio Git se Husky precisar ser ativado localmente.
- Iniciar Fase 3 somente apos confirmar credenciais e projeto Supabase, sem commitar secrets.

### Proxima etapa recomendada

Iniciar Fase 3 - Banco, configurando Supabase e Prisma sem expor credenciais.

---

### 2026-05-04 - Fase 3: Banco de dados

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/20260504120000_initial_schema/migration.sql`
- `prisma/seed.ts`
- `src/lib/db/prisma.ts`
- `docs/DATABASE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Camada inicial de banco de dados com Supabase Postgres e Prisma ORM:

- schema Prisma;
- entidades principais;
- relacionamentos;
- enums;
- indices;
- constraints;
- migration inicial versionada;
- seed inicial idempotente;
- helper singleton de Prisma Client.

Nao foram implementadas autenticacao, RLS, services, repositories, Server Actions ou telas funcionais.

### Testes executados

- `npm run prisma:validate`
- `npx prisma generate`
- `npm run prisma:migrate -- --name initial_schema`
- `npm run prisma:seed`
- `npm run lint`
- `npm run typecheck`

### Resultado dos testes

- `npx prisma generate`: aprovado.
- `npm run prisma:validate`: falhou sem `.env` por ausencia de `DIRECT_URL`; aprovado ao repetir com URLs temporarias nao secretas.
- `npm run prisma:migrate -- --name initial_schema`: bloqueado por ausencia de banco Postgres acessivel em `localhost:5432` ao usar placeholder local.
- `npm run prisma:seed`: bloqueado por ausencia de banco Postgres acessivel em `localhost:5432` ao usar placeholder local.
- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.

### Riscos encontrados

- Migration e seed nao foram aplicados em Supabase porque nao ha `.env` local com `DATABASE_URL` e `DIRECT_URL`.
- O schema usa `DIRECT_URL`; portanto validacoes Prisma sem `.env` exigem variaveis temporarias ou arquivo local ignorado pelo Git.
- RLS ainda nao existe e deve ser implementado na Fase 4 antes de expor dados sensiveis.
- A constraint `studentId + courseId` em `Enrollment` simplifica renovacao na primeira versao, mas nao preserva historico de multiplas matriculas no mesmo curso.

### Pendencias

- Criar `.env` local com URLs reais do Supabase Postgres.
- Executar `npm run prisma:migrate -- --name initial_schema` contra Supabase.
- Executar `npm run prisma:seed` contra Supabase.
- Implementar RLS e RBAC na Fase 4.

### Proxima etapa recomendada

Configurar Supabase real e aplicar a migration inicial antes de iniciar autenticacao e seguranca.
