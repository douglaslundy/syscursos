# Analise geral do sistema (2026-10-21)

Escopo: arquitetura, recursos do aluno por curso e por aula, seguranca, desempenho, qualidade de codigo e ideias de evolucao.
Fonte: leitura do codigo, `npm audit` e testes. O que nao foi verificado esta marcado.

## 1. Como o sistema esta distribuido

- Camadas: `src/app` (paginas e rotas) -> `src/server/actions` -> `src/server/services` -> `src/server/repositories`. Perfis ADMIN, PRODUCER e STUDENT.
- Autorizacao fica no servidor: `requireRole`/`requireAnyRole` em cada servico, escopo por organizacao e produtor nos repositorios do admin, matricula e validade checadas por `findTranscribableLesson` e `getStudentLesson`. Nao achei acesso a dado de outro aluno ou produtor.
- SQL cru (`$queryRaw`) usa `Prisma.sql` com parametros. Nao achei injecao.
- Markdown de resumos e notas e renderizado como texto React, sem HTML. Nao achei XSS.
- Segredos (chaves de IA, Google, Gemini) ficam cifrados com AES-256-GCM em `AppSetting`.

### Recursos do aluno

Por curso: lista com progresso, favoritos, bloqueio por validade/cancelamento, plano de estudo unico para ate 5 cursos (divisao igual por dia, modo sequencial ou por modulos), pedido de matricula, "continuar de onde parou".

Por aula: video (YouTube/Drive) com conclusao e avanco automatico, trilha lateral, materiais, anotacao com autosave, favorito, transcricao (legenda do YouTube, Gemini ou gravacao + Whisper no navegador, com rascunho local), resumos por tecnica, flashcards, mapa mental e PDF de cada um, caderno geral de anotacoes.

## 2. Vulnerabilidades

Corrigidas nesta analise:
- `jspdf` 2.5.2 (critico: leitura de arquivo local, injecao de PDF) atualizado para 4.2.1. O uso aqui e so texto gerado no servidor, o que reduz a exposicao.
- `npm audit fix` (sem mudanca de versao maior) nas dependencias transitivas.
- Faltavam cabecalhos de seguranca: agora `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`, e `X-Powered-By` removido (`next.config.mjs`).

Abertas (decisao ou risco de quebra, nao alteradas):
- **Next 14.2.35**: `npm audit` lista avisos criticos e altos (negacao de servico em Server Components e Server Actions, RCE no otimizador de imagem com AVIF, SSRF em rewrites). Todos so sao corrigidos na linha 15.5.24+ ou 16. Na Vercel parte dos vetores e mitigada pela plataforma, mas o certo e migrar para a 15.5.x (params assincronos, mudancas de cache). Fazer em branch propria, com build e testes.
- **Cadastro aberto de aluno** (`registerAction`): cria usuario com `email_confirm: true`, sem verificar o e-mail, sem captcha e sem limite de tentativas. Qualquer pessoa pode cadastrar o e-mail de outra, e cada cadastro cria uma `Organization`. Decidir: exigir confirmacao de e-mail, ou cadastro so por convite/admin; adicionar limite por IP.
- **Login sem limite proprio**: depende do limite do Supabase Auth. Conferir a configuracao no painel.
- **CSP**: nao ha Content-Security-Policy. Precisa de lista de origens testada (YouTube, Drive, Hugging Face do modelo Whisper, worker). Fazer em modo `Report-Only` primeiro.
- **IA sem limite por aluno**: o conteudo e gerado uma vez por aula/tipo/tecnica, entao o custo total e limitado, mas chamadas que falham gastam tokens e podem ser repetidas. Adicionar intervalo minimo por aluno e por aula.
- **Chave `google_api_key` rejeitada pelo Gemini** (`API_KEY_SERVICE_BLOCKED`): o admin precisa cadastrar uma chave com a Generative Language API ativa.
- **Sem auditoria**: acoes do admin (apagar curso, aluno, backup) nao deixam registro de quem fez.

## 3. Desempenho e lentidao

Corrigido: a pagina da aula lia 5 a 7 linhas de `AppSetting` por visita (metodo de transcricao, chave Gemini lida duas vezes, provedor de IA, tecnicas) e decifrava a chave a cada leitura. Agora `src/server/services/app-settings.ts` guarda a leitura em memoria por 30 s e limpa o cache em qualquer escrita. Limite conhecido: outra instancia serverless pode servir o valor antigo por ate 30 s.

Ja estava bom: arvore do curso em cache (`unstable_cache`, 5 min), usuario autenticado em cache (2 min), `touchLessonProgress` fora do caminho critico e no maximo 1 vez por minuto, indices nas tabelas principais, pool de conexoes ajustado.

