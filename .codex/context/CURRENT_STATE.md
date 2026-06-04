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

## Atualizacao 2026-05-10 - CRUD de alunos com mensagens especificas
- Causa raiz revisada: a edicao de aluno podia passar pela validacao Zod e falhar depois no reposititorio; o `findFirstOrThrow` do update gerava erro Prisma `P2025`, que a action convertia para `status=invalid`, exibindo a mensagem generica "Algum campo obrigatorio esta ausente ou fora do formato esperado.".
- Correcao aplicada:
  - update de aluno agora valida explicitamente `user.id`, `studentProfile.id` e vinculo do aluno com o produtor antes de atualizar;
  - falha de escopo/identificadores inconsistentes retorna `student_not_found`;
  - a action de aluno usa mapper proprio para erros de mutacao, sem cair em `adminErrorStatus`;
  - mensagens de feedback foram adicionadas para identificador de usuario, perfil, nome, e-mail, senha, documento, telefone, status, conflito de e-mail/documento, Auth e falha de escopo;
  - testes de action cobrem cada campo validado e erros de reposititorio/Auth.
- Arquivos alterados:
  - `src/server/repositories/admin-repository.ts`
  - `src/server/actions/admin-actions.ts`
  - `src/components/admin/feedback.tsx`
  - `src/tests/integration/admin-actions.test.ts`
  - `docs/TODO.md`
  - `docs/REVIEW.md`
  - `.codex/context/CURRENT_STATE.md`
- Validacoes:
  - `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts src/tests/integration/admin-service.test.ts`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
  - `npm run test`: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha ja registrada anteriormente.

## Atualizacao 2026-05-10 - Consistencia final de edicao/exclusao de aluno
- Causa raiz adicional identificada:
  - o escopo de aluno para produtor dependia apenas de `producer_students`; registros acessiveis por matricula em cursos do produtor podiam falhar na edicao;
  - exclusao de aluno removia somente o vinculo em `producer_students`, apesar da UI informar remocao de dados relacionados.
- Correcao aplicada:
  - escopo de aluno do produtor passou a aceitar `vinculo direto` OU `matricula em curso do produtor`;
  - edicao valida `studentProfile.id + user.id` dentro do escopo e cria/normaliza vinculo `producer_students` quando necessario;
  - exclusao de aluno agora remove o `user` do aluno (cascade de `studentProfile`, matriculas, progresso e notas), com validacao de escopo;
  - mapeamento generico de erros passou a reconhecer `StudentMutationError` para nao cair em mensagem generica.
- Arquivos alterados:
  - `src/server/repositories/admin-repository.ts`
  - `src/server/actions/admin-actions.ts`
