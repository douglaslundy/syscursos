# Prompt 6 — Área do aluno

Leia:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `prompts/00_MASTER_INSTRUCTIONS.md`

Implemente apenas a área do aluno.

Criar:

- layout do aluno;
- dashboard de cursos;
- página do curso;
- listagem de módulos;
- listagem de aulas;
- página da aula;
- player YouTube;
- controle de aula concluída;
- cálculo de progresso do curso;
- aviso de curso expirado;
- estados vazios e estados de erro.

Regras:

- somente STUDENT pode acessar;
- aluno só vê cursos vinculados;
- curso expirado deve ser bloqueado;
- curso sem matrícula deve retornar 403;
- aula inativa não deve aparecer;
- módulo inativo não deve aparecer;
- curso inativo não deve aparecer;
- progresso deve ser calculado com base nas aulas concluídas;
- toda validação crítica deve ocorrer no servidor.

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
