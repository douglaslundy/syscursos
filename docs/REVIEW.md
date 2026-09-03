# Review Tecnico

Este arquivo deve ser atualizado ao final de cada etapa.

## Modelo de preenchimento

### Etapa executada

### Arquivos criados ou alterados

### O que foi implementado

### Testes executados

### Resultado dos testes

### Riscos encontrados

### Pendencias

### Proxima etapa recomendada

---

## Historico

### 2026-06-20 - Configuracao do SysCursos para a VPS Supabase

### Arquivos criados ou alterados

- `.env`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `docs/TODO.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Identificada a instancia correta da VPS como `supabase-syscursos`.
- Confirmado no banco remoto o inventario esperado do projeto:
  - `organizations = 10`
  - `users = 9`
  - `courses = 11`
  - `modules = 71`
  - `lessons = 555`
  - `enrollments = 17`
  - `lesson_progress = 68`
  - `lesson_notes = 6`
  - `lesson_materials = 0`
- `.env` local passou a apontar para o Supavisor da VPS usando `options=reference=your-tenant-id`.
- `DATABASE_URL` e `DIRECT_URL` foram alinhadas para o mesmo endpoint do pooler, que e o formato aceito pela instancia atual.

### Testes executados

- `npx prisma validate`
- `npm.cmd run typecheck`
- `npx prisma migrate status`

### Resultado dos testes

- `npx prisma validate`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npx prisma migrate status`: aprovado com o `DATABASE_URL` ajustado para o tenant da VPS.

### Riscos encontrados

- O tenant do Supavisor esta configurado como `your-tenant-id`; se a VPS for recriada com outro `POOLER_TENANT_ID`, a URL local precisara ser atualizada.
- O listener do pooler nao usa TLS nesse host, entao `sslmode=require` nao funciona para essa instancia.

### Pendencias

- Nenhuma pendencia tecnica imediata para a conexao local.

### Proxima etapa recomendada

- Rodar a aplicacao local apontando para a VPS e validar login e leitura das paginas principais.

### 2026-06-20 - Verificacao de acesso do sistema ao banco

### Arquivos criados ou alterados

- `.codex/context/CURRENT_STATE.md`
- `docs/REVIEW.md`
- `docs/TODO.md`

### O que foi implementado

- Executada consulta real com `PrismaClient` usando a `DATABASE_URL` configurada no workspace.
- Confirmado que o cliente do projeto consegue ler dados reais do banco da VPS.
- Resultado observado:
  - `organizations = 10`
  - `users = 9`
  - `courses = 11`
  - `modules = 71`
  - `lessons = 555`
  - `enrollments = 17`
  - curso mais recente: `CURSO RUDAH MASSAGEM` (`curso-rudah-massagem`)

### Testes executados

- Consulta direta com `PrismaClient` na `DATABASE_URL` do workspace.

### Resultado dos testes

- Acesso ao banco confirmado com retorno de dados reais.

### Riscos encontrados

- A consulta validou a conectividade e a leitura de dados, mas nao validou um fluxo autenticado completo no navegador.

### Pendencias

- Validar login e navegação autenticada no ambiente publicado, se necessario.

### Proxima etapa recomendada

- Abrir a aplicacao com uma conta valida e confirmar leitura das telas protegidas.

### 2026-06-20 - Redefinicao das credenciais dos usuarios principais

### Arquivos criados ou alterados

- `.codex/context/CURRENT_STATE.md`
- `docs/REVIEW.md`
- `docs/TODO.md`

### O que foi implementado

- As contas `dlsistemas100@gmail.com`, `douglaslundy100@gmail.com` e `douglaslundy@gmail.com` tiveram a senha redefinida para o valor informado pelo usuario.
- Como os `authUserId` antigos nao existiam mais na instancia atual do Supabase Auth, os registros foram recriados no Auth e os `authUserId` da tabela `users` foram alinhados.
- O login foi validado com sucesso para as tres contas apos a redefinicao.

### Testes executados

- `supabase.auth.admin.createUser` / `supabase.auth.admin.updateUserById`
- `supabase.auth.signInWithPassword` para cada conta
- Atualizacao da tabela `users` no banco da aplicacao

### Resultado dos testes

- Redefinicao concluida e validada com login bem-sucedido.

### Riscos encontrados

- A operacao alterou os `authUserId` vinculados aos usuarios no banco da aplicacao, o que era necessario porque os IDs anteriores nao existiam mais no Auth atual.

### Pendencias

- Nenhuma pendencia imediata para essas tres contas.

### Proxima etapa recomendada

- Se necessario, repetir a mesma abordagem para outras contas que ainda estejam com Auth desalinhado.

### 2026-06-19 - Backup e restore do Supabase em VPS

### Arquivos criados ou alterados

- `backups/syscursos-full-backup-2026-06-19T20-49-54.547Z.sql`
- `backups/syscursos-public-restore-2026-06-19.sql`
- `backups/syscursos-auth-restore-2026-06-19.ordered.sql`
- `backups/syscursos-auth-restore-2026-06-19.nosrl.sql`
- `backups/syscursos-storage-restore-2026-06-19.nosrl.sql`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

### O que foi implementado

- Backup logico completo do banco de origem gerado com os schemas `public`, `auth` e `storage`.
- Schema `public` inicializado na VPS com as migrations do projeto.
- Restore aplicado na VPS em tres etapas, respeitando os roles corretos de cada schema.
- Validacoes finais confirmaram contagens principais em `public`, `auth` e `storage`.

### Testes executados

- `npx tsx` para exportacao do backup e geracao dos restores.
- `docker exec ... psql` para aplicacao das migrations e dos restores na VPS.
- consultas de validacao por contagem em `public`, `auth` e `storage`.

### Resultado dos testes

- Backup gerado com sucesso.
- Migrations aplicadas com sucesso no banco da VPS.
- Restores de `public`, `auth` e `storage` aplicados com sucesso.
- Validacoes finais:
  - `public._prisma_migrations = 9`
  - `public.users = 9`
  - `public.courses = 11`
  - `public.lessons = 555`
  - `auth.users = 11`
  - `auth.identities = 11`
  - `auth.sessions = 26`
  - `auth.refresh_tokens = 35`
  - `storage.buckets = 1`
  - `storage.objects = 21`
  - `storage.migrations = 61`

### Riscos encontrados

- O backup inclui dados sensiveis de `auth` e `storage`; os arquivos devem permanecer protegidos.
- A string externa direta de Prisma/Supavisor nao ficou completamente identificada no repositório ou na VPS; apenas as credenciais publicas e internas ficaram confirmadas.
- `storage.objects` foi restaurado apenas como metadado do banco; arquivos binarios de storage nao foram transferidos.

### Pendencias

- Definir, fora desta operacao, a `DATABASE_URL`/`DIRECT_URL` externa exata para uso do Prisma fora da rede interna do Supabase.

### Proxima etapa recomendada

- Configurar a aplicação para consumir as chaves publicas da VPS e validar login e leitura dos dados em ambiente de integracao.

### 2026-05-04 - Fase 1: Planejamento

### Arquivos criados ou alterados

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Nao houve implementacao de codigo. Foram documentados:

- analise completa do escopo;
- validacao da stack;
- proposta de arquitetura;
- riscos tecnicos;
- riscos de seguranca;
- estrutura de pastas;
- plano de execucao por fases;
- decisoes tecnicas iniciais.

### Testes executados

Nao aplicavel nesta etapa, pois somente documentacao foi alterada e o projeto Next.js ainda nao foi criado.

### Resultado dos testes

Nao aplicavel.

### Riscos encontrados

- Necessidade de definir cedo o mapeamento entre Supabase Auth e entidades locais.
- Risco de acesso horizontal entre alunos se services, RLS e testes nao forem implementados em conjunto.
- Risco de Server Actions concentrarem regra demais se nao delegarem para services.
- Risco de performance em listagens sem paginacao e indices.
- Risco de excesso de writes no autosave de anotacoes.

### Pendencias

- Criar projeto e configurar stack base.
- Definir schema Prisma e policies RLS nas proximas fases.
- Implementar testes de autorizacao assim que auth e banco existirem.
- Executar lint, typecheck, testes e build a partir da Fase 2, quando houver codigo e scripts.

### Proxima etapa recomendada

Iniciar Fase 2 - Setup do projeto Next.js e ferramentas de qualidade.

---

### 2026-05-04 - Fase 2: Setup inicial

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `next-env.d.ts`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `.eslintrc.json`
- `.prettierrc.json`
- `.prettierignore`
- `.gitignore`
- `.env.example`
- `components.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `.husky/pre-commit`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/lib/utils.ts`
- `src/tests/setup.ts`
- `src/tests/unit/smoke.test.ts`
- estrutura inicial em `src/components`, `src/features`, `src/server`, `src/types` e `src/tests`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Setup inicial da aplicacao, sem autenticacao, banco ou telas funcionais:

- projeto Next.js com App Router;
- TypeScript strict;
- Tailwind CSS;
- configuracao base de shadcn/ui;
- ESLint;
- Prettier;
- Husky;
- lint-staged;
- `.env.example`;
- Vitest com Testing Library;
- Playwright;
- estrutura de pastas prevista na arquitetura;
- pagina raiz minima apenas para validar o setup.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
- `npm audit`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 1 teste unitario.
- `npm run build`: aprovado com Next.js 14.2.35.
- `npm audit --omit=dev`: encontrou 2 vulnerabilidades em dependencias de producao, relacionadas a Next.js e PostCSS interno do Next.
- `npm audit`: encontrou 16 vulnerabilidades no total, incluindo dependencias de desenvolvimento.

### Riscos encontrados

- O ambiente local usa Node 18.17.1. Next.js 15 falhou por exigir Node mais recente, entao foi adotado Next.js 14.2.35.
- O npm recomenda resolver vulnerabilidades principais com `npm audit fix --force`, que instalaria Next.js 16.2.4 e representaria mudanca quebravel para o runtime atual.
- Husky informou `.git can't be found` durante `npm install`, pois o workspace atual nao e um repositorio Git; o hook foi criado em `.husky/pre-commit` e funcionara quando o projeto estiver sob Git.
- O Vitest emitiu aviso de deprecacao sobre CJS build da API do Vite; nao bloqueia testes nesta fase.

### Pendencias

- Decidir upgrade de Node antes de migrar para Next.js 15/16 ou resolver completamente o audit de Next.js.
- Inicializar repositorio Git se Husky precisar ser ativado localmente.
- Iniciar Fase 3 somente apos confirmar credenciais e projeto Supabase, sem commitar secrets.

### Proxima etapa recomendada

Iniciar Fase 3 - Banco, configurando Supabase e Prisma sem expor credenciais.

---

### 2026-05-04 - Fase 3: Banco de dados

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/20260504120000_initial_schema/migration.sql`
- `prisma/seed.ts`
- `src/lib/db/prisma.ts`
- `docs/DATABASE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

Camada inicial de banco de dados com Supabase Postgres e Prisma ORM:

- schema Prisma;
- entidades principais;
- relacionamentos;
- enums;
- indices;
- constraints;
- migration inicial versionada;
- seed inicial idempotente;
- helper singleton de Prisma Client.

Nao foram implementadas autenticacao, RLS, services, repositories, Server Actions ou telas funcionais.

### Testes executados

- `npm run prisma:validate`
- `npx prisma generate`
- `npm run prisma:migrate -- --name initial_schema`
- `npm run prisma:seed`
- `npm run lint`
- `npm run typecheck`

### Resultado dos testes

- `npx prisma generate`: aprovado.
- `npm run prisma:validate`: falhou sem `.env` por ausencia de `DIRECT_URL`; aprovado ao repetir com URLs temporarias nao secretas.
- `npm run prisma:migrate -- --name initial_schema`: bloqueado por ausencia de banco Postgres acessivel em `localhost:5432` ao usar placeholder local.
- `npm run prisma:seed`: bloqueado por ausencia de banco Postgres acessivel em `localhost:5432` ao usar placeholder local.
- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.

### Riscos encontrados

- Migration e seed nao foram aplicados em Supabase porque nao ha `.env` local com `DATABASE_URL` e `DIRECT_URL`.
- O schema usa `DIRECT_URL`; portanto validacoes Prisma sem `.env` exigem variaveis temporarias ou arquivo local ignorado pelo Git.
- RLS ainda nao existe e deve ser implementado na Fase 4 antes de expor dados sensiveis.
- A constraint `studentId + courseId` em `Enrollment` simplifica renovacao na primeira versao, mas nao preserva historico de multiplas matriculas no mesmo curso.

### Pendencias

- Criar `.env` local com URLs reais do Supabase Postgres.
- Executar `npm run prisma:migrate -- --name initial_schema` contra Supabase.
- Executar `npm run prisma:seed` contra Supabase.
- Implementar RLS e RBAC na Fase 4.

### Proxima etapa recomendada

Configurar Supabase real e aplicar a migration inicial antes de iniciar autenticacao e seguranca.

---