- Validacoes:
  - `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/admin-repository.test.ts src/tests/unit/admin-validators.test.ts`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
  - `npm run test`: falhou apenas em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`, falha preexistente.

## Atualizacao 2026-05-10 - Vinculo de aluno preexistente por Auth
- Causa raiz identificada:
  - o cadastro de aluno do produtor ja reaproveitava aluno interno existente por e-mail/documento, mas ainda podia falhar quando o e-mail ja existia no Supabase Auth e o `auth_user_id` correspondente ja estava vinculado a outro `users` interno do mesmo tenant;
  - nesse cenario, a tentativa de criar novo `users` com o mesmo `auth_user_id` disparava `student_auth_conflict`, embora o comportamento esperado fosse apenas vincular o aluno existente ao produtor.
- Correcao aplicada:
  - o fluxo de criacao agora consulta o Supabase Auth antes de criar novo aluno quando nao encontra correspondencia interna inicial;
  - se o `auth_user_id` encontrado ja pertence a um `STUDENT` da mesma `organization`, o sistema cria/normaliza somente o vinculo em `producer_students` e retorna `linked_existing`;
  - `saveStudentAction` passou a respeitar o `redirect` de `linked_existing`, sem converte-lo em `student_save_error`;
  - a mensagem de feedback foi ajustada para confirmar vinculacao com sucesso.
- Arquivos alterados:
  - `src/server/repositories/admin-repository.ts`
  - `src/server/actions/admin-actions.ts`
  - `src/components/admin/feedback.tsx`
  - `src/tests/integration/admin-actions.test.ts`
  - `src/tests/integration/admin-repository.test.ts`
  - `docs/TODO.md`
  - `docs/DECISIONS.md`
  - `docs/REVIEW.md`
  - `.codex/context/CURRENT_STATE.md`
- Validacoes:
  - `npm run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-service.test.ts src/tests/integration/admin-repository.test.ts src/tests/unit/admin-validators.test.ts`: aprovado.
  - `npm run typecheck`: aprovado.
  - `npm run lint`: aprovado.
  - `npm run build`: aprovado.
- `npm run test` completo: nao executado nesta rodada; segue registrada falha preexistente em `src/tests/integration/auth-actions.test.ts` com `TypeError: cache is not a function`.

## Atualizacao 2026-05-10 - Aumento de 30% dos cards de aulas no aluno
- Escopo aplicado somente na vitrine de aulas da pagina de curso do aluno.
- Alteracao visual realizada:
  - `src/app/app/courses/[courseId]/page.tsx`
  - largura do card alterada de `w-40 md:w-44` para `w-52 md:w-56` (aumento aproximado de 30%).
- Nenhuma mudanca de logica, rotas, APIs ou banco.

## Validacoes executadas nesta rodada (2026-05-10)
- `npm run lint`: nao executado diretamente por bloqueio de policy do PowerShell (`npm.ps1`).
- `npm.cmd run lint`: aprovado, sem warnings ou erros.
- `npm run typecheck`: nao executado diretamente por bloqueio de policy do PowerShell (`npm.ps1`).
- `npm.cmd run typecheck`: falhou com erros TypeScript preexistentes fora do escopo desta tarefa (campos `coverImageUrl`/tipagens em arquivos de admin, student service e repositories).
- `npm.cmd run test -- --run src/tests/unit/student-components.test.tsx src/tests/integration/student-service.test.ts`: falhou por erro de ambiente/permissao ao carregar `vitest.config.mts` (`Cannot read directory \"../..\": Access is denied`).
- `npm.cmd run build`: falhou por restricao de rede/permissao ao buscar fontes Google (`Nunito` e `Sora`) durante `next build` (`EACCES`).

## Atualizacao 2026-05-10 - Fluxo de cadastro e vinculo de aluno por produtor
- Fluxo em duas etapas implementado na tela de alunos do produtor:
  - etapa inicial com apenas e-mail + botao de verificacao;
  - e-mail nao encontrado: libera formulario editavel para criar aluno e vincular;
  - e-mail encontrado: exibe dados bloqueados e botao para vincular aluno ao produtor.
- Backend adicionado para:
  - verificar e-mail de aluno por produtor;
  - vincular aluno existente ao produtor;
  - evitar vinculo duplicado (`student_already_linked`).
- Exclusao de aluno por produtor alterada para remover somente vinculo `producer_students` (nao remove `users`/`student_profiles`).
- Regras de acesso do aluno endurecidas no repositório:
  - dashboard e opcoes de caderno filtram apenas cursos cujo produtor possui vinculo com o aluno;
  - acesso por matricula considera tambem vinculo com produtor.

### Commits desta etapa
- `47ea25e feat(producer-students): add lookup/link workflow backend and unlink-only removal`
- `d3de3ed feat(producer-students): add lookup/link workflow backend and unlink-only removal` (ajuste de teste de repositorio)
- `e30a9ed feat(producer-students): implement two-step email lookup UI for student link/create`

