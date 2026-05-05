# Prompt 11 - Ajustes de CRUD Administrativo

Objetivo: corrigir a experiencia e o update dos CRUDs de cursos, alunos e matriculas sem alterar regras de negocio desnecessarias.

Politica de economia de tokens:

- Leia primeiro `docs/TODO.md`, `docs/DEVELOPMENT_MEMORY.md`, `docs/DECISIONS.md` e este prompt.
- Depois leia apenas os arquivos de admin envolvidos: paginas em `src/app/admin/**`, componentes usados por elas, `src/server/actions/admin-actions.ts`, `src/server/services/admin-service.ts`, `src/server/repositories/admin-repository.ts` e validators necessarios.
- Use `rg` para localizar funcoes e componentes antes de abrir arquivos longos.
- Nao cole arquivos inteiros no chat; resuma causa raiz, decisao e arquivos alterados.

Requisitos:

- Cursos, alunos e matriculas devem listar registros em modo leitura.
- Nao exibir inputs de edicao diretamente em cada linha/listagem.
- Cada registro deve ter botao `Editar`.
- Ao clicar em `Editar`, popular o formulario principal de cadastro para edicao.
- O mesmo formulario deve funcionar para criar e atualizar, com estado visual claro.
- Corrigir updates que nao estejam persistindo corretamente.
- Manter feedback controlado para sucesso, validacao, conflito, erro de Auth e erro generico.
- Preservar confirmacoes para acoes destrutivas.
- Manter separacao entre UI, Server Actions, services, repositories e validators.

Boas praticas:

- Preferir Server Components para leitura.
- Usar Client Component pequeno apenas para estado de formulario/edicao quando necessario.
- Validar tudo no servidor com Zod.
- Nao confiar em campos escondidos para autorizacao.
- Evitar duplicacao de formularios entre create e update.
- Adicionar testes focados em validators/services/actions quando houver bug de update na camada server-side.

Validacao obrigatoria antes do commit:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build` quando a etapa tocar fluxo renderizado ou Server Actions

Commit:

- Fazer commit proprio para esta etapa.
- Sugestao de mensagem: `Fix admin CRUD editing flows`