### 2026-05-04 - Fase 4: Autenticacao e seguranca base

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `middleware.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/actions/auth-actions.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/auth/schemas.ts`
- `src/server/auth/types.ts`
- `src/server/permissions/rbac.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/app/page.tsx`
- `prisma/migrations/20260504130000_auth_rls_policies/migration.sql`
- `src/tests/unit/rbac.test.ts`
- `src/tests/unit/login-schema.test.ts`
- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Supabase Auth com `@supabase/ssr`.
- Login via Server Action.
- Logout via Server Action.
- Leitura server-side de sessao.
- RBAC com `ADMIN` e `STUDENT`.
- Middleware protegendo `/admin`, `/app` e redirecionando `/login`.
- Guards server-side por perfil.
- Validacao Zod para login.
- Policies RLS em migration SQL.
- Testes unitarios de autorizacao e validacao.

Nao foram implementados CRUDs, dashboard funcional, cadastro de usuarios no Supabase Auth, recuperacao de senha, rate limiting externo ou telas finais.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run prisma:migrate -- --name auth_rls_policies`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 10 testes.
- `npm run build`: aprovado.
- `npm run prisma:migrate -- --name auth_rls_policies`: bloqueado por ausencia de banco Postgres acessivel em `localhost:5432` ao usar placeholder local.

### Riscos encontrados

- RLS foi criada, mas ainda nao aplicada em Supabase real porque nao ha `.env` local com `DATABASE_URL` e `DIRECT_URL`.
- O middleware consulta a tabela `users` via Supabase e depende das policies RLS aplicadas para operar em ambiente real.
- Login depende de usuario existir tanto no Supabase Auth quanto na tabela interna `users`.
- Ainda nao ha rate limiting dedicado para login.

### Pendencias

- Criar usuarios reais no Supabase Auth e vincular `users.auth_user_id`.
- Aplicar migrations pendentes em Supabase.
- Validar RLS com dados reais de admin e aluno.
- Implementar rate limiting ou protecao equivalente no deploy.

### Proxima etapa recomendada

Aplicar as migrations em Supabase real e validar login com um usuario `ADMIN` e um usuario `STUDENT` antes de iniciar os CRUDs administrativos.

---

### 2026-05-04 - Fase 5: Modulo administrativo

### Arquivos criados ou alterados

- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/loading.tsx`
- `src/app/admin/courses/page.tsx`
- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `src/app/admin/students/page.tsx`
- `src/app/admin/enrollments/page.tsx`
- `src/app/admin/students/[studentId]/courses/page.tsx`
- `src/app/admin/courses/[courseId]/students/page.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/components/admin/feedback.tsx`
- `src/components/admin/pagination.tsx`
- `src/components/admin/search-form.tsx`
- `src/components/admin/submit-button.tsx`
- `src/server/actions/admin-actions.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/validators/admin.ts`
- `src/server/validators/pagination.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Layout administrativo.
- Dashboard administrativo.
- CRUD de cursos.
- CRUD de modulos.
- CRUD de aulas.
- CRUD de alunos internos.
- Matricula de aluno em curso.
- Renovacao de matricula.
- Cancelamento de matricula.
- Listagem de cursos por aluno.
- Listagem de alunos por curso.
- Paginacao e busca em listagens principais.
- Estados de loading.
- Feedback por query string apos mutacoes.
- Confirmacao no navegador para acoes destrutivas.
- Separacao entre UI, Server Actions, services, repositories e validators.
- Validacao Zod para inputs administrativos.
- Testes unitarios de validators administrativos.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 14 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- As telas administrativas dependem de banco Supabase com migrations aplicadas; o workspace ainda nao possui `.env` real.
- CRUD de alunos cria usuarios internos e perfis, mas nao cria usuarios no Supabase Auth nem define senha inicial.
- A constraint atual permite apenas uma matricula por aluno e curso; renovacao atualiza a matricula existente.
- Feedback de erro de actions ainda e generico via erro do servidor; fluxos finais podem exigir mensagens por campo.

### Pendencias

- Aplicar migrations em Supabase real.
- Criar fluxo seguro para criar usuarios no Supabase Auth e definir senha inicial.
- Validar manualmente os CRUDs com banco real e usuario `ADMIN`.
- Evoluir feedback de erro por campo se necessario.

### Proxima etapa recomendada

Aplicar as migrations pendentes no Supabase real e validar o modulo administrativo ponta a ponta com um usuario `ADMIN`.

---

### 2026-05-04 - Fase 6: Area do aluno

### Arquivos criados ou alterados

- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/loading.tsx`
- `src/app/app/forbidden/route.ts`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/components/student/student-shell.tsx`
- `src/components/student/progress-bar.tsx`
- `src/components/student/course-blocked.tsx`
- `src/server/actions/student-actions.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/server/services/progress-service.ts`
- `src/server/services/youtube-service.ts`
- `src/server/validators/student.ts`
- `src/tests/unit/student-progress.test.ts`
- `src/tests/unit/youtube-service.test.ts`
- `src/tests/unit/student-validators.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Layout do aluno.
- Dashboard de cursos vinculados.
- Pagina do curso.
- Listagem de modulos ativos.
- Listagem de aulas ativas.
- Pagina da aula.
- Player YouTube via iframe.
- Controle de aula concluida.
- Calculo de progresso por curso.
- Bloqueio de curso expirado.
- Bloqueio de curso, modulo e aula inativos.
- Retorno HTTP 403 para curso sem matricula via `/app/forbidden`.
- Testes unitarios de progresso, YouTube e validators do aluno.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 23 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- As paginas do aluno dependem de banco Supabase com migrations aplicadas; o workspace ainda nao possui `.env` real.
- `/app/forbidden` retorna HTTP 403 como Route Handler, fora do layout visual do aluno, porque Next.js 14 nao fornece `forbidden()` para Server Components.
- Progresso considera apenas aulas ativas de modulos ativos em cursos ativos.
- A conclusao de aula depende de `LessonProgress` e da constraint unica por aluno/aula criada na camada de banco.

### Pendencias

- Validar fluxo ponta a ponta com usuario `STUDENT` real.
- Aplicar migrations e RLS em Supabase real antes de uso integrado.
- Implementar cadernos/anotacoes na Fase 7.

### Proxima etapa recomendada

Iniciar Fase 7 - Cadernos, mantendo isolamento de aluno e validacao server-side.

---

### 2026-05-04 - Fase 7: Cadernos e anotacoes

### Arquivos criados ou alterados

- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/components/student/lesson-note-editor.tsx`
- `src/components/student/student-shell.tsx`
- `src/server/actions/student-actions.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/server/validators/student.ts`
- `src/tests/unit/student-validators.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Campo de anotacao na pagina da aula.
- Salvamento manual de anotacao.
- Edicao de anotacao existente.
- Autosave com debounce.
- Caderno por curso.
- Pagina `Meus Cadernos`.
- Selecao de curso.
- Listagem de notas agrupadas por modulo e aula.
- Busca no conteudo dos cadernos.
- Validacao Zod para conteudo e query.
- Sanitizacao de texto removendo caracteres de controle e normalizando quebras de linha.
- Regras server-side para impedir acesso horizontal e criacao de nota fora de curso ativo, matriculado e disponivel.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 26 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- O autosave pode gerar mais escritas em usuarios muito ativos, embora esteja limitado por debounce.
- As consultas reais dependem de migrations e RLS aplicadas no Supabase; o workspace segue sem `.env` real versionado.
- A anotacao e texto plano; recursos rich text exigiriam nova revisao de sanitizacao e politica de renderizacao.

### Pendencias

- Validar o fluxo completo com usuario `STUDENT` real e banco Supabase.
- Aplicar migrations e RLS pendentes no Supabase real.
- Avaliar E2E de cadernos quando o ambiente real estiver disponivel.

### Proxima etapa recomendada

Iniciar Fase 8 - UI/UX, revisando navegacao do aluno, responsividade e estados visuais.

---

### 2026-05-04 - Fase 8: UI/UX da area do aluno

### Arquivos criados ou alterados

- `next.config.mjs`
- `src/app/globals.css`
- `src/app/app/page.tsx`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/app/app/loading.tsx`
- `src/app/app/error.tsx`
- `src/components/student/student-shell.tsx`
- `src/components/student/student-navigation.tsx`
- `src/components/student/course-card.tsx`
- `src/components/student/empty-state.tsx`
- `src/components/student/skeleton.tsx`
- `src/components/student/course-blocked.tsx`
- `src/components/student/lesson-note-editor.tsx`
- `src/components/student/progress-bar.tsx`
- `docs/TODO.md`
- `docs/UI_UX.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Sidebar desktop para a area do aluno.
- Bottom navigation mobile.
- Header mobile com logo autorizada.
- Cards de curso responsivos com status, progresso e expiracao.
- Melhor hierarquia visual nas paginas de cursos, aulas e cadernos.
- Skeleton loading.
- Estado vazio reutilizavel.
- Error boundary da area do aluno.
- Melhorias de acessibilidade em navegacao, formularios, progresso e autosave.
- Paleta visual proprietaria e contraste revisado.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado apos reexecucao isolada; a primeira tentativa correu em paralelo com o build enquanto `.next/types` era regenerado.
- `npm run test`: aprovado, 26 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- A logo e carregada remotamente de `sysdoc.vercel.app`; indisponibilidade desse dominio afeta apenas exibicao visual da marca.
- A revisao visual foi feita por codigo e build local, sem validacao manual em navegador com dados reais.
- As telas continuam dependentes de banco Supabase real com migrations e RLS aplicadas.

### Pendencias

- Validar visualmente em navegador com dados reais em mobile e desktop.
- Evoluir testes E2E e acessibilidade automatizada na fase de testes.
- Aplicar migrations e RLS pendentes no Supabase real.

### Proxima etapa recomendada

Iniciar Fase 9 - Testes, priorizando fluxos E2E de aluno, cadernos, expiracao de matricula e autorizacao.

---

### 2026-05-04 - Fase 9: Suite de testes

### Arquivos criados ou alterados

- `package.json`
- `playwright.config.ts`
- `vitest.config.ts`
- `src/tests/e2e/public.spec.ts`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/integration/auth-actions.test.ts`
- `src/tests/integration/student-service.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`

### O que foi implementado

- Scripts separados para testes unitarios, integracao e E2E.
- Configuracao do Vitest para nao coletar specs do Playwright.
- Configuracao do Playwright com web server local em porta isolada.
- Testes de login admin e login aluno via Server Action mockando Supabase e Prisma.
- Testes de bloqueio de aluno/admin via RBAC ja existente.
- Testes de CRUD administrativo para curso, modulo, aula e aluno via service.
- Testes de matricula, renovacao e regras de autorizacao administrativa.
- Testes de matricula expirada, curso ativo, curso expirado, anotacoes, caderno por curso e progresso via service do aluno.
- Testes de filtros e paginacao.
- Testes E2E publicos para home em desktop e mobile.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test:unit`: aprovado, 27 testes.
- `npm run test:integration`: aprovado, 16 testes.
- `npm run test`: aprovado, 43 testes.
- `npm run test:e2e`: aprovado, 2 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- E2E autenticado completo ainda depende de Supabase real, usuarios reais e migrations/RLS aplicadas.
- Os testes de integracao usam mocks para Prisma, Supabase e guards; eles validam fluxo de regra de negocio, mas nao substituem validacao ponta a ponta com banco real.
- Playwright exigiu instalacao local do Chromium com `npx playwright install chromium`.

### Pendencias

- Criar ambiente de teste integrado com Supabase ou banco Postgres isolado para E2E autenticado.
- Adicionar testes E2E completos de admin e aluno quando houver credenciais e seed de teste.
- Aplicar migrations e RLS pendentes no Supabase real.

### Proxima etapa recomendada

Iniciar Fase 10 - Review Final, com foco em seguranca, performance, acessibilidade, dependencias e relatorio final.

---

### 2026-05-04 - Fase 10: Review final completo

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `prisma/migrations/20260504130000_auth_rls_policies/migration.sql`
- `src/server/repositories/student-repository.ts`
- `src/tests/integration/student-repository.test.ts`
- `src/tests/unit/student-components.test.tsx`
- `docs/TODO.md`
- `docs/REVIEW.md`

### Correcoes aplicadas

- Removidas dependencias sem uso atual: `@hookform/resolvers`, `react-hook-form`, `class-variance-authority` e `@testing-library/user-event`.
- Mantido `@testing-library/react` com teste real de componentes acessiveis.
- Atualizado `@supabase/supabase-js` para `2.50.0`, primeira linha fora da faixa vulneravel conhecida e sem exigencia de Node 20.
- Filtradas opcoes de curso em `Meus Cadernos` para listar apenas matriculas ativas, ja iniciadas e nao expiradas.
- Reforcadas policies RLS de `lesson_notes` e `lesson_progress` para permitir insert/update apenas quando a aula pertence a curso ativo, modulo ativo, aula ativa e matricula ativa nao expirada.
- Adicionado teste de integracao para garantir o filtro de cursos dos cadernos.
- Adicionados testes de componentes para estado vazio e barra de progresso semantica.

### Arquitetura

- A estrutura atual separa App Router, UI, Server Actions, services, repositories, validators, auth, permissions, Prisma e testes.
- As regras criticas estao concentradas em services server-side e repositories nao sao chamados diretamente por componentes visuais.
- O modulo administrativo e a area do aluno seguem limites claros.
- A pasta `features` nao e usada atualmente; nao representa risco funcional, mas pode ser removida ou usada quando houver organizacao por dominio mais granular.

