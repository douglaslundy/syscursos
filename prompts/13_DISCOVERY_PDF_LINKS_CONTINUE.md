# Prompt 13 - Discovery: Materiais de Aula + Continuar Ultima Aula

Objetivo:
Executar somente descoberta tecnica e planejamento para implementar:
1. materiais de aula do tipo PDF e link externo;
2. menu/atalho de continuidade "Continuar ultima aula".

Escopo desta etapa:
- Nao alterar dados de banco em producao.
- Nao executar seed, carga ou scripts de escrita em producao.
- Ler contexto obrigatorio (`AGENTS.md`, `.codex/context/*`, `docs/*`) e usar apenas evidencias do repositorio.

Entregas obrigatorias:
1. Diagnostico tecnico do estado atual (camadas, rotas, services, repositorios e schema afetados).
2. Proposta de modelo de dados para materiais de aula (campos, constraints, indices e ordem).
3. Proposta de UX admin/aluno para PDF e links.
4. Proposta de regra server-side para "Continuar ultima aula" com fallback.
5. Riscos de seguranca e mitigacoes.
6. Plano incremental de implementacao em pequenas etapas testaveis.
7. Atualizacao de `docs/DECISIONS.md` e `docs/REVIEW.md` com as decisoes desta descoberta.

Criterios de qualidade:
- Nao usar `any`.
- Nao misturar regra de negocio com UI.
- Nao inventar APIs/rotas fora do que o repositorio suporta sem registrar decisao.
- Priorizar seguranca, simplicidade e manutencao.
