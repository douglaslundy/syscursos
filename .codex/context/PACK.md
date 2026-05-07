# Codex Context Pack

## Git
main
A  .codex/scripts/context-pack.sh
A  .codex/scripts/update-state.sh
 M AGENTS.md
?? .codex/context/
?? .codex/scripts/context-pack.ps1
?? .codex/scripts/update-state.ps1
?? .codex/tasks/

## Arquivos relevantes
./.codex/context/ARCHITECTURE.md
./.codex/context/COMMANDS.md
./.codex/context/CURRENT_STATE.md
./.codex/context/DECISIONS.md
./.codex/context/GLOSSARY.md
./.codex/context/PROJECT_BRIEF.md
./.codex/scripts/context-pack.ps1
./.codex/scripts/context-pack.sh
./.codex/scripts/update-state.ps1
./.codex/scripts/update-state.sh
./.codex/tasks/TASK_TEMPLATE.md
./.env
./.env.example
./.eslintrc.json
./.gitignore
./.husky/_/.gitignore
./.husky/_/applypatch-msg
./.husky/_/commit-msg
./.husky/_/h
./.husky/_/husky.sh
./.husky/_/post-applypatch
./.husky/_/post-checkout
./.husky/_/post-commit
./.husky/_/post-merge
./.husky/_/post-rewrite
./.husky/_/pre-applypatch
./.husky/_/pre-auto-gc
./.husky/_/pre-commit
./.husky/_/pre-merge-commit
./.husky/_/prepare-commit-msg
./.husky/_/pre-push
./.husky/_/pre-rebase
./.husky/pre-commit
./.prettierignore
./.prettierrc.json
./AGENTS.md
./components.json
./dev-server.err.log
./dev-server.log
./dev-server-current.err.log
./dev-server-current.log
./docs/ARCHITECTURE.md
./docs/DATABASE.md
./docs/DECISIONS.md
./docs/DEVELOPMENT_MEMORY.md
./docs/PROJECT_CONTEXT.md
./docs/REVIEW.md
./docs/SECURITY.md
./docs/TODO.md
./docs/UI_UX.md
./middleware.ts
./next.config.mjs
./next-env.d.ts
./package.json
./package-lock.json
./playwright.config.ts
./playwright-report/index.html
./postcss.config.mjs
./prisma/migrations/20260504120000_initial_schema/migration.sql
./prisma/migrations/20260504130000_auth_rls_policies/migration.sql
./prisma/provision-auth-users.ts
./prisma/schema.prisma
./prisma/seed.ts
./PROJECT_STATUS.md
./prompts/00_MASTER_INSTRUCTIONS.md
./prompts/01_PROJECT_ANALYSIS.md
./prompts/02_SETUP.md
./prompts/03_DATABASE.md
./prompts/04_AUTH_SECURITY.md
./prompts/05_ADMIN_MODULE.md
./prompts/06_STUDENT_MODULE.md
./prompts/07_NOTEBOOKS.md
./prompts/08_UI_UX_REVIEW.md
./prompts/09_TESTS_REVIEW.md
./prompts/10_FINAL_REVIEW.md
./prompts/11_CRUD_ADMIN_UX_FIXES.md
./prompts/12_STUDENT_LESSON_NOTEBOOK_VIDEO_FIXES.md
./README.md
./src/app/(auth)/login/page.tsx
./src/app/admin/courses/[courseId]/modules/page.tsx
./src/app/admin/courses/[courseId]/students/page.tsx
./src/app/admin/courses/page.tsx
./src/app/admin/enrollments/page.tsx
./src/app/admin/layout.tsx
./src/app/admin/loading.tsx
./src/app/admin/modules/[moduleId]/lessons/page.tsx
./src/app/admin/page.tsx
./src/app/admin/students/[studentId]/courses/page.tsx
./src/app/admin/students/page.tsx
./src/app/app/courses/[courseId]/lessons/[lessonId]/page.tsx
./src/app/app/courses/[courseId]/page.tsx
./src/app/app/error.tsx
./src/app/app/forbidden/route.ts
./src/app/app/layout.tsx
./src/app/app/loading.tsx
./src/app/app/notebooks/page.tsx
./src/app/app/page.tsx
./src/app/globals.css
./src/app/layout.tsx
./src/app/page.tsx
./src/components/admin/.gitkeep
./src/components/admin/admin-shell.tsx
./src/components/admin/feedback.tsx
./src/components/admin/pagination.tsx
./src/components/admin/search-form.tsx
./src/components/admin/submit-button.tsx
./src/components/shared/.gitkeep
./src/components/student/.gitkeep
./src/components/student/course-blocked.tsx
./src/components/student/course-card.tsx
./src/components/student/empty-state.tsx
./src/components/student/lesson-note-editor.tsx
./src/components/student/lesson-trail-sidebar.tsx
./src/components/student/note-autosave-editor.tsx
./src/components/student/progress-bar.tsx
./src/components/student/skeleton.tsx
./src/components/student/student-navigation.tsx
./src/components/student/student-shell.tsx
./src/components/ui/.gitkeep
./src/features/auth/.gitkeep
./src/features/courses/.gitkeep
./src/features/enrollments/.gitkeep
./src/features/lessons/.gitkeep
./src/features/modules/.gitkeep
./src/features/notes/.gitkeep
./src/features/progress/.gitkeep
./src/features/students/.gitkeep
./src/lib/db/prisma.ts
./src/lib/supabase/admin.ts
./src/lib/supabase/env.ts
./src/lib/supabase/middleware.ts
./src/lib/supabase/server.ts
./src/lib/utils.ts
./src/server/actions/.gitkeep
./src/server/actions/admin-actions.ts
./src/server/actions/auth-actions.ts
./src/server/actions/student-actions.ts
./src/server/auth/.gitkeep
./src/server/auth/guards.ts
./src/server/auth/schemas.ts
./src/server/auth/session.ts
./src/server/auth/types.ts
./src/server/errors/.gitkeep
./src/server/permissions/.gitkeep
./src/server/permissions/rbac.ts
./src/server/repositories/.gitkeep
./src/server/repositories/admin-repository.ts
./src/server/repositories/student-repository.ts
./src/server/services/.gitkeep
./src/server/services/admin-service.ts
./src/server/services/progress-service.ts
./src/server/services/student-service.ts
./src/server/services/youtube-service.ts
./src/server/validators/.gitkeep
./src/server/validators/admin.ts
./src/server/validators/pagination.ts
./src/server/validators/student.ts
./src/tests/e2e/.gitkeep
./src/tests/e2e/public.spec.ts
./src/tests/integration/.gitkeep
./src/tests/integration/admin-repository.test.ts
./src/tests/integration/admin-service.test.ts
./src/tests/integration/auth-actions.test.ts
./src/tests/integration/student-repository.test.ts
./src/tests/integration/student-service.test.ts
./src/tests/setup.ts
./src/tests/unit/admin-validators.test.ts
./src/tests/unit/login-schema.test.ts
./src/tests/unit/rbac.test.ts
./src/tests/unit/smoke.test.ts
./src/tests/unit/student-components.test.tsx
./src/tests/unit/student-progress.test.ts
./src/tests/unit/student-validators.test.ts
./src/tests/unit/supabase-env.test.ts
./src/tests/unit/youtube-service.test.ts
./src/types/.gitkeep
./tailwind.config.ts
./test-results/.last-run.json
./tsconfig.json
./tsconfig.tsbuildinfo
./vercel.json
./vitest.config.mts