### Seguranca e autorizacao

- `/admin` e protegido por middleware e `requireRole("ADMIN")` em layout/services.
- `/app` e protegido por middleware e `requireRole("STUDENT")` em layout/services.
- Acesso horizontal do aluno e bloqueado por `studentProfileId`, verificacao de matricula, status de curso/modulo/aula e constraints unicas.
- Inputs de login, admin, aluno, anotacao, caderno e paginacao passam por Zod.
- Anotacoes sao texto plano sanitizado e renderizadas sem HTML.
- Secrets nao foram encontrados no codigo versionado.

### RLS

- Existe migration RLS para tabelas principais.
- Policies de `lesson_notes` e `lesson_progress` foram reforcadas nesta revisao para validar ownership e matricula ativa no banco.
- RLS ainda precisa ser aplicada e validada no Supabase real; o workspace local nao possui `.env` com `DATABASE_URL` e `DIRECT_URL`.

### Performance

- Listagens administrativas usam paginacao.
- Conteudo do aluno filtra cursos, modulos e aulas ativos no servidor.
- Progresso do dashboard ainda executa contagens por curso matriculado; aceitavel para MVP, mas deve ser agregado em lote em bases maiores.
- Autosave das anotacoes usa debounce para reduzir escrita.

### Acessibilidade e responsividade

- A area do aluno possui sidebar desktop, bottom navigation mobile, skip link, `aria-current`, `aria-live`, labels e `role="progressbar"`.
- Testes de componente validam estado vazio e barra de progresso semantica.
- E2E publico cobre home em desktop e mobile.
- Fluxos autenticados ainda precisam de validacao visual com dados reais.

### Tipagem, duplicacoes e codigo morto

- TypeScript strict esta ativo.
- Busca por `any` nao encontrou uso em codigo de aplicacao/testes.
- Nao foram encontrados `debugger` ou `console.log` em runtime da aplicacao; ha `console.log` apenas no seed.
- Duplicacao relevante nao foi identificada nas camadas principais.
- Dependencias sem uso atual foram removidas.

### Qualidade dos testes

- Unitarios cobrem RBAC, login schema, validators, YouTube, progresso e componentes.
- Integracao cobre login admin/aluno, admin services, student services e filtro de repositorio.
- E2E cobre rotas publicas em desktop/mobile.
- E2E autenticado completo permanece pendente por depender de Supabase real com usuarios e seed de teste.

### Build de producao

- Build de producao executado com sucesso em Next.js 14.2.35.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run prisma:validate`
- `npm audit fix`
- `npm audit --omit=dev`
- `npm audit`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test:unit`: aprovado, 29 testes.
- `npm run test:integration`: aprovado, 17 testes.
- `npm run test`: aprovado, 46 testes.
- `npm run test:e2e`: aprovado, 2 testes.
- `npm run build`: aprovado.
- `npm run prisma:validate`: aprovado com URLs temporarias nao secretas.
- `npm audit fix`: removeu vulnerabilidade de Supabase/Auth sem upgrade quebravel; foi necessario fixar `@supabase/supabase-js` em `2.50.0` para manter compatibilidade com Node 18.
- `npm audit --omit=dev`: 2 vulnerabilidades restantes, exigindo `npm audit fix --force` e upgrade quebravel para Next 16.
- `npm audit`: 16 vulnerabilidades restantes, exigindo upgrades quebraveis de Next/Vitest/ESLint.

### Pendencias reais

- Aplicar migrations em Supabase real.
- Executar seed em Supabase real ou criar usuarios manualmente com vinculo `auth_user_id`.
- Aplicar e validar RLS em Supabase real com usuarios `ADMIN` e `STUDENT`.
- Implementar criacao/alteracao segura de senha inicial de alunos no Supabase Auth.
- Adicionar rate limiting para login no ambiente de deploy.
- Criar ambiente de teste com banco isolado para E2E autenticado completo.
- Planejar upgrade de runtime para Node 20+ e migracao para Next 16 para zerar auditoria sem `--force` cego.
- Otimizar calculo de progresso do dashboard em lote quando houver volume maior de cursos por aluno.

### Recomendacoes para proxima versao

- Priorizar ambiente Supabase real com migrations, RLS e usuarios de teste.
- Implementar fluxo de provisionamento de usuario Supabase Auth no cadastro administrativo de aluno.
- Criar suite E2E autenticada para admin e aluno com banco de teste descartavel.
- Adicionar monitoramento, rate limiting e logs estruturados no deploy.
- Planejar upgrade coordenado de Node, Next, Vitest e ESLint para resolver auditoria restante.
- Avaliar agregacoes de progresso por curso para reduzir queries em dashboards com alto volume.

---

### 2026-05-04 - Ajuste pos-review: autosave nos cadernos

### Arquivos criados ou alterados

- `src/components/student/note-autosave-editor.tsx`
- `src/components/student/lesson-note-editor.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/tests/unit/student-components.test.tsx`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Criado componente reutilizavel de anotacao com autosave e debounce de 900ms.
- A pagina da aula passou a usar o componente compartilhado.
- A pagina `Meus Cadernos` agora permite editar cada nota diretamente com autosave.
- Mantido salvamento manual como alternativa ao autosave.
- Mantido o mesmo Server Action seguro para validacao, sanitizacao e autorizacao server-side.
- Adicionado teste unitario cobrindo o debounce do autosave no caderno.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test:unit`: aprovado, 30 testes.
- `npm run test:integration`: aprovado, 17 testes.
- `npm run test`: aprovado, 47 testes.
- `npm run build`: aprovado. Permanece warning conhecido do Supabase realtime sobre dependencia dinamica.

### Riscos encontrados

- O autosave aumenta escritas no banco quando o aluno edita muitas notas, mitigado por debounce de 900ms.
- Teste E2E autenticado do caderno ainda depende de ambiente de teste com login real.

### Pendencias

- Validar manualmente edicao no caderno com usuario aluno no navegador.

### Proxima etapa recomendada

Testar o fluxo em `http://localhost:3000/app/notebooks` com o usuario aluno.

---

### 2026-05-04 - Correcao definitiva do build na Vercel

### Arquivos criados ou alterados

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `vitest.config.ts` renomeado para `vitest.config.mts`
- `vercel.json`
- `docs/DECISIONS.md`
- `docs/TODO.md`
- `docs/REVIEW.md`

### O que foi implementado

- Adicionado `postinstall: prisma generate`, conforme recomendacao oficial do Prisma para builds na Vercel.
- Mantido `build: prisma generate && next build` como segunda camada de seguranca antes do build do Next.js.
- Criado `vercel.json` com `buildCommand`, `installCommand` e framework Next.js explicitos.
- Sincronizado `package-lock.json` para registrar `engines.node: 20.x` e `hasInstallScript`.
- Aplicado override do `glob` usado por `@next/eslint-plugin-next` para reduzir warning de pacote deprecated durante install.
- Adicionado filtro webpack restrito para o warning conhecido de `@supabase/realtime-js`.
- Renomeada a config do Vitest para `.mts`, removendo o warning da API CJS do Vite.

### Analise do erro

O log da Vercel mostrou que o deploy estava clonando o commit antigo `a510386`, cujo script de build ainda era apenas `next build`. Nesse cenario, a coleta de dados da rota `/login` inicializava o Prisma Client sem que ele tivesse sido gerado na instalacao/build, causando `PrismaClientInitializationError`.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 47 testes.
- `npm run build`: aprovado, sem warnings.

### Riscos encontrados

- A Vercel deve disparar um novo deploy usando o commit mais recente do branch `main`; logs que ainda mostrem `a510386` indicam deploy antigo, nao o estado atual do repositorio.
- As variaveis `DATABASE_URL`, `DIRECT_URL` e variaveis Supabase precisam existir no ambiente de Production/Preview da Vercel para `prisma generate` e as rotas server-side.

### Pendencias

- Confirmar novo deploy na Vercel usando commit posterior a `a510386`.

### Proxima etapa recomendada

Executar novo deploy na Vercel apos o push e confirmar que o log mostra commit posterior a `a510386`.

---

### 2026-05-04 - Correcao de erro server-side no login em producao

### Arquivos criados ou alterados

- `.env.example`
- `src/lib/supabase/env.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/actions/auth-actions.ts`
- `src/app/(auth)/login/page.tsx`
- `src/tests/unit/supabase-env.test.ts`
- `src/tests/integration/auth-actions.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Helper central para ler URL e chave publica do Supabase.
- Fallback de `NEXT_PUBLIC_SUPABASE_ANON_KEY` para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Tratamento controlado para erro de Prisma ao buscar o usuario interno durante login.
- Mensagem segura para erro temporario de login.
- Testes unitarios do helper de ambiente Supabase.
- Teste de integracao para falha de banco no login.

### Resultado esperado

Se a Vercel estiver sem uma das chaves publicas aceitas, o erro fica mais claro no log. Se o Supabase Auth autenticar mas o banco estiver indisponivel ou com URL incorreta, o usuario volta para `/login?error=server` em vez de receber uma tela generica de `Application error`.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 51 testes.
- `npm run build`: aprovado, sem warnings.

### Pendencias

- Confirmar no log da Vercel a excecao real associada ao digest, caso o erro persista.

---

### 2026-05-04 - Protecao contra erro generico de sessao em producao

### Arquivos criados ou alterados

- `middleware.ts`
- `src/server/auth/types.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/actions/auth-actions.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- `getCurrentUser` agora captura falhas de Supabase Auth e Prisma.
- `requireRole` redireciona erro tecnico para `/login?error=server`.
- Middleware captura falhas de leitura de sessao e de contexto de acesso.
- Rotas protegidas nao devem mais exibir `Application error` por falhas de infraestrutura de autenticacao/autorizacao.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 51 testes.
- `npm run build`: aprovado.

### Pendencias

- Validar no deploy da Vercel.

---

### 2026-05-04 - CRUD administrativo e senha inicial de aluno

### Arquivos criados ou alterados

- `src/lib/supabase/admin.ts`
- `src/server/actions/admin-actions.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/validators/admin.ts`
- `src/components/admin/feedback.tsx`
- `src/app/admin/students/page.tsx`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Tratamento controlado de erro em todas as Server Actions administrativas.
- Feedback para validacao invalida, conflito de dados, erro de Auth e erro generico.
- Cadastro de aluno com senha inicial obrigatoria.
- Edicao de aluno com troca de senha opcional.
- Provisionamento do aluno no Supabase Auth com service role.
- Vinculo do `auth_user_id` no usuario interno.
- Reutilizacao de usuario Supabase Auth existente por e-mail.
- Remocao do usuario Auth ao remover aluno, com log seguro em caso de falha.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 52 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- O provisionamento de aluno depende de `SUPABASE_SERVICE_ROLE_KEY` configurada na Vercel.
- Se o usuario Auth for criado e o banco falhar na sequencia, pode sobrar usuario Auth sem vinculo interno; o fluxo agora evita duplicar por e-mail em tentativas futuras.

### Pendencias

- Validar cadastro de curso e cadastro de aluno no deploy de producao apos o push.

---

### 2026-05-05 - Planejamento de ajustes de CRUD, aula, caderno e video

### Arquivos criados ou alterados

- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `docs/DEVELOPMENT_MEMORY.md`
- `prompts/11_CRUD_ADMIN_UX_FIXES.md`
- `prompts/12_STUDENT_LESSON_NOTEBOOK_VIDEO_FIXES.md`
- `C:\Users\User\.codex\memories\syscursos_continuidade_2026-05-05.md`

### O que foi implementado

- Registrados os requisitos recebidos em 2026-05-05 no TODO.
- Criada estrategia de execucao incremental com commits por tarefa.
- Criados prompts para implantar as correcoes administrativas e da area do aluno.
- Criada memoria externa para retomada apos reinicio ou limite de contexto.
- Reforcada politica de economia de tokens para retomadas.

### Testes executados

Nao aplicavel para runtime, pois a etapa alterou apenas documentacao e memoria de continuidade.

### Resultado dos testes

Nao aplicavel.

### Riscos encontrados

- Ja existiam alteracoes nao commitadas em `AGENTS.md`, `AGENTS.OLD.md` e `docs/DEVELOPMENT_MEMORY.md`; elas foram preservadas e nao revertidas.
- Os problemas funcionais ainda precisam de analise em codigo antes de qualquer correcao.

### Pendencias

- Corrigir CRUDs administrativos.
- Corrigir visibilidade de matriculas/cursos cancelados para aluno.
- Ajustar navegacao da aula e caderno.
- Investigar erro real de player YouTube.

### Proxima etapa recomendada

Executar o prompt `prompts/11_CRUD_ADMIN_UX_FIXES.md` e commitar ao concluir a etapa com testes.

---

### 2026-05-05 - Ajustes de CRUD administrativo

### Arquivos criados ou alterados

- `src/app/admin/courses/page.tsx`
- `src/app/admin/students/page.tsx`
- `src/app/admin/enrollments/page.tsx`
- `src/server/repositories/admin-repository.ts`
- `src/tests/integration/admin-repository.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DEVELOPMENT_MEMORY.md`

