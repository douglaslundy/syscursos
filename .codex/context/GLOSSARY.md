# Glossario do Projeto

- `Admin`: perfil com acesso a `/admin` para gestao operacional.
- `Aluno`: perfil com acesso a `/app` para consumo de cursos.
- `Curso (Course)`: unidade principal de ensino, com status e metadados.
- `Modulo (Module)`: agrupador ordenado de aulas dentro de um curso.
- `Aula (Lesson)`: conteudo individual (com link do YouTube) dentro de um modulo.
- `Matricula (Enrollment)`: vinculo aluno-curso com periodo e status (`ACTIVE`, `EXPIRED`, `CANCELED`).
- `Progresso (LessonProgress)`: status por aluno/aula (ex.: `NOT_STARTED`, `COMPLETED`).
- `Anotacao (LessonNote)`: texto privado do aluno por aula.
- `RBAC`: controle de acesso por papel (admin/aluno), evidenciado em `src/server/permissions/rbac.ts`.
- `RLS`: Row Level Security no banco, evidenciado por migracao dedicada.
- `Server Actions`: mecanismo de mutacao server-side usado no app.
- `Repository`: camada de acesso a dados (Prisma).
- `Service`: camada de regra de negocio e orquestracao.
- `Validator`: schema/validacao de entrada (Zod).
- `Context Pack`: arquivo `.codex/context/PACK.md` com snapshot de contexto.
