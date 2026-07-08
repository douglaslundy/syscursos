# Reordenação de posição em Módulos, Aulas e Materiais

Data: 2026-07-08

## Contexto

Módulos, aulas e materiais de aula têm um campo `position` (Int) com constraint única
por pai no banco:

- `Module`: `@@unique([courseId, position])`
- `Lesson`: `@@unique([moduleId, position])`
- `LessonMaterial`: `@@unique([lessonId, position])`

Hoje, `upsertModule`, `upsertLesson` e `upsertLessonMaterial`
(`src/server/repositories/admin-repository.ts`) gravam a posição informada
diretamente (`updateMany`/`create`), sem transação e sem realocar os irmãos.
Editar um item para uma posição já ocupada por outro colide com a constraint
única do Postgres e falha.

## Objetivo

Ao editar a posição de uma aula ou módulo (ou material), os demais itens do
mesmo pai devem ser deslocados automaticamente para abrir espaço, preservando
uma sequência contígua de posições sem colisão — de forma análoga a mover um
item dentro de uma lista ordenada:

- Mover a aula 10 para a posição 1 → aulas 1..9 passam a ser 2..10.
- Mover a aula 3 para a posição 10 → aulas 4..10 passam a ser 3..9.

Esse comportamento vale para módulos (escopo: curso), aulas (escopo: módulo)
e materiais de aula (escopo: aula). Não há, hoje, como mover um item entre
pais diferentes pelos formulários existentes (moduleId/courseId são campos
fixos/hidden), então o reordenamento é sempre dentro do mesmo pai.

## Regras

1. **Edição (`input.id` presente):**
   - Buscar o registro atual (posição `C` e id do pai), já escopado por
     organização/produtor. Se não encontrado (não existe ou sem permissão),
     lança erro — antes o `updateMany` falhava silenciosamente (0 linhas
     afetadas); agora fica consistente com o mapeamento de erro já existente
     nas actions (`P2025` → status `"invalid"`).
   - Contar o total de itens (`total`) do pai (inclui o próprio item).
   - A posição alvo `P` é limitada (clamp) ao intervalo `[1, total]`.
   - Se `P === C`: nenhum reposicionamento necessário; segue update normal
     dos demais campos.
   - Se `P !== C`: os irmãos com posição entre `C` e `P` (exclusive do
     próprio item) são deslocados em ±1:
     - `P < C`: irmãos com posição em `[P, C-1]` → `+1`.
     - `P > C`: irmãos com posição em `(C, P]` → `-1`.

2. **Criação (`input.id` ausente):**
   - Contar o total de itens existentes (`total`) do pai (não inclui o novo
     item, que ainda não existe).
   - A posição alvo `P` é limitada ao intervalo `[1, total + 1]`.
   - Irmãos com posição `>= P` são deslocados `+1`.
   - O novo item é criado com `position = P` depois do deslocamento.

3. **Atomicidade e ordem de escrita:** a constraint única do Postgres não é
   deferível (checagem imediata por linha). Para evitar colisão transitória
   ao deslocar várias linhas, a atualização é feita em duas fases dentro de
   uma `prisma.$transaction`:
   - Fase 1: cada linha afetada (item movido/criado, se aplicável, + irmãos
     deslocados) recebe uma posição negativa temporária e distinta
     (`-1, -2, -3, ...`), garantindo que nenhuma colisione com posições
     existentes (todas as posições válidas são `>= 1`).
   - Fase 2: cada linha afetada recebe seu valor final definitivo. Como
     todas já estão em valores negativos após a fase 1, não há colisão
     possível na fase 2.

4. **Reuso:** as três entidades (`Module`, `Lesson`, `LessonMaterial`)
   seguem exatamente o mesmo padrão de dados (posição única por pai). A
   lógica de deslocamento em duas fases é implementada como um helper
   genérico, parametrizado pelo delegate do Prisma (`tx.module`, `tx.lesson`
   ou `tx.lessonMaterial`), usado pelos três `upsert*`.

## Fora de escopo

- Mover um item entre pais diferentes (mudar de módulo/curso) — não há UI
  para isso hoje.
- Drag-and-drop na interface — a entrada continua sendo o campo numérico de
  posição já existente nos formulários.
- Alterar a constraint do banco para `DEFERRABLE` — resolvido inteiramente
  na camada de aplicação, sem migração.

## Testes

Estender `src/tests/integration/admin-repository.test.ts` (usa mocks do
Prisma client, incluindo `$transaction`) cobrindo, para módulo e aula (e
material):

- Mover para uma posição anterior (itens intermediários deslocados +1).
- Mover para uma posição posterior (itens intermediários deslocados -1).
- Clamp quando a posição informada excede o total existente.
- Criação inserindo no meio da lista (irmãos deslocados +1).
- No-op quando a posição não muda (nenhum deslocamento, só os outros
  campos são atualizados).
- Erro ao editar item inexistente/sem permissão (antes era no-op
  silencioso).
