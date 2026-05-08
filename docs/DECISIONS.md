# Decisoes Tecnicas

Registre aqui toda decisao tecnica relevante tomada durante o desenvolvimento.

## Formato obrigatorio

```md
## AAAA-MM-DD - Titulo da decisao

Decisao:

Motivo:

Alternativas consideradas:

Impacto:

Arquivos afetados:
```

## 2026-05-04 - Validacao da stack oficial

Decisao:

Manter a stack oficial definida em `docs/PROJECT_CONTEXT.md`: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Server Actions, Route Handlers quando necessario, Supabase Auth, Prisma ORM, Supabase Postgres, Vitest, React Testing Library e Playwright.

Motivo:

A stack atende aos requisitos de SaaS com areas segregadas, autenticacao, autorizacao por perfil, RLS, CRUD administrativo, area do aluno, anotacoes privadas, progresso e bloqueio por expiracao de matricula.

Alternativas consideradas:

React SPA tradicional, backend separado desde a primeira versao, MySQL, Drizzle ORM e autenticacao customizada.

Impacto:

O projeto seguira arquitetura full stack com forte validacao server-side, menor duplicacao operacional, uso de RLS como defesa em profundidade e produtividade alta com TypeScript.

Arquivos afetados:

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Arquitetura modular por dominio

Decisao:

Adotar arquitetura modular orientada a dominio, separando `app`, `components`, `features`, `server`, `lib`, `types`, `tests` e `prisma`.

Motivo:

O projeto exige separacao clara entre UI, regras de negocio, validacoes, autorizacao, persistencia e infraestrutura. Essa separacao reduz componentes monoliticos, duplicacao e acoplamento.

Alternativas consideradas:

Organizacao por tipo em poucas pastas globais e organizacao totalmente por feature sem camada server compartilhada.

Impacto:

Services centralizarao regras de negocio e autorizacao; repositories ficarao restritos a persistencia; UI recebera apenas dados ja autorizados; Server Actions serao pequenas e delegarao regras para services.

Arquivos afetados:

- `docs/ARCHITECTURE.md`
- `docs/TODO.md`

## 2026-05-04 - Modelo de seguranca em camadas

Decisao:

Aplicar seguranca em camadas com middleware, verificacoes server-side, RBAC, services de permissao, validacao Zod, constraints de banco e RLS.

Motivo:

O principal risco do produto e acesso horizontal entre alunos ou acesso a cursos expirados/inativos. Nenhuma camada isolada e suficiente para proteger todos os fluxos.

Alternativas consideradas:

Proteger apenas por middleware, proteger apenas por UI, ou depender apenas de RLS.

Impacto:

Cada operacao sensivel devera validar autenticacao, perfil, ownership, status de aluno, matricula ativa, expiracao, status de curso, modulo e aula. Testes de autorizacao serao obrigatorios antes de concluir fases criticas.

Arquivos afetados:

- `docs/SECURITY.md`
- `docs/TODO.md`
- `docs/REVIEW.md`

## 2026-05-04 - Setup inicial com Next.js 14

Decisao:

Criar o setup inicial com Next.js 14.2.35, React 18.3.1, App Router, TypeScript strict, Tailwind CSS 3, shadcn/ui configurado por `components.json`, ESLint, Prettier, Husky, lint-staged, Vitest, Testing Library e Playwright.

Motivo:

O ambiente local usa Node 18.17.1. Next.js 15 exige Node mais recente, enquanto Next.js 14.2.35 suporta `>=18.17.0`, compila corretamente neste workspace e preserva App Router, Server Components e Server Actions para as proximas fases.

Alternativas consideradas:

Usar Next.js 15 ou 16 e exigir upgrade imediato do Node; usar scaffold automatico `create-next-app`; adiar testes para fase posterior.

Impacto:

A Fase 2 fica funcional e validada no ambiente atual. O projeto permanece pronto para evoluir para autenticacao, banco e telas funcionais sem reestrutura inicial. Existe risco residual de auditoria em dependencias que o npm recomenda corrigir apenas com upgrade para Next.js 16, o que requer decisao futura de runtime.

Arquivos afetados:

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
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
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Modelo relacional inicial com Prisma

Decisao:

Criar o schema inicial com as entidades `User`, `StudentProfile`, `Course`, `Module`, `Lesson`, `Enrollment`, `LessonNote` e `LessonProgress`, usando UUIDs, enums de status, timestamps, relacionamentos explicitos, indices e constraints de unicidade.

Motivo:

