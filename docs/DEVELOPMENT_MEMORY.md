# Memoria de Desenvolvimento

Ultima atualizacao: 2026-05-05

## Estado atual

- Projeto: SysCursos
- Stack: Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase Auth, Supabase Postgres, Prisma ORM, Vitest e Playwright.
- Branch principal: `main`
- Remote: `https://github.com/douglaslundy/syscursos.git`
- Ultimo commit enviado ao GitHub: `0d435b6 Trigger Vercel deploy with runtime fix`

## O que esta implementado

- Setup inicial Next.js com App Router.
- Prisma com schema, migrations e seed.
- Supabase Auth com RBAC `ADMIN` e `STUDENT`.
- Protecao de rotas `/admin` e `/app`.
- Modulo administrativo com CRUD de cursos, modulos, aulas, alunos e matriculas.
- Area do aluno com dashboard, curso, aula, player YouTube, progresso e conclusao de aula.
- Sistema de anotacoes e cadernos com autosave.
- UI dark premium com acento laranja aplicada nas areas principais.
- Build da Vercel corrigido com `prisma generate && next build`.
- Runtime da Vercel fixado em Node 20 via `engines.node: "20.x"`.
- Novo deploy da Vercel disparado por commit vazio apos confirmar que o GitHub estava em commit mais recente que o deploy antigo.

## Commits recentes importantes

- `585ce89 Add notebook autosave editing`
- `f6bf916 Apply dark LMS visual theme`
- `2294ba6 Fix Vercel Prisma generation during build`
- `654afca Pin Vercel Node runtime`
- `0d435b6 Trigger Vercel deploy with runtime fix`

## Ambiente local

O arquivo `.env` local existe e nao deve ser commitado.

Variaveis esperadas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_EMAIL`
- `ADMIN_INITIAL_PASSWORD`
- `STUDENT_EMAIL`
- `STUDENT_INITIAL_PASSWORD`

Observacao: secrets foram usados localmente durante a configuracao. Antes de producao, rotacionar senha do banco e chaves do Supabase.

## Credenciais iniciais de desenvolvimento

Admin:

- E-mail: `admin@syscursos.local`
- Senha: definida em `ADMIN_INITIAL_PASSWORD` no `.env` local.

Aluno:

- E-mail: `aluno@syscursos.local`
- Senha: definida em `STUDENT_INITIAL_PASSWORD` no `.env` local.

## Comandos de verificacao

Executar antes de concluir uma etapa:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Build atual:

```bash
npm run build
```

O script de build executa:

```bash
prisma generate && next build
```

## Como rodar localmente

```bash
npm run dev
```

URL padrao:

```txt
http://localhost:3000
```

Se a porta estiver ocupada, o Next.js escolhe a proxima porta disponivel.

## Supabase e Prisma

Migrations ja foram aplicadas no Supabase real durante a configuracao inicial.

Comandos uteis:

```bash
npx prisma migrate deploy
npm run prisma:seed
npm run auth:provision
```

Use `auth:provision` apenas com `SUPABASE_SERVICE_ROLE_KEY` configurada.

## Pendencias conhecidas

- Rotacionar secrets do Supabase antes de producao.
- Configurar todas as variaveis de ambiente na Vercel.
- Validar deploy da Vercel no commit `0d435b6` ou posterior.
- Validar visualmente a UI dark em desktop e mobile.
- Implementar fluxo administrativo seguro para criar/alterar senha de alunos no Supabase Auth.
- Adicionar rate limiting para login em producao.
- Criar E2E autenticado com ambiente de teste real/isolado.
- Planejar upgrade para Node 20+ e Next mais recente para reduzir warnings/auditoria.
- Corrigir UX e update dos CRUDs administrativos de cursos, alunos e matriculas.
- Manter cursos/matriculas cancelados visiveis para o aluno com status cancelado, sem liberar conteudo protegido.
- Ajustar navegacao da aula com dropdown de modulos, menu lateral de aulas e botoes anterior/proxima aula.
- Ajustar caderno para abrir em modo somente leitura por padrao.
- Investigar erro de reproducao do player YouTube pela causa raiz.

## Requisitos recebidos em 2026-05-05

- Economizar tokens em todas as retomadas e etapas.
- Consultar memoria atual e status do Git antes de continuar.
- Fazer commit a cada tarefa concluida.
- Rodar testes adequados a cada tarefa para integridade, funcionalidades e seguranca.
- Ao encontrar erro, parar a tentativa repetitiva, refletir sobre causa raiz e escolher a correcao mais simples e segura.
- CRUDs de cursos, alunos e matriculas devem listar registros em modo leitura, com botao `Editar`; ao clicar, o formulario principal deve ser populado para edicao.
- Updates dos CRUDs citados precisam ser revisados e corrigidos.
- Curso cancelado deve continuar aparecendo na listagem do aluno como cancelado.
- Pagina de aulas dentro de modulo deve usar dropdown.
- Tela de aula deve exibir menu/listagem de aulas a direita.
- Botoes de aula anterior e proxima aula devem aparecer antes de aula concluida.
- Caderno deve mostrar anotacoes com cabecalho do titulo da aula, sem abrir editor e botao salvar por padrao.
- Tela de aula deve ser verificada por erro de reproducao do video YouTube.

## Prompts de continuidade

- `prompts/11_CRUD_ADMIN_UX_FIXES.md`
- `prompts/12_STUDENT_LESSON_NOTEBOOK_VIDEO_FIXES.md`

## Memoria externa

- `C:\Users\User\.codex\memories\syscursos_continuidade_2026-05-05.md`

## Estado do Git no momento da memoria

Alteracoes nao relacionadas podem existir localmente:

- `AGENTS.md`
- `AGENTS.OLD.md`
- `docs/DEVELOPMENT_MEMORY.md`

`docs/DEVELOPMENT_MEMORY.md` foi criado para retomada de contexto e deve ser commitado somente quando voce quiser registrar essa memoria no GitHub. `AGENTS.md` e `AGENTS.OLD.md` nao fizeram parte dos commits recentes de autosave, UI dark ou fix da Vercel.

## Regra para retomar

Ao retomar:

1. Rodar `git status --short`.
2. Ler `docs/TODO.md`, esta memoria e a memoria externa.
3. Abrir apenas o prompt da etapa atual.
4. Usar `rg` para localizar arquivos especificos antes de abrir arquivos longos.
5. Conferir se `.env` local existe quando a etapa depender de banco/Auth.
6. Rodar testes proporcionais antes de concluir.
7. Fazer commit proprio da tarefa concluida.
8. Se for continuar UI, seguir as regras atuais de `AGENTS.md`.
9. Se for continuar produto/funcionalidade, conferir tambem `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md` e `docs/REVIEW.md` quando necessario.
