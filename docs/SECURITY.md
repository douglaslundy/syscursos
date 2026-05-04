# Seguranca

## Objetivo

Definir o modelo de seguranca da plataforma de cursos online, garantindo autenticacao confiavel, autorizacao server-side, protecao contra acesso horizontal e isolamento dos dados privados dos alunos.

## Principios obrigatorios

- Nunca confiar no frontend para autorizacao.
- Validar toda entrada no servidor.
- Aplicar RBAC em rotas, Server Actions, services e dados sensiveis.
- Aplicar RLS no Supabase Postgres como defesa em profundidade.
- Nao expor secrets no client.
- Nao usar service role key no frontend.
- Nao retornar dados sensiveis desnecessarios.
- Tratar erros sem vazar detalhes internos.
- Registrar decisoes e riscos relevantes em documentacao.

## Perfis

### ADMIN

Pode acessar `/admin` e gerenciar:

- cursos;
- modulos;
- aulas;
- alunos;
- matriculas;
- renovacao e cancelamento de acesso;
- consultas administrativas.

Administrador nao deve usar o fluxo visual do aluno na primeira versao.

### STUDENT

Pode acessar `/app` e:

- visualizar cursos vinculados por matricula ativa e nao expirada;
- visualizar modulos e aulas ativos desses cursos;
- assistir aulas liberadas;
- marcar as proprias aulas como concluidas;
- criar e editar as proprias anotacoes;
- visualizar os proprios cadernos;
- buscar apenas dentro dos proprios cadernos.

## Protecao de rotas

- `/admin/*`: exige usuario autenticado com perfil `ADMIN`.
- `/app/*`: exige usuario autenticado com perfil `STUDENT`.
- `/login`: deve redirecionar usuarios autenticados para a area correta.
- Rotas inexistentes ou nao autorizadas nao devem revelar existencia de recursos privados.

## Implementacao atual

### Supabase Auth

A autenticacao usa Supabase Auth via `@supabase/ssr`.

Arquivos principais:

- `src/lib/supabase/server.ts`: cliente Supabase para Server Components e Server Actions.
- `src/lib/supabase/middleware.ts`: cliente Supabase para middleware.
- `src/server/actions/auth-actions.ts`: login e logout.
- `src/server/auth/session.ts`: leitura server-side da sessao autenticada.
- `src/server/auth/guards.ts`: guard server-side por perfil.
- `middleware.ts`: protecao inicial de `/admin`, `/app` e redirecionamento de `/login`.