### Validacoes executadas nesta etapa
- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run test -- --run src/tests/integration/admin-actions.test.ts src/tests/integration/admin-repository.test.ts src/tests/integration/student-repository.test.ts src/tests/integration/student-service.test.ts`: falhou por restricao de ambiente (`Cannot read directory "../..": Access is denied` ao carregar `vitest.config.mts`).

## Atualizacao 2026-05-10 - Correcao de vinculo/listagem/exclusao no fluxo produtor-aluno
- Correcao 1: alinhado escopo de `linkStudentToProducer` com a verificacao por e-mail.
  - Causa: lookup por e-mail encontrava aluno globalmente, mas o vinculo ainda filtrava por `organizationId`.
  - Ajuste: vinculo passou a localizar aluno por `studentProfileId` + `role=STUDENT`, evitando falso `student_not_found` apos lookup bem-sucedido.
- Correcao 2: listagem de alunos do produtor corrigida para incluir alunos vinculados fora do tenant original.
  - Causa: `scopedStudentWhere` para produtor ainda exigia `user.organizationId`.
  - Ajuste: escopo do produtor na listagem passou a priorizar relacao de vinculo/matricula com `user.role=STUDENT`, sem filtro fixo de `organizationId`.
- Correcao 3: remocao de vinculo corrigida.
  - Causa: `deleteStudent` ainda buscava aluno com `organizationId`, gerando `student_not_found` indevido.
  - Ajuste: busca previa para unlink passou a usar `user.role=STUDENT` e remocao exclusiva em `producer_students`.
- Impacto funcional:
  - vincular aluno encontrado por e-mail funciona de ponta a ponta;
  - aluno vinculado aparece na listagem/dashboard do produtor;
  - remover aluno pelo produtor remove apenas o vinculo sem excluir cadastro global.

### Commits complementares desta correcao
- `6b4bc6f fix(students): populate and lock existing student data on email lookup`
- `e21052d fix(students): align producer link lookup with email verification scope`
- `07c1977 fix(students): list producer-linked students regardless of tenant id filter`
- `529b8e6 fix(students): allow unlink and dashboard visibility for linked external students`

### Validacoes executadas
- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.

## Atualizacao 2026-05-16 - Configuracao Supabase e auditoria de pendencias
- Configuracao local criada em `.env` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` e `DIRECT_URL` para o projeto Supabase informado.
- Diagnostico de migrations no banco remoto:
  - comando: `npx prisma migrate status`
  - resultado: `8 migrations found in prisma/migrations` e `Database schema is up to date!`.
- Diagnostico de seed (comparando `prisma/seed.ts` com dados reais):
  - organizacao fixa da seed (`11111111-1111-1111-1111-111111111111`) existe, mas com nome diferente (`SysCursos Default Tenant` em vez de `SysCursos Tenant Demo`);
  - usuarios da seed (`admin@syscursos.local`, `aluno@syscursos.local`, `produtor@syscursos.local`) nao existem;
  - curso da seed (`slug=curso-demonstracao`) nao existe.
- Conclusao:
  - migrations: sem pendencias;
  - seed: pendente/nao aplicada para o estado esperado do `prisma/seed.ts` atual.

## Validacoes executadas nesta rodada (2026-05-16)
- `npm install`: aprovado (incluiu `prisma generate` no `postinstall`).
- `npm run prisma:validate`: aprovado.
- `npx prisma migrate status`: aprovado (executado fora do sandbox para acesso de rede).
- leitura de dados via Prisma Client (query pontual): aprovado (executado fora do sandbox).

## Politica operacional 2026-05-16 - Banco de producao
- O banco Supabase atualmente conectado neste workspace deve ser tratado como ambiente de producao.
- Qualquer tarefa futura (incluindo uso de skills, scripts, seeds, migrations, rotinas de manutencao ou desenvolvimento) nao deve alterar registros de banco em nenhuma tabela por padrao.
- Excecao: alteracao de dados somente quando for estritamente necessaria para cumprir a tarefa.
- Antes de qualquer alteracao de dados em producao, e obrigatorio:
  1. explicar claramente a necessidade tecnica e o impacto esperado;
  2. solicitar aprovacao previa explicita do usuario;
  3. executar apenas apos aprovacao.
- Leitura/auditoria sem escrita permanece permitida.
- Observacao desta rodada: desconsiderar a conclusao anterior sobre seed pendente como acao requerida, pois este banco e de producao.

## Atualizacao 2026-05-16 - Consolidacao do TODO e analise tecnica
- Revisao completa do `docs/TODO.md` para alinhar checklist com estado real do repositorio e do ambiente atual.
- Atualizacoes aplicadas no TODO:
  - Fase 3: `Configurar Supabase` e `Executar migration em Supabase` marcados como concluidos.
  - Fase 3: `Executar seed em Supabase` marcado como nao aplicavel no banco de producao conectado (politica operacional).
  - Fase 4: `Aplicar policies RLS em Supabase` marcado como concluido.
  - Fase 5: `Definir e alterar senha inicial de alunos` marcado como concluido.
  - Pendencias historicas duplicadas/obsoletas de testes foram consolidadas em uma secao unica de pendencias atuais.
