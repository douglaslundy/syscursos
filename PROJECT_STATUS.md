# PROJECT_STATUS

## Objetivo

Planejar e executar os ajustes solicitados em 2026-05-07 no SysCursos, com separacao de login admin/cliente, landing page inicial, melhoria de UX no cadastro de aulas, cadernos em markdown e capa de curso no cadastro/exibicao.

## Decisoes

- Tratar a demanda em etapas pequenas com commit por tarefa para reduzir risco de regressao.
- Preservar regras atuais de seguranca (RBAC, validacoes server-side e filtros por matricula ativa).
- Manter alteracoes focadas no escopo funcional solicitado, sem refatoracao ampla.

## Tarefas concluidas

- Leitura obrigatoria de contexto (`AGENTS.md`, `.codex/context/PACK.md`, `docs/PROJECT_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`, `docs/REVIEW.md`).
- Verificacao do estado atual do repositorio e do ultimo commit.
- Consolidacao dos novos requisitos funcionais, nao funcionais, implicitos, ambiguidades, riscos e dependencias para execucao.

## Tarefas pendentes (foco atual)

- Corrigir limpeza do formulario no cadastro de aula no admin.
- Criar landing page basica em `/` com botoes separados para login de clientes e login/admin.
- Separar fluxos visuais de login para cliente e admin, mantendo possibilidade de um usuario admin tambem acessar area do aluno quando possuir perfil/alocacao valida.
- Exibir caderno com renderizacao markdown (titulo da aula como heading markdown e conteudo da anotacao como bloco markdown por aula).
- Permitir upload/registro de imagem de capa no cadastro de curso e exibir capa de forma elegante na area do aluno sem remover componentes existentes.
- Atualizar testes de integridade, funcionalidade, seguranca e regressao.

## Arquivos alterados

- `PROJECT_STATUS.md`

## Riscos

- Ambiguidade sobre estrategia de armazenamento da imagem de capa (URL externa vs upload no storage).
- Separacao de login por rota pode conflitar com regra historica de redirecionamento automatico por role.
- Renderizacao markdown exige sanitizacao para prevenir XSS e preservar isolamento de dados.
- Alteracoes de formulario admin podem quebrar fluxo de edicao existente se reset ocorrer no momento errado.

## Testes executados

- Nao aplicavel nesta etapa de analise/documentacao (nenhuma alteracao funcional de codigo executada ainda).

## Ultimo commit

- `3b9a660 chore: add codex context layer`

## Proximos passos

1. Confirmar arquitetura existente dos fluxos de login, curso, aula e cadernos nos arquivos de codigo.
2. Executar implementacao por tarefa com commit individual.
3. Rodar `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build` apos cada tarefa funcional.
