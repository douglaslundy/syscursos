# Arquitetura

## Status

Fase 1 concluida em nivel de planejamento. Nenhum codigo de aplicacao foi implementado nesta etapa.

## Analise completa do escopo

A plataforma sera um SaaS de cursos online com dois fluxos principais:

- area administrativa em `/admin`;
- area do aluno em `/app`.

O administrador gerencia cursos, modulos, aulas com links do YouTube, alunos, matriculas, prazos de acesso, status de publicacao e consultas operacionais. O aluno acessa apenas cursos liberados por matricula ativa e nao expirada, assiste aulas, acompanha progresso e mantem anotacoes privadas por aula e cadernos por curso.

O escopo inicial inclui:

- autenticacao e segregacao de perfis;
- CRUD administrativo de cursos, modulos, aulas, alunos e matriculas;
- ordenacao de modulos e aulas;
- controle de status ativo/inativo;
- validade de acesso por matricula;
- player de YouTube;
- progresso por aula concluida;
- anotacoes por aula;
- cadernos agrupados por curso, modulo e aula;
- busca e filtros nas principais listagens.

Ficam fora da primeira versao:

- pagamentos;
- certificados;
- cupons;
- afiliados;
- avaliacoes;
- comentarios;
- comunidades;
- gamificacao avancada;
- upload proprio de videos;
- relatorios analiticos avancados.

## Validacao da stack

A stack definida em `docs/PROJECT_CONTEXT.md` e adequada para o escopo.

### Frontend

- Next.js App Router: adequado para separar layouts de autenticacao, admin e aluno, usar Server Components e proteger rotas no servidor.
- TypeScript strict: obrigatorio para reduzir erros de contrato entre UI, services, repositories e dados.
- Tailwind CSS: adequado para velocidade e consistencia visual.
- shadcn/ui: adequado para componentes acessiveis e customizaveis sem copiar identidade visual de terceiros.
- React Hook Form: adequado para formularios administrativos e validacao eficiente.
- Zod: adequado para schemas compartilhaveis entre formularios, Server Actions e services.

### Backend

- Server Actions: adequadas para mutacoes de CRUD, progresso, anotacoes e matriculas com validacao server-side.
- Route Handlers: devem ser usados somente quando houver necessidade real de endpoint HTTP explicito, como webhooks futuros, health checks, callbacks ou integracoes.
- Supabase Auth: adequado para autenticacao e sessao.
- Prisma ORM: adequado para schema, migrations, tipagem e queries estruturadas.

### Banco

- Supabase Postgres: adequado para integridade relacional, indices, constraints, transacoes e RLS.
- RLS: indispensavel como camada adicional contra acesso horizontal, especialmente em anotacoes, progresso e matriculas.

### Testes e qualidade

- Vitest: adequado para regras de negocio, validators, permissions e services.
- React Testing Library: adequado para componentes e fluxos de UI.
- Playwright: adequado para fluxos criticos de autenticacao, autorizacao, expiracao de matricula e jornada do aluno.
- ESLint, Prettier, Husky, lint-staged e TypeScript strict: adequados para manter padrao de producao.

## Proposta de arquitetura

A aplicacao deve seguir arquitetura modular orientada a dominio, com UI isolada das regras de negocio.

Fluxo recomendado para leitura:

1. Server Component carrega dados por service server-side.
2. Service valida contexto do usuario, permissao e regra de negocio.
3. Repository executa query Prisma.
4. Retorno e normalizado para DTO seguro.
5. UI renderiza apenas dados ja autorizados.

Fluxo recomendado para mutacao:

1. Formulario usa React Hook Form e Zod para validacao inicial.
2. Server Action valida novamente com Zod.
3. Server Action identifica usuario autenticado.
4. Service valida RBAC, ownership, status e regras de matricula.
5. Repository executa transacao quando necessario.
6. Action retorna resultado tipado e sem vazamento de detalhes sensiveis.
7. Cache e revalidado de forma pontual.

## Camadas

### `app`

Responsavel por rotas, layouts, loading states, error boundaries e composicao de telas.

### `components`

Responsavel por componentes visuais puros ou com interacao local. Nao deve conter query, regra de negocio, verificacao de permissao critica ou acesso direto ao banco.

### `features`

Responsavel por organizar UI, actions, schemas e tipos especificos de cada dominio funcional quando fizer sentido manter coesao por feature.

### `server`

Responsavel por actions, services, repositories, permissions, auth server-side e erros de dominio.

