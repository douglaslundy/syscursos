# Decisions

## 2026-05-08 - SaaS por papel com ownership de produtor

Decisao evidente no codigo:
- ADMIN gerencia produtores; PRODUCER gerencia cursos/modulos/aulas/alunos/matriculas no proprio escopo; STUDENT gerencia dados pessoais/senha.

Evidencias:
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/server/permissions/rbac.ts`

## 2026-05-08 - Vinculo produtor-aluno com reaproveitamento de credencial

Decisao evidente no codigo:
- Cadastro de aluno por produtor vincula cadastro existente por email/documento sem alterar senha, retornando feedback especifico.

Evidencias:
- `src/server/repositories/admin-repository.ts`
- `src/server/actions/admin-actions.ts`
- `src/components/admin/feedback.tsx`

## 2026-05-08 - Ultimo acesso e validade de acesso em usuarios

Decisao evidente no codigo:
- Login atualiza `last_login_at` e sessao considera `access_expires_at`.

Evidencias:
- `src/server/actions/auth-actions.ts`
- `src/server/auth/session.ts`
- `prisma/schema.prisma`

## 2026-05-08 - Entrada administrativa por `/admin` com redirect de autenticacao

Decisao evidente no codigo:
- Em acesso anonimo a rotas administrativas, o redirect de entrada passa a ser `/login/admin` (e nao `/login/client`).

Evidencias:
- `src/server/permissions/rbac.ts`
- `middleware.ts`

## 2026-05-08 - Saneamento operacional para 3 contas base

Decisao evidente no codigo:
- Provisionamento consolidado para manter somente 1 admin, 1 produtor e 1 aluno, com transferencia de cursos ativos para o produtor principal.

Evidencias:
- `prisma/provision-saas-accounts.ts`
