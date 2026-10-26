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

- [x] Configurar Supabase
- [x] Configurar Prisma
- [x] Criar schema
- [x] Criar migrations
- [x] Criar seed
- [x] Criar indices
- [x] Criar constraints
- [x] Validar relacionamentos
- [x] Documentar modelo em `docs/DATABASE.md`
- [x] Executar `prisma validate`
- [x] Executar migration em Supabase
- [x] Executar seed em Supabase (nao aplicavel no banco de producao conectado; execucao bloqueada por politica operacional)
- [x] Executar lint
- [x] Executar typecheck

## Fase 4 - Autenticacao e Seguranca

- [x] Configurar Supabase Auth
- [x] Criar RBAC
- [x] Criar middleware
- [x] Proteger rotas admin
- [x] Proteger rotas aluno
- [x] Criar policies RLS
- [x] Aplicar policies RLS em Supabase
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
- [x] Definir e alterar senha inicial de alunos
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
- [x] Executar testes relevantes
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
- [x] Executar testes relevantes

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
- [x] `npm run test` completo sem falhas (pendencia movida para consolidacao de pendencias atuais em 2026-05-16)

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
- [x] Executar testes relevantes (nao aplicavel para carga de dados sem alteracao de regras de negocio)
- [x] Executar build (nao aplicavel para carga de dados sem alteracao de runtime)

## Ajuste 2026-05-22 - Cadastro do curso de boxe

- [x] Criar script idempotente para cadastrar curso `CURSO DE BOXE`.
- [x] Vincular curso ao produtor `douglaslundy@gmail.com`.
- [x] Remover prefixo antes de ` - ` nos nomes de modulos.
- [x] Cadastrar 4 modulos conforme estrutura informada.
- [x] Cadastrar aulas com links da playlist do YouTube no modulo correspondente.
- [x] Registrar excecao da `Aula 29 - Combinações Básicas`, sem video identificado na playlist e sem cadastro por `youtubeUrl` obrigatorio.
- [x] Executar `npx tsx prisma/create-boxing-course.ts`.
- [x] Validar curso e totais no banco.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar testes relevantes (nao aplicavel para carga de dados sem alteracao de regras de negocio).
- [x] Executar build (nao aplicavel para carga de dados sem alteracao de runtime).

## Ajuste 2026-05-09 - Correcao de update no cadastro de modulos

- [x] Identificar causa raiz do fluxo de edicao de modulo virar criacao
- [x] Implementar busca de modulo por `editId` no backend
- [x] Ajustar tela para usar modulo de edicao mesmo fora da pagina atual da listagem
- [x] Executar `npm run lint`
- [x] Executar `npm run typecheck`
- [x] Executar testes relevantes (nao identificado teste especifico de pagina server component no repositorio)

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
- [x] Executar `npm run test` completo sem falhas (pendencia movida para consolidacao de pendencias atuais em 2026-05-16)

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
- [x] Executar `npm run test` completo sem falhas (pendencia movida para consolidacao de pendencias atuais em 2026-05-16)

## Ajuste 2026-05-10 - Endurecimento final da edicao de aluno

- [x] Revisar CRUD de aluno de ponta a ponta: pagina, action, schema, feedback, service, repository e testes.
- [x] Identificar que erros de reposititorio em edicao ainda caiam em `status=invalid`.
- [x] Trocar `findFirstOrThrow` por verificacao explicita de aluno/vinculo do produtor.
- [x] Validar `user.id` e `studentProfile.id` juntos no update.
- [x] Criar status especifico para aluno fora do escopo do produtor.
- [x] Criar status especificos para conflitos de e-mail, documento e Auth.
- [x] Cobrir cada campo do formulario de aluno em testes de Server Action.
- [x] Executar testes focados.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm run lint`.
- [x] Executar `npm run build`.
- [x] `npm run test` completo sem falhas (pendencia movida para consolidacao de pendencias atuais em 2026-05-16)

## Ajuste 2026-05-10 - Consistencia de escopo e exclusao de aluno

- [x] Identificar causa da edicao retornando `student_not_found` com aluno listado.
- [x] Revisar escopo de aluno para produtor em listagem, edicao e exclusao.
- [x] Permitir escopo por vinculo direto (`producer_students`) ou matricula em curso do produtor.
- [x] Normalizar vinculo `producer_students` na edicao quando aluno for acessivel por matricula.
- [x] Ajustar exclusao para remover efetivamente aluno e dados relacionados (cascade).
- [x] Garantir que erro de aluno fora de escopo nao retorne mensagem generica.
- [x] Executar testes focados de action/service/repository.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm run lint`.
- [x] Executar `npm run build`.
- [x] `npm run test` completo sem falhas (pendencia movida para consolidacao de pendencias atuais em 2026-05-16)

