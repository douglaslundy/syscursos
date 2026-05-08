# Current State

## Branch
- `main`

## Ultimos commits identificados
- `a1900a1 perf(dashboard): reduce query volume with aggregated joins`
- `5953a54 fix(admin): preserve redirect errors and classify storage config failures`
- `67aaef3 fix(storage): ensure course cover bucket exists before upload`
- `6cc69fc feat(dashboard): add lesson KPIs and role-based filters`
- `96f81a4 fix(auth): add transient db retry for login and session lookup`

## Estado do workspace no momento da leitura
- `git status --short`: sem arquivos modificados antes desta atualizacao de contexto.

## Modulos e fluxos ativos identificados
- Login/cadastro por audiencia:
  - `/login/client`
  - `/login/admin`
  - `/login/client/register`
  - `/login/admin/register` (rota existe; fluxo de cadastro admin publico bloqueado no server action)
- Painel:
  - administrativo/produtor: `/admin`
  - aluno: `/app`
- Modulos funcionais observados:
  - cursos, modulos, aulas
  - alunos e matriculas
  - cadernos e progresso
  - meus dados (admin/produtor/aluno)

## Regras ativas observadas
- Middleware protegido para `/login/:path*`, `/admin/:path*`, `/app/:path*`.
- RBAC por role:
  - `STUDENT` direcionado para `/app`
  - `ADMIN` e `PRODUCER` direcionados para `/admin`
  - `PRODUCER` com restricoes de rotas administrativas especificas
- Escopo de dados por tenant (`organization_id`) e ownership por produtor (`producer_id`, `producer_students`).

## Itens nao identificados no repositorio
- Procedimento operacional oficial de deploy de migration em producao.
- Matriz formal de observabilidade/monitoramento.
