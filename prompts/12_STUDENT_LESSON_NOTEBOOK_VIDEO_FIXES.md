# Prompt 12 - Ajustes da Area do Aluno, Caderno e Video

Objetivo: corrigir visibilidade de curso cancelado, navegacao de aulas, comportamento do caderno e erro de reproducao de video.

Politica de economia de tokens:

- Leia primeiro `docs/TODO.md`, `docs/DEVELOPMENT_MEMORY.md`, `docs/DECISIONS.md` e este prompt.
- Depois leia apenas `src/app/app/**`, `src/components/student/**`, `src/server/actions/student-actions.ts`, `src/server/services/student-service.ts`, `src/server/repositories/student-repository.ts`, `src/server/services/youtube-service.ts` e testes relacionados.
- Investigue com `rg "youtube|Lesson|Enrollment|CANCELED|cancel"` antes de abrir arquivos.
- Evite reler documentos historicos longos se a etapa atual ja estiver clara.

Requisitos:

- Quando um curso/matricula for cancelado, ele deve continuar aparecendo para o aluno com status cancelado.
- Curso cancelado nao deve liberar acesso indevido ao conteudo protegido.
- Na pagina do curso/aulas, os modulos devem ficar em dropdown.
- Na tela de exibicao da aula, deve haver menu/listagem de aulas a direita.
- Antes do botao de aula concluida, inserir botoes para aula anterior e proxima aula.
- O caderno deve abrir somente leitura, exibindo anotacoes com cabecalho do titulo da aula.
- A area de digitar e o botao salvar nao devem aparecer automaticamente no caderno.
- Investigar o erro do player YouTube: `Ocorreu um erro. Tente novamente mais tarde`.
- Corrigir normalizacao, validacao ou embed do YouTube conforme causa raiz.

Boas praticas:

- Separar status de matricula visivel de permissao para assistir conteudo.
- Nao resolver o erro do video por tentativa repetitiva; identificar formato de URL, videoId, permissao de embed, origem e parametros do iframe.
- Manter YouTube em helper/service testavel.
- Preservar acessibilidade de dropdowns e navegacao anterior/proxima.
- Evitar Client Components grandes; usar componentes pequenos para interacao.

Validacao obrigatoria antes do commit:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e` se a alteracao impactar navegacao renderizada e o ambiente permitir

Commit:

- Fazer commits separados se dividir em mais de uma correcao.
- Sugestoes de mensagem:
  - `Fix student canceled course visibility`
  - `Improve lesson navigation layout`
  - `Fix notebook read-only view`
  - `Fix YouTube lesson playback`