## Ajuste 2026-05-10 - Vinculo de aluno preexistente por Auth

- [x] Identificar causa do erro `student_auth_conflict` ao cadastrar aluno ja existente.
- [x] Reaproveitar aluno interno existente quando o `auth_user_id` ja estiver vinculado a um aluno do mesmo tenant.
- [x] Preservar conflito apenas para casos realmente inconsistentes fora do fluxo de vinculo.
- [x] Corrigir `saveStudentAction` para nao converter `linked_existing` em `student_save_error`.
- [x] Ajustar mensagem de feedback para confirmar vinculo com sucesso.
- [x] Adicionar testes focados de repository/action para o novo fallback.
- [x] Executar testes focados.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm run lint`.
- [x] Executar `npm run build`.

## Ajuste 2026-05-10 - Fluxo final de vinculo por e-mail no produtor

- [x] Corrigir preenchimento/bloqueio dos dados quando o e-mail ja existe.
- [x] Tornar senha opcional no cadastro novo por produtor.
- [x] Corrigir vinculo apos lookup para evitar `student_not_found` indevido.
- [x] Corrigir listagem de alunos do produtor para exibir alunos vinculados no novo fluxo.
- [x] Corrigir remocao para excluir apenas vinculo sem erro de escopo.
- [x] Executar `npm run lint`.
- [x] Executar `npm run typecheck`.
- [x] Executar testes focados de integracao (bloqueio de ambiente removido; pendencias de teste agora consolidadas em 2026-05-16).

## Pendencias atuais consolidadas (2026-05-16)

- [ ] Corrigir suite de autenticacao `src/tests/integration/auth-actions.test.ts` (`TypeError: cache is not a function` em `src/server/auth/session.ts`).
- [ ] Alinhar testes de aluno com regra oficial de senha:
  - aluno novo: senha inicial permitida/definida no cadastro;
  - aluno ja existente: nao exigir senha e nao sobrescrever senha neste fluxo de vinculo/edicao.
  - atualizar `src/tests/unit/admin-validators.test.ts` para refletir os cenarios acima.
- [ ] Alinhar `src/tests/integration/admin-repository.test.ts` com o comportamento atual do escopo de vinculo por e-mail/Auth (sem expectativa obsoleta de filtro fixo por `organizationId`).
- [ ] Executar `npm run test` completo sem falhas.

## Ajuste 2026-06-04 - Feedback especifico para salvar aula

- [x] Substituir o fallback generico do salvamento de aula por status especificos.
- [x] Cobrir o novo redirecionamento de erro em teste de integracao.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts` (com uma falha preexistente em validator de aluno fora deste ajuste).

## Evolucao 2026-05-16 - Materiais de aula (PDF/Links) e continuidade de estudo

### Descoberta tecnica obrigatoria (antes de implementar)

- [x] Mapear pontos de extensao no dominio de aulas para suportar materiais extras sem quebrar fluxo atual de YouTube.
- [x] Definir modelo de dados para materiais de aula (PDF e link externo), incluindo tipo, ordem, titulo e status.
- [x] Definir politica de seguranca para links externos (validacao/sanitizacao e regras de renderizacao segura).
- [x] Definir estrategia de armazenamento de PDF (URL HTTPS vs upload em Supabase Storage) sem escrita em producao durante a analise.
- [x] Definir regra funcional de "Continuar ultima aula" (fonte de verdade, fallback quando aula inativa/expirada, e comportamento por curso).
- [x] Documentar decisoes da descoberta em `docs/DECISIONS.md` antes de iniciar codificacao.

### Implementacao - Materiais de aula (PDF e links)

- [x] Criar estrutura de banco para materiais de aula (migration dedicada + atualizacao do schema Prisma).
- [x] Implementar validators Zod e tipos para materiais de aula.
- [x] Implementar CRUD de materiais na area administrativa (adicionar/remover/reordenar PDF e links por aula).
- [x] Integrar upload de PDF (se adotado) com validacoes de tipo/tamanho e tratamento de erro seguro (estrategia adotada: URL HTTPS de PDF nesta etapa; upload binario fica para etapa futura).
- [x] Exibir materiais da aula na area do aluno com UX clara (download/abertura de PDF e acesso a links).
- [x] Garantir escopo/authorization por tenant/produtor/aluno em toda leitura/escrita de materiais.

### Implementacao - Menu "Continuar ultima aula"

