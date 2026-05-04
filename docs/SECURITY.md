# Seguranca

## Objetivo

Definir o modelo de seguranca da plataforma de cursos online, garantindo autenticacao confiavel, autorizacao server-side, protecao contra acesso horizontal e isolamento dos dados privados dos alunos.

## Principios obrigatorios

- Nunca confiar no frontend para autorizacao.
- Validar toda entrada no servidor.
- Aplicar RBAC em rotas, Server Actions, services e dados sensiveis.
- Aplicar RLS no Supabase Postgres como defesa em profundidade.
- Nao expor secrets no client.
- Nao usar service role key no frontend.
- Nao retornar dados sensiveis desnecessarios.
- Tratar erros sem vazar detalhes internos.
- Registrar decisoes e riscos relevantes em documentacao.

## Perfis

### ADMIN

Pode acessar `/admin` e gerenciar:

- cursos;
- modulos;
- aulas;
- alunos;
- matriculas;
- renovacao e cancelamento de acesso;
- consultas administrativas.

Administrador nao deve usar o fluxo visual do aluno na primeira versao.

### STUDENT

Pode acessar `/app` e:

- visualizar cursos vinculados por matricula ativa e nao expirada;
- visualizar modulos e aulas ativos desses cursos;
- assistir aulas liberadas;
- marcar as proprias aulas como concluidas;
- criar e editar as proprias anotacoes;
- visualizar os proprios cadernos;
- buscar apenas dentro dos proprios cadernos.

## Protecao de rotas

- `/admin/*`: exige usuario autenticado com perfil `ADMIN`.
- `/app/*`: exige usuario autenticado com perfil `STUDENT`.
- `/login`: deve redirecionar usuarios autenticados para a area correta.
- Rotas inexistentes ou nao autorizadas nao devem revelar existencia de recursos privados.

## Camadas de autorizacao

### Middleware

Deve fazer bloqueio inicial por autenticacao e perfil para reduzir acesso indevido a areas inteiras.

### Server Components

Devem buscar dados ja autorizados por services. Nao devem receber dados brutos e filtrar permissao apenas na renderizacao.

### Server Actions

Devem autenticar usuario, validar input, validar perfil e chamar services. Nunca devem confiar em IDs enviados pelo client sem checar ownership e permissoes.

### Services

Devem centralizar regras de negocio e autorizacao:

- perfil correto;
- propriedade dos dados;
- matricula ativa;
- matricula nao expirada;
- curso ativo;
- modulo ativo;
- aula ativa;
- status do aluno;
- limites e paginacao.

### Repositories

Devem executar queries Prisma sem decidir autorizacao. Queries sensiveis devem receber filtros ja definidos pelo service.

### RLS

Deve reforcar isolamento em tabelas expostas ou sensiveis. Policies devem cobrir leitura, insercao, atualizacao e remocao quando aplicavel.

## Verificacoes obrigatorias por recurso

### Curso para aluno

- usuario autenticado;
- perfil `STUDENT`;
- aluno ativo;
- matricula ativa;
- `startsAt` valido;
- `expiresAt` nulo ou futuro;
- curso ativo.

### Modulo para aluno

- todas as verificacoes de curso;
- modulo pertence ao curso;
- modulo ativo.

### Aula para aluno

- todas as verificacoes de modulo;
- aula pertence ao modulo;
- aula ativa.

### Anotacao

- usuario autenticado;
- perfil `STUDENT`;
- anotacao pertence ao proprio aluno;
- aula pertence a curso liberado;
- constraint unica por aluno e aula.

### Progresso

- usuario autenticado;
- perfil `STUDENT`;
- progresso pertence ao proprio aluno;
- aula pertence a curso liberado;
- constraint unica por aluno e aula.

## Riscos de seguranca

- Acesso horizontal entre alunos por IDs previsiveis ou validacao incompleta.
- Aluno acessar curso expirado por rota direta.
- Aluno acessar aula inativa por URL conhecida.
- Administrador receber permissoes de aluno sem fluxo auditado de impersonation.
- Exposicao de service role key ou secrets via variaveis `NEXT_PUBLIC_*`.
- Validacao apenas no client em formularios administrativos.
- Falta de RLS em tabelas de anotacoes, progresso e matriculas.
- Erros de banco ou auth vazando detalhes internos para o usuario.
- Falta de rate limiting em login, autosave e mutacoes frequentes.
- XSS em anotacoes ou campos textuais exibidos na UI.
- CSRF ou abuso de Server Actions se a sessao e origem nao forem tratadas corretamente pelo framework e pelos controles server-side.
- Enumeracao de recursos em respostas de erro diferentes para "nao existe" e "sem permissao".

## Medidas obrigatorias

- Usar Zod em todos os inputs de Server Actions e Route Handlers.
- Sanitizar ou renderizar texto de anotacoes como texto, nao HTML.
- Usar UUIDs em entidades principais.
- Aplicar constraints de unicidade em anotacoes e progresso por aluno/aula.
- Aplicar indices para filtros de autorizacao frequentes.
- Usar transacoes para ordenacao e operacoes multi-entidade.
- Restringir env vars publicas ao minimo necessario.
- Criar helper unico de sessao server-side.
- Criar helper unico de permissao por perfil.
- Padronizar erros de dominio sem vazar causa interna.
- Registrar eventos sensiveis futuros, como login, renovacao, cancelamento e alteracao de senha inicial.

## Politicas RLS planejadas

- `students`: aluno le apenas o proprio perfil; admin gerencia.
- `enrollments`: aluno le apenas as proprias matriculas; admin gerencia.
- `lesson_notes`: aluno le e altera apenas as proprias anotacoes; admin nao precisa ler conteudo privado na primeira versao.
- `lesson_progress`: aluno le e altera apenas o proprio progresso; admin pode consultar dados agregados se implementado no futuro.
- `courses`, `modules`, `lessons`: aluno le apenas conteudo ativo relacionado a matricula valida; admin gerencia.

## Checklist de revisao de seguranca por fase

- Confirmar que nenhuma autorizacao critica ficou apenas na UI.
- Confirmar validacao Zod no servidor.
- Confirmar ausencia de `any`.
- Confirmar ausencia de secrets em codigo e logs.
- Confirmar que erros publicos sao seguros.
- Confirmar RLS e policies para tabelas sensiveis.
- Confirmar testes de acesso negado e acesso horizontal.
