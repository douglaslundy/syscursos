# Glossary

- `Organization`: tenant da plataforma SaaS.
- `User`: usuario da aplicacao com papel (`ADMIN` ou `STUDENT`).
- `StudentProfile`: perfil complementar de aluno vinculado a `User`.
- `Course`: curso pertencente a uma `Organization`.
- `Module`: modulo de um curso.
- `Lesson`: aula de um modulo (com link/id de YouTube).
- `Enrollment`: matricula de aluno em curso com periodo e status.
- `LessonProgress`: progresso de conclusao de aula por aluno.
- `LessonNote`: anotacao do aluno por aula.
- `RBAC`: controle de acesso por papeis (`ADMIN`/`STUDENT`).
- `Server Action`: mutacao server-side usada nas paginas Next.js.
- `Service`: camada de regras de negocio.
- `Repository`: camada de acesso a dados com Prisma.
- `RLS`: row-level security no banco (politicas SQL em migrations).
- `Tenant isolation`: restricao de dados por `organizationId`.

Evidencias principais:
- `prisma/schema.prisma`
- `src/server/permissions/rbac.ts`
- `src/server/services/admin-service.ts`
- `prisma/migrations/20260504130000_auth_rls_policies/migration.sql`
