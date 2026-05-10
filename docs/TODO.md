# TODO

## Fase 1 - Planejamento

- [x] Analisar requisitos
- [x] Validar stack
- [x] Propor arquitetura
- [x] Definir riscos tecnicos
- [x] Definir riscos de seguranca
- [x] Definir estrutura de pastas
- [x] Criar plano de execucao
- [x] Atualizar `docs/ARCHITECTURE.md`
- [x] Atualizar `docs/SECURITY.md`
- [x] Atualizar `docs/DECISIONS.md`
- [x] Atualizar `docs/REVIEW.md`

## Fase 2 - Setup

- [x] Criar projeto Next.js
- [x] Configurar TypeScript strict
- [x] Configurar Tailwind CSS
- [x] Configurar shadcn/ui
- [x] Configurar ESLint
- [x] Configurar Prettier
- [x] Configurar Husky
- [x] Configurar lint-staged
- [x] Configurar variaveis de ambiente
- [x] Configurar estrutura de pastas
- [x] Criar scripts de lint, typecheck, test e build
- [x] Configurar Vitest e Testing Library
- [x] Configurar Playwright
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 3 - Banco

- [ ] Configurar Supabase
- [x] Configurar Prisma
- [x] Criar schema
- [x] Criar migrations
- [x] Criar seed
- [x] Criar indices
- [x] Criar constraints
- [x] Validar relacionamentos
- [x] Documentar modelo em `docs/DATABASE.md`
- [x] Executar `prisma validate`
- [ ] Executar migration em Supabase
- [ ] Executar seed em Supabase
- [x] Executar lint
- [x] Executar typecheck

## Fase 4 - Autenticacao e Seguranca

- [x] Configurar Supabase Auth
- [x] Criar RBAC
- [x] Criar middleware
- [x] Proteger rotas admin
- [x] Proteger rotas aluno
- [x] Criar policies RLS
- [ ] Aplicar policies RLS em Supabase
- [x] Validar inputs com Zod
- [x] Criar helpers de autenticacao server-side
- [x] Criar tratamento padronizado de erros
- [x] Criar testes de autorizacao
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 5 - Admin

- [x] Dashboard administrativo
- [x] CRUD cursos
- [x] Ativar/inativar cursos
- [x] CRUD modulos
- [x] Ordenar modulos
- [x] Ativar/inativar modulos
- [x] CRUD aulas
- [x] Ordenar aulas
- [x] Ativar/inativar aulas
- [x] Validar links do YouTube
- [x] CRUD alunos
- [x] Ativar/inativar alunos
- [ ] Definir e alterar senha inicial de alunos
- [x] Matriculas
- [x] Renovacao de acesso
- [x] Cancelamento de acesso
- [x] Listagem de alunos por curso
- [x] Listagem de cursos por aluno
- [x] Busca e filtros administrativos
- [x] Paginacao administrativa
- [x] Estados de loading
- [x] Feedback de sucesso
- [x] Confirmacao de acoes destrutivas
- [x] Testes de validators administrativos
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 6 - Aluno

- [x] Dashboard de cursos
- [x] Pagina do curso
- [x] Pagina do modulo
- [x] Pagina da aula
- [x] Player YouTube
- [x] Bloqueio de curso expirado
- [x] Bloqueio de curso, modulo e aula inativos
- [x] Bloqueio 403 para curso sem matricula
- [x] Marcar aula como concluida
- [x] Progresso do curso
- [x] Estados vazios e erros
- [x] Testes de progresso
- [x] Testes de YouTube
- [x] Testes de validators do aluno
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 7 - Cadernos

- [x] Criar anotacao por aula
- [x] Editar anotacao
- [x] Salvar manualmente
- [x] Autosave com debounce quando adequado
- [x] Caderno por curso
- [x] Pagina Meus Cadernos
- [x] Selecao de curso
- [x] Agrupamento por modulo e aula
- [x] Busca nos cadernos
- [x] Testar isolamento entre alunos
- [x] Validar conteudo com Zod
- [x] Sanitizar texto
- [x] Impedir acesso horizontal via service e filtros por aluno
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 8 - UI/UX