O dominio exige controle forte de aluno, curso, matricula, ordenacao de conteudo, anotacoes privadas e progresso individual. O modelo relacional normalizado facilita autorizacao server-side, RLS futura, integridade de dados e consultas administrativas.

Alternativas consideradas:

Modelo com uma tabela unica de usuarios sem `StudentProfile`; historico ilimitado de matriculas duplicadas por aluno e curso; progresso calculado apenas por eventos; anotacoes sem constraint unica.

Impacto:

Cada aluno possui no maximo uma matricula por curso na primeira versao, renovacoes devem atualizar a matricula existente, e cada aluno possui no maximo uma anotacao e um registro de progresso por aula. A Fase 4 devera adicionar policies RLS alinhadas a essas chaves.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260504120000_initial_schema/migration.sql`
- `prisma/seed.ts`
- `src/lib/db/prisma.ts`
- `docs/DATABASE.md`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Autenticacao Supabase com RBAC server-side

Decisao:

Implementar autenticacao com Supabase Auth via `@supabase/ssr`, manter RBAC no servidor com perfis `ADMIN` e `STUDENT`, proteger `/admin` e `/app` no middleware e repetir autorizacao critica com guards server-side.

Motivo:

Middleware melhora a experiencia e bloqueia acesso cedo, mas nao deve ser a unica barreira de seguranca. Guards server-side mantem a regra critica proxima da renderizacao protegida e reduzem risco de bypass por chamada direta.

Alternativas consideradas:

Confiar apenas no middleware; confiar apenas no frontend; usar autenticacao customizada; usar service role key nos fluxos de usuario.

Impacto:

Login e logout passam por Server Actions, inputs sao validados com Zod, usuarios internos precisam existir e estar ativos, e cada perfil e redirecionado para sua area. RLS foi criada como migration SQL, mas ainda depende de aplicacao em Supabase real.

Arquivos afetados:

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
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Modulo administrativo com Server Actions

Decisao:

Implementar o modulo administrativo com Server Components para leitura, Server Actions para mutacoes, validators Zod por entidade, services protegidos por `requireRole("ADMIN")` e repositories isolando o Prisma.

Motivo:

O modulo administrativo executa operacoes sensiveis e nao pode confiar no frontend. Separar UI, actions, services, repositories e validators mantem autorizacao critica no servidor, reduz duplicacao e deixa o dominio testavel.

Alternativas consideradas:

CRUD client-side com API Routes, queries Prisma diretamente nas paginas, componentes monoliticos por dominio e forms sem camada de service.

Impacto:

Todas as mutacoes administrativas passam por Server Actions e validacao Zod. Listagens usam paginacao simples por `page`, `pageSize` e `query`. A criacao de usuarios no Supabase Auth e definicao de senha inicial permanecem pendentes para uma etapa especifica de gerenciamento de identidade.

Arquivos afetados:

- `src/app/admin/**`
- `src/components/admin/**`
- `src/server/actions/admin-actions.ts`
- `src/server/services/admin-service.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/validators/admin.ts`
- `src/server/validators/pagination.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Area do aluno com autorizacao por matricula

Decisao:

Implementar a area do aluno com Server Components para leitura, Server Action para concluir aula, services protegidos por `requireRole("STUDENT")`, repositories filtrando matricula e conteudo ativo, e Route Handler `/app/forbidden` retornando HTTP 403 para acesso sem matricula.

Motivo:

O aluno so pode acessar conteudo vinculado a matricula ativa e nao expirada. Essa regra precisa ficar no servidor e nao pode depender de filtros visuais no frontend.

Alternativas consideradas:

Filtrar cursos apenas na UI; redirecionar acesso negado para dashboard sem status 403; calcular progresso no cliente; listar aulas inativas com bloqueio visual.

Impacto:

Dashboard e paginas do aluno exibem apenas dados autorizados. Cursos expirados ou inativos sao bloqueados com aviso. Curso sem matricula redireciona para endpoint 403. Progresso e calculado por aulas ativas concluidas.

Arquivos afetados:

- `src/app/app/**`
- `src/components/student/**`
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
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Cadernos com texto plano sanitizado

Decisao:

Implementar anotacoes de aula e cadernos por curso com Server Actions para escrita, services validando perfil `STUDENT`, matricula ativa e aula ativa, repositories filtrando por `studentId`, e conteudo salvo como texto plano sanitizado.

Motivo:

As anotacoes sao privadas e fazem parte do risco principal de acesso horizontal. Salvar texto plano reduz superficie de XSS, simplifica renderizacao segura e evita introduzir editor rich text antes de haver necessidade real.

Alternativas consideradas:

Editor rich text com HTML sanitizado, API Route client-side, filtragem apenas no frontend e autosave sem debounce.

Impacto:

Cada aluno continua limitado a uma nota por aula pela constraint unica do banco. O autosave usa debounce para reduzir escritas, mas toda gravacao passa por Zod, sanitizacao, verificacao de matricula ativa e verificacao de aula ativa no servidor.

Arquivos afetados:

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
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - UI da area do aluno com identidade proprietaria

Decisao:

Revisar a area do aluno com shell responsivo, sidebar desktop, bottom navigation mobile, cards de curso, skeletons, estados vazios e erro recuperavel, usando a logo proprietaria autorizada de `sysdoc.vercel.app`.

Motivo:

A etapa exige uma interface moderna de area de membros, original, responsiva e acessivel, sem copiar marca, textos ou assets de terceiros.

Alternativas consideradas:

Manter header simples, usar uma biblioteca de dashboard pronta, criar identidade visual inspirada em marketplace de cursos e carregar logo como `<img>` sem configuracao de imagem.

Impacto:

O aluno ganha navegacao persistente e clara em desktop e mobile. A logo remota foi configurada em `next.config.mjs` para uso com `next/image`. A paleta global foi ajustada para uma identidade propria com contraste adequado e sem dependencia de assets proibidos.

Arquivos afetados:

- `next.config.mjs`
- `src/app/globals.css`
- `src/app/app/**`
- `src/components/student/**`
- `docs/TODO.md`
- `docs/UI_UX.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Autosave editavel nos cadernos

Decisao:

Reutilizar um componente unico de autosave para as anotacoes da aula e para as notas exibidas em `Meus Cadernos`, mantendo debounce de 900ms e botao de salvamento manual.

Motivo:

O caderno deve permitir edicao direta com autosave, sem criar uma rota paralela ou duplicar logica de persistencia. A Server Action existente ja valida Zod, sanitiza texto, verifica perfil `STUDENT`, matricula ativa e aula ativa.

Alternativas consideradas:

Manter o caderno somente leitura; criar uma API Route client-side separada; duplicar o editor da aula dentro da pagina de cadernos.

Impacto:

As notas do caderno passam a ser editaveis e salvas automaticamente pelo mesmo fluxo seguro das anotacoes da aula. O componente evita sobrescrever alteracoes mais recentes quando uma resposta de salvamento anterior retorna atrasada.

Arquivos afetados:

- `src/components/student/note-autosave-editor.tsx`
- `src/components/student/lesson-note-editor.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/tests/unit/student-components.test.tsx`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Build Vercel resiliente para Prisma

Decisao:

Adicionar `postinstall: prisma generate`, manter `build: prisma generate && next build`, criar `vercel.json` com build e install commands explicitos, sincronizar `package-lock.json` com Node `20.x`, aplicar override do `glob` usado pelo plugin ESLint do Next e manter somente um ignore de webpack especifico para o warning conhecido de `@supabase/realtime-js`.

Motivo:

O deploy da Vercel estava executando um commit antigo que ainda usava `next build` puro e falhava ao coletar dados de `/login` porque o Prisma Client nao era gerado durante o build. A documentacao oficial do Prisma recomenda `postinstall: prisma generate` em Vercel para evitar Prisma Client desatualizado quando ha cache de dependencias. A documentacao da Vercel tambem permite fixar o runtime por `engines.node`; o lockfile precisava refletir `20.x` para remover a inconsistencia. O warning de `@supabase/realtime-js` e originado por dependencia interna do `supabase-js`, nao por codigo da aplicacao, entao foi filtrado de forma restrita no webpack.

Alternativas consideradas:

Confiar apenas no script `build`, rodar migrations automaticamente no build da Vercel, commitar Prisma Client gerado e ignorar warnings de instalacao.

Impacto:

O Prisma Client passa a ser gerado no install e novamente antes do build, reduzindo risco de falha por cache ou build command. Migrations continuam fora do build para evitar alterar banco em deploy sem controle. O deploy deve ocorrer em Node 20 e usar os comandos versionados no repositorio.

Arquivos afetados:

- `package.json`
- `package-lock.json`
- `vercel.json`
- `next.config.mjs`
- `vitest.config.mts`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

## 2026-05-04 - Login resiliente a configuracao Supabase e falha de banco

Decisao:

Criar helper central para variaveis Supabase, aceitando `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, e tratar falhas de leitura do usuario interno durante login com redirecionamento controlado para `/login?error=server`.

Motivo:

Em producao, o login pode falhar por diferenca entre nomenclaturas das chaves atuais do Supabase ou por indisponibilidade/configuracao incorreta do banco no momento em que o Prisma busca o usuario interno. Sem tratamento, o Next.js exibe apenas `Application error` com digest, dificultando recuperacao do usuario e diagnostico.

Alternativas consideradas:

Exigir somente `NEXT_PUBLIC_SUPABASE_ANON_KEY`, expor a mensagem tecnica na UI, ou ignorar o erro de banco e permitir login sem usuario interno.

Impacto:

O sistema continua exigindo usuario interno ativo e autorizacao server-side, mas passa a falhar de forma controlada no login. O erro tecnico segue registrado no log do servidor, sem expor detalhes sensiveis ao usuario.

Arquivos afetados:

- `.env.example`
- `src/lib/supabase/env.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/actions/auth-actions.ts`
- `src/app/(auth)/login/page.tsx`
- `src/tests/unit/supabase-env.test.ts`
- `src/tests/integration/auth-actions.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - Falhas de sessao protegidas contra tela de erro generica

Decisao:

Tratar excecoes de Supabase e Prisma em `getCurrentUser`, `requireRole` e `middleware`, retornando estado de erro controlado e redirecionando rotas protegidas para `/login?error=server`.

Motivo:

Em producao, uma falha de infraestrutura durante a resolucao da sessao ou do usuario interno pode ocorrer fora do fluxo de login, por exemplo apos o redirect para `/admin` ou `/app`. Sem tratamento, o Next.js exibe `Application error` com digest, sem orientar o usuario.

Alternativas consideradas:

Deixar a excecao subir para o error boundary, redirecionar sempre para `/login` sem distinguir erro tecnico, ou permitir acesso sem confirmar usuario interno.

Impacto:

O acesso continua bloqueado quando a autorizacao server-side nao pode ser confirmada. O usuario recebe uma mensagem segura no login, enquanto o erro tecnico fica registrado nos logs da Vercel.

Arquivos afetados:

- `middleware.ts`
- `src/server/auth/types.ts`
- `src/server/auth/session.ts`
- `src/server/auth/guards.ts`
- `src/server/actions/auth-actions.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-04 - CRUD administrativo com falhas controladas e provisionamento de aluno

Decisao:

Padronizar as Server Actions administrativas para capturar falhas de validacao, constraints e infraestrutura, redirecionando com status controlado. O cadastro de aluno passa a exigir senha inicial e provisionar o usuario no Supabase Auth com `SUPABASE_SERVICE_ROLE_KEY`; edicoes permitem troca opcional de senha.

Motivo:

Falhas em Server Actions, como constraint unica de curso ou indisponibilidade de banco/Auth, estavam subindo como excecao server-side e exibindo `Application error` com digest. Alem disso, alunos criados apenas na tabela interna nao conseguiam autenticar porque nao existia usuario correspondente no Supabase Auth.

Alternativas consideradas:

Manter CRUD apenas no Prisma e provisionar Auth por script separado; expor detalhes tecnicos na UI; capturar erros individualmente em cada pagina; permitir aluno sem usuario Auth ate etapa futura.

Impacto:

Todos os CRUDs administrativos passam a retornar feedback seguro em vez de erro generico. Alunos novos ja ficam aptos a acessar o sistema desde que o ambiente tenha `SUPABASE_SERVICE_ROLE_KEY` configurada. A autorizacao critica permanece no servidor e o frontend nao recebe secrets.

Arquivos afetados:

- `src/server/actions/admin-actions.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/validators/admin.ts`
- `src/lib/supabase/admin.ts`
- `src/components/admin/feedback.tsx`
- `src/app/admin/students/page.tsx`
- `src/tests/integration/admin-service.test.ts`
- `src/tests/unit/admin-validators.test.ts`
- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`

## 2026-05-05 - Ajustes incrementais com economia de contexto

Decisao:

Tratar os novos ajustes de CRUD, aula, caderno e video como etapas pequenas, cada uma com analise de causa raiz, testes proporcionais e commit proprio. Para economizar tokens, cada retomada deve ler primeiro `docs/TODO.md`, `docs/DEVELOPMENT_MEMORY.md`, esta decisao e apenas os arquivos diretamente envolvidos na etapa em andamento.

Motivo:

Os problemas relatados cruzam UI administrativa, regras de matricula, navegacao da aula, caderno e normalizacao de video. Separar por fluxo reduz risco de regressao e facilita retomada apos reinicio ou limite de contexto.

Alternativas consideradas:

Resolver tudo em uma unica alteracao ampla; refatorar a area administrativa inteira antes de corrigir bugs; executar somente correcao visual sem revisar services e testes.

Impacto:

Cada etapa deve manter separacao entre UI, Server Actions, services, repositories e validators. CRUDs administrativos devem listar registros em modo leitura, usando formulario unico para criacao/edicao apos acao explicita de editar. Matriculas canceladas devem permanecer visiveis ao aluno com status de cancelamento, sem liberar conteudo protegido indevidamente.

Arquivos afetados:

- `docs/TODO.md`
- `docs/REVIEW.md`
- `docs/DECISIONS.md`
- `docs/DEVELOPMENT_MEMORY.md`
- `prompts/11_CRUD_ADMIN_UX_FIXES.md`
- `prompts/12_STUDENT_LESSON_NOTEBOOK_VIDEO_FIXES.md`

## 2026-05-07 - Login separado por publico com redirecionamento por intencao

Decisao:

Separar o login em paginas dedicadas (`/login/client` e `/login/admin`) e manter a autenticacao no mesmo `loginAction`, adicionando o campo `audience` para orientar o destino apos autenticar.

Motivo:

A demanda exige entradas separadas para clientes e administradores sem duplicar logica de autenticacao server-side.

Alternativas consideradas:

Duplicar Server Actions por publico; manter pagina unica com toggle visual.

Impacto:

Landing publica em `/` passa a direcionar para o login correto. O fluxo de cliente redireciona para `/app` mesmo para usuario admin, e o acesso final ao conteudo continua condicionado a `studentProfileId` no servidor.

Arquivos afetados:

- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/components/shared/login-form.tsx`
- `src/server/actions/auth-actions.ts`
- `src/server/auth/guards.ts`
- `src/server/permissions/rbac.ts`
- `src/app/app/layout.tsx`
- `middleware.ts`

## 2026-05-07 - Capa de curso via URL HTTPS validada

Decisao:

Implementar capa de curso na forma de URL HTTPS (`coverImageUrl`) em vez de upload binario nesta iteracao.

Motivo:

Atende o requisito funcional com baixo risco, sem introduzir storage, upload, assinatura de URL ou pipeline adicional de seguranca de arquivos.

Alternativas consideradas:

Upload direto para Supabase Storage nesta mesma etapa; uso de assets locais fixos.

Impacto:

Curso passa a armazenar e exibir capa no dashboard do aluno mantendo os componentes existentes. Foi criada migration para coluna `cover_image_url`.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260507195500_course_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/server/repositories/student-repository.ts`
- `src/server/services/student-service.ts`
- `src/app/admin/courses/page.tsx`
- `src/components/student/course-card.tsx`

## 2026-05-08 - Base SaaS multi-admin por organizacao

Decisao:

Introduzir `Organization` e vincular `User` e `Course` por `organizationId`, aplicando escopo de organizacao nas consultas administrativas principais e no dashboard de consumo por aluno.

Motivo:

Permitir que cada administrador gerencie apenas seus cursos e alunos, com suporte a cadastro de novos administradores e clientes no mesmo tenant.

Alternativas consideradas:

- Isolamento apenas via filtros de tela.
- Isolamento apenas por role sem tenant explicito.

Impacto:

- Estrutura de base pronta para modelo SaaS multi-admin.
- Necessidade de aplicar migration de tenant no banco real antes de executar novos fluxos.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260508110000_multi_tenant_organizations/migration.sql`
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/app/admin/page.tsx`

## 2026-05-08 - Capa de modulo por URL HTTPS

Decisao:

Adicionar `cover_image_url` em `modules` e tratar capa de modulo como URL HTTPS em vez de upload binario nesta etapa.

Motivo:

Implementacao incremental e testavel, reaproveitando validacao ja adotada para capa de curso sem ampliar escopo para novos fluxos de storage.

Alternativas consideradas:

Upload de arquivo com bucket dedicado para modulos nesta mesma etapa.

Impacto:

Modulo passa a aceitar, persistir e exibir capa por URL sem alterar fluxo de aulas, cursos ou area do aluno.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260508153000_module_cover_image/migration.sql`
- `src/server/validators/admin.ts`
- `src/server/repositories/admin-repository.ts`
- `src/app/admin/courses/[courseId]/modules/page.tsx`

## 2026-05-08 - Cadastro publico por audiencia de login

Decisao:

Criar cadastro publico separado por audiencia (`admin` e `client`) com `registerAction` unica, definindo role pelo contexto da pagina de origem.

Motivo:

Atender requisito de solicitacao de cadastro nas duas telas de login sem duplicar camada de autenticacao.

Alternativas consideradas:

Cadastro unico sem separar audiencia; cadastro apenas administrativo com aprovacao manual.

Impacto:

Novos usuarios conseguem se cadastrar e entrar no sistema pela area correspondente. Cada cadastro cria uma `organization` propria para manter isolamento SaaS por tenant.

Arquivos afetados:

- `src/server/auth/schemas.ts`
- `src/server/actions/auth-actions.ts`
- `src/components/shared/login-form.tsx`
- `src/components/shared/register-form.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `src/app/(auth)/login/client/page.tsx`
- `src/app/(auth)/login/admin/register/page.tsx`
- `src/app/(auth)/login/client/register/page.tsx`

## 2026-05-08 - Papel PRODUCER com escopo administrativo restrito

Decisao:

Introduzir role `PRODUCER` com acesso ao painel `/admin` para gerenciamento de cursos/modulos/aulas e sem acesso a usuarios, alunos e matriculas.

Motivo:

Atender ao requisito de cadastro de produtores mantendo segregacao de responsabilidades entre administrador principal e produtores.

Alternativas consideradas:

1. Reutilizar apenas `ADMIN` para produtores.
2. Criar um painel separado para produtor.

Impacto:

- Fluxo admin passa a aceitar `ADMIN` e `PRODUCER` no login administrativo.
- Cadastro pela pagina administrativa publica cria usuario `PRODUCER`.
- Rotas sensiveis de gestao de usuarios/alunos/matriculas continuam exclusivas de `ADMIN`.

Arquivos afetados:

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

## 2026-05-08 - Responsabilidades SaaS por papel com ownership de produtor

Decisao:

Separar responsabilidades por papel no mesmo tenant: `ADMIN` gerencia produtores; `PRODUCER` gerencia cursos/modulos/aulas/alunos/matriculas sob seu ownership; `STUDENT` gerencia dados pessoais e senha.

Motivo:

Atender aos requisitos de separacao SaaS com isolamento operacional por produtor e sem cadastro publico de administrador.

Alternativas consideradas:

1. Manter escopo apenas por organizacao.
2. Criar nova aplicacao/painel separado por papel.

Impacto:

- Novo ownership de cursos por produtor.
- Novo vinculo N:N produtor-aluno.
- Fluxo de cadastro de aluno passa a vincular aluno existente sem reset de senha.
- Ultimo acesso fica registrado em `users.last_login_at`.

Arquivos afetados:

- `prisma/schema.prisma`
- `prisma/migrations/20260508190000_saas_responsibilities/migration.sql`
- `src/server/repositories/admin-repository.ts`
- `src/server/services/admin-service.ts`
- `src/server/actions/admin-actions.ts`
- `src/server/actions/auth-actions.ts`
- `src/server/permissions/rbac.ts`
- `src/server/actions/student-actions.ts`
- `src/server/repositories/student-repository.ts`
- `src/app/admin/*`
- `src/app/app/me/page.tsx`
- `src/components/shared/login-form.tsx`
- `src/components/admin/feedback.tsx`

## 2026-05-08 - Redirect administrativo dedicado e saneamento de contas base

Decisao:

Direcionar acessos nao autenticados a rotas administrativas para `/login/admin` e padronizar a base com apenas 3 contas operacionais (1 admin, 1 produtor, 1 aluno) via script de provisionamento.

Motivo:

Atender o fluxo solicitado de entrada administrativa em `/admin` sem quebrar o painel e eliminar usuarios residuais/legados do ambiente.

Alternativas consideradas:

1. Manter redirect administrativo para `/login/client`.
2. Limpar usuarios manualmente por SQL avulso sem script versionado.

Impacto:

O fluxo de autenticacao administrativa fica explicito para o usuario final, e o saneamento de contas fica reexecutavel e auditavel pelo repositorio.

Arquivos afetados:

- `src/server/permissions/rbac.ts`
- `src/app/page.tsx`
- `src/app/(auth)/login/admin/page.tsx`
- `prisma/provision-saas-accounts.ts`
- `src/tests/unit/rbac.test.ts`