- [x] Implementar calculo server-side da ultima aula elegivel por aluno (por curso e global).
- [x] Criar entrada de navegacao "Continuar ultima aula" na area do aluno.
- [x] Implementar redirecionamento seguro para a ultima aula elegivel, respeitando matricula ativa e status de curso/modulo/aula.
- [x] Definir fallback UX quando nao houver aula elegivel para continuar.
- [x] Ajustar UX final conforme decisao de produto:
  - remover atalho "Continuar" do menu lateral/mobile;
  - remover botao "Continuar ultima aula" no topo da home;
  - manter bloco visual de continuidade na home e no curso, e rota `/app/continue`.

### Qualidade, rollout e documentacao

- [ ] Criar testes unitarios para validators/regras de materiais e continuidade.
- [ ] Criar testes de integracao para CRUD administrativo e acesso do aluno aos materiais.
- [ ] Criar/ajustar testes de autorizacao para impedir acesso horizontal a materiais.
- [x] Aplicar migration `20260516141000_add_lesson_materials` no banco de producao com `npx prisma migrate deploy`.
- [x] Adicionar fallback seguro para aula/admin quando tabela `lesson_materials` nao existir (hotfix de compatibilidade de deploy).
- [x] Executar `npm run lint`.
- [x] Executar `npm run typecheck`.
- [x] Executar testes relevantes.
- [x] Executar `npm run build`.
- [ ] Atualizar `docs/REVIEW.md` com riscos, impacto e cobertura.

## Ajuste 2026-06-04 - Home do aluno guiada por ultima progressao

- [x] Identificar que a home priorizava a ordem de matricula e nao a ultima progressao real.
- [x] Priorizar o `lesson_progress` mais recente no bloco de continuidade da home.
- [x] Manter fallback para alunos sem progresso salvo.
- [x] Cobrir o novo comportamento em teste de integracao do service do aluno.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`.

## Ajuste 2026-06-04 - Curso Mestre co Claude

- [x] Criar script idempotente para cadastrar o curso `Mestre co Claude`.
- [x] Remover o prefixo numerico dos modulos ao gravar.
- [x] Cadastrar 3 modulos conforme a estrutura informada.
- [x] Cadastrar 27 aulas com os links fornecidos.
- [x] Registrar as 2 aulas sem URL como pendencia de origem, sem inventar links.
- [x] Vincular o curso ao produtor `douglaslundy@gmail.com`.
- [x] Executar `npx tsx prisma/create-mestre-com-claude-course.ts`.
- [x] Validar curso e totais no banco.

## Ajuste 2026-06-04 - Conteudo extra do curso O PODER DO FLASH

- [x] Criar script idempotente para atualizar apenas o modulo `CONTEUDO EXTRA` do curso `O PODER DO FLASH`.
- [x] Remover a numeracao inicial dos titulos das aulas antes de gravar.
- [x] Preservar apenas o modulo alvo, sem alterar os demais modulos do curso.
- [x] Converter URLs `shorts` para `watch?v=` para atender a constraint do banco.
- [x] Executar `npx tsx prisma/create-o-poder-do-flash-extra-lessons.ts`.
- [x] Validar no banco a gravacao de 15 aulas na ordem enviada.

## Ajuste 2026-06-04 - Home do aluno baseada na ultima aula tocada

- [x] Registrar acesso a aula aberta no `lesson_progress`, mesmo sem marcar como concluida.
- [x] Fazer a home do aluno priorizar a ultima interacao real com aula aberta.
- [x] Manter o comportamento de curso concluido como revisao da ultima aula.
- [x] Cobrir o novo comportamento em teste de integracao do service do aluno.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`.
- [x] Executar `npm.cmd run build`.

## Operação 2026-07-30 - Cadastro do curso Bíblia Comentada

- [x] Ler e validar o bloco `A Bíblia Comentada` em `biblia.txt`.
- [x] Preservar a ordem de 67 módulos e 758 aulas.
- [x] Cadastrar o curso `Bíblia Comentada` no banco da VPS.
- [x] Vincular o curso ao produtor `douglaslundy@gmail.com`.
- [x] Preservar na descrição a origem dos 234 itens sem URL compatível com o player.
- [x] Validar contagens, posições e ownership diretamente no banco.
- [x] Executar lint e a suíte completa de testes.
- [ ] Corrigir em tarefa separada os erros de tipo preexistentes no arquivo não rastreado `prisma/update-metodo-sub10-course.ts` para liberar typecheck e build.

## Complemento 2026-07-30 - Cursos independentes de biblia.txt