- [x] Sidebar desktop
- [x] Bottom navigation mobile
- [x] Cards de curso
- [x] Skeleton loading
- [x] Estados vazios
- [x] Estados de erro
- [x] Responsividade
- [x] Acessibilidade
- [x] Revisao visual
- [x] Confirmar identidade visual original
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build

## Fase 9 - Testes

- [x] Testes unitarios
- [x] Testes de integracao
- [x] Testes E2E
- [x] Testes de autorizacao
- [x] Testes de login admin
- [x] Testes de login aluno
- [x] Testes de CRUD administrativo
- [x] Testes de matricula
- [x] Testes de matricula expirada
- [x] Testes de acesso a curso ativo
- [x] Testes de bloqueio de curso expirado
- [x] Testes de anotacoes
- [x] Testes de caderno por curso
- [x] Testes de progresso
- [x] Testes de filtros e paginacao
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes unitarios
- [x] Executar testes de integracao
- [x] Executar testes E2E
- [x] Executar build

## Fase 10 - Review Final

- [x] Review de arquitetura
- [x] Review de seguranca
- [x] Review de autorizacao
- [x] Review de RLS
- [x] Review de validacao
- [x] Review de performance
- [x] Review de acessibilidade
- [x] Review de responsividade
- [x] Review de duplicacoes
- [x] Review de tipagem
- [x] Review de codigo morto
- [x] Review de dependencias
- [x] Review de organizacao de pastas
- [x] Review de qualidade dos testes
- [x] Build final
- [x] Relatorio final

## Ajustes Pos-Review

- [x] Tornar notas da pagina `Meus Cadernos` editaveis com autosave e debounce
- [x] Reutilizar o mesmo fluxo server-side de validacao, sanitizacao e autorizacao das anotacoes
- [x] Criar teste unitario para autosave com debounce no caderno
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes relevantes
- [x] Executar build

## Ajustes de Deploy

- [x] Corrigir build da Vercel com `prisma generate` no `postinstall`
- [x] Manter `prisma generate` no script `build`
- [x] Fixar runtime Node 20 no `package.json` e no lockfile
- [x] Criar `vercel.json` com comandos explicitos
- [x] Reduzir warning de `glob` deprecated via override controlado
- [x] Silenciar warning conhecido do Supabase Realtime no build sem esconder outros warnings
- [x] Remover warning CJS do Vitest usando config ESM
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Commitar e enviar ao GitHub

## Ajustes de Login em Producao

