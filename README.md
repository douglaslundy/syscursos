# Instruções para uso com Codex ou IA de desenvolvimento

Este pacote contém a estrutura de documentação e prompts para desenvolver uma plataforma de cursos online com área administrativa e área do aluno.

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
3. Peça para ele ler `AGENTS.md` e `docs/PROJECT_CONTEXT.md`.
4. Execute os prompts da pasta `/prompts` em sequência.
5. Não envie todos os prompts de uma vez.
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

## Observação importante

Os arquivos `.md` são a memória persistente do projeto. Os prompts operacionais devem ser executados manualmente, um por vez, para manter controle, qualidade e rastreabilidade.
