# PROJECT_STATUS

## Objetivo

Manter um status persistente do projeto SysCursos para continuidade de trabalho com contexto minimo e confiavel.

## Decisoes

- Usar este arquivo como snapshot operacional de alto nivel.
- Atualizar este arquivo no inicio de demandas grandes e ao final de marcos relevantes.
- Manter rastreabilidade com `docs/TODO.md`, `docs/REVIEW.md` e `docs/DEVELOPMENT_MEMORY.md`.

## Tarefas concluidas

- CRUD administrativo de cursos, alunos e matriculas ajustado para listagem em modo leitura com edicao via formulario principal.
- Correcao de update de matricula por `id`.
- Dashboard do aluno mantendo curso cancelado visivel com bloqueio de acesso.
- Navegacao da aula com trilha lateral direita e botoes de aula anterior/proxima.
- Caderno em modo somente leitura.
- Normalizacao de embed YouTube e testes associados.
- E2E publico ajustado para redirect real de `/` para `/login`.
- Correcao de validacao no update de curso para normalizar `slug` em entrada humana.
- Modulos e aulas do admin padronizados para fluxo de listagem em modo leitura + editar por formulario principal.
- Area do aluno com toggle para abrir/fechar menu lateral esquerdo.
- Tela de aula com retorno explicito para pagina inicial de cursos.
- Trilha da aula mantida na lateral direita com controle de abrir/fechar.

## Tarefas pendentes (foco atual)

- Validacao manual em navegador dos fluxos administrativos e da experiencia da aula com dados reais.

## Arquivos alterados recentemente

- `src/app/admin/courses/page.tsx`
- `src/app/admin/students/page.tsx`
- `src/app/admin/enrollments/page.tsx`
- `src/server/repositories/admin-repository.ts`
- `src/app/app/courses/[courseId]/page.tsx`
- `src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/app/app/notebooks/page.tsx`
- `src/server/services/student-service.ts`
- `src/server/services/youtube-service.ts`
- `src/tests/integration/student-service.test.ts`
- `src/tests/unit/youtube-service.test.ts`

## Riscos

- Alteracoes locais nao versionadas em `AGENTS.md` e `AGENTS.OLD.md` podem gerar divergencia de diretrizes.
- Fluxos de formulario administrativo dependem de parsing e validacao server-side; pequenos desvios de campos podem quebrar update.
- Mudancas de layout na area do aluno podem causar regressao de responsividade e navegacao.
- Falhas de reproducao no YouTube podem persistir para videos privados/bloqueados na origem.

## Testes executados (ultimo ciclo funcional)

- `npm run lint`
- `npm run typecheck`
- `npm run test` (56 testes aprovados)
- `npm run build`
- `npm run test:e2e` (2 testes aprovados)

## Ultimo commit

- `438df57 feat(student-layout): adicionar toggles e navegacao da aula`

## Proximos passos

1. Reproduzir e corrigir o erro de update de curso (`slug` e `description`).
2. Aplicar padrao de listagem + edicao para modulos e aulas.
3. Ajustar toggles de menus esquerdo/direito na experiencia do aluno.
4. Executar validacao manual ponta a ponta no browser e coletar feedback visual/ergonomico.
