# Prompt 3 — Banco de dados

Leia:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/DATABASE.md`
- `prompts/00_MASTER_INSTRUCTIONS.md`

Implemente apenas a camada de banco de dados.

Use:

- Supabase Postgres;
- Prisma ORM.

Criar:

- schema Prisma;
- entidades principais;
- relacionamentos;
- enums;
- índices;
- constraints;
- migration inicial;
- seed inicial.

Entidades:

- User
- StudentProfile
- Course
- Module
- Lesson
- Enrollment
- LessonNote
- LessonProgress

Regras:

- aluno pode ter N cursos;
- curso pode ter N módulos;
- módulo pode ter N aulas;
- aula possui link do YouTube;
- matrícula possui início, expiração e status;
- nota pertence ao aluno e à aula;
- aluno só pode ter uma nota por aula;
- módulos e aulas possuem ordenação;
- cursos, módulos, aulas e alunos possuem status.

Ao finalizar:

- rode `prisma validate`;
- rode migration;
- rode seed;
- rode lint;
- rode typecheck;
- atualize `docs/DATABASE.md`;
- atualize `docs/TODO.md`;
- atualize `docs/REVIEW.md`;
- registre decisões em `docs/DECISIONS.md`.

Trabalhe em modo autônomo. Não peça confirmação para decisões técnicas triviais.