--- AGENTS.md ---

# AGENTS


# Camada de contexto para Codex

Antes de alterar cÃ³digo:
1. Leia `.codex/context/PROJECT_BRIEF.md`.
2. Leia `.codex/context/ARCHITECTURE.md`.
3. Leia `.codex/context/CURRENT_STATE.md`.
4. Use somente evidÃªncias do repositÃ³rio.
5. NÃ£o invente APIs, rotas, schemas, regras de negÃ³cio ou variÃ¡veis de ambiente.
6. Se algo nÃ£o estiver claro, escreva â€œnÃ£o identificado no repositÃ³rioâ€.
7. FaÃ§a mudanÃ§as pequenas e testÃ¡veis.
8. Ao final, atualize `.codex/context/CURRENT_STATE.md`.

## Objetivo

Este arquivo define regras globais para qualquer agente de IA, Codex, Codex CLI ou assistente que atuar neste projeto.

O projeto deve evoluir a plataforma SysCursos conforme os requisitos funcionais, tecnicos, arquiteturais, de seguranca e qualidade definidos em `docs/PROJECT_CONTEXT.md`.

## Modo de trabalho

- Trabalhar em modo autonomo.
- Tomar decisoes tecnicas comuns sem interromper o fluxo.
- Em caso de ambiguidade, escolher a alternativa mais segura, simples, escalavel e facil de manter.
- Registrar decisoes tecnicas relevantes em `docs/DECISIONS.md`.

## Leitura obrigatoria antes de qualquer tarefa

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

## Regras obrigatorias gerais

- Trabalhar por etapas.
- Nao implementar funcionalidades fora da etapa atual.
- Nao usar `any`.
- Nao ignorar erros silenciosamente.
- Nao criar codigo duplicado.
- Nao criar componentes monoliticos.
- Nao misturar UI com regra de negocio.
- Nao expor secrets.
- Nao confiar no frontend para autorizacao.
- Atualizar documentacao ao final de cada etapa.

## Criterios de decisao

Quando houver mais de uma alternativa valida, priorizar:

1. seguranca;
2. simplicidade;
3. escalabilidade;
4. manutencao;
5. alinhamento ao stack do projeto;
6. adequacao para producao.

## Regra adicional para tarefas de reestilizacao visual

Quando a tarefa for explicitamente de reestilizacao UI/theme, aplicar tambem as regras abaixo:

- Nao alterar logica de negocio.
- Nao alterar rotas.
- Nao alterar APIs.
- Nao alterar banco de dados.
- Nao alterar fluxo de autenticacao ou pagamentos.
- Nao quebrar responsividade.
- Nao introduzir inconsistencia visual.

### Direcao visual (LMS dark premium)

