# Roadmap de execucao (pedido de 2026-10-21)

Pedido do usuario: fazer todas as correcoes da analise (`docs/ANALISE-SISTEMA.md`), todas as melhorias e todos os recursos sugeridos. Um quiz gerado por IA deve ser salvo no banco e reutilizado por outros alunos, sem gastar creditos de IA de novo.

Este arquivo e a fonte de verdade para retomar o trabalho apos um `compact`. Marque `[x]` ao concluir cada item (com commit). Regras do projeto: sem `any`, sem expor segredos, lint + tipos + testes antes de cada commit, atualizar `docs/TODO.md`, `docs/DECISIONS.md` e `docs/REVIEW.md`. Commits terminam com as linhas `Co-Authored-By` e `Claude-Session` combinadas. Nao dar push sem o usuario pedir. Nao aplicar migracao no banco sem o usuario autorizar (o `.env` aponta para o banco real).

Armadilhas deste ambiente (Windows): heredoc do bash com aspas/`\n` quebra, use a ferramenta Write/Edit para codigo; scripts Python precisam de `newline=''` e `encoding='utf-8'` (arquivos do projeto sao CRLF); instalacoes npm longas devem rodar em segundo plano e ser aguardadas; `npx @next/codemod` nao funciona aqui.

## Estado (atualize aqui)

- Concluido e commitado: `d439dbd` (jspdf 4.2.1, cabecalhos de seguranca, cache de configuracoes, analise).
- ATENCAO: o codigo novo le colunas/tabelas da migracao `20261022120000_study_features` (ex.: `lesson_progress.position_seconds`). Aplicar `prisma migrate deploy` ANTES de rodar/deployar, senao as paginas de aula quebram. Ainda nao aplicada (aguardando autorizacao do usuario).
- Commitados: `d731e02` (Next 15), `6875137` (seguranca). Etapas 4, 5 e parte da 6 prontas (quiz, revisao, progresso, player, marcadores, Pomodoro); lembrete por cron, busca, exportacao e playlists tambem prontos (etapa 7 concluida); etapa 8 concluida (duvidas, avisos, chat, relatorios, saude). Proximo: etapa 9 (prova final e certificado), depois 10 (PWA/acessibilidade), refatoracoes pendentes da etapa 2 e fechamento.
- Commitado `d731e02`: migracao Next 14 -> 15.5.28 (build e 198 testes OK), schema + migracao `20261022120000_study_features` (nao aplicada), libs `src/lib/ai/quiz.ts`, `src/lib/study/srs.ts`, `src/lib/study/streak.ts`, prompts de quiz/prova/chat, quiz no `ai-content-service` (tipo `QUIZ`, limite por aluno, chamada unica para pedidos simultaneos).

## Etapas

### 1. Next 15 (correcao)
- [x] Atualizar para `next@15.5.28` e `eslint-config-next`; `cookies()` assincrono; `params`/`searchParams` assincronos nas paginas e na rota de PDF; build OK.
- [x] Lint, testes e build OK; commitado.
- [ ] Rodar `npm audit fix` para o que sobrar (ws, postcss etc.) sem mudanca maior; reavaliar `tailwindcss` (aviso so de ferramenta de build).

### 2. Seguranca e desempenho (correcoes abertas)
- [x] Limite de tentativas no login e no cadastro (por IP e por e-mail), mensagem `rate_limited` nos formularios.
- [x] Interruptor "cadastro de alunos aberto" no painel (`AppSetting registration_open`, padrao aberto) para fechar o cadastro publico; honeypot no formulario. Confirmacao de e-mail depende de SMTP no Supabase: registrar como pendencia do usuario.
- [x] Auditoria: `src/server/services/audit-service.ts` gravando `AuditLog` nas acoes sensiveis do admin (apagar curso/modulo/aula/aluno, matriculas, usuarios, chaves, backup, aprovacao de pedidos).
- [x] CSP em modo `Report-Only` (YouTube, Drive, Hugging Face, worker) em `next.config.mjs`.
- [x] `getAdminConsumptionMetrics` com limite/paginacao (hoje sem `LIMIT`).
- [ ] Dividir `admin-repository.ts` (1.742 linhas) e `admin-actions.ts` (740) por dominio, mantendo a API publica; extrair hooks de `lesson-transcriber.tsx`.
- [ ] Transcricao longa carregada sob demanda na pagina da aula.
- [ ] Reaproveitar `React.cache` na busca de matricula repetida entre `findTranscribableLesson` e `getStudentLesson`.
- [ ] Limite por aluno nas chamadas de IA (feito no servico; falta teste) e aviso de custo no painel.

