# Current State

## Branch
- `main`

## Ultimo commit identificado
- `ad55f84 feat(authz): add producer role with restricted admin scope`

## Escopo desta atualizacao
- Saneamento de contas para base minima operacional.
- Ajuste de labels da landing/login para linguagem de produtor.
- Redirecionamento de `/admin` para login administrativo em usuario nao autenticado.

## Mudancas principais
- Script `prisma/provision-saas-accounts.ts` consolidando:
  - 1 admin: `dlsistemas100@gmail.com`
  - 1 produtor: `douglaslundy@gmail.com`
  - 1 aluno: `douglaslundy100@gmail.com`
- Transferencia de cursos ativos para o produtor principal.
- Consolidacao de perfil de aluno para um unico cadastro.
- Landing atualizada para `Sou produtor` e `Entrar no painel de produtor`.
- RBAC atualizado para usar `/login/admin` em rotas administrativas nao autenticadas.

## Itens nao identificados no repositorio
- Modelo de multiplos perfis com mesmo e-mail em contas locais separadas (conflita com unicidade local e Supabase Auth).

## Atualizacao 2026-05-08 - Performance de consultas do dashboard
- Reduzidas consultas redundantes em `getAdminDashboardStats`:
  - removidas contagens duplicadas de matriculas e aulas ativas para calcular pendencias.
  - `pendingLessons` agora reutiliza KPIs ja carregados (`enrollments` e `activeLessons`).
- Refatorado `getAdminConsumptionMetrics` para agregacao SQL unica com joins (`users`, `enrollments`, `lesson_progress`) e escopo por organizacao/produtor.
- Objetivo: reduzir roundtrips e volume de dados transferidos no dashboard.