Para melhorar (nao feito):
- `getAdminConsumptionMetrics` (`admin-repository.ts`) agrega todos os alunos de uma vez, sem `LIMIT` nem paginacao. Vai ficar lento com milhares de alunos.
- `admin-repository.ts` tem 1.742 linhas e `admin-actions.ts` 740: dividir por dominio (cursos, alunos, matriculas, dashboard).
- A transcricao (ate 400 mil caracteres) vai inteira na pagina da aula. Carregar sob demanda ou paginar.
- `generateAiContent` pode gastar tokens em duplicidade se dois alunos pedem ao mesmo tempo (o segundo resultado e descartado). Travar por chave (lock otimista) evita o gasto.
- Varias rotas repetem a busca de matricula (`findTranscribableLesson` e `getStudentLesson`). Aproveitar `React.cache`.
- Teste de carga e Lighthouse nao foram rodados.

## 4. Qualidade de codigo

- Arquivos grandes (ver acima) e `lesson-transcriber.tsx` com muita responsabilidade (gravacao, Whisper, Gemini, rascunho, fim automatico): extrair hooks (`useRecorder`, `useWhisperWorker`, `useTranscriptDraft`).
- Cobertura de teste em componentes de tela e em fluxos logados e baixa; o teste de ponta a ponta (Playwright) nao cobre aula, transcricao nem IA.
- `docs/TODO.md` acumula historico; separar "feito" de "proximo".

## 5. Recursos para desenvolver (foco em estudar melhor)

Ordem sugerida por valor para o aluno e esforco.

Aprendizado ativo
1. **Repeticao espacada dos flashcards**: agendar revisao (intervalos 1/3/7/21 dias) com fila "para revisar hoje". `gradeCard` ja existe; falta persistir a nota por aluno e a data da proxima revisao.
2. **Quiz por aula** gerado pela IA, com correcao e explicacao; erros alimentam a fila de revisao.
3. **Perguntar a aula (chat com a transcricao)**: o aluno pergunta e a IA responde so com base no conteudo daquela aula, citando o minuto.
4. **Revisao do dia**: tela unica com cartoes vencidos, aulas pouco revisadas e metas.

Video e navegacao
5. **Marcadores com minuto** nas anotacoes (clicar leva ao ponto do video) e transcricao clicavel com busca.
6. **Busca global**: em aulas, transcricoes, anotacoes e resumos do aluno.
7. **Velocidade, retomar no minuto exato e modo foco** (sem trilha lateral).

Constancia e motivacao
8. **Sequencia diaria (streak), meta semanal e metricas** (tempo estudado, aulas por semana) ligadas ao plano de estudo, com lembrete por e-mail ou push quando o dia passa sem estudo.
9. **Certificado** de conclusao por curso, com verificacao publica por codigo.
10. **Pomodoro** integrado a aula e ao plano.

Conteudo e colaboracao
11. **Duvidas por aula** (comentarios para o produtor responder) e **notificacoes**.
12. **Playlists/trilhas** que juntam aulas de cursos diferentes e **exportar anotacoes e resumos** (PDF/Markdown/Anki).
13. **Prova final por curso** e relatorio de desempenho para o produtor (aulas onde os alunos abandonam, erros mais comuns).

Plataforma
14. **PWA/offline** para anotacoes e flashcards; **modo escuro por aula** e acessibilidade (legenda, teclado, contraste).
15. **Painel de saude** para o admin: custo de IA por curso, falhas de transcricao, aulas sem duracao.

## 6. Nao verificado

- Fluxos logados no navegador (gravacao do Drive, fim automatico, rascunho) e o botao do Gemini com chave valida.
- Migracao do Next para 15.5.x e seus efeitos.
- Configuracao real do Supabase (limite de login, politicas do bucket) e da Vercel.
## 7. Andamento (atualizado em 2026-10-22)

Feito: Next 15.5.28, jspdf 4.2.1, cabecalhos e CSP Report-Only, limite de tentativas, interruptor de cadastro, auditoria, limite do dashboard, `admin-repository` dividido, transcricao paginada, e os recursos 1 a 15 da secao 5 (quiz compartilhado, revisao espacada, chat, marcadores e transcricao clicavel, busca, velocidade/retomar/foco, sequencia e metas, certificado, Pomodoro, duvidas e avisos, playlists, exportacao, prova final, relatorios, PWA, atalhos, painel de saude).
Pendente: `CRON_SECRET`, confirmacao de e-mail no cadastro, CSP ativo, extrair hooks de `lesson-transcriber.tsx`, testar tudo no navegador logado.
