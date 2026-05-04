# Banco de Dados

## Decisao oficial

Utilizar Supabase Postgres com Prisma ORM.

## Status

Fase 3 implementada em nivel de schema, migration versionada e seed inicial.

A migration e o seed foram tentados, mas nao puderam ser aplicados em banco real porque nao existe `.env` local com `DATABASE_URL` e `DIRECT_URL` apontando para um Supabase Postgres acessivel. O schema foi validado com URLs temporarias nao secretas.

## Configuracao

Variaveis esperadas:

- `DATABASE_URL`: connection string usada pela aplicacao. Em Supabase, pode ser a URL com pooler.
- `DIRECT_URL`: connection string direta usada por migrations Prisma.

Essas variaveis devem ficar em `.env`, que nao deve ser versionado.

## Entidades

### User

Representa o usuario interno da aplicacao.

Campos principais:

- `id`: UUID.
- `authUserId`: UUID opcional para vinculo futuro com Supabase Auth.
- `email`: unico.
- `name`.
- `role`: `ADMIN` ou `STUDENT`.
- `status`: `ACTIVE` ou `INACTIVE`.

### StudentProfile

Perfil operacional do aluno.

Relacionamentos:

- pertence a `User`;
- possui varias `Enrollment`;
- possui varias `LessonNote`;
- possui varios `LessonProgress`.

Constraint:

- `userId` unico.

### Course

Curso administravel.

Relacionamentos:

- possui muitos `Module`;
- possui muitas `Enrollment`.

Constraints e indices:

- `slug` unico;
- indice por `status`;
- indice por `title`.

### Module

Modulo ordenado dentro de um curso.

Relacionamentos:

- pertence a `Course`;
- possui muitas `Lesson`.

Constraints e indices:

- `courseId + position` unico;
- `position > 0` na migration;
- indice por `courseId + status`.

### Lesson

Aula ordenada dentro de um modulo, com link do YouTube.

Relacionamentos:

- pertence a `Module`;
- possui varias `LessonNote`;
- possui varios `LessonProgress`.

Constraints e indices:

- `moduleId + position` unico;
- `position > 0` na migration;
- check SQL para aceitar apenas formatos basicos de URL do YouTube;
- indice por `moduleId + status`;
- indice por `youtubeVideoId`.

### Enrollment

Matricula de aluno em curso.

Relacionamentos:

- pertence a `StudentProfile`;
- pertence a `Course`.

Campos principais:

- `startsAt`;
- `expiresAt`;
- `status`: `ACTIVE`, `EXPIRED` ou `CANCELED`.

Constraints e indices:

- `studentId + courseId` unico;
- check SQL para garantir `expiresAt > startsAt` quando houver expiracao;
- indices por `studentId + status`, `courseId + status` e `expiresAt`.

### LessonNote

Anotacao privada do aluno em uma aula.

Relacionamentos:

- pertence a `StudentProfile`;
- pertence a `Lesson`.

Constraint:

- `studentId + lessonId` unico, impedindo mais de uma nota do mesmo aluno para a mesma aula.

### LessonProgress

Progresso do aluno em uma aula.

Relacionamentos:

- pertence a `StudentProfile`;
- pertence a `Lesson`.

Constraints e indices:

- `studentId + lessonId` unico;
- check SQL para exigir `completedAt` quando `status = COMPLETED`;
- indice por `studentId + status`;
- indice por `lessonId`.

## Enums

- `UserRole`: `ADMIN`, `STUDENT`.
- `UserStatus`: `ACTIVE`, `INACTIVE`.
- `CourseStatus`: `ACTIVE`, `INACTIVE`.
- `ModuleStatus`: `ACTIVE`, `INACTIVE`.
- `LessonStatus`: `ACTIVE`, `INACTIVE`.
- `EnrollmentStatus`: `ACTIVE`, `EXPIRED`, `CANCELED`.
- `LessonProgressStatus`: `NOT_STARTED`, `COMPLETED`.

## Regras atendidas

- Aluno pode ter N cursos via `Enrollment`.
- Curso pode ter N modulos via `Module`.
- Modulo pode ter N aulas via `Lesson`.
- Aula possui link do YouTube em `youtubeUrl`.
- Matricula possui inicio, expiracao e status.
- Nota pertence ao aluno e a aula.
- Aluno so pode ter uma nota por aula.
- Progresso tambem e unico por aluno e aula.
- Modulos e aulas possuem ordenacao por `position`.

## Seed inicial

O seed cria dados minimos e idempotentes:

- usuario admin `admin@syscursos.local`;
- usuario aluno `aluno@syscursos.local`;
- perfil do aluno;
- curso de demonstracao;
- modulo inicial;
- aula inicial com URL do YouTube;
- matricula ativa;
- anotacao inicial;
- progresso inicial.

O seed nao cria senhas e nao integra Supabase Auth nesta fase.

## Seguranca

RLS sera implementado na Fase 4. Nesta fase, a seguranca estrutural ficou concentrada em:

- UUIDs;
- constraints de ownership logico;
- constraints de unicidade;
- checks de integridade;
- indices para consultas autorizadas futuras;
- ausencia de secrets versionados.
