# Project Brief

## Objetivo do produto
Plataforma web de cursos (LMS) com área administrativa e área do aluno, incluindo gestão de cursos/módulos/aulas, matrículas, progresso e cadernos de anotações.

Evidências:
- Rotas administrativas em `src/app/admin/*`
- Rotas do aluno em `src/app/app/*`
- Modelos Prisma em `prisma/schema.prisma`

## Stack identificada
- Frontend/App: Next.js 14 (App Router) + React 18 + TypeScript
- Estilo: Tailwind CSS
- Backend na aplicação: Server Actions + camadas de serviço/repositório/validação
- Banco: PostgreSQL via Prisma ORM
- Autenticação/Sessão: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Testes: Vitest (unitário/integração) e Playwright (E2E)
- Qualidade: ESLint, Prettier, Husky + lint-staged

Evidências:
- `package.json`
- `prisma/schema.prisma`
- `src/lib/supabase/*`
- `src/tests/*`

## Domínios funcionais identificados
- Usuários e papéis (`User`, `UserRole`)
- Perfil de aluno (`StudentProfile`)
- Cursos, módulos e aulas (`Course`, `Module`, `Lesson`)
- Matrículas (`Enrollment`)
- Progresso por aula (`LessonProgress`)
- Cadernos/anotações (`LessonNote`)

Evidência:
- `prisma/schema.prisma`

## Regras/restrições aparentes
- Autorização não confiada ao frontend; presença de guards/RBAC no servidor.
- Separação de áreas por rotas: admin e aluno.
- Validações de entrada com schemas (Zod).

Evidências:
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`
- `src/server/validators/*`

## Itens não identificados no repositório
- SLA/SLO
- Requisitos de LGPD formalizados
- Estratégia oficial de observabilidade centralizada
- Processo formal de release/versionamento semântico