### O que foi implementado

- Cursos, alunos e matriculas passaram a listar registros em modo leitura.
- Cada item recebeu acao `Editar`, que usa `editId` na URL para popular o formulario principal.
- O formulario principal alterna entre criacao e edicao.
- Removidos formularios de edicao embutidos em cards de cursos e alunos.
- Removido input de renovacao embutido em cada matricula; a alteracao de validade agora ocorre pelo formulario principal de edicao.
- Corrigido update de matricula para atualizar por `id` quando houver registro existente.
- Adicionado teste de integracao garantindo update de matricula por `id`.

### Testes executados

- `npm run test -- --run src/tests/integration/admin-repository.test.ts src/tests/integration/admin-service.test.ts src/tests/unit/admin-validators.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- Testes focados: aprovados, 12 testes.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 53 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- O formulario de edicao usa o item presente na pagina atual. Se o usuario manipular manualmente um `editId` que nao esteja na pagina filtrada/paginada atual, o formulario volta ao modo criacao.
- Alterar aluno em producao ainda depende de `SUPABASE_SERVICE_ROLE_KEY` configurada corretamente.

### Pendencias

- Validar manualmente no navegador com dados reais.
- Continuar ajustes da area do aluno, caderno e video.

### Proxima etapa recomendada

Executar `prompts/12_STUDENT_LESSON_NOTEBOOK_VIDEO_FIXES.md`.

---

### 2026-05-05 - Ajustes da area do aluno, caderno e YouTube

### Arquivos criados ou alterados

- `src/app/app/courses/[courseId]/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/components/student/course-blocked.tsx`
- `src/components/student/course-card.tsx`
- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/server/services/youtube-service.ts`
- `src/server/validators/admin.ts`
- `src/tests/integration/student-service.test.ts`
- `src/tests/unit/youtube-service.test.ts`
- `src/tests/e2e/public.spec.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DEVELOPMENT_MEMORY.md`

### O que foi implementado

- Matriculas canceladas deixaram de ser filtradas no dashboard do aluno.
- Curso cancelado aparece como `Cancelado` e bloqueia acesso ao conteudo.
- Modulos da pagina do curso passaram a usar dropdown nativo.
- Tela de aula passou a exibir menu de aulas a direita, agrupado por modulo.
- Adicionados botoes de aula anterior e proxima aula antes de marcar aula como concluida.
- Caderno passou a abrir em modo somente leitura, com cabecalho por aula e conteudo da anotacao.
- Player YouTube passou a validar `youtubeVideoId` salvo antes de usar, aceitar `watch`, `embed`, `shorts`, `live` e `youtu.be`, e gerar embed via `youtube-nocookie.com`.
- Teste E2E publico foi atualizado para o comportamento real de `/` redirecionar para `/login`.

### Testes executados

- `npm run typecheck`
- `npm run test -- --run src/tests/unit/youtube-service.test.ts src/tests/integration/student-service.test.ts src/tests/integration/student-repository.test.ts src/tests/unit/student-components.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

### Resultado dos testes

- Typecheck: aprovado.
- Testes focados: aprovados, 19 testes.
- `npm run lint`: aprovado.
- `npm run test`: aprovado, 56 testes.
- `npm run build`: aprovado.
- `npm run test:e2e`: falhou inicialmente porque o teste esperava heading antigo `SysCursos`; corrigido para validar redirect para `/login` e heading `Entrar`; reexecucao aprovada, 2 testes.

### Riscos encontrados

- Se o video do YouTube estiver privado, removido, com embed desativado pelo proprietario ou bloqueado por politica da plataforma, o player ainda exibira erro do proprio YouTube; a aplicacao agora evita IDs invalidos e embeds malformados, mas nao pode liberar videos bloqueados na origem.
- A navegacao lateral da aula depende de conteudo ativo; modulos/aulas inativos continuam ocultos por regra server-side.

### Pendencias

- Validar manualmente com o video real que gerou o ID de reproducao informado.
- Validar visualmente em desktop/mobile com aluno real.

### Proxima etapa recomendada

Fazer deploy/push conforme fluxo do projeto e testar os fluxos administrativos e do aluno em ambiente real.

---

### 2026-05-07 - Tarefa 1: limpar formulario de cadastro de aula

### Arquivos criados ou alterados

- `src/server/actions/admin-actions.ts`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `PROJECT_STATUS.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Ajustado `saveLessonAction` para redirecionar com `formReset` apos salvamento com sucesso.
- Aplicado `key` no `LessonForm` com base em `formReset` para forcar remount do formulario e limpar campos no fluxo de criacao.
- Mantido tratamento de erro controlado ja existente para status administrativos.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 57 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- O parametro `formReset` adiciona variacao de query string apos salvar; impacto esperado apenas de UX no formulario.

### Pendencias

- Implementar tarefa 2: landing page inicial com botoes separados para login de cliente e admin.

### Proxima etapa recomendada

Executar separacao de login por pagina publica dedicada e ajustar os testes E2E publicos.

---

### 2026-05-07 - Tarefas 2 a 7: landing, login separado, markdown e capa

### Arquivos criados ou alterados

- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/components/shared/login-form.tsx`
- `middleware.ts`
- `src/server/actions/auth-actions.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`
- `src/app/app/layout.tsx`
- `src/server/services/student-service.ts`
- `src/app/app/notebooks/page.tsx`
- `src/components/student/markdown-content.tsx`
- `prisma/schema.prisma`
- `prisma/migrations/20260507195500_course_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/app/admin/courses/page.tsx`
- `src/components/student/course-card.tsx`
- `src/app/app/page.tsx`
- `src/tests/e2e/public.spec.ts`
- `src/tests/integration/auth-actions.test.ts`
- `src/tests/integration/student-service.test.ts`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/unit/rbac.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `src/tests/unit/student-components.test.tsx`

### O que foi implementado

- Landing page publica em `/` com botoes para login de clientes e administradores.
- Login separado por publico em `/login/client` e `/login/admin`.
- `loginAction` unificada com parametro `audience` para redirecionamento correto.
- Fluxo cliente habilitado para usuario admin acessar `/app` quando houver perfil de aluno vinculado.
- Caderno do aluno migrado para renderizacao markdown segura, incluindo heading da aula por anotacao.
- Cadastro de cursos atualizado com `coverImageUrl` (HTTPS) e exibicao de capa no card da area do aluno.
- Migration criada para adicionar `cover_image_url` em `courses`.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: aprovado, 61 testes.
- `npm run build`: aprovado.

### Riscos encontrados

- A migration de capa ainda precisa ser aplicada no banco de producao.
- Capa por URL depende da disponibilidade da imagem remota.
- Acesso de admin ao fluxo cliente continua condicionado a `studentProfileId`; sem esse vinculo, o acesso ao conteudo segue bloqueado.

### Pendencias

- Executar migration `20260507195500_course_cover_image` no Supabase.
- Validar manualmente o fluxo completo no browser com usuarios reais.

### Proxima etapa recomendada

Publicar as alteracoes, aplicar migration em producao e executar smoke manual dos fluxos de login/cursos/cadernos.

---

### 2026-05-08 - SaaS por administrador, cadastro de usuarios e meus dados

### Arquivos criados ou alterados

- `prisma/schema.prisma`
- `prisma/migrations/20260508110000_multi_tenant_organizations/migration.sql`
- `prisma/seed.ts`
- `prisma/provision-auth-users.ts`
- `src/server/auth/types.ts`
- `src/server/auth/session.ts`
- `src/server/validators/admin.ts`
- `src/server/validators/student.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/admin-service.ts`
- `src/server/services/student-service.ts`
- `src/server/actions/admin-actions.ts`
- `src/server/actions/student-actions.ts`
- `src/components/admin/admin-shell.tsx`
- `src/components/student/student-navigation.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/me/page.tsx`
- `src/app/app/me/page.tsx`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/integration/admin-repository.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`
- `.codex/context/DECISIONS.md`

### O que foi implementado

- Estrutura de tenant com `organizations` e vinculo de organizacao em `users` e `courses`.
- Ajuste de seed/provisionamento para criar e usar tenant padrao.
- Cadastro de novo usuario pelo admin com escolha de perfil `ADMIN` ou `STUDENT`.
- Menu e pagina `Meus dados` na area admin para atualizar dados proprios.
- Menu e pagina `Meus dados` na area aluno para atualizar nome/telefone e manter CPF (`document`) somente leitura.
- Dashboard admin ampliado com tabela de consumo por aluno, limitada aos alunos da organizacao do admin.

### Testes executados

- `npm run prisma:validate`
- `npx prisma generate`
- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run src/tests/integration/admin-service.test.ts src/tests/integration/admin-repository.test.ts src/tests/integration/student-service.test.ts`
- `npm run build`

### Resultado dos testes

- `prisma validate`: aprovado.
- `prisma generate`: aprovado.
- `lint`: aprovado.
- `typecheck`: aprovado.
- `test` focado: falhou por restricao do ambiente local (`EPERM: lstat C:\Users\User`).
- `build`: aprovado.

### Riscos encontrados

- Migration de tenant precisa ser aplicada no banco alvo antes de executar o sistema com o novo schema.
- O filtro de tenant foi priorizado nas rotinas de dashboard e listagens criticas desta etapa; revisar cobertura completa em futuras etapas.

### Pendencias

- Aplicar migration em ambiente Supabase real.
- Reexecutar testes de integracao quando o ambiente liberar acesso sem erro `EPERM`.

### Proxima etapa recomendada

- Validar fluxo end-to-end com dois administradores em tenants distintos para confirmar isolamento completo de dados.

### 2026-05-08 - Hardening final de tenant e aplicacao de migration

### O que foi implementado

- Escopo de organizacao aplicado nas mutacoes administrativas restantes (curso/modulo/aula/aluno/matricula).
- Atualizacao de testes de servico/repositorio para assinatura tenant-aware.
- Migration de tenancy aplicada com sucesso via 
px prisma migrate deploy.

### Testes executados

- 
pm run lint`n- 
pm run typecheck`n- 
pm run test`n- 
pm run build`n- 
px prisma migrate deploy`n
### Resultado dos testes

- Todos aprovados.


---

### 2026-05-08 - Capa por modulo e cadastro publico por perfil

### Arquivos criados ou alterados

- `prisma/schema.prisma`
- `prisma/migrations/20260508153000_module_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `src/server/auth/schemas.ts`
- `src/server/actions/auth-actions.ts`
- `src/components/shared/login-form.tsx`
- `src/components/shared/register-form.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/register/page.tsx`
- `src/app/(auth)/login/client/register/page.tsx`
- `src/tests/integration/admin-service.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`
- `.codex/context/CURRENT_STATE.md`
- `.codex/context/DECISIONS.md`

### O que foi implementado

- Cadastro de capa por modulo com campo `coverImageUrl` (URL HTTPS) no schema, validacao, repositorio e UI administrativa de modulos.
- Observacao 2026-05-10: este comportamento foi substituido; capa de modulo foi removida do banco e capa visual passou a pertencer a aula.
- Criado fluxo de solicitacao de cadastro publico por pagina:
  - admin: `/login/admin/register`
  - cliente: `/login/client/register`
- `registerAction` cria usuario no Supabase Auth, cria tenant (`organizations`) e cria usuario interno com role conforme a pagina de origem.
- Cadastro de cliente cria `studentProfile` com suporte a CPF (`document`).

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run src/tests/integration/auth-actions.test.ts src/tests/integration/admin-service.test.ts src/tests/unit/login-schema.test.ts`

### Resultado dos testes

- `lint`: aprovado.
- `typecheck`: aprovado.
- Teste focado: falhou por restricao de ambiente local (`EPERM: lstat C:\Users\User`).

### Riscos encontrados

## Revisao 2026-05-10 - Capa por aula e vitrine do curso

### Arquivos revisados

- `prisma/schema.prisma`
- `prisma/migrations/20260510133000_lesson_cover_remove_module_cover/migration.sql`
- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/server/actions/admin-actions.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/youtube-service.ts`
- `src/server/validators/admin.ts`
- `src/tests/unit/admin-validators.test.ts`
- `src/tests/unit/youtube-service.test.ts`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/integration/student-service.test.ts`

### O que foi implementado

- Capa de modulo removida do schema, migration, repositorio e UI administrativa.
- Capa de aula adicionada ao schema, validacao, repositorio, action e UI administrativa.
- Upload de capa de aula reaproveita o storage de capas existente, sem criar nova variavel de ambiente.
- Pagina inicial do curso do aluno passou a exibir modulos verticais e aulas horizontais com cards visuais.
- Aula sem capa cadastrada usa thumbnail do YouTube como fallback.
- Pagina interna da aula nao foi alterada.

### Testes executados

- `npx prisma generate`
- `npm run typecheck`
- `npm run prisma:validate` com `DATABASE_URL` e `DIRECT_URL` temporarios locais.
- `npm run test -- --run src/tests/unit/admin-validators.test.ts src/tests/unit/youtube-service.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/student-service.test.ts`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos testes

- Prisma generate: aprovado.
- Typecheck: aprovado.
- Prisma validate: aprovado com variaveis temporarias locais.
- Testes focados: aprovados.
- Lint: aprovado.
- Build: aprovado.
- Suite completa: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha preexistente ja registrada.

