# Prompt 7 — Anotações e cadernos

Leia:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `prompts/00_MASTER_INSTRUCTIONS.md`

Implemente o sistema de anotações e cadernos.

Criar:

- campo de anotação na página da aula;
- salvar anotação;
- editar anotação;
- autosave com debounce;
- caderno por curso;
- página “Meus Cadernos”;
- seleção de curso;
- listagem de notas agrupadas por módulo e aula;
- busca nos cadernos.

Regras:

- aluno só vê as próprias notas;
- aluno só cria nota em aula de curso ativo e matriculado;
- aluno não pode criar nota em curso expirado;
- uma nota por aluno/aula;
- validar conteúdo com Zod;
- sanitizar texto;
- impedir acesso horizontal;
- salvar conteúdo de forma segura.

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
