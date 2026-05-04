# Prompt 5 — Módulo administrativo

Leia:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `prompts/00_MASTER_INSTRUCTIONS.md`

Implemente apenas o módulo administrativo.

Criar:

- layout admin;
- dashboard admin;
- CRUD de cursos;
- ativar e inativar cursos;
- CRUD de módulos;
- ordenação de módulos;
- ativar e inativar módulos;
- CRUD de aulas;
- ordenação de aulas;
- ativar e inativar aulas;
- CRUD de alunos;
- ativar e inativar alunos;
- matrícula de aluno em curso;
- renovação de matrícula;
- cancelamento de matrícula;
- listagem de cursos por aluno;
- listagem de alunos por curso;
- filtros e busca onde fizer sentido.

Regras:

- somente ADMIN pode executar;
- validar todos os inputs com Zod;
- usar Server Actions;
- separar UI, services, repositories e validators;
- usar paginação;
- usar estados de loading;
- usar feedback de erro e sucesso;
- confirmar ações destrutivas;
- não expor lógica sensível no frontend.

Ao finalizar:

- criar testes;
- rodar lint;
- rodar typecheck;
- rodar testes;
- rodar build;
- atualizar `docs/TODO.md`;
- atualizar `docs/REVIEW.md`;
- registrar decisões em `docs/DECISIONS.md`.

Trabalhe em modo autônomo. Não peça confirmação para decisões técnicas triviais.