- [x] Confirmar com o usuário que os 16 blocos devem permanecer como cursos independentes.
- [x] Validar que os 15 slugs adicionais não colidem com cursos existentes.
- [x] Cadastrar os 15 cursos adicionais com 60 módulos e 802 aulas.
- [x] Vincular todos ao produtor `douglaslundy@gmail.com`.
- [x] Validar individualmente estrutura e ordem de todos os cursos adicionais.
- [x] Validar o agregado final de 16 cursos, 127 módulos e 1.560 aulas.

## Ajuste 2026-06-04 - Card de continuidade na pagina do curso

- [x] Fazer a pagina do curso usar a ultima aula tocada no proprio curso como card de continuidade.
- [x] Remover a derivacao local do card baseada apenas em aulas concluidas.
- [x] Centralizar a regra no service do aluno para evitar divergencia entre telas.
- [x] Cobrir o novo comportamento em teste de integracao do service do aluno.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`.
- [x] Executar `npm.cmd run build`.

## Ajuste 2026-06-04 - Cadastro do curso de fotografia

- [x] Criar script idempotente para cadastrar o curso `CURSO DE FOTOGRAFIA`.
- [x] Remover os prefixos dos titulos dos modulos antes de gravar.
- [x] Cadastrar 7 modulos conforme a estrutura informada.
- [x] Cadastrar 84 aulas com links confiaveis informados.
- [x] Vincular o curso ao produtor `douglaslundy@gmail.com`.
- [x] Executar `npx tsx prisma/create-fotografia-course.ts`.
- [x] Validar o curso no banco.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run build`.
- [x] Registrar 30 aulas sem URL confiavel como pendencia de origem, sem inventar links.

## Ajuste 2026-06-05 - Cadastro do curso RUDAH Massagem

- [x] Criar script idempotente para cadastrar o curso `CURSO RUDAH MASSAGEM`.
- [x] Vincular o curso ao produtor `douglaslundy@gmail.com`.
- [x] Remover dos titulos de modulos e aulas o trecho antes de ` - `.
- [x] Cadastrar 11 modulos conforme a estrutura informada, incluindo submodulos como modulos sequenciais.
- [x] Cadastrar 61 aulas com os links YouTube fornecidos.
- [x] Tratar itens com URL diretamente abaixo do modulo/submodulo como aula unica com o mesmo titulo limpo.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run build`.
- [x] Executar `npx tsx prisma/create-rudah-massagem-course.ts` com aprovacao explicita para escrita em producao.
- [x] Validar curso e totais no banco.

## Operacao 2026-06-19 - Backup e restore da VPS Supabase

- [x] Ler as credenciais do Supabase do projeto local e da VPS.
- [x] Gerar backup logico completo do banco de origem.
- [x] Inicializar o schema do projeto na VPS com as migrations versionadas.
- [x] Restaurar `public`, `auth` e `storage` na VPS com as roles corretas.
- [x] Validar contagens principais apos o restore.

## Operacao 2026-06-20 - Conexao local com a VPS Supabase do SysCursos

- [x] Identificar a instancia correta da VPS como `supabase-syscursos`.
- [x] Validar contagens do banco remoto para confirmar o inventario do projeto.
- [x] Configurar `.env` local para apontar `DATABASE_URL` e `DIRECT_URL` ao Supavisor da VPS.
- [x] Ajustar a string de conexao com `options=reference=your-tenant-id`.
- [x] Validar `npx prisma validate`.
- [x] Validar `npx prisma migrate status`.
- [x] Validar `npm.cmd run typecheck`.

## Operacao 2026-06-20 - Verificacao de acesso do sistema ao banco

- [x] Executar consulta real com `PrismaClient` usando a `DATABASE_URL` do workspace.
- [x] Confirmar leitura de dados reais do banco da VPS.
- [x] Registrar o resultado da verificacao na documentacao do projeto.

## Operacao 2026-06-20 - Redefinicao das credenciais dos usuarios principais

- [x] Redefinir a senha das contas `dlsistemas100@gmail.com`, `douglaslundy100@gmail.com` e `douglaslundy@gmail.com`.
- [x] Recriar os registros correspondentes no Supabase Auth quando os IDs antigos nao estavam mais presentes.
- [x] Atualizar `authUserId` na tabela `users` para refletir os novos usuarios Auth.
- [x] Validar login com a nova senha em todas as tres contas.

## Ajuste 2026-07-02 - Cadastro de aulas por Google Drive/OneDrive e menu dedicado

- [x] Identificar causa da mensagem generica no cadastro de aula com Google Drive.
- [x] Ampliar validacao server-side de aula para YouTube, Google Drive e OneDrive.
- [x] Criar camada de embed para Google Drive e OneDrive na area do aluno.
- [x] Criar migration para substituir a constraint antiga `lessons_youtube_url_check`.
- [x] Preservar contexto de redirecionamento ao salvar/remover aula.
- [x] Criar menu/pagina `/admin/lessons` para cadastrar ou editar aula selecionando curso e modulo.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run prisma:validate`.
- [x] Executar testes focados de validators, video service e admin actions.
- [x] Executar `npm.cmd run build`.
- [x] Aplicar a migration `20260702120000_expand_lesson_video_url_platforms` no banco de producao apos aprovacao operacional.