### Riscos encontrados

- A migration remove intencionalmente dados existentes em `modules.cover_image_url`.
- Nao identificado no repositorio um procedimento oficial para aplicar a migration no banco de producao.

## Revisao 2026-05-10 - Conexoes Prisma no aluno

### Arquivos revisados

- `src/app/app/error.tsx`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/server/services/student-service.ts`
- `src/server/repositories/student-repository.ts`
- `src/lib/db/prisma.ts`

### Causa identificada

- A mensagem exibida ao aluno vem do error boundary da area `/app`.
- A consulta operacional ao banco retornou `EMAXCONNSESSION max clients reached in session mode`, indicando esgotamento de conexoes no pooler Supabase.
- Com `connection_limit=1`, `npx prisma migrate status` confirmou `Database schema is up to date!`.

### O que foi implementado

- `PrismaClient` passou a ser reaproveitado via `globalThis` tambem em producao.
- Em producao, `DATABASE_URL` recebe `connection_limit=1` em runtime quando esse parametro nao foi definido.
- O build local continua funcional quando `DATABASE_URL` nao esta configurada.

### Testes executados

- `npm run typecheck`
- `npm run lint`
- `npm run test -- --run src/tests/integration/student-service.test.ts src/tests/unit/youtube-service.test.ts`
- `npm run build`
- `npx prisma migrate status` com `connection_limit=1`

### Resultado dos testes

- Typecheck: aprovado.
- Lint: aprovado.
- Testes focados: aprovados.
- Build: aprovado.
- Prisma migrate status: banco atualizado.

### Riscos encontrados

- Se a plataforma de deploy tiver muitas instancias simultaneas, o limite total do Supabase ainda pode ser atingido; a configuracao operacional do pool no Supabase continua relevante.

## Revisao 2026-05-10 - Endurecimento final da edicao de aluno

### Arquivos revisados

- `src/app/admin/students/page.tsx`
- `src/server/actions/admin-actions.ts`
- `src/server/validators/admin.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`
- `src/components/admin/feedback.tsx`
- `src/tests/integration/admin-actions.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `src/tests/integration/admin-service.test.ts`

### Causa identificada

- A mensagem "Algum campo obrigatorio esta ausente ou fora do formato esperado." corresponde a `status=invalid`.
- O parse dedicado do aluno ja retornava mensagens especificas para erros Zod, mas a edicao ainda podia falhar depois, no reposititorio.
- O update usava `findFirstOrThrow`; quando o produtor nao tinha vinculo com o aluno, ou quando os identificadores ocultos estavam inconsistentes, o Prisma gerava `P2025`.
- `P2025` era convertido pelo mapper generico para `status=invalid`, por isso a tela ainda exibia a mensagem generica.

### O que foi implementado

- Update de aluno passou a verificar explicitamente `user.id`, `studentProfile.id` e vinculo do produtor antes de atualizar.
- Falha de escopo ou identificadores inconsistentes retorna `student_not_found`.
- `saveStudentAction` passou a usar mapper proprio de erros de aluno para falhas de reposititorio/Auth.
- Feedback recebeu mensagens especificas para:
  - identificador do usuario;
  - identificador do perfil;
  - nome;
  - e-mail;
  - senha;
  - documento;
  - telefone;
  - status;
  - aluno fora do escopo do produtor;
  - conflito de e-mail/documento/Auth;
  - erro de Auth;
  - falha final de salvamento.
- Testes de Server Action foram ampliados para cobrir cada campo e falhas de mutacao.

### Testes executados

- `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos testes

- Testes focados: aprovados, 28 testes.
- Typecheck: aprovado.
- Lint: aprovado.
- Build: aprovado.
- Suite completa: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha preexistente ja registrada.

### Riscos encontrados

- Nao identificado no repositorio um teste de componente/server page que submeta o formulario real renderizado; a cobertura foi feita no schema/action/service.

## Revisao 2026-05-10 - Consistencia de escopo e exclusao de aluno

### Arquivos revisados

- `src/server/repositories/admin-repository.ts`
- `src/server/actions/admin-actions.ts`
- `src/app/admin/students/page.tsx`
- `prisma/schema.prisma`
- `src/tests/integration/admin-actions.test.ts`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/integration/admin-repository.test.ts`
- `src/tests/unit/admin-validators.test.ts`

### Causa identificada

- A listagem de alunos e os fluxos de mutacao podiam divergir por depender estritamente de `producer_students`.
- Em cenarios com dados legados/incompletos, o aluno podia aparecer no contexto do produtor e falhar na edicao por escopo.
- A exclusao retornava sucesso mesmo sem remover cadastro, porque apagava apenas o vinculo `producer_students`.

### O que foi implementado

- Escopo de aluno do produtor unificado para aceitar:
  - vinculo direto em `producer_students`;
  - matricula em curso cujo `producer_id` e o produtor atual.
- Edicao de aluno passou a validar `studentProfile.id + user.id` dentro desse escopo e, quando necessario, cria o vinculo `producer_students`.
- Exclusao de aluno passou a remover `users` (role `STUDENT`) no escopo do produtor, com cascata para `student_profiles`, `enrollments`, `lesson_progress` e `lesson_notes`.
- Mapper generico de erro passou a reconhecer `StudentMutationError`, evitando fallback para mensagem generica.

### Testes executados

- `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/admin-repository.test.ts src/tests/unit/admin-validators.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos testes

- Testes focados: aprovados.
- Typecheck: aprovado.
- Lint: aprovado.
- Build: aprovado.
- Suite completa: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha preexistente.

### Riscos encontrados

- A exclusao agora e destrutiva para o cadastro do aluno no tenant; em cenarios de compartilhamento de aluno entre produtores no mesmo tenant, a remocao por um produtor remove o aluno para todos.

- Cadastro publico de administrador fica aberto para qualquer e-mail nesta iteracao.
- Nao foi identificado no repositorio um papel separado de "produtor"; o fluxo continua com roles `ADMIN` e `STUDENT`.

### Pendencias

- Aplicar migration `20260508153000_module_cover_image` no banco alvo.
- Reexecutar testes quando o ambiente local permitir acesso sem erro `EPERM`.

---

### 2026-05-08 - Introducao de role PRODUCER

### Arquivos criados ou alterados

- `prisma/schema.prisma`
- `prisma/migrations/20260508170000_add_producer_role/migration.sql`
- `src/server/permissions/rbac.ts`
- `src/server/actions/auth-actions.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`
- `src/app/admin/layout.tsx`
- `src/app/admin/me/page.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/app/(auth)/login/admin/register/page.tsx`
- `middleware.ts`
- `src/tests/unit/rbac.test.ts`
- `src/tests/integration/auth-actions.test.ts`
- `src/tests/integration/admin-service.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`
- `.codex/context/DECISIONS.md`

### O que foi implementado

- Novo papel `PRODUCER` no dominio de usuarios.
- Login administrativo aceitando `ADMIN` e `PRODUCER`.
- Cadastro da pagina admin convertido para criacao de `PRODUCER`.
- Regra de acesso para produtor no `/admin` com bloqueio das rotas de usuarios/alunos/matriculas.
- Ajuste de menu admin para esconder navegacao restrita quando o usuario e produtor.
- Services de cursos/modulos/aulas e perfil proprio liberados para `ADMIN` e `PRODUCER`.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Resultado dos testes

- Todos aprovados.

### Riscos encontrados

- Campo de CPF para `PRODUCER` nao esta modelado separadamente no repositorio atual; no fluxo atual, CPF continua formalmente associado ao perfil de cliente/aluno.

### Pendencias

- Aplicar migration `20260508170000_add_producer_role` no banco alvo.

---

### 2026-05-08 - Separacao SaaS por papel, ownership e provisionamento inicial

### O que foi implementado

- Login cliente sem CTA para login administrativo.
- Cadastro publico admin bloqueado.
- Ownership de curso por produtor e vinculo produtor-aluno.
- Cadastro de aluno por produtor com reaproveitamento de credencial existente sem alterar senha.
- Dashboard admin com ultimo acesso.
- Meus dados aluno com troca de senha + confirmacao.
- Meus dados admin/produtor com troca de senha opcional.
- Provisionamento aplicado para admin solicitado e produtor principal no tenant.

### Testes executados

- `npm run lint` (aprovado)
- `npm run typecheck` (aprovado)
- `npm run test` (aprovado)
- `npm run build` (aprovado)
- `npx prisma migrate deploy` (aprovado)
- `npx tsx prisma/provision-saas-accounts.ts` (aprovado)

### Observacao tecnica

- Nao foi possivel criar produtor com o mesmo e-mail do admin devido unicidade de e-mail no modelo local e no Supabase Auth. Foi aplicado fallback seguro para `douglaslundy+producer@gmail.com`.

---

### 2026-05-08 - Saneamento final de usuarios e ajuste de entrada admin

### Arquivos criados ou alterados

- `prisma/provision-saas-accounts.ts`
- `src/server/permissions/rbac.ts`
- `src/app/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/tests/unit/rbac.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `.codex/context/CURRENT_STATE.md`
- `.codex/context/DECISIONS.md`

### O que foi implementado

- Provisionamento consolidado para manter apenas:
  - admin: `dlsistemas100@gmail.com`
  - produtor: `douglaslundy@gmail.com`
  - aluno: `douglaslundy100@gmail.com`
- Transferencia de cursos ativos para o produtor principal.
- Consolidacao de perfil de aluno para cadastro unico.
- Ajuste de labels na landing para linguagem de produtor.
- Redirect de usuario nao autenticado em rota administrativa para `/login/admin`.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npx tsx prisma/provision-saas-accounts.ts`

### Resultado dos testes

- Todos aprovados.

### Riscos encontrados

- O script de provisionamento afeta dados e credenciais do ambiente atual; deve ser executado apenas no tenant/ambiente esperado.

### Pendencias

- Nao identificadas no escopo desta etapa.

---

### 2026-06-05 - Cadastro do curso RUDAH Massagem

### Arquivos criados ou alterados

- `prisma/create-rudah-massagem-course.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Criado script idempotente para cadastrar/atualizar o curso `CURSO RUDAH MASSAGEM` com slug `curso-rudah-massagem`.
- Curso vinculado ao produtor `douglaslundy@gmail.com`.
- Modulos e aulas tiveram o trecho antes de ` - ` removido antes da gravacao.
- Submodulos foram cadastrados como modulos sequenciais por nao existir entidade de submodulo no schema.
- Itens com URL diretamente abaixo do modulo/submodulo foram cadastrados como aula unica com o mesmo titulo limpo.
- Foram cadastrados 11 modulos e 61 aulas.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npx tsx prisma/create-rudah-massagem-course.ts`
- Consulta de validacao via Prisma Client para curso `slug=curso-rudah-massagem`

### Resultado dos testes

- `lint`: aprovado.
- `typecheck`: aprovado.
- `build`: aprovado.
- Script de carga: aprovado.
- Verificacao em banco: curso `CURSO RUDAH MASSAGEM` localizado com 11 modulos, 61 aulas e produtor `douglaslundy@gmail.com`.

### Riscos encontrados

- O script recria modulos/aulas do curso `curso-rudah-massagem` a cada execucao, comportamento intencional para manter consistencia da trilha.
- A estrutura de submodulo foi achatada como modulo sequencial porque o schema identificado nao possui submodulos.

### Pendencias

- Nao identificadas no escopo desta etapa.

### Proxima etapa recomendada

- Validar visualmente no painel administrativo a ordenacao final dos modulos e aulas.

---

### 2026-05-16 - Discovery: PDF, links de aula e continuar ultima aula

### Arquivos criados ou alterados

- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `prompts/13_DISCOVERY_PDF_LINKS_CONTINUE.md`
- `prompts/14_IMPLEMENT_PDF_LINKS.md`
- `prompts/15_IMPLEMENT_CONTINUE_LAST_LESSON.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Mapeamento tecnico das camadas atuais de aula:
  - admin: CRUD de aulas em `src/app/admin/modules/[moduleId]/lessons/page.tsx`, `src/server/actions/admin-actions.ts`, `src/server/services/admin-service.ts`, `src/server/repositories/admin-repository.ts`, `src/server/validators/admin.ts`;
  - aluno: consumo de aula em `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx` com service/repository em `student-service` e `student-repository`.
- Proposta de evolucao definida:
  - materiais de aula por entidade dedicada (`lesson_materials`) com tipo (`PDF`/`LINK`), ordenacao e status;
  - continuidade de estudo por leitura de progresso (`lesson_progress`) e trilha ordenada de aulas ativas.
- Prompts de execucao criados em 3 etapas:
  - discovery;
  - implementacao de materiais;
  - implementacao do menu "continuar ultima aula".

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: falhou em 3 suites:
  - `src/tests/integration/auth-actions.test.ts` (`cache is not a function`);
  - `src/tests/unit/admin-validators.test.ts` (regra de senha inicial);
  - `src/tests/integration/admin-repository.test.ts` (expectativa de escopo antiga).

### Riscos encontrados

