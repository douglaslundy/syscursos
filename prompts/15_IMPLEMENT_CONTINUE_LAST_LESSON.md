# Prompt 15 - Implementacao: Menu Continuar Ultima Aula

Pre-condicao:
- Regra funcional de continuidade definida na discovery.

Objetivo:
Implementar navegacao "Continuar ultima aula" na area do aluno.

Escopo:
1. Regra server-side
- Calcular ultima aula elegivel por aluno com base em matricula ativa, status de curso/modulo/aula e progresso.
- Definir fallback quando nao houver aula elegivel.

2. Integracao no aluno
- Criar entrada no menu/dashboard para "Continuar ultima aula".
- Redirecionar para a aula correta com validacao server-side.

3. Cobertura
- Testes unitarios para regra de selecao/fallback.
- Testes de integracao para redirecionamento/autorizacao.

4. Qualidade
- Rodar lint, typecheck, testes e build.
- Atualizar `docs/REVIEW.md` e `docs/TODO.md`.

Regras importantes:
- Nao confiar no frontend para autorizacao.
- Nao alterar dados de producao sem aprovacao explicita previa.
