# Architecture

## Visao geral
Aplicacao monolitica em Next.js (App Router), com renderizacao server-side e mutacoes via Server Actions.

Fluxo principal identificado:
1. Rotas e paginas em `src/app/*`
2. Acoes server em `src/server/actions/*`
3. Regras de negocio em `src/server/services/*`
4. Persistencia em `src/server/repositories/*`
5. Acesso a banco via Prisma em `src/lib/db/prisma.ts`

## Camadas identificadas
- `src/app`: rotas, layouts, paginas e handlers
- `src/components`: componentes de UI (admin, student, shared)
- `src/server/actions`: entrada de mutacoes disparadas por formulario
- `src/server/services`: regras de negocio e autorizacao
- `src/server/repositories`: queries/mutacoes no banco
- `src/server/validators`: schemas Zod
- `src/server/auth` e `src/server/permissions`: sessao, guards, RBAC
- `src/lib/supabase`: clientes Supabase server/middleware/admin
- `src/lib/db`: singleton Prisma Client

## Dados e modelo
- Banco PostgreSQL com Prisma
- Estrutura multi-tenant por `Organization`
- `User` ligado a `Organization` e com papeis `ADMIN`, `PRODUCER`, `STUDENT`
- `Course` ligado a `Organization` e a um `producerId`
- Vinculo produtor-aluno por `ProducerStudent`
- Conteudo em hierarquia `Course -> Module -> Lesson`
- Acesso do aluno por `Enrollment`; progresso por `LessonProgress`; anotacoes por `LessonNote`

Evidencia:
- `prisma/schema.prisma`

## Autenticacao e autorizacao
- Sessao via Supabase Auth
- Middleware em `middleware.ts` para proteger `/admin`, `/app` e fluxos de login
- RBAC por rota em `src/server/permissions/rbac.ts`
- Guards server-side (`requireRole` / `requireAnyRole`) em `src/server/auth/guards.ts`

## Padrao de acesso a dados
- Listagens administrativas com paginacao via repository (`PageResult`)
- Queries com escopo por organizacao e papel do ator
- Uso pontual de SQL agregada (`$queryRaw`) para metricas de dashboard

Evidencias:
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`

## Testes e qualidade
- Lint: `next lint`
- Typecheck: `tsc --noEmit`
- Unit/integration: Vitest
- E2E: Playwright

Evidencia:
- `package.json`

## Itens nao identificados no repositorio
- Microservicos
- Filas/event bus
- Cache distribuido dedicado