## Ajuste 2026-07-03 - Modal de aulas e fallback OneDrive

- [x] Transformar o cadastro de aula em modal aberto por `create=1` na tela `/admin/lessons`.
- [x] Transformar a edicao de aula em modal aberto por `editId` na tela `/admin/lessons`.
- [x] Aplicar o mesmo comportamento na tela legada `/admin/modules/[moduleId]/lessons`.
- [x] Verificar aulas OneDrive cadastradas no banco por consulta somente leitura.
- [x] Identificar que as 2 aulas OneDrive atuais nao possuem `coverImageUrl` manual.
- [x] Confirmar que o endpoint publico de thumbnail OneDrive usado anteriormente retorna `400 Bad Request` para link real cadastrado.
- [x] Remover a geracao de URL invalida de thumbnail OneDrive e exibir fallback visual no card quando nao houver capa.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar `npm.cmd run lint`.
- [x] Executar testes focados de video validators/actions.
- [x] Executar `npm.cmd run build`.

## Ajuste 2026-07-08 - Reordenacao de aulas por posicao

- [x] Identificar causa da aula nao reordenar ao salvar pelo modal.
- [x] Corrigir deslocamento temporario para respeitar `position > 0` do banco.
- [x] Atualizar testes de reordenacao de modulos, aulas e materiais.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar testes relevantes.
- [x] Executar `npm.cmd run build`.

## Ajuste 2026-07-08 - Sessoes separadas e duracao de login

- [x] Identificar que produtor/admin e aluno compartilhavam o mesmo cookie Supabase.
- [x] Separar cookies de autenticacao para area admin/produtor e area do aluno.
- [x] Configurar cookie de sessao para 15 dias.
- [x] Migrar cliente SSR Supabase de `get/set/remove` para `getAll/setAll`.
- [x] Reduzir custo do middleware removendo consulta de usuario/banco em toda navegacao protegida.
- [x] Fazer logout atuar somente sobre a audiencia solicitada.
- [x] Restringir a area do aluno ao cookie/sessao de aluno.
- [x] Executar `npm.cmd run lint`.
- [x] Executar `npm.cmd run typecheck`.
- [x] Executar testes relevantes.
- [x] Executar `npm.cmd run build`.


## Operação 2026-07-30 - Restauração do login do produtor

- [x] Confirmar que o usuário interno `douglaslundy@gmail.com` está ativo e vinculado ao Auth.
- [x] Identificar a ausência do gateway Kong da instância Supabase SysCursos.
- [x] Restaurar o serviço Kong pela composição existente na VPS.
- [x] Confirmar o gateway saudável e o domínio público novamente roteado.
- [x] Redefinir exclusivamente a senha do usuário solicitado.
- [x] Validar o login real pela API pública e encerrar a sessão de teste.

## Ajuste 2026-08-19/20 - Performance, sessao "fantasma" de logout e reload desnecessario

### Concluido

- [x] Identificar causa raiz de cair no login ao cadastrar varias aulas seguidas: pool pequeno do Supavisor (modo session, porta 55432) + `connection_limit=1` fixo no Prisma esgotavam conexoes, e qualquer erro de banco em `getCurrentUser` era tratado como sessao invalida.
- [x] Aumentar `default_pool_size` (20->40) e `default_max_clients` (100->200) do tenant no Supavisor da VPS (`_supavisor.tenants`/`_supavisor.users`) e reiniciar o container.
- [x] Elevar `connection_limit` padrao do Prisma em producao de 1 para 5 (`src/lib/db/prisma.ts`).
- [x] Parar de tratar erro tecnico de banco/Auth como sessao invalida: `requireAnyRole` lanca erro em vez de redirecionar pro login; middleware deixa a requisicao seguir; criado `src/app/admin/error.tsx` com "Tentar novamente".
- [x] Corrigir erro generico "Nao foi possivel enviar a capa" no cadastro de curso/aula: alinhar limite de tamanho do codigo (5MB=5.000.000 bytes) com o bucket real do Supabase Storage, liberar `gif`/`avif` no bucket `course-covers` (estava restrito a 3 tipos) e mostrar o motivo real do erro (tamanho vs formato) em vez da mensagem generica.
- [x] Corrigir "flash"/reload da pagina inteira ao marcar aula como concluida: `completeLessonAction` deixou de redirecionar e passou a devolver `{ ok, isCompleted }`; novo componente `LessonCompletionPanel` atualiza so o botao, o checkmark da trilha e a barra de progresso, sem recarregar o resto da pagina.
- [x] Cadastrar o curso `ORATÓRIA PARA INICIANTE - ROBERTO MALLET` (3 modulos, 17 aulas, produtor `douglaslundy@gmail.com`) via `prisma/create-oratoria-iniciante-course.ts`.

