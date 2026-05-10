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
- Upload de capa por arquivo habilitado para cursos e aulas com storage Supabase.

## Validacoes executadas nesta rodada
- `npm.cmd run lint`: falhou (`next` nao encontrado no ambiente atual).
- `npm.cmd run typecheck`: falhou (`tsc` nao encontrado no ambiente atual).
- `npm.cmd run test`: falhou (`vitest` nao encontrado no ambiente atual).
- `npm.cmd run build`: falhou (`prisma`/`next` nao encontrados no ambiente atual).

## Itens nao identificados no repositorio
- Procedimento operacional oficial de deploy de migration em producao.
- Matriz formal de observabilidade/monitoramento.

## Atualizacao 2026-05-09 - Cadastro do curso Shibari
- Script adicionado: `prisma/create-shibari-course.ts`.
- Execucao realizada: `npx tsx prisma/create-shibari-course.ts`.
- Resultado validado em banco: curso `Shibari` (slug `shibari`) vinculado ao produtor `douglaslundy@gmail.com`.
- Estrutura cadastrada:
  - 8 modulos
  - 44 aulas
  - Modulos sem aula: `Dó Ré Mi Na Wa` e `Menu Nawa V - Suspensão`
- Regra aplicada: numeracao removida dos titulos de aula antes da gravacao.

## Validacoes executadas nesta rodada (2026-05-09)
- `npm run lint`: aprovado com 1 warning preexistente em `src/app/admin/courses/[courseId]/modules/page.tsx` (`@next/next/no-img-element`).
- `npm run typecheck`: aprovado.

## Atualizacao 2026-05-09 - Correcao de edicao de modulo
- Causa raiz identificada: tela de modulos buscava `editId` apenas em `modules.items` (lista paginada/filtrada). Quando o item nao estava na pagina atual, o formulario perdia o campo `id` e a acao era interpretada como criacao.
- Correcao aplicada: busca dedicada do modulo por `editId` no backend para popular o formulario de edicao independentemente da paginacao.
- Arquivos alterados:
  - `src/server/repositories/admin-repository.ts`
  - `src/server/services/admin-service.ts`
  - `src/app/admin/courses/[courseId]/modules/page.tsx`
- Validacoes:
  - `npm run lint` (aprovado com warning preexistente de `<img>`)
  - `npm run typecheck` (aprovado)

## Atualizacao 2026-05-10 - Edicao de modulos e alunos
- Causa raiz identificada no modulo: formulario de modulos usava `defaultValue` sem `key` de remount. Ao alternar de cadastro para edicao, o campo `position` podia manter o valor anterior (`1`), gerando conflito com `@@unique([courseId, position])`.
- Correcao aplicada no modulo: `ModuleForm` e campos receberam `key` baseada em curso/modulo, e o formulario recebeu `autoComplete="off"`.
- Causa raiz identificada no aluno: tela de alunos buscava `editId` apenas em `students.items`. Com paginacao/filtro, o registro podia nao estar na lista atual e o formulario era tratado como novo cadastro.
- Correcao aplicada no aluno: busca dedicada de aluno por `editId` no backend, escopada por organizacao/produtor, e formulario com `key` por registro.
- Senha de aluno: validacao confirma que senha vazia em edicao vira `null`; o repositorio so envia senha ao Supabase quando preenchida.
- Autocomplete: formulario/campos de aluno receberam `autoComplete="off"` e senha recebeu `autoComplete="new-password"`.
- Arquivos alterados:
  - `src/app/admin/courses/[courseId]/modules/page.tsx`
  - `src/app/admin/students/page.tsx`
  - `src/server/repositories/admin-repository.ts`
  - `src/server/services/admin-service.ts`
  - `src/tests/integration/admin-service.test.ts`
  - `src/tests/unit/admin-validators.test.ts`
  - `docs/TODO.md`
  - `docs/REVIEW.md`
  - `.codex/context/CURRENT_STATE.md`
- Validacoes:
  - `npm run test -- --run src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
  - `npm run test`: falhou em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function` ao importar `src/server/auth/session.ts`; falha nao relacionada aos arquivos desta correcao.