- [x] Aceitar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como fallback da chave publica Supabase
- [x] Manter compatibilidade com `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Tratar falha de consulta Prisma no login com erro controlado
- [x] Adicionar mensagem segura para erro temporario de login
- [x] Criar testes para variaveis Supabase
- [x] Criar teste para falha de banco durante login
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Commitar e enviar ao GitHub

## Ajustes de Erros Server-Side em Producao

- [x] Tratar falha de sessao Supabase no servidor
- [x] Tratar falha de consulta Prisma ao carregar usuario atual
- [x] Tratar falha de sessao no middleware
- [x] Redirecionar rotas protegidas para `/login?error=server` em erro de infraestrutura
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Commitar e enviar ao GitHub

## Ajustes de CRUD Administrativo e Acesso de Alunos

- [x] Revisar Server Actions de cursos, modulos, aulas, alunos e matriculas
- [x] Evitar `Application error` em falhas de CRUD administrativo
- [x] Redirecionar falhas administrativas com feedback controlado
- [x] Exibir feedback para erro de validacao, conflito, auth e erro generico
- [x] Adicionar senha inicial no cadastro de aluno
- [x] Permitir troca opcional de senha na edicao de aluno
- [x] Criar/atualizar usuario do aluno no Supabase Auth via service role
- [x] Vincular `auth_user_id` ao usuario interno no cadastro de aluno
- [x] Reutilizar usuario existente no Supabase Auth quando houver mesmo e-mail
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Commitar e enviar ao GitHub

## Ajustes de Usabilidade CRUD, Aula e Caderno

- [x] Registrar requisitos recebidos em 2026-05-05
- [x] Criar memoria de continuidade fora do repositorio
- [x] Criar prompts de implantacao com politicas de economia de tokens
- [x] Registrar decisao tecnica para fluxo de edicao por formulario unico
- [x] Revisar CRUD de cursos para listar registros em modo leitura e popular formulario somente ao clicar em editar
- [x] Corrigir update de cursos
- [x] Revisar CRUD de alunos para listar registros em modo leitura e popular formulario somente ao clicar em editar
- [x] Corrigir update de alunos
- [x] Revisar CRUD de matriculas para listar registros em modo leitura e popular formulario somente ao clicar em editar
- [x] Corrigir update de matriculas
- [x] Garantir que curso cancelado continue aparecendo para o aluno com status cancelado
- [x] Alterar pagina do curso/aulas para exibir modulos em dropdown
- [x] Exibir menu/listagem de aulas a direita na tela de aula
- [x] Adicionar botoes de aula anterior e proxima aula antes do botao de aula concluida
- [x] Ajustar caderno para abrir somente leitura, exibindo anotacoes com cabecalho do titulo da aula
- [x] Investigar erro de reproducao do video YouTube na tela de aula
- [x] Corrigir normalizacao/validacao de links ou embed do YouTube conforme causa raiz
- [x] Adicionar ou ajustar testes unitarios e de integracao relevantes
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes relevantes
- [x] Executar build quando aplicavel
- [x] Atualizar `docs/REVIEW.md`
- [x] Commitar etapa de requisitos e prompts
- [x] Commitar cada correcao funcional em etapas pequenas

## Ajustes Finais de Trilha da Aula

- [x] Analisar problema visual em telas largas e reduzir gap lateral direito
- [x] Manter expansao/colapso vertical apenas nos modulos da trilha
- [x] Implementar abrir/fechar horizontal da trilha por botao lateral
- [x] Substituir textos dos botoes de abrir/fechar por icones
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Commitar e enviar ao GitHub

## Ajustes 2026-05-07 - Separacao de Login, Landing e Capa

- [x] Corrigir limpeza do formulario de cadastro de aula no admin apos salvar
- [x] Executar lint
- [x] Executar typecheck
- [x] Executar testes
- [x] Executar build
- [x] Criar landing page inicial com acessos separados
- [x] Separar login admin e cliente em paginas distintas
- [x] Permitir acesso de administrador no fluxo cliente quando houver perfil de aluno vinculado
- [x] Renderizar cadernos com markdown seguro
- [x] Adicionar capa de curso no cadastro e exibicao do aluno
- [x] Criar migration para `cover_image_url`

## Ajustes 2026-05-08 - SaaS multi-admin, cadastro e meus dados

- [x] Introduzir estrutura de organizacao (`organizations`) e vinculo de tenant em `users` e `courses`
- [x] Ajustar seed e provisionamento para tenant padrao
- [x] Adicionar cadastro de novo usuario (ADMIN/STUDENT) na area administrativa
- [x] Adicionar menu/pagina `Meus dados` na area administrativa
- [x] Adicionar menu/pagina `Meus dados` na area do aluno sem edicao de CPF
- [x] Adicionar KPIs de consumo por aluno no dashboard admin
- [x] Executar `npm run prisma:validate`
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [ ] Executar testes relevantes (falha de ambiente local EPERM em `C:\Users\User`)
- [x] Executar `npm run build`

- [x] Endurecer escopo tenant nas mutacoes admin (delete/update/cancel/renew).
- [x] Executar 
px prisma migrate deploy no banco configurado.

## Ajustes 2026-05-08 - Capa por modulo e cadastro publico por perfil

- [x] Adicionar `cover_image_url` em modulos com migration dedicada
- [x] Validar `coverImageUrl` HTTPS no cadastro/edicao de modulos
- [x] Exibir e permitir editar capa no formulario de modulos do admin
- [x] Criar cadastro publico separado em `/login/admin/register` e `/login/client/register`
- [x] Criar `registerAction` com provisionamento em Supabase Auth + usuario interno
- [x] Criar organizacao no cadastro publico para manter isolamento SaaS por tenant
- [x] Atualizar links das paginas de login para solicitacao de cadastro
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [ ] Executar testes relevantes (falha de ambiente local EPERM em `C:\Users\User`)

Observacao 2026-05-10: a capa de modulo foi removida do banco por requisito posterior; a capa visual passou a pertencer a `lessons`.

## Ajustes 2026-05-10 - Capa por aula e vitrine do curso

- [x] Analisar print mais recente da pasta de screenshots.
- [x] Remover cadastro/exibicao de capa do modulo na area do produtor.
- [x] Remover `cover_image_url` de `modules` via migration.
- [x] Adicionar `cover_image_url` em `lessons` via migration.
- [x] Permitir capa de aula por URL HTTPS.
- [x] Permitir upload de capa de aula para imagens `jpeg`, `png`, `webp`, `gif` e `avif`.
- [x] Listar modulos na vertical e aulas na horizontal na pagina inicial do curso do aluno.
- [x] Usar thumbnail do YouTube quando a aula nao tiver capa cadastrada.
- [x] Preservar a listagem da pagina interna da aula.
- [x] Executar `npx prisma generate`.
- [x] Executar `npm run prisma:validate`.
- [x] Executar `npm run typecheck`.
- [x] Executar testes focados de validators, YouTube, admin service e student service.
- [x] Executar `npm run lint`.
- [x] Executar `npm run build`.
- [ ] `npm run test` completo sem falhas (falha preexistente em `src/tests/integration/auth-actions.test.ts` com `cache is not a function`).

## Ajustes 2026-05-10 - Conexoes Prisma no aluno

- [x] Identificar origem da mensagem generica `Nao foi possivel carregar`.
- [x] Confirmar erro de banco `EMAXCONNSESSION max clients reached in session mode`.
- [x] Confirmar migration atualizada com `npx prisma migrate status` usando `connection_limit=1`.
- [x] Reaproveitar `PrismaClient` via `globalThis` tambem em producao.
- [x] Adicionar `connection_limit=1` em runtime quando `DATABASE_URL` nao definir limite.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm run lint`.
- [x] Executar testes focados da area do aluno.
- [x] Executar `npm run build`.

