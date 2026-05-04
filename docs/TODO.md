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