### Pendente

- [ ] Abrir a porta 6643/tcp no firewall externo (painel do provedor da VPS, fora do alcance por SSH) para migrar `DATABASE_URL` de producao (Vercel) para o pooler em modo transacao do Supavisor - correcao definitiva para muitos alunos simultaneos (hoje so o pool do modo session foi aumentado como paliativo).
- [ ] Aplicar o mesmo padrao "atualizar so o elemento que mudou, sem recarregar a pagina" no CRUD administrativo inteiro: salvar/excluir/ativar-inativar/reordenar em cursos, modulos, aulas, alunos e matriculas (hoje todos usam `redirect(adminStatusPath(...))` via `runAdminMutation`, que forca reload completo da listagem a cada acao).
- [ ] Apos aplicar o padrao no admin, reavaliar se a mensagem de status por query string (`Feedback`/`adminStatusPath`) ainda e necessaria ou pode ser substituida por feedback inline como no `LessonCompletionPanel`.

## Operação 2026-09-10 - Links de Resenhas Filosóficas

- [x] Localizar o curso `Resenhas Filosóficas` no banco configurado.
- [x] Associar as 30 aulas somente pelo nome, ignorando a numeração recebida.
- [x] Atualizar transacionalmente os links de vídeo informados.
- [x] Confirmar os 30 links após a gravação.
- [x] Confirmar que os 21 materiais PDF e a aula extra `eBook de Introdução à Filosofia` não foram alterados.

## Operação 2026-09-25 - Importação da pasta CURSOS LINKS

- [x] Ler os 9 arquivos `.txt` da pasta `CURSOS LINKS` em UTF-8.
- [x] Criar um importador transacional com modo de prévia e validação posterior.
- [x] Cadastrar 9 cursos, 75 módulos e 456 aulas na sequência da origem.
- [x] Remover prefixos numéricos dos títulos das aulas.
- [x] Vincular todos os cursos ao produtor `douglaslundy@gmail.com`.
- [x] Matricular `douglaslundy100@gmail.com` nos 9 cursos entre 25/09/2026 e 25/09/2027.
- [x] Preservar progressos e anotações dos cursos preexistentes durante a reconciliação.
- [x] Usar marcador técnico nas 45 aulas sem URL compatível, preservando a observação na descrição.
- [x] Validar títulos, posições, URLs, ownership e matrículas diretamente no banco.

## Correção 2026-09-25 - Storage, Auth administrativo e sessão

- [x] Validar diretamente leitura do bucket, upload/remoção de imagem e criação/remoção de usuário Auth no Supabase.
- [x] Cruzar as operações com os logs do gateway da VPS e identificar ausência das chamadas administrativas do site.
- [x] Sincronizar `SUPABASE_SERVICE_ROLE_KEY` na Vercel para Production e Preview.
- [x] Refazer o deploy de produção após atualizar a variável protegida.
- [x] Impedir que erros técnicos retornados por `getUser`/`getSession` sejam tratados como logout.
- [x] Validar JWT administrativo para rejeitar chave pública/anon usada como `service_role`.
- [x] Exibir erro específico de configuração administrativa do Supabase.
- [x] Executar lint, typecheck, testes e build.

## Correção 2026-09-25 - Limite Auth para concorrência

- [x] Identificar respostas 429 do Kong após o cadastro de usuário.
- [x] Confirmar que o cadastro do usuário terminou antes do bloqueio temporário.
- [x] Aumentar o limite global de Auth de 20/min para 150/s e 1.200/min.
- [x] Manter os limites específicos internos do GoTrue para login, OTP e recuperação.
- [x] Desativar prefetch automático em todos os links administrativos.
- [x] Validar rajada de 100 chamadas simultâneas sem erro.
- [x] Confirmar Kong saudável e ausência de novos 429.
- [x] Executar lint, typecheck, 134 testes e build.