### `lib`

Responsavel por infraestrutura compartilhada: cliente Prisma, Supabase server client, utilitarios puros, config e helpers sem regra de negocio especifica.

### `prisma`

Responsavel por schema, migrations e seed.

## Estrutura de pastas proposta

```txt
/
  docs/
  prompts/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/
        login/
      admin/
        layout.tsx
        page.tsx
        courses/
        students/
        enrollments/
      app/
        layout.tsx
        page.tsx
        courses/
        notebooks/
      api/
        health/
    components/
      ui/
      admin/
      student/
      shared/
    features/
      auth/
      courses/
      modules/
      lessons/
      students/
      enrollments/
      notes/
      progress/
    server/
      actions/
      auth/
      errors/
      permissions/
      repositories/
      services/
      validators/
    lib/
      db/
      supabase/
      utils/
    types/
    tests/
      unit/
      integration/
      e2e/
```

## Modelo de dominio inicial

- `User`: identidade autenticada vinculada ao Supabase Auth.
- `StudentProfile`: dados do aluno e status operacional.
- `Course`: curso administravel e publicavel.
- `Module`: agrupamento ordenado dentro de curso.
- `Lesson`: aula ordenada dentro de modulo, com URL do YouTube validada.
- `Enrollment`: vinculo aluno-curso com status, inicio e expiracao.
- `LessonNote`: anotacao privada de um aluno por aula.
- `LessonProgress`: progresso de um aluno por aula.

## Regras arquiteturais obrigatorias

- UI nao acessa Prisma diretamente.
- Componentes nao fazem autorizacao critica.
- Toda mutacao passa por Server Action.
- Toda entrada externa passa por Zod no servidor.
- Toda query sensivel passa por service com permissao explicita.
- Repositories nao decidem permissao; apenas consultam e persistem.
- Services nao retornam campos sensiveis.
- Route Handlers so entram quando Server Actions nao forem adequadas.
- Client Components devem ser excecao justificada por interacao, estado local ou APIs do navegador.

## Riscos tecnicos

- Conflito conceitual entre Supabase Auth e Prisma se o mapeamento de usuarios nao for definido cedo.
- RLS mal desenhado pode bloquear operacoes legitimas ou permitir acesso horizontal.
- Uso excessivo de Client Components pode degradar performance e aumentar superficie de bugs.
- Server Actions grandes podem virar pontos monoliticos se nao delegarem para services.
- CRUDs administrativos podem duplicar logica sem schemas e services compartilhados.
- Ordenacao de modulos e aulas exige transacoes para evitar posicoes duplicadas.
- Progresso calculado pode ficar inconsistente se nao houver constraint unica por aluno/aula.
- Autosave de anotacoes pode gerar excesso de writes sem debounce, controle de concorrencia e feedback.
- Listagens administrativas podem degradar sem paginacao, filtros indexados e limites.
- Player YouTube exige validacao rigorosa para aceitar somente formatos esperados.

## Plano de execucao por fases

### Fase 1 - Planejamento

Concluir analise de escopo, arquitetura, seguranca, riscos, estrutura de pastas e plano de execucao.

### Fase 2 - Setup

Criar projeto Next.js, configurar TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier, Husky, lint-staged, variaveis de ambiente e estrutura base.

### Fase 3 - Banco

Configurar Supabase e Prisma, criar schema, migrations, seed, constraints, indices e documentar relacionamentos.

### Fase 4 - Autenticacao e seguranca

Configurar Supabase Auth, middleware, RBAC, helpers server-side, RLS e testes de autorizacao.

### Fase 5 - Admin

Implementar dashboard e CRUDs administrativos de cursos, modulos, aulas, alunos e matriculas, com filtros e ordenacao.

### Fase 6 - Aluno

Implementar dashboard do aluno, curso, modulo, aula, player YouTube, bloqueios por expiracao e progresso.

### Fase 7 - Cadernos

Implementar anotacoes por aula, autosave, caderno por curso, Meus Cadernos e busca.

### Fase 8 - UI/UX

Revisar responsividade, acessibilidade, estados vazios, loading, erros, feedback visual e consistencia.

### Fase 9 - Testes

Cobrir regras de negocio, autorizacao, expiracao de matricula, anotacoes, progresso e fluxos E2E.

### Fase 10 - Review final

Executar revisoes finais de seguranca, performance, acessibilidade, codigo, dependencias e build.