- Pendencias reais mantidas no TODO (2026-05-16):
  - falha em `src/tests/integration/auth-actions.test.ts` (`cache is not a function`);
  - desalinhamentos em `src/tests/unit/admin-validators.test.ts` e `src/tests/integration/admin-repository.test.ts`;
  - `npm run test` completo ainda sem status verde.

## Validacoes executadas nesta rodada (2026-05-16)
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: falhou com 3 suites:
  - `src/tests/integration/auth-actions.test.ts` (7 falhas);
  - `src/tests/unit/admin-validators.test.ts` (1 falha);
  - `src/tests/integration/admin-repository.test.ts` (1 falha).

## Atualizacao 2026-05-16 - Regra oficial de senha no fluxo produtor-aluno
- Regra validada com o usuario:
  - aluno novo: senha inicial pode ser definida no cadastro;
  - aluno ja existente no sistema: produtor nao deve preencher senha neste fluxo, para evitar sobrescrita indevida.
- `docs/TODO.md` atualizado para refletir essa regra na secao de pendencias consolidadas, incluindo ajuste explicito dos testes a serem alinhados.

## Atualizacao 2026-05-16 - Planejamento de evolucao (PDF, links e continuar ultima aula)
- `docs/TODO.md` atualizado com nova trilha de evolucao contendo:
  - descoberta tecnica obrigatoria;
  - implementacao de materiais de aula (PDF e links);
  - implementacao do menu/atalho "Continuar ultima aula";
  - checklist de qualidade e documentacao.
- Prompts criados para execucao em etapas:
  - `prompts/13_DISCOVERY_PDF_LINKS_CONTINUE.md`
  - `prompts/14_IMPLEMENT_PDF_LINKS.md`
  - `prompts/15_IMPLEMENT_CONTINUE_LAST_LESSON.md`
- Observacao operacional mantida: sem alteracao de dados em producao sem necessidade extrema + explicacao + aprovacao previa do usuario.

## Atualizacao 2026-05-16 - Discovery concluida (PDF/links e continuar ultima aula)
- Discovery tecnica executada com base no repositorio para evolucao de materiais de aula e continuidade de estudo.
- Decisoes registradas em `docs/DECISIONS.md`:
  - adotar entidade dedicada `lesson_materials` para PDF/links (tipo, titulo, url, posicao, status);
  - implementar "Continuar ultima aula" por leitura de `lesson_progress` + ordem de trilha ativa;
  - manter validacoes server-side de matricula/status e links HTTPS.
- `docs/TODO.md` atualizado:
  - bloco de descoberta tecnica marcado como concluido;
  - blocos de implementacao permanecem pendentes.
- `docs/REVIEW.md` atualizado com diagnostico, riscos e proxima etapa recomendada.
- Politica operacional mantida: sem escrita em banco de producao sem necessidade extrema + explicacao + aprovacao previa explicita.

## Atualizacao 2026-05-16 - Implementacao inicial (PDF/links e continuar ultima aula)
- Escopo implementado:
  - nova modelagem `lesson_materials` no Prisma (`PDF`/`LINK`, titulo, url HTTPS, posicao, status);
  - migration criada: `prisma/migrations/20260516141000_add_lesson_materials/migration.sql`;
  - CRUD de materiais de aula na tela admin de aulas por modulo;
  - exibicao de materiais na pagina da aula do aluno;
  - continuidade de estudo com calculo server-side + rota `/app/continue` + CTA/menu "Continuar".
- Decisao aplicada nesta etapa: PDF por URL HTTPS (upload binario adiado para etapa futura).
- Observacao operacional: nenhuma escrita em banco de producao foi executada nesta implementacao.

