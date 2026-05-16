# Prompt 14 - Implementacao: Materiais de Aula (PDF e Links)

Pre-condicao:
- Decisoes da etapa de discovery registradas e aprovadas.

Objetivo:
Implementar suporte completo a materiais de aula:
- PDF (upload ou URL, conforme decisao aprovada);
- links externos por aula.

Escopo:
1. Banco/Prisma
- Criar migration dedicada para estrutura de materiais de aula.
- Atualizar `prisma/schema.prisma`.
- Garantir constraints, indices e ordenacao.

2. Backend
- Criar/ajustar validators Zod.
- Atualizar repositorios/services/actions com escopo por tenant/ownership.
- Implementar tratamento de erros consistente e seguro.

3. Admin UI
- Adicionar CRUD de materiais em aula (inclusao, edicao, remocao e ordenacao).
- Evitar regressao no fluxo atual de aula YouTube.

4. Aluno UI
- Exibir materiais da aula com UX clara e segura.
- PDF com visualizacao/download; links externos com rotulagem adequada.

5. Testes e qualidade
- Criar testes unitarios/integracao relevantes.
- Rodar lint, typecheck, testes e build.

Regras importantes:
- Nao alterar dados de producao sem aprovacao explicita previa.
- Nao introduzir permissao ampla sem justificativa.
