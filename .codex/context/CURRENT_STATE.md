# Current State

## Branch
- `main`

## Ultimos commits identificados
- `7a3a5e4 feat(student): permitir desmarcar aula concluída`
- `8bc96db feat(lessons): sugerir posição automática por total do módulo`
- `0c99303 fix(lessons): limpar formulário ao trocar contexto de módulo`
- `80afd6a feat(modules): exibir capa na listagem de módulos`
- `602e8bf feat(modules): aceitar upload de capa por arquivo`
- `495ab86 feat(producer): liberar cadastro de alunos no painel`
- `2d322f7 fix(auth): preservar login por contexto admin/client`

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
- Upload de capa por arquivo habilitado para cursos e modulos com storage Supabase.

## Validacoes executadas nesta rodada
- `npm.cmd run lint`: falhou (`next` nao encontrado no ambiente atual).
- `npm.cmd run typecheck`: falhou (`tsc` nao encontrado no ambiente atual).
- `npm.cmd run test`: falhou (`vitest` nao encontrado no ambiente atual).
- `npm.cmd run build`: falhou (`prisma`/`next` nao encontrados no ambiente atual).

## Itens nao identificados no repositorio
- Procedimento operacional oficial de deploy de migration em producao.
- Matriz formal de observabilidade/monitoramento.