## Validacoes executadas nesta rodada (2026-05-16)
- `npm run lint`: aprovado.
- `npx prisma generate`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test -- --run src/tests/integration/admin-service.test.ts src/tests/integration/student-service.test.ts src/tests/integration/admin-actions.test.ts src/tests/unit/student-components.test.tsx`: aprovado (35 testes).
- `npm run build`: aprovado.

## Atualizacao 2026-05-16 - Deploy de migration + ajustes UX de continuidade
- Migration aplicada em producao:
  - comando: `npx prisma migrate deploy`;
  - migration: `20260516141000_add_lesson_materials`;
  - validacao: `npx prisma migrate status` retornou `Database schema is up to date!`.
- Hotfix aplicado apos erro de abertura de aula em producao:
  - fallback de leitura para `lesson_materials` quando a tabela nao existir (P2021), evitando quebra de Server Components durante janela de rollout.
- Ajuste de UX por solicitacao de produto:
  - removido item `Continuar` do menu lateral/mobile;
  - removido botao `Continuar ultima aula` ao lado de `Abrir cadernos` na home;
  - mantidos bloco visual de continuidade (home e pagina do curso) e rota `/app/continue`.
- `docs/TODO.md` atualizado com esses itens no bloco de evolucao.

## Atualizacao 2026-05-22 - Cadastro do curso de boxe
- Script adicionado: `prisma/create-boxing-course.ts`.
- Execucao realizada com aprovacao explicita para escrita no banco de producao: `npx tsx prisma/create-boxing-course.ts`.
- Resultado validado em banco: curso `CURSO DE BOXE` (slug `curso-de-boxe`) vinculado ao produtor `douglaslundy@gmail.com`.
- Estrutura cadastrada:
  - 4 modulos
  - 93 aulas
- Distribuicao validada:
  - `Módulo 1 Introdução Box (Iniciante)`: 25 aulas
  - `Módulo 2 Evoluindo no treinamento (Intermediario)`: 36 aulas
  - `Módulo 3 Dominando o Boxe (Avançado)`: 27 aulas
  - `Módulo Bônus Iniciando no Boxe`: 5 aulas
- Excecao registrada: `Aula 29 - Combinações Básicas` nao foi cadastrada porque o video nao foi identificado na playlist e `youtubeUrl` e obrigatorio no schema.
- Regra aplicada: nomes de modulos foram gravados usando somente o trecho apos ` - `.

## Validacoes executadas nesta rodada (2026-05-22)
- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- Consulta de validacao via Prisma Client: aprovada.

## Atualizacao 2026-06-04 - Backup do banco gerado
- Backup logico gerado a partir do schema `public` do banco conectado em producao.
- Arquivo criado:
  - `backups/syscursos-backup-2026-06-04T17-36-48-796Z.json`
- Tabelas exportadas:
  - `_prisma_migrations`
  - `courses`
  - `enrollments`
  - `lesson_materials`
  - `lesson_notes`
  - `lesson_progress`
  - `lessons`
  - `modules`
  - `organizations`
  - `producer_students`
  - `student_profiles`
  - `users`
- Observacao:
  - o backup cobre apenas o schema `public`; o schema de Supabase Auth nao foi exportado nesta execucao.

## Atualizacao 2026-06-04 - Backup completo com schema Auth
- Backup logico completo gerado com os schemas `public` e `auth`.
- Arquivo criado:
  - `backups/syscursos-complete-backup-2026-06-04T17-39-06-777Z.json`
- Escopo exportado:
  - `public`: 517 registros
  - `auth`: 220 registros
- Observacao:
  - o arquivo inclui metadados de tabelas, colunas, indices e constraints, alem das linhas exportadas.

## Atualizacao 2026-06-04 - Restore SQL gerado
- Script SQL de restore gerado a partir do backup logico completo.
- Arquivo criado:
  - `backups/syscursos-restore-2026-06-04.sql`
- Observacao:
  - o script assume um alvo PostgreSQL/Supabase com permissao para alternar `session_replication_role` durante a restauracao.

## Atualizacao 2026-06-04 - ZIP enviado para Downloads
- Arquivo compactado gerado e copiado para a pasta Downloads do usuario.
- Arquivo criado:
  - `C:\Users\dougl\Downloads\syscursos-backup-2026-06-04.zip`
- Conteudo:
  - `backups/syscursos-complete-backup-2026-06-04T17-39-06-777Z.json`
  - `backups/syscursos-restore-2026-06-04.sql`

## Atualizacao 2026-06-04 - Feedback especifico para salvar aula
- O salvamento de aula deixou de cair no fallback generico do admin e passou a usar status especifico para falhas de lesson.
- Arquivos alterados:
  - `src/server/actions/admin-actions.ts`
  - `src/components/admin/feedback.tsx`
  - `src/tests/integration/admin-actions.test.ts`
- Validacoes executadas nesta alteracao:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run test -- --run src/tests/integration/admin-actions.test.ts src/tests/unit/admin-validators.test.ts`
- Resultado:
  - `lint`: aprovado
  - `typecheck`: aprovado
  - `admin-actions.test.ts`: aprovado
  - `admin-validators.test.ts`: falhou em teste preexistente de senha inicial do aluno, nao relacionado ao fluxo de aula