## Ajustes 2026-05-08 - Papel PRODUCER e escopo administrativo

- [x] Adicionar `PRODUCER` no enum `UserRole`
- [x] Criar migration para novo papel (`add_producer_role`)
- [x] Permitir login administrativo para `ADMIN` e `PRODUCER`
- [x] Alterar cadastro da pagina admin para criar `PRODUCER`
- [x] Permitir acesso de `PRODUCER` ao `/admin` com restricao de rotas sensiveis
- [x] Bloquear `PRODUCER` em usuarios, alunos e matriculas
- [x] Atualizar menu admin para ocultar itens restritos ao produtor
- [x] Ajustar services/admin para `ADMIN` ou `PRODUCER` em cursos, modulos, aulas e perfil proprio
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar `npm run test`
- [x] Executar `npm run build`

## Ajustes 2026-05-08 - Responsabilidades SaaS admin/produtor/aluno

- [x] Remover botao "Entrar como administrador" do login de clientes
- [x] Bloquear cadastro publico na rota admin/register
- [x] Adicionar `access_expires_at` e `last_login_at` em usuarios
- [x] Adicionar ownership de curso por produtor (`courses.producer_id`)
- [x] Adicionar vinculo produtor-aluno (`producer_students`)
- [x] Escopar consultas/mutacoes admin por papel e ownership (ADMIN/PRODUCER)
- [x] Impedir cadastro de admin por fluxo publico e por modulo de usuarios
- [x] Permitir apenas admin cadastrar produtores
- [x] Permitir produtor cadastrar/vincular alunos sem alterar senha em cadastro preexistente
- [x] Exibir feedback de vinculo para aluno preexistente
- [x] Adicionar troca de senha no "Meus dados" do aluno com confirmacao
- [x] Adicionar troca de senha no "Meus dados" admin/produtor
- [x] Exibir ultimo acesso no dashboard administrativo
- [x] Aplicar migration `20260508190000_saas_responsibilities`
- [x] Provisionar admin `douglaslundy@gmail.com` e produtor principal no tenant
- [x] Vincular alunos existentes ao produtor principal
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar `npm run test`
- [x] Executar `npm run build`