### 3. Banco (uma migracao unica, ja escrita)
- [x] Schema: `QuizAttempt`, `CourseExam`, `FlashcardReview`, `LessonBookmark`, `StudyDay`, `Certificate`, `LessonQuestion`, `Notification`, `Playlist`, `PlaylistItem`, `AuditLog`, `StudentProfile.weeklyGoalMinutes`, enum `AiContentKind` com `QUIZ`/`EXAM`/`CHAT`.
- [x] Acrescentar `LessonProgress.positionSeconds Int @default(0)` (retomar no minuto exato) e regerar a migracao `20261022120000_study_features` (usar `prisma migrate diff` contra `schema.old.prisma` ou editar o SQL a mao). Ainda nao aplicada.
- [ ] Pedir autorizacao ao usuario para `prisma migrate deploy` (banco real) antes de testar com dados reais.

### 4. Quiz por aula (gerado por IA, salvo no banco, compartilhado)
- [x] Servico: tipo `QUIZ` em `LessonAiContent` (um por aula, reaproveitado por todos os alunos; so a primeira geracao gasta tokens).
- [x] Acao `submitQuizAction`: corrige no servidor contra o quiz salvo, grava `QuizAttempt`, devolve nota, gabarito e explicacoes; erros viram cartoes de revisao.
- [x] UI no `lesson-study-tools.tsx`: botao "Quiz", perguntas com 4 alternativas, resultado e historico de notas; teclas 1-4.
- [x] Testes (servico, acao, componente).

### 5. Revisao espacada e "Revisao do dia"
- [x] Servico/acao de revisao: `FlashcardReview` com `nextReview` (`src/lib/study/srs.ts`), fila de cartoes vencidos + cartoes novos por dia, cartoes de quiz errados.
- [x] O baralho da aula (`Deck`) grava a nota (errei/dificil/bom/facil) por aluno.
- [x] Pagina `/app/review` com fila do dia, sequencia, meta e "continuar" (link no menu do aluno).

### 6. Video, anotacoes e constancia
- [x] Player: velocidade, retomar no minuto (grava `positionSeconds` a cada ~15 s), buscar tempo (`seekTo`), tempo atual para marcadores, modo foco (esconde a trilha).
- [x] Marcadores com minuto (`LessonBookmark`) e transcricao clicavel com busca dentro da aula.
- [x] Tempo de estudo: batimento do cliente a cada 30 s (`StudyDay`), sequencia (`streak.ts`), meta semanal (`weeklyGoalMinutes`), metricas (tempo, aulas por semana, media de quiz) em `/app/progress`.
- [x] Pomodoro na aula.
- [x] Lembrete: rota de cron (`vercel.json` + `CRON_SECRET`) que cria `Notification` para quem nao estudou hoje (sem e-mail: nao ha provedor configurado).

### 7. Busca, exportacao, playlists
- [x] Busca global `/app/search` (aulas, transcricoes, anotacoes, resumos) so nos cursos disponiveis do aluno.
- [x] Exportar anotacoes e resumos (Markdown) e flashcards (TSV para Anki) por curso: `/app/export/[courseId]`.
- [x] Playlists/trilhas do aluno (`/app/playlists`, botao "Adicionar a playlist" na aula).

### 8. Duvidas, notificacoes, relatorios, saude
- [x] Duvidas por aula (`LessonQuestion`): aluno pergunta, produtor/admin responde em `/admin/questions`; respostas visiveis na aula.
- [x] Notificacoes (`Notification`): sino com contador no menu do aluno e `/app/notifications`; aviso ao produtor de duvida nova.
- [x] Chat com a aula (`/app/.../chat` ou painel): resposta so com a transcricao, cita minuto, limite por aluno, uso registrado como `CHAT`.
- [x] Relatorio do produtor `/admin/reports`: notas por aula, onde os alunos abandonam, questoes mais erradas, duvidas sem resposta.
- [x] Painel de saude `/admin/health`: custo de IA por curso, aulas sem duracao e sem transcricao, ultimas acoes (`AuditLog`).

### 9. Prova final e certificado
- [ ] Prova final do curso (`CourseExam` gerada uma vez por IA e compartilhada; tentativas em `QuizAttempt`).
- [ ] Certificado (`Certificate`) quando o curso chega a 100% e a prova (se houver) tem nota >= 70%; PDF e pagina publica de verificacao `/verificar/[codigo]` (so nome, curso e data).

### 10. PWA e acessibilidade
- [ ] `manifest.webmanifest`, icones, service worker simples (shell + pagina offline); anotar o limite (sem sincronizacao offline de anotacoes).
- [ ] Atalhos de teclado nos flashcards/quiz, link "pular para o conteudo", foco visivel e rotulos ARIA.

### 11. Fechamento
- [ ] Atualizar `docs/TODO.md`, `docs/DECISIONS.md`, `docs/REVIEW.md`, `docs/ANALISE-SISTEMA.md` (marcar o que foi feito), `PROJECT_STATUS.md`.
- [ ] Lint, tipos, testes, build; commit por etapa; relatorio final dizendo o que NAO foi testado (telas logadas no navegador, IA com chave real, migracao no banco real).