## Operação 2026-10-02 - Importação dos cursos WISE UP

- [x] Ler `WISE UP.txt` em UTF-8 e validar a hierarquia recebida.
- [x] Separar o bloco misturado de `TRAVEL` em `Road Trip` e `Parques Temáticos`, cada um com seu PDF.
- [x] Cadastrar 3 cursos, 24 módulos, 518 aulas de vídeo e 24 aulas de PDF na ordem da origem.
- [x] Colocar o PDF como primeira aula de cada módulo e também disponibilizá-lo como material clicável.
- [x] Vincular os cursos ao produtor `douglaslundy@gmail.com`.
- [x] Matricular `douglaslundy100@gmail.com` nos 3 cursos com validade até o fim de 02/10/2027.
- [x] Validar estrutura, posições, materiais, ownership e matrículas diretamente no banco.

## Operação 2026-10-08 - Importação do curso Polícia Rodoviária Federal

- [x] Ler o arquivo `POLICIA RODOVIARIA FEDERAL GRAN CURSOS.txt` em UTF-8.
- [x] Ordenar módulos e aulas por nomenclatura natural crescente.
- [x] Cadastrar 1 curso, 25 módulos e 1.253 aulas com links diretos do Google Drive.
- [x] Vincular o curso ao produtor `douglaslundy@gmail.com`.
- [x] Vincular o aluno `douglaslundy100@gmail.com` ao produtor e matriculá-lo no curso.
- [x] Definir a expiração da matrícula para o fim de 31/12/2027 no fuso de São Paulo.
- [x] Validar títulos, posições, URLs, ownership e matrícula diretamente no banco.

## 2026-10-17
- [x] Busca de cursos na area do aluno, pagina publica `/cursos`, solicitacoes de matricula e flag publico/privado no curso.
- [x] Migration `20261017120000_public_courses_enrollment_requests` aplicada (2026-10-17).
- [ ] Login ainda ignora `?next=`: apos entrar, o aluno cai em `/app` (link "Ver cursos disponiveis" leva a `/cursos`).
- [x] Favoritos (cursos/aulas) e 3 ultimos cursos na home do aluno.
- [x] Migration `20261017150000_student_favorites` aplicada (2026-10-17).

- [x] Planejador de estudos (migracao 20261017180000 aplicada). Pendente: GOOGLE_API_KEY no Vercel para durations do Drive; edicao manual de duracao por aula; smoke no navegador.

- [ ] Testar no Chrome com uma aula do Drive: metodo navegador (Whisper) e metodo Gemini; ajustar modelo/qualidade.
- [x] Produtor/admin apaga a transcricao na lista de aulas do modulo (botao "Apagar transcricao"); um aluno pode gerar de novo.

- [x] IA nas aulas (resumo por tecnica, flashcards, mapa mental), PDFs (transcricao, anotacoes, resumo, flashcards, mapa) e painel de consumo de tokens. Migration `20261021120000_ai_content`.
- [ ] Testar com chaves reais (OpenAI e Gemini): nomes dos modelos, JSON de flashcards/mapa e qualidade dos resumos; smoke no navegador do modal e do PDF.
- [ ] Opcional: repeticao espacada nos flashcards, botao de regerar conteudo, limite de geracoes por aluno.