## Ajustes 2026-05-08 - Saneamento de usuarios e entrada admin

- [x] Manter somente 1 administrador (`dlsistemas100@gmail.com`)
- [x] Manter somente 1 produtor (`douglaslundy@gmail.com`)
- [x] Manter somente 1 aluno (`douglaslundy100@gmail.com`)
- [x] Transferir cursos ativos para o produtor principal
- [x] Consolidar vinculos de aluno para cadastro unico
- [x] Atualizar landing: `Sou produtor`
- [x] Atualizar CTA: `Entrar no painel de produtor`
- [x] Redirecionar acesso anonimo de `/admin` para `/login/admin`
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar `npm run test`
- [x] Executar `npm run build`

## Ajustes 2026-05-08 - Performance de dashboard

- [x] Revisar consultas de KPIs para eliminar contagens redundantes
- [x] Agrupar metricas de consumo por aluno em consulta SQL agregada com joins
- [x] Preservar filtros de organizacao/produtor/aluno no novo plano de consulta
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar `npm run test -- --run src/tests/integration/admin-repository.test.ts src/tests/integration/admin-service.test.ts`

## Ajuste 2026-05-09 - Cadastro do curso Shibari

- [x] Criar script idempotente para cadastrar curso `Shibari`
- [x] Criar modulos a partir das linhas sem numeracao informadas
- [x] Cadastrar aulas mantendo ordem de aparicao e sequencia
- [x] Remover numeracao do nome de cada aula antes de gravar
- [x] Manter modulos sem aulas quando explicitado no texto
- [x] Vincular curso ao produtor `douglaslundy@gmail.com`
- [x] Executar script `npx tsx prisma/create-shibari-course.ts`
- [x] Validar curso e totais no banco
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [ ] Executar testes relevantes (nao aplicavel para carga de dados sem alteracao de regras de negocio)
- [ ] Executar build (nao aplicavel para carga de dados sem alteracao de runtime)

## Ajuste 2026-05-09 - Correcao de update no cadastro de modulos

- [x] Identificar causa raiz do fluxo de edicao de modulo virar criacao
- [x] Implementar busca de modulo por `editId` no backend
- [x] Ajustar tela para usar modulo de edicao mesmo fora da pagina atual da listagem
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [ ] Executar testes relevantes (nao identificado teste especifico de pagina server component no repositorio)

## Ajuste 2026-05-10 - Edicao de modulos e alunos no admin

- [x] Identificar causa raiz da posicao de modulo permanecer em `1` no formulario de edicao
- [x] Forcar remount do formulario de modulo ao alternar entre novo/editar
- [x] Identificar causa raiz da edicao de aluno depender da lista paginada atual
- [x] Implementar busca dedicada de aluno por `editId` no backend
- [x] Garantir que senha vazia em edicao de aluno continue sem alterar a senha cadastrada
- [x] Desabilitar autocomplete nos campos do cadastro/edicao de aluno
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar testes focados
- [x] Executar `npm run build`
- [ ] Executar `npm run test` completo sem falhas (bloqueado por falha preexistente/ambiental em `auth-actions.test.ts`: `cache is not a function`)

## Ajuste 2026-05-10 - Mensagens especificas no CRUD de alunos

- [x] Revisar regras de validacao do cadastro/edicao de aluno
- [x] Identificar que `status=invalid` vinha do `studentSchema.safeParse`
- [x] Criar parse dedicado de formulario de aluno na Server Action
- [x] Retornar status especifico para e-mail, nome, senha, documento, telefone, status e identificador invalidos
- [x] Trocar nomes dos campos do formulario de aluno para reduzir autofill indevido
- [x] Garantir que senha vazia em edicao continue chegando como `null`
- [x] Adicionar testes de Server Action para mensagens especificas
- [x] Executar testes focados
- [x] Executar `npm run typecheck`
- [x] Executar `npm run lint`
- [x] Executar `npm run build`
- [ ] Executar `npm run test` completo sem falhas (bloqueado por falha preexistente em `auth-actions.test.ts`: `cache is not a function`)
