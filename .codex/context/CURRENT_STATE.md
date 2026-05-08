# Current State

## Branch
- `main`

## Ultimo commit identificado
- `ad55f84 feat(authz): add producer role with restricted admin scope`

## Escopo desta atualizacao
- Separacao de responsabilidades SaaS entre ADMIN, PRODUCER e STUDENT.
- Ownership de cursos por produtor e vinculo produtor-aluno.
- Controle de ultimo acesso e validade de acesso por usuario.

## Mudancas principais
- `users.access_expires_at`, `users.last_login_at`
- `courses.producer_id`
- tabela `producer_students`
- escopo produtor em CRUD de cursos/modulos/aulas/alunos/matriculas
- ajuste de login/cadastro conforme regras de papel

## Itens nao identificados no repositorio
- Modelo de multiplos perfis com mesmo e-mail em contas locais separadas (conflita com unicidade local e Supabase Auth).
