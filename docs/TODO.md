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