- Sem alinhamento previo de modelagem, adicionar PDF/links direto em `lessons` tende a gerar acoplamento e migracoes futuras mais caras.
- Fluxo de "continuar ultima aula" pode expor aula indevida sem reuso das verificacoes atuais de matricula/status.
- Integracoes de links externos ampliam superficie de risco sem validacao HTTPS e renderizacao segura.

### Pendencias

- Implementar migration + schema para `lesson_materials`.
- Implementar CRUD admin/aluno para materiais.
- Implementar menu/atalho "Continuar ultima aula".
- Corrigir suites de testes pendentes para voltar ao verde completo.

### Proxima etapa recomendada

Executar `prompts/14_IMPLEMENT_PDF_LINKS.md` em etapa incremental, mantendo bloqueio de escrita em producao sem aprovacao explicita.

---

### 2026-06-04 - Feedback especifico para salvar aula

### Arquivos criados ou alterados

- `src/server/actions/admin-actions.ts`
- `src/components/admin/feedback.tsx`
- `src/tests/integration/admin-actions.test.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/DECISIONS.md`

### O que foi implementado

- O salvamento de aula passou a usar um status especifico para falhas de `Lesson`, evitando o fallback generico de mutacao administrativa.
- Foram adicionadas mensagens proprias para:
  - conflito de posicao;
  - falha de validacao/persistencia da aula;
  - erro desconhecido no salvamento da aula;
  - erro relacionado a auth/storage, quando aplicavel.
- A cobertura de testes passou a verificar o redirecionamento de erro especifico para o fluxo de salvamento de aula.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts`

### Resultado dos testes

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `src/tests/integration/admin-actions.test.ts`: aprovado.
- `src/tests/unit/admin-validators.test.ts`: falhou em teste preexistente de regra de senha inicial do aluno, sem relacao com o fluxo de aula.

### Riscos encontrados

- O fluxo de salvamento de aula ainda depende do estado real do banco e do `moduleId` informado pelo formulario.
- A falha preexistente do validator de aluno continua registrada fora deste ajuste.

### Pendencias

- Nenhuma pendencia nova criada por esta correcao.

### Proxima etapa recomendada

Se o problema persistir em ambiente real, capturar o `status` retornado na URL ou o erro do servidor para fechar a causa raiz especifica do banco.

---

### 2026-06-04 - Home do aluno prioriza ultima progressao

### Arquivos criados ou alterados

- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/tests/integration/student-service.test.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/DECISIONS.md`

### O que foi implementado

- A home da area do aluno passou a escolher o bloco de continuidade com base na ultima progressao registrada no banco, em vez da ordem de criacao das matriculas.
- O fallback continua ativo para usuarios sem progresso salvo.
- A cobertura de testes foi ajustada para garantir que o curso exibido no bloco de continuidade corresponde ao ultimo curso realmente acessado.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`

### Resultado dos testes

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `src/tests/integration/student-service.test.ts`: aprovado.

### Riscos encontrados

- O criterio ainda depende de `lesson_progress`; se o aluno nunca concluiu ou desmarcou nenhuma aula, o fallback continua sendo usado.
- Se futuramente for necessario rastrear visita sem conclusao, sera preciso persistir novo evento de "ultima aula acessada".

### Pendencias

- Nenhuma pendencia nova criada por este ajuste.

### Proxima etapa recomendada

- Se o produto quiser rastrear visita sem conclusao, criar uma entidade/evento dedicado para "ultima aula acessada".

---

### 2026-06-04 - Curso Mestre co Claude cadastrado

### Arquivos criados ou alterados

- `prisma/create-mestre-com-claude-course.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/DECISIONS.md`

### O que foi implementado

- Curso `Mestre co Claude` cadastrado de forma idempotente e vinculado ao produtor `douglaslundy@gmail.com`.
- Os modulos numerados do pedido foram gravados sem o prefixo numerico.
- As aulas foram cadastradas na ordem informada, preservando os links enviados.
- Duas aulas sem URL foram registradas como pendencia e nao foram inseridas no banco.

### Testes executados

- `npx tsx prisma/create-mestre-com-claude-course.ts`
- Consulta de validacao via Prisma Client para o curso `mestre-co-claude`

### Resultado dos testes

- Script de carga: aprovado.
- Verificacao em banco: curso localizado com 3 modulos e 27 aulas, produtor `douglaslundy@gmail.com`.

### Riscos encontrados

- As duas aulas sem URL continuam ausentes ate serem fornecidos os links corretos.
- O script recria a arvore de modulos/aulas do curso a cada execucao, comportamento intencional para manter consistencia.

### Pendencias

- Receber as URLs faltantes das duas aulas pendentes, se elas existirem.

### Proxima etapa recomendada

- Validar visualmente a ordenacao final do curso no painel administrativo.

---

### 2026-06-04 - Conteudo extra do curso O PODER DO FLASH

### Arquivos criados ou alterados

- `prisma/create-o-poder-do-flash-extra-lessons.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`

### O que foi implementado

- Atualizacao idempotente do modulo `CONTEUDO EXTRA` do curso `O PODER DO FLASH`.
- Remocao das aulas existentes apenas no modulo alvo antes da recriacao.
- Gravacao de 15 aulas na ordem enviada, sem o prefixo numerico dos titulos.
- Normalizacao dos links `shorts` para `watch?v=` para atender a constraint de `youtube_url` do banco.

### Testes executados

- `npx tsx prisma/create-o-poder-do-flash-extra-lessons.ts`
- Consulta de validacao via Prisma Client para o modulo `CONTEUDO EXTRA`

### Resultado dos testes

- Script de carga: aprovado.
- Verificacao em banco: modulo localizado com 15 aulas, titulos sem numeracao inicial e ordem preservada.

### Riscos encontrados

- A carga recria as aulas do modulo alvo a cada execucao, comportamento intencional para manter consistencia.
- Os links foram convertidos de `shorts` para `watch?v=` para respeitar a constraint atual do schema.

### Pendencias

- Nenhuma pendencia nova criada por este ajuste.

### Proxima etapa recomendada

- Validar visualmente no painel administrativo a ordenacao final das aulas do modulo.

---

### 2026-06-04 - Home do aluno baseada na ultima aula tocada

### Arquivos criados ou alterados

- `src/server/services/student-service.ts`
- `src/server/repositories/student-repository.ts`
- `src/tests/integration/student-service.test.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`

### O que foi implementado

- A abertura de uma aula agora atualiza `lesson_progress`, mesmo quando o aluno ainda nao marcou como concluida.
- A home do aluno passou a usar a ultima interacao real com aula aberta como origem do card de continuidade.
- O comportamento de curso totalmente concluido foi mantido como revisao da ultima aula.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`
- `npm.cmd run build`

### Resultado dos testes

- `lint`: aprovado.
- `typecheck`: aprovado.
- `student-service.test.ts`: aprovado.
- `build`: aprovado.

### Riscos encontrados

- O sistema passa a registrar uma interacao de progresso ao abrir a aula, o que aumenta o volume de writes em relacao ao comportamento anterior.
- O card de continuidade agora prioriza a ultima aula aberta, mesmo se o aluno ainda nao a concluiu, o que e coerente com "retomar de onde parou" mas pode diferir de uma expectativa de "proxima aula". 

### Pendencias

- Nenhuma pendencia nova criada por este ajuste.

### Proxima etapa recomendada

- Se quiser reduzir writes, avaliar uma estrategia de debounce ou tracking dedicado de visita de aula.

---

### 2026-06-04 - Card de continuidade na pagina do curso

### Arquivos criados ou alterados

- `src/app/app/courses/[courseId]/page.tsx`
- `src/server/services/student-service.ts`
- `src/server/repositories/student-repository.ts`
- `src/tests/integration/student-service.test.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`

### O que foi implementado

- A pagina do curso passou a renderizar o card de continuidade a partir do `continueLesson` entregue pelo service.
- O service passou a calcular o card do curso com base na ultima aula tocada naquele curso, em vez de recomputar apenas pelas aulas concluidas.
- A regra ficou alinhada com a home do aluno para evitar divergencia entre telas.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`
- `npm.cmd run build`

### Resultado dos testes

- `lint`: aprovado.
- `typecheck`: aprovado.
- `student-service.test.ts`: aprovado.
- `build`: aprovado.

### Riscos encontrados

- O service agora realiza uma consulta adicional para identificar a ultima aula tocada no curso.
- A regra passa a depender de `lesson_progress` atualizado ao abrir a aula, o que aumenta writes mas deixa o comportamento previsivel.

### Pendencias

- Nenhuma pendencia nova criada por este ajuste.

### Proxima etapa recomendada

- Se o produto quiser reduzir writes, avaliar tracking dedicado de visita ou consolidacao do acesso em debounce.

---

### 2026-05-16 - Implementacao inicial: materiais de aula e continuar ultima aula

### Arquivos criados ou alterados

- `prisma/schema.prisma`
- `prisma/migrations/20260516141000_add_lesson_materials/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/admin-service.ts`
- `src/server/services/student-service.ts`
- `src/server/actions/admin-actions.ts`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `src/app/app/page.tsx`
- `src/app/app/continue/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/components/student/student-navigation.tsx`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Modelagem de materiais por aula com entidade dedicada `lesson_materials`:
  - `type` (`PDF`/`LINK`), `title`, `url`, `position`, `status`.
- Validator Zod para material de aula com URL HTTPS obrigatoria.
- CRUD de materiais na area administrativa dentro da tela de aulas por modulo.
- Exibicao de materiais da aula na area do aluno com abertura externa segura.
- Continuidade de estudo:
  - calculo server-side da aula elegivel;
  - rota `/app/continue` para redirecionamento automatico;
  - CTA na home e item de navegacao "Continuar".

### Testes executados

- `npm run lint`
- `npx prisma generate`
- `npm run typecheck`
- `npm run test -- --run src/tests/integration/admin-service.test.ts src/tests/integration/student-service.test.ts src/tests/integration/admin-actions.test.ts src/tests/unit/student-components.test.tsx`
- `npm run build`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npx prisma generate`: aprovado.
- `npm run typecheck`: aprovado.
- Testes focados: aprovados (35 testes).
- `npm run build`: aprovado.

### Riscos encontrados

- Upload binario de PDF ainda nao foi implementado; nesta etapa o material PDF depende de URL HTTPS.
- Suite completa `npm run test` continua com pendencias antigas fora do escopo desta entrega (auth/tests legados ja mapeados no TODO).

### Pendencias

- Criar testes unitarios/integracao especificos para `lesson_materials` e para regra de continuidade.
- Avaliar etapa futura de upload binario de PDF com storage dedicado e validacoes de tamanho/tipo.

### Proxima etapa recomendada

Aplicar migration em ambiente homologado (nao producao) e validar fluxo completo admin/aluno com dados reais de materiais.

---

### 2026-05-10 - Correcoes finais do vinculo produtor-aluno por e-mail

### Arquivos criados ou alterados

- `src/app/admin/students/page.tsx`
- `src/components/admin/feedback.tsx`
- `src/server/actions/admin-actions.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/validators/admin.ts`
- `src/tests/integration/admin-actions.test.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/REVIEW.md`

### O que foi implementado

- Ajustado fluxo de verificacao por e-mail para carregar aluno existente com campos bloqueados e acao exclusiva de vinculo.
- Removida obrigatoriedade de senha para novo cadastro por produtor.
- Corrigido algoritmo de vinculo para manter o mesmo escopo da busca por e-mail e evitar falso `student_not_found`.
- Corrigida listagem/dashboard de alunos do produtor para exibir alunos vinculados no novo fluxo.
- Corrigida remocao de aluno para remover apenas vinculo sem depender de filtro de tenant que invalida o unlink.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-repository.test.ts src/tests/integration/student-repository.test.ts src/tests/integration/student-service.test.ts`

### Resultado dos testes

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- Testes de integracao focados: bloqueados por ambiente local ao carregar `vitest.config.mts` (`Cannot read directory "../..": Access is denied`).

### Riscos encontrados

- O fluxo de vinculo entre tenants diferentes exige atencao para governanca de dados no nivel de produto.
- Nao foi possivel validar os testes focados de integracao neste ambiente por restricao de permissao local.

### Pendencias

- Reexecutar os testes de integracao focados em ambiente sem restricao de leitura de `vitest.config.mts`.

---

### 2026-05-10 - Vinculo de aluno preexistente por Auth

### Arquivos criados ou alterados

- `src/server/repositories/admin-repository.ts`
- `src/server/actions/admin-actions.ts`
- `src/components/admin/feedback.tsx`
- `src/tests/integration/admin-actions.test.ts`
- `src/tests/integration/admin-repository.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- O cadastro de aluno por produtor agora tenta reaproveitar um aluno interno existente tambem pelo `auth_user_id` quando o e-mail ja existe no Supabase Auth.
- Quando esse aluno ja pertence ao mesmo tenant como `STUDENT`, o fluxo cria apenas o vinculo em `producer_students` e retorna `linked_existing`.
- `saveStudentAction` passou a preservar o `redirect` de sucesso `linked_existing`, sem converte-lo para `student_save_error`.
- A mensagem de feedback do admin foi ajustada para confirmar vinculacao com sucesso.
- Testes focados cobrem o fallback por Auth no repository e o redirect de sucesso na action.