Variaveis obrigatorias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` nao e usada no frontend nem nos helpers de sessao.

### Login

O login fica em `/login`.

Fluxo:

1. O formulario envia `email` e `password` para uma Server Action.
2. A Server Action valida entrada com Zod.
3. A Server Action autentica com Supabase Auth.
4. A Server Action busca o usuario interno em `users` por `authUserId` ou `email`.
5. Usuario inexistente ou inativo e deslogado e redirecionado para login.
6. Usuario `ADMIN` vai para `/admin`.
7. Usuario `STUDENT` vai para `/app`.

### Logout

O logout chama `supabase.auth.signOut()` em Server Action e redireciona para `/login`.

### RBAC

RBAC esta centralizado em `src/server/permissions/rbac.ts`.

Regras implementadas:

- `/admin` e subrotas exigem `ADMIN`.
- `/app` e subrotas exigem `STUDENT`.
- usuario nao autenticado vai para `/login`.
- usuario inativo vai para `/login?error=inactive`.
- usuario autenticado no perfil errado e redirecionado para sua area correta.

### Guards server-side

As paginas protegidas usam `requireRole`.

Essa protecao e propositalmente redundante ao middleware. O middleware reduz acesso indevido cedo, mas a autorizacao critica permanece no servidor.

### RLS

A migration `prisma/migrations/20260504130000_auth_rls_policies/migration.sql` cria:

- `public.current_user_role()`;
- `public.current_student_profile_id()`;
- `public.is_admin()`;
- RLS em todas as tabelas principais;
- policies para admin gerenciar dados;
- policies para aluno acessar apenas proprio usuario, perfil, matriculas, anotacoes e progresso;
- policies para aluno ler cursos, modulos e aulas ativos vinculados a matricula ativa e nao expirada.

A migration ainda precisa ser aplicada contra um Supabase real, pois o workspace nao possui `.env` com `DATABASE_URL` e `DIRECT_URL`.

## Camadas de autorizacao

### Middleware

Deve fazer bloqueio inicial por autenticacao e perfil para reduzir acesso indevido a areas inteiras.

### Server Components

Devem buscar dados ja autorizados por services. Nao devem receber dados brutos e filtrar permissao apenas na renderizacao.

### Server Actions

Devem autenticar usuario, validar input, validar perfil e chamar services. Nunca devem confiar em IDs enviados pelo client sem checar ownership e permissoes.

### Services

Devem centralizar regras de negocio e autorizacao:

- perfil correto;
- propriedade dos dados;
- matricula ativa;
- matricula nao expirada;
- curso ativo;
- modulo ativo;
- aula ativa;
- status do aluno;
- limites e paginacao.

### Repositories

Devem executar queries Prisma sem decidir autorizacao. Queries sensiveis devem receber filtros ja definidos pelo service.

### RLS

Deve reforcar isolamento em tabelas expostas ou sensiveis. Policies devem cobrir leitura, insercao, atualizacao e remocao quando aplicavel.

## Verificacoes obrigatorias por recurso

### Curso para aluno

- usuario autenticado;
- perfil `STUDENT`;
- aluno ativo;
- matricula ativa;
- `startsAt` valido;
- `expiresAt` nulo ou futuro;
- curso ativo.

### Modulo para aluno

- todas as verificacoes de curso;
- modulo pertence ao curso;
- modulo ativo.

### Aula para aluno

- todas as verificacoes de modulo;
- aula pertence ao modulo;
- aula ativa.

### Anotacao

- usuario autenticado;
- perfil `STUDENT`;
- anotacao pertence ao proprio aluno;
- aula pertence a curso liberado;
- constraint unica por aluno e aula.

### Progresso

- usuario autenticado;
- perfil `STUDENT`;
- progresso pertence ao proprio aluno;
- aula pertence a curso liberado;
- constraint unica por aluno e aula.

## Riscos de seguranca

- Acesso horizontal entre alunos por IDs previsiveis ou validacao incompleta.
- Aluno acessar curso expirado por rota direta.
- Aluno acessar aula inativa por URL conhecida.
- Administrador receber permissoes de aluno sem fluxo auditado de impersonation.
- Exposicao de service role key ou secrets via variaveis `NEXT_PUBLIC_*`.
- Validacao apenas no client em formularios administrativos.
- Falta de RLS em tabelas de anotacoes, progresso e matriculas.
- Erros de banco ou auth vazando detalhes internos para o usuario.
- Falta de rate limiting em login, autosave e mutacoes frequentes.
- XSS em anotacoes ou campos textuais exibidos na UI.
- CSRF ou abuso de Server Actions se a sessao e origem nao forem tratadas corretamente pelo framework e pelos controles server-side.
- Enumeracao de recursos em respostas de erro diferentes para "nao existe" e "sem permissao".

## Medidas obrigatorias

- Usar Zod em todos os inputs de Server Actions e Route Handlers.
- Sanitizar ou renderizar texto de anotacoes como texto, nao HTML.
- Usar UUIDs em entidades principais.
- Aplicar constraints de unicidade em anotacoes e progresso por aluno/aula.
- Aplicar indices para filtros de autorizacao frequentes.
- Usar transacoes para ordenacao e operacoes multi-entidade.
- Restringir env vars publicas ao minimo necessario.
- Criar helper unico de sessao server-side.
- Criar helper unico de permissao por perfil.
- Padronizar erros de dominio sem vazar causa interna.
- Registrar eventos sensiveis futuros, como login, renovacao, cancelamento e alteracao de senha inicial.

## Politicas RLS

- `users`: aluno le apenas o proprio usuario; admin gerencia.
- `student_profiles`: aluno le apenas o proprio perfil; admin gerencia.
- `enrollments`: aluno le apenas as proprias matriculas; admin gerencia.
- `lesson_notes`: aluno le, cria e altera apenas as proprias anotacoes; admin gerencia.
- `lesson_progress`: aluno le, cria e altera apenas o proprio progresso; admin gerencia.
- `courses`, `modules`, `lessons`: aluno le apenas conteudo ativo relacionado a matricula ativa e nao expirada; admin gerencia.

## Checklist de revisao de seguranca por fase

- Confirmar que nenhuma autorizacao critica ficou apenas na UI.
- Confirmar validacao Zod no servidor.
- Confirmar ausencia de `any`.
- Confirmar ausencia de secrets em codigo e logs.
- Confirmar que erros publicos sao seguros.
- Confirmar RLS e policies para tabelas sensiveis.
- Confirmar testes de acesso negado e acesso horizontal.