- Observacao de ambiente: `npm install` foi necessario porque `vitest` nao estava disponivel; o ambiente atual usa Node `24.14.1`, enquanto o projeto declara Node `20.x`.

## Atualizacao 2026-05-10 - Mensagens especificas no CRUD de alunos
- Causa raiz complementar: o erro "Revise os dados informados e tente novamente." vinha de `studentSchema.safeParse` em `saveStudentAction`, que sempre redirecionava validacoes de aluno para `status=invalid`.
- Risco identificado: o formulario usava nomes comuns (`email`, `password`, `name`), que podem receber autofill do navegador; uma senha preenchida automaticamente com menos de 8 caracteres fazia a edicao falhar como validacao generica.
- Correcao aplicada:
  - `saveStudentAction` passou a usar parse dedicado de aluno.
  - Campos do formulario de aluno foram renomeados para `studentEmail`, `studentPassword`, `studentName`, `studentDocument`, `studentPhone`, `studentStatus` e `studentUserId`.
  - Feedback admin recebeu mensagens especificas para identificador, nome, e-mail, senha inicial ausente, nova senha curta, documento, telefone e status invalidos.
  - Senha vazia em edicao segue normalizada para `null` e nao altera a senha cadastrada.
- Arquivos alterados:
  - `src/app/admin/students/page.tsx`
  - `src/components/admin/feedback.tsx`
  - `src/server/actions/admin-actions.ts`
  - `src/tests/integration/admin-actions.test.ts`
  - `docs/TODO.md`
  - `.codex/context/CURRENT_STATE.md`
- Validacoes:
  - `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
  - `npm run test`: falhou em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`; falha preexistente no harness de autenticacao.

## Atualizacao 2026-05-10 - Capa por aula e vitrine do curso
- Print analisado: `C:\Users\dougl\Pictures\Screenshots\Captura de tela 2026-05-10 012313.png`; o layout mostra modulos empilhados verticalmente e aulas em cards horizontais com imagem.
- Decisao aplicada: `modules.cover_image_url` foi removido por migration, e `lessons.cover_image_url` foi adicionado para a capa visual ficar na aula.
- Area do produtor:
  - formulario/listagem de modulos nao cadastra nem exibe capa;
  - formulario/listagem de aulas aceita capa por URL HTTPS ou upload de imagem (`jpeg`, `png`, `webp`, `gif`, `avif`).
- Area do aluno:
  - pagina inicial do curso (`/app/courses/[courseId]`) lista modulos verticalmente e aulas horizontalmente;
  - quando a aula nao possui capa cadastrada, usa thumbnail do YouTube por `youtubeVideoId` ou URL;
  - pagina interna da aula nao foi alterada, mantendo a listagem existente.
- Arquivos alterados:
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
  - testes unitarios/integracao relacionados.
- Validacoes:
  - `npx prisma generate`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run prisma:validate`: aprovado com `DATABASE_URL` e `DIRECT_URL` temporarios locais.
  - `npm run test -- --run src/tests/unit/admin-validators.test.ts src/tests/unit/youtube-service.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/student-service.test.ts`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
  - `npm run test`: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha ja registrada anteriormente.

## Atualizacao 2026-05-10 - Conexoes Prisma no acesso do aluno
- Sintoma analisado: area do aluno exibindo o error boundary `Nao foi possivel carregar` ao acessar curso.
- Evidencia encontrada no banco: `npx prisma migrate status` falhou inicialmente com `FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`.
- Confirmacao posterior: com `connection_limit=1`, `npx prisma migrate status` retornou `Database schema is up to date!`.
- Correcao aplicada:
  - `src/lib/db/prisma.ts` passou a reaproveitar o `PrismaClient` via `globalThis` tambem em producao;
  - em producao, quando `DATABASE_URL` nao define `connection_limit`, o cliente adiciona `connection_limit=1` antes de criar o PrismaClient;
  - quando `DATABASE_URL` nao existe no build local, o cliente usa a configuracao padrao do Prisma sem sobrescrever datasource.
- Arquivo alterado:
  - `src/lib/db/prisma.ts`
- Validacoes:
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run test -- --run src/tests/integration/student-service.test.ts src/tests/unit/youtube-service.test.ts`: aprovado.
  - `npm run build`: aprovado.