### Testes executados

- `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/admin-repository.test.ts src/tests/unit/admin-validators.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Resultado dos testes

- Testes focados: aprovados, 31 testes.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm run build`: aprovado.

### Riscos encontrados

- O fallback por Auth continua restrito a `role=STUDENT` e `organizationId` igual; acessos Auth ligados a outros papeis continuam fora desse reaproveitamento.
- Nao foi executada a suite completa `npm run test`; permanece a falha preexistente em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, ja registrada no repositorio.

### Pendencias

- Corrigir em etapa propria o harness de `auth-actions.test.ts` para liberar a suite completa.

---

### 2026-05-10 - Correcao de edicao de modulos e alunos

### Arquivos criados ou alterados

- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `src/app/admin/students/page.tsx`
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Formulario de modulos agora usa `key` estavel por curso/modulo e `autoComplete="off"` para remontar ao alternar entre cadastro e edicao.
- Campos de modulo passam a receber valores vazios explicitos quando nao ha registro em edicao, evitando reaproveitamento visual de estado anterior.
- Edicao de aluno passou a buscar o registro por `editId` no backend, escopado por organizacao/produtor, sem depender da pagina atual da listagem.
- Formulario de aluno passou a usar `key` por registro e `autoComplete="off"` nos campos, com `new-password` no campo de senha.
- Teste de validator confirma que senha vazia em edicao de aluno e normalizada para `null`, mantendo a senha existente.

### Testes executados

- `npm install`
- `npm run test -- --run src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos testes

- `npm install`: aprovado; gerou Prisma Client. Aviso: projeto exige Node `20.x`, ambiente atual usa Node `24.14.1`; npm reportou 13 vulnerabilidades ja existentes na arvore instalada.
- Testes focados: aprovados, 15 testes.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado, sem warnings.
- `npm run build`: aprovado.
- `npm run test`: falhou em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function` ao importar `src/server/auth/session.ts`. Falha nao relacionada aos arquivos alterados nesta etapa.

### Riscos encontrados

- Nao foi alterada a regra de unicidade `@@unique([courseId, position])`; portanto, conflitos reais de posicao continuam corretamente bloqueados pelo banco.
- A validacao completa via `npm run test` permanece bloqueada por falha no harness de testes de autenticacao.

### Pendencias

- Corrigir em etapa propria o harness de `auth-actions.test.ts` para compatibilizar `react.cache` no Vitest ou ajustar a estrategia de mock.

---

### 2026-05-10 - Mensagens especificas no CRUD de alunos

### Arquivos criados ou alterados

- `src/app/admin/students/page.tsx`
- `src/components/admin/feedback.tsx`
- `src/server/actions/admin-actions.ts`
- `src/tests/integration/admin-actions.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- `saveStudentAction` recebeu parse dedicado para aluno, separando a validacao do CRUD de alunos do `parseForm` generico.
- Campos do formulario de aluno foram renomeados para nomes especificos (`studentEmail`, `studentPassword`, `studentName`, etc.) para reduzir autofill indevido em edicao.
- Erros de validacao de aluno agora retornam status especificos e mensagens de UI com o motivo: identificador, nome, e-mail, senha inicial, nova senha, documento, telefone ou status.
- Senha vazia em edicao continua sendo enviada ao service como `null`, mantendo a senha existente no Supabase.
- Testes de Server Action cobrem edicao com senha vazia e mensagens especificas para e-mail invalido, senha inicial ausente e nova senha curta.

### Testes executados

- `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos testes

- Testes focados: aprovados, 19 testes.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `npm run test`: falhou somente em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha ja registrada antes desta etapa.

### Riscos encontrados

- Navegadores podem ignorar `autoComplete="off"` em alguns cenarios, mas os nomes especificos dos campos reduzem a chance de preenchimento automatico indevido.
- Mensagens agora sao mais especificas, mas continuam sem expor detalhes tecnicos de banco/Auth.

### Pendencias

- Corrigir em etapa propria o harness dos testes de autenticacao para liberar `npm run test` completo.

---

### 2026-05-09 - Correcao de edicao de modulo (update vs create)

### Arquivos criados ou alterados

- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/app/admin/courses/[courseId]/modules/page.tsx`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

### O que foi implementado

- Corrigido o fluxo de edicao de modulo para nao depender do item estar em `modules.items` da pagina atual.
- Adicionada busca dedicada de modulo por `editId` no backend, com escopo de seguranca por tenant/ownership.
- Tela de modulos passa a preencher formulario de edicao com esse retorno dedicado, preservando envio de `id` para update.

### Testes executados

- `npm run lint`
- `npm run typecheck`

### Resultado dos testes

- `npm run lint`: aprovado com warning preexistente (`@next/next/no-img-element`).
- `npm run typecheck`: aprovado.

### Riscos encontrados

- Nao foram identificados riscos novos alem do warning visual preexistente de uso de `<img>`.

### Pendencias

- Nao identificadas no escopo desta etapa.

---

### 2026-05-09 - Cadastro do curso Shibari

### Arquivos criados ou alterados

- `prisma/create-shibari-course.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

### O que foi implementado

- Criado script Prisma idempotente para cadastrar/atualizar o curso `Shibari` com slug `shibari`.
- Vinculo do curso aplicado ao produtor `douglaslundy@gmail.com`.
- Modulos criados conforme titulos nao numerados fornecidos.
- Aulas criadas na ordem de aparicao, com remocao da numeracao no inicio do titulo.
- Modulos sem aulas foram preservados (`Dó Ré Mi Na Wa` e `Menu Nawa V - Suspensão`).

### Testes executados

- `npx tsx prisma/create-shibari-course.ts`
- `npm run lint`
- `npm run typecheck`

### Resultado dos testes

- Script de carga: aprovado.
- Verificacao em banco: curso localizado com 8 modulos e 44 aulas, produtor `douglaslundy@gmail.com`.
- `npm run lint`: aprovado com 1 warning preexistente (`@next/next/no-img-element`).
- `npm run typecheck`: aprovado.

### Riscos encontrados

- O script recria modulos/aulas do curso `shibari` a cada execucao (comportamento intencional para manter consistencia da trilha).

### Pendencias

- Nao identificadas no escopo desta etapa.

### Proxima etapa recomendada

- Validar visualmente no painel administrativo a ordenacao final de modulos e aulas.

---

### 2026-05-22 - Cadastro do curso de boxe

### Arquivos criados ou alterados

- `prisma/create-boxing-course.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Criado script Prisma idempotente para cadastrar/atualizar o curso `CURSO DE BOXE`.
- Curso vinculado ao produtor `douglaslundy@gmail.com`.
- Modulos cadastrados removendo o prefixo antes de ` - ` nos nomes.
- Aulas cadastradas em seus modulos conforme mapeamento da playlist.
- `Aula 29 - Combinações Básicas` nao foi cadastrada porque o video nao foi identificado na playlist e o schema exige `youtubeUrl`.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npx tsx prisma/create-boxing-course.ts`
- Consulta de validacao via Prisma Client para curso `slug=curso-de-boxe`

### Resultado dos testes

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- Script de carga: aprovado.
- Verificacao em banco: curso `CURSO DE BOXE` localizado com 4 modulos e 93 aulas, produtor `douglaslundy@gmail.com`.

### Riscos encontrados

- O script recria modulos/aulas do curso `curso-de-boxe` a cada execucao, comportamento intencional para manter consistencia da trilha.
- A aula 29 permanece pendente ate existir link de video confiavel.

### Pendencias

- Informar/cadastrar o link correto da `Aula 29 - Combinações Básicas`, se o video existir fora da playlist consultada.

### Proxima etapa recomendada

- Validar visualmente no painel administrativo a ordenacao final do curso.

### Proxima etapa recomendada

- Validar manualmente login e alteracao de e-mail em `Meus dados` para admin, produtor e aluno.

---

### 2026-06-04 - Cadastro do curso de fotografia

### Arquivos criados ou alterados

- `prisma/create-fotografia-course.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Criado script idempotente para cadastrar o curso `CURSO DE FOTOGRAFIA` com slug `curso-de-fotografia`.
- Curso vinculado ao produtor `douglaslundy@gmail.com`.
- Prefixos dos modulos removidos antes da gravacao.
- Foram cadastrados 7 modulos e 84 aulas com URLs confiaveis.
- 30 aulas sem URL confiavel identificada foram registradas como pendencia de origem, sem inventar links.
- O nome formal do curso nao estava identificado no repositório; foi adotado um titulo operacional consistente com o conteudo enviado.

### Testes executados

- `npx tsx prisma/create-fotografia-course.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

### Resultado dos testes

- Script de carga: aprovado.
- `lint`: aprovado.
- `typecheck`: aprovado.
- `build`: aprovado.

### Riscos encontrados

- As 30 aulas sem URL confiavel continuam pendentes para entrada futura, caso o material original seja localizado.
- Os modulos 1 e 6 ficaram sem aulas porque nao houve link seguro identificado no repositório ou na extracao enviada.

### Pendencias

- Se o material original das aulas faltantes aparecer depois, o script pode ser reexecutado com os links corretos.

### Proxima etapa recomendada

- Validar visualmente no painel administrativo a estrutura do curso e, se necessario, ajustar o titulo operacional.

---

### 2026-05-08 - Performance de consultas no dashboard

### Arquivos criados ou alterados

- `src/server/repositories/admin-repository.ts`
- `.codex/context/CURRENT_STATE.md`
- `docs/TODO.md`
- `docs/REVIEW.md`

### O que foi implementado

- Remocao de consultas redundantes no calculo de `pendingLessons` do dashboard.
- Refatoracao de metricas de consumo por aluno para consulta agregada unica com joins e `GROUP BY`, reduzindo carga de dados e roundtrips.
- Mantido escopo por organizacao e filtros por produtor/aluno no mesmo SQL.

### Testes executados

- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run src/tests/integration/admin-repository.test.ts src/tests/integration/admin-service.test.ts`

### Resultado dos testes

- Todos aprovados.

### Riscos encontrados

- Consulta SQL agregada exige cuidado em futuras alteracoes de schema para manter compatibilidade com aliases e filtros.

### Pendencias

- Nao identificadas no escopo desta etapa.

---

### 2026-07-02 - Cadastro de aulas com Google Drive/OneDrive e menu dedicado

### Arquivos criados ou alterados

- `src/server/services/video-platform-service.ts`
- `src/server/services/youtube-service.ts`
- `src/server/validators/admin.ts`
- `src/server/actions/admin-actions.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/server/services/student-service.ts`
- `src/components/student/lesson-video-player.tsx`
- `src/components/admin/lesson-form.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/components/admin/pagination.tsx`
- `src/app/admin/lessons/page.tsx`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/tests/unit/admin-validators.test.ts`
- `src/tests/unit/youtube-service.test.ts`
- `prisma/migrations/20260702120000_expand_lesson_video_url_platforms/migration.sql`

### O que foi implementado

- Cadastro de aula passou a aceitar URLs suportadas de YouTube, Google Drive e OneDrive.
- Google Drive e OneDrive passaram a renderizar no player da aula do aluno via iframe.
- O redirecionamento de salvar/remover aula passou a aceitar `redirectTo` interno seguro para preservar o contexto da tela atual.
- Criada a pagina `/admin/lessons`, acessivel pelo menu `Cadastrar aulas`, com selecao de curso e modulo para criar ou editar aulas sem navegar por curso > modulo.
- Criada migration para trocar a constraint antiga de YouTube por constraint de plataformas suportadas.

### Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run prisma:validate`
- `npm.cmd run test -- --run src/tests/unit/admin-validators.test.ts src/tests/unit/youtube-service.test.ts src/tests/integration/admin-actions.test.ts`
- `npm.cmd run build`

### Resultado dos testes

- Todos aprovados.

### Riscos encontrados

- A migration foi aplicada no banco configurado apos aprovacao operacional.
- Marcacao automatica de conclusao por fim de video permanece disponivel apenas para YouTube.
- OneDrive e renderizado a partir do link compartilhado; se a permissao do arquivo bloquear iframe, o arquivo precisara estar compartilhado corretamente na origem.

### Pendencias

- Nenhuma pendencia imediata identificada para este ajuste.

### Proxima etapa recomendada

- Validar visualmente o cadastro real com os links de Google Drive e OneDrive informados.

---

### 2026-07-03 - Modal de cadastro/edicao de aulas e diagnostico OneDrive

### Arquivos criados ou alterados

- `src/components/admin/admin-modal.tsx`
- `src/app/admin/lessons/page.tsx`
- `src/app/admin/modules/[moduleId]/lessons/page.tsx`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/server/services/video-platform-service.ts`
- `src/tests/unit/youtube-service.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Criado modal administrativo reutilizavel para formularios.
- O botao `Cadastrar aula` agora abre modal em `/admin/lessons` usando `create=1`.
- A edicao de aula em `/admin/lessons` abre o mesmo modal usando `editId`.
- A tela `/admin/modules/[moduleId]/lessons` recebeu o mesmo comportamento para cadastro e edicao.
- Verificacao somente leitura no banco confirmou 2 aulas OneDrive cadastradas, ambas sem `coverImageUrl`.
- Teste real do endpoint de thumbnail OneDrive usado pelo codigo retornou `400 Bad Request` para URL cadastrada.
- Teste do endpoint Microsoft Graph sem token retornou `401 Unauthorized`, confirmando que nao ha thumbnail publica automatica confiavel identificada no repositorio.
- O fallback de thumbnail OneDrive deixou de gerar URL invalida; o card do aluno mostra um fallback visual com `OneDrive` quando nao ha capa manual.

