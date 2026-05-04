# Banco de Dados

## Decisão oficial

Utilizar Supabase Postgres com Prisma ORM.

## Entidades obrigatórias

- User
- StudentProfile
- Course
- Module
- Lesson
- Enrollment
- LessonNote
- LessonProgress

## Regras obrigatórias

- IDs devem ser UUID.
- Todas as tabelas devem ter `createdAt` e `updatedAt` quando aplicável.
- Criar índices para consultas frequentes.
- Criar constraint única para impedir duas anotações do mesmo aluno na mesma aula.
- Criar ordenação para módulos e aulas.
- Criar status para curso, módulo, aula, aluno e matrícula.
- Criar migrations versionadas.
- Criar seed inicial.

## Relacionamentos

- Course possui muitos Module.
- Module possui muitas Lesson.
- StudentProfile possui muitas Enrollment.
- Course possui muitas Enrollment.
- StudentProfile possui muitas LessonNote.
- Lesson possui muitas LessonNote.
- StudentProfile possui muitos LessonProgress.
- Lesson possui muitos LessonProgress.

## Segurança

Ativar Row Level Security nas tabelas expostas.

Alunos só podem acessar:

- suas próprias matrículas;
- seus próprios progressos;
- suas próprias anotações;
- cursos, módulos e aulas liberados por matrícula ativa.

Administradores podem gerenciar dados administrativos.