```css
:root {
  --color-primary: #FF4D00;
  --color-primary-hover: #FF6A2A;

  --bg-main: #0F1115;
  --bg-elevated: #15181D;
  --bg-surface: #1A1D21;
  --bg-surface-hover: #20242A;

  --border-subtle: #2A2F36;
  --border-strong: #3A4048;

  --text-primary: #FFFFFF;
  --text-secondary: #A0A6AD;
  --text-muted: #6F7680;

  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
}
```

## Checklist obrigatorio antes de concluir etapa

1. Executar lint.
2. Executar typecheck.
3. Executar testes relevantes.
4. Executar build quando aplicavel.
5. Revisar seguranca.
6. Revisar legibilidade e duplicacoes.
7. Atualizar `docs/TODO.md`.
8. Atualizar `docs/REVIEW.md`.
9. Registrar decisoes em `docs/DECISIONS.md`.

## Padrao esperado

O projeto deve manter qualidade equivalente a aplicacoes SaaS modernas em producao.


--- package.json ---

{
  "name": "syscursos",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": "20.x",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run src/tests/unit",
    "test:integration": "vitest run src/tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    "prisma:validate": "prisma validate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed",
    "auth:provision": "tsx prisma/provision-auth-users.ts",
    "postinstall": "prisma generate",
    "prepare": "husky"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "2.50.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.35",
    "husky": "^9.1.7",
    "jsdom": "^25.0.1",
    "lint-staged": "^15.2.10",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "overrides": {
    "@next/eslint-plugin-next": {
      "glob": "13.0.6"
    },
    "@typescript-eslint/eslint-plugin": "6.21.0",
    "@typescript-eslint/parser": "6.21.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}


--- README.md ---

# InstruÃ§Ãµes para uso com Codex ou IA de desenvolvimento

Este pacote contÃ©m a estrutura de documentaÃ§Ã£o e prompts para desenvolver uma plataforma de cursos online com Ã¡rea administrativa e Ã¡rea do aluno.

## Estrutura

```txt
/AGENTS.md
/docs
  PROJECT_CONTEXT.md
  ARCHITECTURE.md
  DATABASE.md
  SECURITY.md
  UI_UX.md
  TODO.md
  REVIEW.md
  DECISIONS.md
/prompts
  00_MASTER_INSTRUCTIONS.md
  01_PROJECT_ANALYSIS.md
  02_SETUP.md
  03_DATABASE.md
  04_AUTH_SECURITY.md
  05_ADMIN_MODULE.md
  06_STUDENT_MODULE.md
  07_NOTEBOOKS.md
  08_UI_UX_REVIEW.md
  09_TESTS_REVIEW.md
  10_FINAL_REVIEW.md
```

## Como usar

1. Copie todos os arquivos para a raiz do projeto.
2. Abra o Codex na pasta do projeto.
3. PeÃ§a para ele ler `AGENTS.md` e `docs/PROJECT_CONTEXT.md`.
4. Execute os prompts da pasta `/prompts` em sequÃªncia.
5. NÃ£o envie todos os prompts de uma vez.
6. Revise o resultado entre uma etapa e outra.

## Ordem correta

1. `01_PROJECT_ANALYSIS.md`
2. `02_SETUP.md`
3. `03_DATABASE.md`
4. `04_AUTH_SECURITY.md`
5. `05_ADMIN_MODULE.md`
6. `06_STUDENT_MODULE.md`
7. `07_NOTEBOOKS.md`
8. `08_UI_UX_REVIEW.md`
9. `09_TESTS_REVIEW.md`
10. `10_FINAL_REVIEW.md`

## ObservaÃ§Ã£o importante

Os arquivos `.md` sÃ£o a memÃ³ria persistente do projeto. Os prompts operacionais devem ser executados manualmente, um por vez, para manter controle, qualidade e rastreabilidade.


--- .env.example ---

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
ADMIN_EMAIL=admin@syscursos.local
ADMIN_INITIAL_PASSWORD=
STUDENT_EMAIL=aluno@syscursos.local
STUDENT_INITIAL_PASSWORD=


--- .codex/context/PROJECT_BRIEF.md ---


--- .codex/context/ARCHITECTURE.md ---


--- .codex/context/DECISIONS.md ---


--- .codex/context/CURRENT_STATE.md ---

# Estado atual

Branch atual:
main

Ultimo commit:
c044640 fix(student-lesson): corrigir abertura da trilha lateral e toggle horizontal

Arquivos modificados:
A  .codex/scripts/context-pack.sh
A  .codex/scripts/update-state.sh
 M AGENTS.md
?? .codex/context/
?? .codex/scripts/context-pack.ps1
?? .codex/scripts/update-state.ps1
?? .codex/tasks/

Arquivos alterados recentemente:
(nenhum arquivo alterado no diff com HEAD)

Pendencias:
- Preencher contexto com base no codigo existente.
- Validar comandos oficiais.
- Registrar decisoes arquiteturais ja presentes no projeto.

Riscos:
- Contexto inicial pode estar incompleto.
- Algumas regras podem existir apenas implicitamente no codigo.


--- .codex/context/COMMANDS.md ---


--- .codex/context/GLOSSARY.md ---

