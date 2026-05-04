# Decisoes Tecnicas

Registre aqui toda decisao tecnica relevante tomada durante o desenvolvimento.

## Formato obrigatorio

```md
## AAAA-MM-DD - Titulo da decisao

Decisao:

Motivo:

Alternativas consideradas:

Impacto:

Arquivos afetados:
```

## 2026-05-04 - Validacao da stack oficial

Decisao:

Manter a stack oficial definida em `docs/PROJECT_CONTEXT.md`: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Server Actions, Route Handlers quando necessario, Supabase Auth, Prisma ORM, Supabase Postgres, Vitest, React Testing Library e Playwright.

Motivo:

A stack atende aos requisitos de SaaS com areas segregadas, autenticacao, autorizacao por perfil, RLS, CRUD administrativo, area do aluno, anotacoes privadas, progresso e bloqueio por expiracao de matricula.

Alternativas consideradas:

React SPA tradicional, backend separado desde a primeira versao, MySQL, Drizzle ORM e autenticacao customizada.

Impacto:

O projeto seguira arquitetura full stack com forte validacao server-side, menor duplicacao operacional, uso de RLS como defesa em profundidade e produtividade alta com TypeScript.

Arquivos afetados:

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Arquitetura modular por dominio

Decisao:

Adotar arquitetura modular orientada a dominio, separando `app`, `components`, `features`, `server`, `lib`, `types`, `tests` e `prisma`.

Motivo:

O projeto exige separacao clara entre UI, regras de negocio, validacoes, autorizacao, persistencia e infraestrutura. Essa separacao reduz componentes monoliticos, duplicacao e acoplamento.

Alternativas consideradas:

Organizacao por tipo em poucas pastas globais e organizacao totalmente por feature sem camada server compartilhada.

Impacto:

Services centralizarao regras de negocio e autorizacao; repositories ficarao restritos a persistencia; UI recebera apenas dados ja autorizados; Server Actions serao pequenas e delegarao regras para services.

Arquivos afetados:

- `docs/ARCHITECTURE.md`
- `docs/TODO.md`

## 2026-05-04 - Modelo de seguranca em camadas

Decisao:

Aplicar seguranca em camadas com middleware, verificacoes server-side, RBAC, services de permissao, validacao Zod, constraints de banco e RLS.

Motivo:

O principal risco do produto e acesso horizontal entre alunos ou acesso a cursos expirados/inativos. Nenhuma camada isolada e suficiente para proteger todos os fluxos.

Alternativas consideradas:

Proteger apenas por middleware, proteger apenas por UI, ou depender apenas de RLS.

Impacto:

Cada operacao sensivel devera validar autenticacao, perfil, ownership, status de aluno, matricula ativa, expiracao, status de curso, modulo e aula. Testes de autorizacao serao obrigatorios antes de concluir fases criticas.

Arquivos afetados:

- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/REVIEW.md`

## 2026-05-04 - Setup inicial com Next.js 14

Decisao:

Criar o setup inicial com Next.js 14.2.35, React 18.3.1, App Router, TypeScript strict, Tailwind CSS 3, shadcn/ui configurado por `components.json`, ESLint, Prettier, Husky, lint-staged, Vitest, Testing Library e Playwright.

Motivo:

O ambiente local usa Node 18.17.1. Next.js 15 exige Node mais recente, enquanto Next.js 14.2.35 suporta `>=18.17.0`, compila corretamente neste workspace e preserva App Router, Server Components e Server Actions para as proximas fases.

Alternativas consideradas:

Usar Next.js 15 ou 16 e exigir upgrade imediato do Node; usar scaffold automatico `create-next-app`; adiar testes para fase posterior.

Impacto:

A Fase 2 fica funcional e validada no ambiente atual. O projeto permanece pronto para evoluir para autenticacao, banco e telas funcionais sem reestrutura inicial. Existe risco residual de auditoria em dependencias que o npm recomenda corrigir apenas com upgrade para Next.js 16, o que requer decisao futura de runtime.

Arquivos afetados:

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
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
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`
