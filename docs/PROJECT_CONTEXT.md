# Plataforma de Cursos Online

## Objetivo

Desenvolver uma plataforma SaaS de cursos online com área administrativa e área do aluno.

A plataforma permitirá que administradores cadastrem cursos, módulos, aulas hospedadas no YouTube, alunos, matrículas e prazos de acesso. O aluno acessará seus cursos, módulos, aulas, anotações e cadernos.

## Decisão técnica oficial

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

### Backend

- Next.js Server Actions
- Route Handlers quando necessário
- Supabase Auth
- Prisma ORM

### Banco de dados

- Supabase Postgres

Não utilizar MySQL nesta versão.

Justificativa: o projeto exige autenticação, autorização por perfil, controle de acesso por aluno/curso, validade de matrícula, notas privadas por aluno e proteção contra acesso horizontal. Supabase Postgres com Row Level Security é mais adequado para esse cenário.

### Testes

- Vitest
- React Testing Library
- Playwright

### Qualidade

- ESLint
- Prettier
- Husky
- lint-staged
- TypeScript strict

## Regra de autonomia da IA

A IA deve trabalhar em modo autônomo.

Ela deve tomar decisões técnicas adequadas sem interromper o fluxo, desde que as decisões respeitem:

- os requisitos deste projeto;
- boas práticas modernas;
- segurança;
- escalabilidade;
- legibilidade;
- arquitetura limpa.

A IA não deve pedir confirmação para decisões técnicas triviais.

Quando houver ambiguidade, deve escolher a alternativa mais segura, mais simples e mais escalável, registrando a decisão em `docs/DECISIONS.md`.

## Escopo funcional

### Administrador

O administrador deve conseguir:

- autenticar-se;
- acessar painel administrativo;
- criar, editar, listar e remover cursos;
- ativar e inativar cursos;
- criar, editar, listar e remover módulos dentro de cursos;
- ordenar módulos;
- ativar e inativar módulos;
- criar, editar, listar e remover aulas dentro de módulos;
- ordenar aulas;
- ativar e inativar aulas;
- cadastrar aulas usando apenas links do YouTube;
- cadastrar alunos;
- ativar e inativar alunos;
- definir e alterar senha inicial dos alunos;
- vincular N cursos a um aluno;
- definir data de início e data de expiração da matrícula;
- renovar acesso;
- cancelar acesso;
- consultar cursos de cada aluno;
- consultar alunos matriculados em cada curso;
- buscar e filtrar alunos, cursos, matrículas e aulas.

### Aluno

O aluno deve conseguir:

- autenticar-se;
- visualizar cursos liberados;
- visualizar aviso de curso expirado quando aplicável;
- escolher qual curso estudar;
- visualizar módulos do curso;
- visualizar aulas de cada módulo;
- assistir aula com player do YouTube;
- marcar aula como concluída;
- acompanhar progresso do curso;
- criar resumo/anotação em cada aula;
- editar resumo/anotação;
- salvar anotações manualmente;
- ter autosave com debounce quando tecnicamente adequado;
- visualizar o caderno do curso;
- acessar “Meus Cadernos”;
- selecionar um curso e visualizar todos os resumos agrupados por módulo e aula;
- buscar dentro dos próprios cadernos.

## Regras de acesso

- Administrador acessa apenas `/admin`.
- Aluno acessa apenas `/app`.
- Aluno não pode acessar área administrativa.
- Administrador não deve utilizar fluxo visual do aluno, salvo se houver funcionalidade futura de impersonation devidamente auditada.
- Aluno só pode acessar cursos vinculados a ele.
- Aluno não pode acessar curso expirado.
- Aluno só pode acessar as próprias anotações.
- Aluno só pode acessar o próprio progresso.
- Toda validação crítica deve ocorrer no servidor.
- Nunca confiar apenas no frontend.

## Entidades principais

- User
- StudentProfile
- Course
- Module
- Lesson
- Enrollment
- LessonNote
- LessonProgress

## Regras de negócio

