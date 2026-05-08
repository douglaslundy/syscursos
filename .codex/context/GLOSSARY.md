# Glossary

- `Organization`: tenant logico do sistema; agrupa usuarios e cursos.
- `User`: conta principal da plataforma com papel (`ADMIN`, `PRODUCER`, `STUDENT`), status e credencial vinculada ao Supabase (`authUserId`).
- `StudentProfile`: extensao do usuario aluno (documento e telefone) e ponto de relacao com matriculas, notas e progresso.
- `Producer`: usuario com role `PRODUCER`, responsavel por cursos e gestao de alunos vinculados.
- `ProducerStudent`: tabela de vinculacao entre produtor e aluno.
- `Course`: curso do LMS, com status e capa, vinculado a organizacao e produtor.
- `Module`: modulo de um curso, com ordenacao por `position` e status.
- `Lesson`: aula de um modulo, com URL/ID do YouTube, ordenacao e status.
- `Enrollment`: matricula do aluno no curso com inicio, expiracao e status (`ACTIVE`, `EXPIRED`, `CANCELED`).
- `LessonProgress`: progresso por aluno/aula, incluindo marcacao de concluido.
- `LessonNote`: anotacao por aluno/aula.
- `RBAC`: controle de acesso por perfil aplicado em middleware e guards server-side.
- `Server Action`: funcao server-side do Next usada para mutacoes.
- `Repository`: camada de acesso a dados (Prisma/SQL) usada pelos services.
- `Service`: camada de regra de negocio e autorizacao entre actions e repositories.
- `Audience`: intencao de login/cadastro (`admin` ou `client`) usada no fluxo de autenticacao.

## Termos nao identificados no repositorio
- Definicao formal de billing/plano por tenant
- Definicao formal de impersonation de usuario