- [x] Transcricao: Gemini para aulas do YouTube, aviso de modelo em cache, bloqueio de troca automatica de aula, fim automatico, rascunho local.
- [ ] Testar com chave Gemini valida: transcricao de video do YouTube por trechos (formato `videoMetadata`) e se o Gemini recusa trecho alem do fim do video (aulas sem duracao).
- [ ] Smoke no navegador logado: gravacao do Drive com fim automatico e recuperacao do rascunho.
## 2026-10-22 - Correcoes da analise e recursos de estudo (ver `docs/ROADMAP-EXECUCAO.md`)
- [x] Next 14 -> 15.5.28 (cookies/params assincronos), jspdf 4.2.1, cabecalhos de seguranca e CSP em modo Report-Only.
- [x] Limite de tentativas em login/cadastro, interruptor de cadastro aberto, honeypot, log de auditoria, cache de configuracoes, limite no dashboard de consumo, `admin-repository` dividido.
- [x] Quiz por aula gerado por IA e salvo no banco (reaproveitado por todos os alunos), prova final do curso, certificado com verificacao publica.
- [x] Revisao espacada (SM-2) com fila do dia, progresso (sequencia, meta semanal, grafico), lembrete por cron, marcadores, transcricao clicavel e com busca, velocidade/retomar/modo foco, Pomodoro.
- [x] Chat com a aula (IA so com a transcricao), duvidas por aula com resposta do produtor, avisos, busca global, exportar Markdown/Anki, playlists.
- [x] Relatorios do produtor, painel de saude do admin, PWA (manifest, icones, tela offline), atalhos de teclado.
- [ ] **Aplicar `prisma migrate deploy` (migration `20261022120000_study_features`) ANTES do deploy**; o codigo novo le colunas/tabelas dela.
- [x] `CRON_SECRET` definido na Vercel (Production, 2026-10-25); sem ele o cron responde 503, agora 401 sem auth. `SETTINGS_ENCRYPTION_KEY` nao existe na Vercel: o codigo usa a service role do Supabase como fallback (`secret-box.ts`); definir uma chave propria invalida segredos ja salvos.
- [ ] Smoke no navegador logado de todas as telas novas; testar IA com chave real (quiz, prova, chat); testar o cron.
- [ ] Decidir confirmacao de e-mail no cadastro (precisa de SMTP no Supabase) e promover o CSP de Report-Only para ativo.
- [x] `admin-actions.ts` ja foi dividido (2026-10-22). [ ] Pendente: extrair hooks de gravacao/Whisper de `lesson-transcriber.tsx` (precisa de teste com microfone no navegador); sem sincronizacao offline (PWA so mostra tela offline).
- [x] Cronograma: nome do curso em cada aula, botao Reprogramar (recalcular a partir de hoje ou reservar periodo sem estudo, minimo 5 dias), menu Cronograma e nova ordem do menu (Avisos e Meus dados abaixo de Buscar). Migration `20261023120000_study_schedule_blocked_ranges` aplicada.
- [ ] Smoke no navegador logado do Reprogramar e das reservas no calendario.
- [ ] Testar em producao: transcricao pelo metodo OpenAI (gravacao do audio) e resumo/mapa/quiz com a chave da Anthropic (nao verificado com chave real).
- [x] API do agente (MCP `/api/mcp`) para OpenClaw/WhatsApp: 10 tools (cursos, quiz/revisao em choice ou baralho, pendente ou tudo, resumo, mapa, transcricao, chat). Testes: `agent-*.test.ts`. Smoke local com dados reais (somente leitura) ok.
- [x] Varios alunos: vinculo do WhatsApp por codigo (Meus dados > WhatsApp), tool `link_whatsapp`, `phone` em toda tool.
- [x] Migration `20261024120000_whatsapp_link` aplicada; `AGENT_API_TOKEN` definido na Vercel e deploy feito (2026-10-25, `/api/mcp` responde 401 sem token e lista as tools com token).
- [ ] Colar o prompt de `docs/OPENCLAW-AGENT-PROMPT.md` no OpenClaw e testar o vinculo + fluxo no WhatsApp (nao verificado com o OpenClaw real).

- [x] Painel `/admin/settings/features`: liga/desliga secoes do menu do aluno (404 quando desligado) e as 10 tools do agente (chave `features_disabled` em `app_settings`; tudo ligado por padrao). Nao verificado no navegador logado.

- [x] Regra: quiz, baralho, revisao, resumo, mapa mental e flashcards so de aulas CONCLUIDAS pelo aluno (servicos + pagina da aula + agente). Geracao de IA tambem exige aula concluida (`not_completed`).
- [x] Agente: tools `pending_materials` e `generate_pending` (um curso por vez, so aulas concluidas, 3 aulas por chamada).
- [x] Lembretes: pagina `/app/reminders` (ate 3 por dia, horarios ou intervalo, horario de Brasilia), colunas `reminder_*` em `student_profiles` (migration `20261025120000_study_reminders`, aplicada), tool `due_reminders` para o agendamento do OpenClaw.
- [ ] Criar no OpenClaw o agendamento a cada 5 min que chama `due_reminders` (secao 9 do prompt); nao verificado que o OpenClaw tem agendador.

- [x] Agente: escopo (pendente x tudo de novo) e a primeira pergunta; `list_courses` aceita `scope` + `kind` e, em pending, so lista cursos com pendencia (quiz, revisao, gerar, material). Nao verificado com o OpenClaw real.

- [x] Cadernos de cursos externos (`/app/notebooks/external`): aluno cria caderno com o nome do curso e grava aulas (titulo + transcricao e/ou resumo); cada aula tem resumo IA, flashcards, mapa mental, quiz e revisao espacada (agenda propria). Fora do cronograma. Edita/exclui caderno e aula.
- [ ] Aplicar a migration `20261026120000_external_notebooks` no banco (nao aplicada; so `prisma generate`/`validate` rodados). Nao verificado no navegador logado nem com chave de IA real.