### Testes executados

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test -- --run src/tests/unit/youtube-service.test.ts src/tests/unit/admin-validators.test.ts src/tests/integration/admin-actions.test.ts`
- `npm.cmd run build`

### Resultado dos testes

- `typecheck`: aprovado.
- `lint`: aprovado, sem warnings.
- Testes focados: aprovados, 41 testes.
- `build`: aprovado.

### Riscos encontrados

- OneDrive nao fornece thumbnail publica confiavel para os links cadastrados sem integracao autenticada com Microsoft Graph.
- Produtores que quiserem capa real em aula OneDrive precisam informar URL HTTPS de capa ou fazer upload manual da capa no formulario.

### Pendencias

- Nao identificadas no escopo desta etapa.

### Proxima etapa recomendada

- Validar visualmente `/admin/lessons?create=1` e uma edicao por `editId` no navegador com usuario produtor/admin.

---

### 2026-07-08 - Correcao de reordenacao de aulas pelo modal

### Arquivos criados ou alterados

- `src/server/repositories/admin-repository.ts`
- `src/tests/integration/admin-repository.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Identificada a causa da falha de reordenacao: a rotina usava posicoes temporarias negativas, mas o banco exige `position > 0` em `modules` e `lessons`.
- A rotina `shiftPositions` passou a usar posicoes temporarias positivas altas antes de aplicar as posicoes finais.
- Testes de reordenacao foram atualizados para cobrir a nova sequencia temporaria positiva.
- Nao houve migration nova.

### Testes executados

- `npm.cmd run test -- --run src/tests/integration/admin-repository.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`

### Resultado dos testes

- Teste focado aprovado: 15 testes.
- `lint`: aprovado.
- `typecheck`: aprovado.
- Suite completa: aprovada, 108 testes.
- `build`: aprovado.

### Riscos encontrados

- A falha anterior podia fechar o modal apos submit e nao alterar a ordenacao por erro de constraint no banco real.

### Pendencias

- Nenhuma pendencia identificada para esta correcao.

### Proxima etapa recomendada

- Validar deploy automatico na Vercel apos o push e retestar a edicao de posicao de aula no painel.

---

### 2026-07-08 - Sessoes separadas e desempenho de middleware

### Arquivos criados ou alterados

- `middleware.ts`
- `src/lib/supabase/session.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/actions/auth-actions.ts`
- `src/app/app/layout.tsx`
- `src/server/services/student-service.ts`
- `src/components/admin/admin-shell.tsx`
- `src/components/student/student-shell.tsx`
- `src/tests/integration/auth-actions.test.ts`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`
- `.codex/context/CURRENT_STATE.md`

### O que foi implementado

- Criada configuracao de cookies por audiencia: `syscursos-admin-auth` e `syscursos-client-auth`.
- Sessao configurada com `maxAge` de 15 dias.
- Cliente Supabase SSR atualizado para `getAll/setAll`.
- Middleware deixou de consultar usuario/banco a cada navegacao; agora verifica apenas se ha sessao da audiencia correta em rotas protegidas.
- Guards server-side passaram a ler o cookie correto conforme os papeis exigidos.
- Logout recebeu audiencia explicita para sair somente da area atual.
- Area do aluno passou a exigir sessao/papel `STUDENT`.
- Testes de login/logout cobrem o uso do cookie correto por audiencia.

### Testes executados

- `npm.cmd run test -- --run src/tests/integration/auth-actions.test.ts src/tests/unit/rbac.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

### Resultado dos testes

- Testes focados: aprovados, 17 testes.
- `typecheck`: aprovado.
- `lint`: aprovado.
- Suite completa: aprovada, 110 testes.
- `build`: aprovado.

### Riscos encontrados

- Como o nome do cookie mudou, sessoes antigas no navegador nao serao reaproveitadas; sera necessario logar novamente uma vez apos o deploy.
- Se o Supabase Auth da VPS tiver expiracao de refresh token menor que 15 dias, a configuracao do servidor Auth tambem precisara ser ajustada fora do codigo.

### Pendencias

- Nenhuma pendencia identificada para esta correcao.

### Proxima etapa recomendada

- Apos deploy, testar no mesmo navegador: login produtor em `/login/admin`, login aluno em `/login/client`, alternancia entre `/admin` e `/app` e logout independente em cada area.

---

### 2026-07-30 - Cadastro do curso Bíblia Comentada na VPS

### O que foi executado

- Criado o script transacional `prisma/create-biblia-comentada-course.ts`.
- Importado somente o bloco explicitamente identificado como `A Bíblia Comentada` no arquivo de origem.
- Curso `Bíblia Comentada` criado com slug `biblia-comentada` e vinculado ao produtor `douglaslundy@gmail.com`.
- Gravados 67 módulos e 758 aulas na ordem da origem.
- Para 234 itens sem URL aceita pelo schema, foi usado marcador técnico; a observação ou URL original ficou preservada na descrição.

### Validação no banco

- Curso ativo e ownership confirmado.
- 67 módulos e 758 aulas confirmados.
- Posições de módulos e aulas confirmadas como consecutivas.
- `Marcos` na posição 44 e `Lucas` na posição 45 confirmados sem aulas, conforme o arquivo.
- Todas as 234 aulas com marcador possuem descrição de origem.

### Verificações do repositório

- `npm.cmd run lint`: aprovado.
- `npm.cmd run test`: aprovado, 110 testes.
- `npm.cmd run typecheck`: falhou por dois erros preexistentes em `prisma/update-metodo-sub10-course.ts`, arquivo não rastreado e não alterado nesta operação.
- `npm.cmd run build`: compilou a aplicação e falhou na verificação de tipos pelo mesmo arquivo preexistente.

### Riscos e pendências

- Os 234 itens com marcador não possuem mídia reproduzível no arquivo de origem; seus links reais precisarão ser cadastrados quando estiverem disponíveis.
- Corrigir separadamente os erros de tipo do script não rastreado `prisma/update-metodo-sub10-course.ts`.

---

### 2026-07-30 - Cadastro dos demais cursos de biblia.txt

### Resultado

- O usuário confirmou que os blocos `CURSO:` devem ser cadastrados como cursos independentes.
- Criados 15 cursos adicionais por meio de `prisma/create-biblia-additional-courses.ts`.
- O lote adicional possui 60 módulos e 802 aulas.
- Somado ao `Bíblia Comentada`, o catálogo importado possui 16 cursos, 127 módulos e 1.560 aulas.
- Todos os cursos estão ativos e vinculados a `douglaslundy@gmail.com`.
- Nenhum slug estava previamente ocupado; não houve sobrescrita de cursos alheios.
- A validação pós-gravação confirmou cada título, posição, URL e descrição.
- As 267 aulas sem URL compatível no catálogo completo usam marcador técnico e preservam a origem na descrição.


---

### 2026-07-30 - Restauração da autenticação do produtor

### Diagnóstico

- A conta interna de `douglaslundy@gmail.com` estava ativa, vinculada ao Auth e sem expiração de acesso.
- O domínio do Supabase retornava `404` porque o contêiner Kong da instância SysCursos não existia, embora os demais serviços estivessem saudáveis.
- A interface convertia a falha de infraestrutura em mensagem genérica de credenciais inválidas.

### Correção e validação

- O serviço Kong foi recriado usando os arquivos de composição existentes na VPS.
- O contêiner ficou saudável com política de reinício `unless-stopped`, e o proxy voltou a encaminhar o domínio público.
- A senha da conta solicitada foi redefinida sem persistir o valor em documentação.
- Um login real por e-mail e senha foi concluído pela API pública do Supabase com o identificador Auth esperado; a sessão de validação foi encerrada em seguida.
- A página pública `/login/admin` permaneceu disponível com resposta HTTP 200.
- Verificações finais do repositório: lint aprovado, 110 testes aprovados e `git diff --check` sem erros.
- Typecheck e build seguem bloqueados somente pelos erros preexistentes nas linhas 264 e 268 de `prisma/update-metodo-sub10-course.ts`, que não foi alterado nesta operação.

---

### 2026-09-02 - Desempenho da area do aluno, avanco automatico e bloco "continuar"

### Arquivos criados ou alterados

- `src/server/cache/course-content.ts` (novo)
- `src/server/services/student-service.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/auth/session.ts`
- `src/server/actions/admin-actions.ts`
- `src/server/actions/student-actions.ts`
- `src/components/student/lesson-completion-panel.tsx`
- `src/components/student/lesson-trail-sidebar.tsx`
- `src/components/student/continue-lesson-block.tsx` (novo)
- `src/app/app/page.tsx`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- Testes: `lesson-completion-panel`, `lesson-trail-sidebar` (novo), `continue-lesson-block` (novo), `student-service`, `student-actions`, `admin-actions`
- `prisma/create-resenhas-filosoficas-course.ts` (novo, cadastro do curso Resenhas Filosoficas)

### O que foi implementado

1. Desempenho da navegacao do aluno:
   - `getStudentLesson` deixou de encadear ~11 consultas em serie; agora sao uma
     checagem de acesso e um unico `Promise.all`.
   - `touchLessonProgress` virou upsert autocontido (update vazio, nunca reverte
     aula concluida), fora do caminho critico e no maximo 1x/60s por aula.
   - Arvore de modulos/aulas do curso em `unstable_cache` (tag
     `student-course-content`); mutacoes de curso/modulo/aula/material no painel
     chamam `revalidateTag`.
   - Lookup do usuario da aplicacao em `getCurrentUser` cacheado por identidade
     (tag `app-user`, 120s), invalidado pelas acoes de perfil.
   - Dashboard: 2 counts por curso -> 2 consultas agregadas com mapa por curso.
   - `LessonTrailSidebar` so renderiza as aulas do modulo atual (ou expandido).
2. Avanco automatico: ao concluir a aula (fim do video no YouTube ou botao
   manual) com proxima aula existente, contagem de 5s com "Ir agora"/"Cancelar"
   e `router.push` (navegacao soft).
3. Bloco "ultima aula assistida" (home e curso) extraido para
   `ContinueLessonBlock` com "Assistir novamente" + "Assistir a proxima aula";
   quando a aula do bloco ja e a proxima pendente, mostra so "Continuar".

### Testes executados

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

### Resultado dos testes

- lint: aprovado. typecheck: aprovado. test: 126 testes aprovados. build: aprovado.

### Riscos encontrados

- `unstable_cache`/`revalidateTag` sao novos no repo; se alguma mutacao de
  conteudo de curso nao passar pelas acoes do painel, o cache pode servir a
  arvore antiga por ate 300s.
- O bump de "ultima aula vista" e disparado sem `await`; em ambiente serverless
  pode nao concluir, atrasando o ponteiro de "continuar" em no maximo uma aula.
- Videos do Google Drive/OneDrive continuam sem deteccao de fim; o avanco nesses
  cursos depende do clique manual em "Marcar como concluida".

### Pendencias

- Roundtrip do `supabase.auth.getUser()` a cada render segue de pe (nao mexido
  por ser sensivel a seguranca).
- Item de infra da porta 6643 / modo transacao do pooler permanece pendente.

### Proxima etapa recomendada

- Validar no navegador com usuario aluno: troca de aulas, contagem de avanco,
  os dois botoes do bloco de continuar, e medir a latencia percebida.

---

### 2026-09-03 - Regiao das funcoes Vercel (gargalo do login)

### Diagnostico

- Login e navegacao continuavam lentos apos as otimizacoes de query.
- Causa: funcoes serverless na Vercel rodavam em `iad1` (US East, default
  nao configurado) enquanto Postgres e Supabase Auth (GoTrue) estao na VPS
  Contabo em Lauterbourg, Franca (geo-IP de 144.91.92.70).
- Cada `prisma.*` e cada `supabase.auth.*` de dentro de uma funcao era uma
  ida-e-volta transatlantica (~170ms). Login + cair no `/app` encadeia
  8-12 dessas chamadas (~1,5-2,5s so de latencia).

### Correcao

- `vercel.json`: `"regions": ["fra1"]` (Frankfurt, <10ms da VPS).
- Deploy `dpl_CfMjXfM6VjoFghJDm33HnLWCwWtT` (commit 71cc2fc) confirmado com
  `regions: ["fra1"]` e `X-Vercel-Id: ...::fra1::...`.
- Sem downside para o publico majoritariamente brasileiro (BR->fra1 ~ BR->iad1;
  assets estaticos seguem na CDN global).

### Pendencias / proximos passos

- Validar o tempo real de login com usuario aluno.
- Opcao de fundo (maior): mover a VPS para um datacenter no Brasil, aproximando
  banco e usuarios ao mesmo tempo.
- Roundtrip do `supabase.auth.getUser()` a cada render e conexoes frias do
  pooler agora custam ~5ms em fra1; deixaram de ser prioridade.
