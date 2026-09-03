# Migração de aulas .ts para .mp4 — design

## Contexto

Aulas cujo vídeo no Google Drive tem extensão `.ts` (MPEG-TS) não são exibidas
no player embutido: o próprio widget de preview do Google Drive não sabe
pré-visualizar esse contêiner e cai num fallback de "Nenhuma visualização
disponível" com botão de download. Isso foi confirmado abrindo diretamente um
link de exemplo no Drive. Não há nenhum bug no código do syscursos —
`video-platform-service.ts` não filtra por extensão/MIME, apenas monta o
iframe `drive.google.com/file/d/{id}/preview` para qualquer arquivo.

O campo que guarda o link do vídeo é `Lesson.youtubeUrl` (nome legado,
aceita Drive/OneDrive/YouTube) — `prisma/schema.prisma:157-178`. Não existe
integração com a API do Google Drive neste projeto (nem client, nem
credenciais) — apenas parsing de URL.

## Escopo

Migração pontual (não recorrente) para corrigir as aulas `.ts` já
cadastradas, sem introduzir nenhuma dependência de API do Google Drive. Todo
o pareamento entre arquivo novo (`.mp4`) e aula é feito manualmente pelo
usuário, assistido por um relatório gerado a partir do banco de dados.

## Partes

### 1. Ajuste em `scripts/convert-ts-to-mp4.ps1`

Comportamento atual: converte cada `.ts` encontrado recursivamente para
`.mp4` (remux, com fallback para re-encode), e só apaga o `.ts` original se
a flag `-DeleteOriginal` for passada.

Mudança: apagar o `.ts` original automaticamente sempre que a conversão for
confirmada com sucesso (arquivo `.mp4` existe e o comando `ffmpeg` saiu com
código 0). Adiciona a flag `-KeepOriginal` para quem quiser desativar esse
comportamento e manter os dois arquivos. Sem essa flag, o padrão passa a ser
apagar.

### 2. Novo script `prisma/report-drive-lessons.ts`

Segue o padrão dos demais scripts em `prisma/` (`new PrismaClient()` local,
`main()` com `.catch().finally(() => prisma.$disconnect())`, rodado via
`tsx`).

Lógica:
- Busca todas as `Lesson` cujo `youtubeUrl` contenha `drive.google.com`.
- Faz join com `Module` e `Course` para obter os títulos.
- Ordena por Curso > Módulo > `Lesson.position`.
- Gera um arquivo Markdown (`drive-lessons-report.md`, salvo na raiz do
  projeto) com uma seção por curso, subseção por módulo, e uma lista de
  aulas com checkbox (`- [ ] Título da aula — <link atual>`).

Uso: depois de rodar a conversão local e a sincronização do Drive, o usuário
roda `npm run report:drive-lessons`, abre o `.md` gerado, e usa como
checklist para: achar o `.mp4` correspondente no Drive (mesmo nome base,
mesma pasta), copiar o link novo, colar no cadastro da aula via admin
(fluxo existente, `saveLessonAction`), e marcar o checkbox.

Adiciona o script `"report:drive-lessons": "tsx prisma/report-drive-lessons.ts"`
em `package.json`.

## Fora de escopo

- Qualquer integração com a API do Google Drive (auth, busca de arquivos,
  atualização automática do banco).
- Qualquer mudança em `video-platform-service.ts` ou no player de vídeo —
  confirmado que não há bug ali.
- Prevenção futura (ex: validação no cadastro para rejeitar `.ts`) — não foi
  pedido; pode ser um projeto futuro separado.

## Teste

- `report-drive-lessons.ts`: rodar contra o banco local/dev e conferir que o
  Markdown gerado reflete corretamente a hierarquia Curso > Módulo > Aula e
  os links atuais.
- `convert-ts-to-mp4.ps1`: exercitar manualmente com uma pasta de teste
  contendo um `.ts` de exemplo, confirmando que o `.mp4` é criado e o `.ts`
  é removido por padrão, e que `-KeepOriginal` preserva o original.
