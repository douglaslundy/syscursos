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

- [ ] Dashboard administrativo
- [ ] CRUD cursos
- [ ] Ativar/inativar cursos
- [ ] CRUD modulos
- [ ] Ordenar modulos
- [ ] Ativar/inativar modulos
- [ ] CRUD aulas
- [ ] Ordenar aulas
- [ ] Ativar/inativar aulas
- [ ] Validar links do YouTube
- [ ] CRUD alunos
- [ ] Ativar/inativar alunos
- [ ] Definir e alterar senha inicial de alunos
- [ ] Matriculas
- [ ] Renovacao de acesso
- [ ] Cancelamento de acesso
- [ ] Listagem de alunos por curso
- [ ] Listagem de cursos por aluno
- [ ] Busca e filtros administrativos

## Fase 6 - Aluno

- [ ] Dashboard de cursos
- [ ] Pagina do curso
- [ ] Pagina do modulo
- [ ] Pagina da aula
- [ ] Player YouTube
- [ ] Bloqueio de curso expirado
- [ ] Bloqueio de curso, modulo e aula inativos
- [ ] Marcar aula como concluida
- [ ] Progresso do curso
- [ ] Estados vazios e erros

## Fase 7 - Cadernos

- [ ] Criar anotacao por aula
- [ ] Editar anotacao
- [ ] Salvar manualmente
- [ ] Autosave com debounce quando adequado
- [ ] Caderno por curso
- [ ] Pagina Meus Cadernos
- [ ] Selecao de curso
- [ ] Agrupamento por modulo e aula
- [ ] Busca nos cadernos
- [ ] Testar isolamento entre alunos

## Fase 8 - UI/UX

- [ ] Sidebar desktop
- [ ] Bottom navigation mobile
- [ ] Cards de curso
- [ ] Skeleton loading
- [ ] Estados vazios
- [ ] Estados de erro
- [ ] Responsividade
- [ ] Acessibilidade
- [ ] Revisao visual
- [ ] Confirmar identidade visual original

## Fase 9 - Testes

- [ ] Testes unitarios
- [ ] Testes de integracao
- [ ] Testes E2E
- [ ] Testes de autorizacao
- [ ] Testes de matricula expirada
- [ ] Testes de anotacoes
- [ ] Testes de progresso
- [ ] Testes de filtros e paginacao

## Fase 10 - Review Final

- [ ] Review de seguranca
- [ ] Review de performance
- [ ] Review de acessibilidade
- [ ] Review de codigo
- [ ] Review de dependencias
- [ ] Build final
- [ ] Relatorio final