## Atualizacao 2026-06-04 - Home do aluno prioriza ultima progressao
- A home da area do aluno agora escolhe o bloco de continuidade pelo `lesson_progress` mais recente, em vez da matricula mais nova.
- O fallback para alunos sem progresso foi mantido.
- Arquivos alterados:
  - `src/server/repositories/student-repository.ts`
  - `src/server/services/student-service.ts`
  - `src/tests/integration/student-service.test.ts`
- Validacoes executadas nesta alteracao:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run test -- --run src/tests/integration/student-service.test.ts`
- Resultado:
  - `lint`: aprovado
  - `typecheck`: aprovado
  - `student-service.test.ts`: aprovado

## Atualizacao 2026-06-04 - Curso Mestre co Claude cadastrado
- Script criado: `prisma/create-mestre-com-claude-course.ts`.
- Execucao realizada com aprovacao explicita para escrita no banco de producao: `npx tsx prisma/create-mestre-com-claude-course.ts`.
- Resultado validado em banco: curso `Mestre co Claude` (slug `mestre-co-claude`) vinculado ao produtor `douglaslundy@gmail.com`.
- Estrutura cadastrada:
  - 3 modulos
  - 27 aulas
- Distribuicao validada:
  - `Mestre do Claude do Zero ao Avançado`: 13 aulas
  - `CLAUDE Code e seu primeiro Squad de Agentes`: 9 aulas
  - `Squad Audio Visual`: 5 aulas
- Excecoes registradas:
  - `Site em 5 Minutos com claude Chat + Gemini` nao foi cadastrada porque a URL nao foi fornecida.
  - `Aulão como montar seu site em 5 minutos` nao foi cadastrada porque a URL nao foi fornecida.
- Regra aplicada: modulos foram gravados sem o prefixo numerico inicial.
- Validacoes executadas nesta rodada:
  - `npx tsx prisma/create-mestre-com-claude-course.ts`
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`

## Atualizacao 2026-06-04 - Aulas de conteudo extra do curso O PODER DO FLASH
- Script criado: `prisma/create-o-poder-do-flash-extra-lessons.ts`.
- Execucao realizada com aprovacao explicita para escrita no banco de producao: `npx tsx prisma/create-o-poder-do-flash-extra-lessons.ts`.
- Resultado validado em banco: modulo `CONTEUDO EXTRA` do curso `O PODER DO FLASH` atualizado com 15 aulas.
- Regra aplicada: os titulos foram gravados sem a numeracao inicial informada no pedido.
- Observacao tecnica: os links `youtube.com/shorts/...` precisaram ser convertidos para `https://www.youtube.com/watch?v=...` para atender a constraint `lessons_youtube_url_check` do banco.

## Atualizacao 2026-06-04 - Home do aluno baseada na ultima aula tocada
- O carregamento de uma aula agora registra `lesson_progress` mesmo quando a aula ainda nao foi marcada como concluida.
- A home da area do aluno passou a usar a ultima interacao real com aula aberta para montar o card de continuidade.
- Resultado prático: a pagina inicial deixa de ficar presa ao ultimo curso cadastrado quando o aluno assistiu outra aula mais recentemente.

## Atualizacao 2026-06-04 - Card de continuidade na pagina do curso
- A pagina do curso passou a usar a ultima aula tocada naquele proprio curso para montar o card de continuidade.
- O card deixou de ser derivado apenas das aulas concluidas, o que alinhou a experiencia com a regra da home.
- A regra agora e consistente entre home global e pagina do curso: a ultima aula aberta vira o ponto de retomada.