- Um aluno pode ter vários cursos.
- Um curso pode ter vários alunos.
- Um curso tem vários módulos.
- Um módulo tem várias aulas.
- Uma aula pertence a um módulo.
- Uma anotação pertence a um aluno e a uma aula.
- Cada aluno só pode ter uma anotação por aula.
- O acesso ao curso depende de matrícula ativa e não expirada.
- O progresso do curso é calculado pelas aulas concluídas.
- Módulos e aulas devem respeitar ordenação definida pelo administrador.
- Cursos, módulos e aulas inativos não devem aparecer para alunos.
- Matrículas expiradas devem bloquear o acesso ao conteúdo.

## Interface

A interface deve ser original, moderna e responsiva.

Pode se inspirar em padrões de áreas de membros, como:

- cards de cursos;
- sidebar;
- bottom navigation mobile;
- lista de módulos;
- player central;
- progresso;
- área de anotações;
- caderno do aluno;
- dashboard limpo e objetivo.

É proibido copiar:

- marca Hotmart;
- logotipo;
- identidade visual;
- textos;
- imagens;
- ícones proprietários;
- assets proprietários;
- trade dress.

## Padrão de código

Todo código deve ser:

- limpo;
- legível;
- modular;
- previsível;
- escalável;
- testável;
- fortemente tipado;
- seguro;
- de fácil manutenção.

Seguir:

- Clean Code;
- SOLID;
- DRY;
- KISS;
- Separation of Concerns;
- composição ao invés de herança;
- arquitetura orientada a domínio quando aplicável.

## Regras obrigatórias de código

- Nunca usar `any`.
- Nunca criar arquivos gigantes.
- Nunca misturar regra de negócio com UI.
- Nunca colocar queries diretamente em componentes visuais.
- Nunca duplicar lógica.
- Nunca criar componentes com múltiplas responsabilidades.
- Nunca hardcodar valores sensíveis.
- Nunca ignorar erros silenciosamente.
- Nunca avançar para próxima etapa sem review.

## Separação de responsabilidades

Separar claramente:

- UI;
- hooks;
- services;
- repositories;
- validators;
- types;
- auth;
- permissions;
- regras de negócio.

## Backend

Toda regra crítica deve estar no servidor.

Separar:

- actions;
- services;
- repositories;
- validators;
- auth;
- permissions;
- errors.

## Frontend

Priorizar:

- Server Components;
- renderização performática;
- lazy loading;
- code splitting;
- acessibilidade;
- responsividade;
- estados previsíveis;
- Client Components apenas quando necessário.

## Banco de dados

- Normalizar corretamente.
- Criar índices necessários.
- Evitar queries N+1.
- Paginação obrigatória em listas grandes.
- Utilizar migrations versionadas.
- Utilizar transações quando necessário.
- Criar constraints para integridade de dados.

## Performance

O sistema deve:

- evitar re-renderizações desnecessárias;
- evitar chamadas redundantes;
- minimizar uso de Client Components;
- otimizar carregamento;
- utilizar cache adequadamente;
- utilizar loading states;
- utilizar skeletons.

## Segurança

- Validar tudo no backend.
- Sanitizar entradas.
- Utilizar RBAC.
- Utilizar RLS.
- Proteger rotas.
- Nunca confiar no frontend.
- Nunca expor secrets.
- Implementar tratamento de erros seguro.
- Impedir acesso horizontal entre alunos.
- Verificar matrícula ativa antes de exibir conteúdo.

## Processo obrigatório

Antes de concluir qualquer etapa:

1. Rodar lint.
2. Rodar typecheck.
3. Rodar testes.
4. Rodar build quando aplicável.
5. Revisar código.
6. Revisar segurança.
7. Revisar duplicações.
8. Revisar complexidade.
9. Atualizar `docs/TODO.md`.
10. Atualizar `docs/REVIEW.md`.
11. Registrar decisões em `docs/DECISIONS.md`.

## Funcionalidades futuras fora do escopo inicial

Não implementar na primeira versão, apenas considerar extensibilidade:

- pagamentos;
- certificados;
- cupons;
- afiliados;
- avaliações;
- comentários;
- comunidades;
- gamificação avançada;
- upload próprio de vídeos;
- relatórios analíticos avançados.
