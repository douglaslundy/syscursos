# UI/UX

## Objetivo

Criar uma interface moderna, responsiva, clara e original para uma plataforma de cursos online.

## Referencia conceitual

A interface pode se inspirar em padroes comuns de areas de membros:

- dashboard com cards de curso;
- sidebar em desktop;
- navegacao inferior em mobile;
- player de video central;
- modulos expansivos;
- aulas listadas por ordem;
- progresso do curso;
- area de anotacoes;
- cadernos por curso.

## Proibicoes

E proibido copiar:

- identidade visual da Hotmart;
- logotipo da Hotmart;
- paleta proprietaria;
- textos proprietarios;
- imagens proprietarias;
- icones proprietarios;
- assets proprietarios;
- trade dress.

## Requisitos visuais

- Layout limpo e orientado a area de membros.
- Boa hierarquia visual em dashboard, curso, aula e cadernos.
- Sidebar desktop persistente.
- Bottom navigation mobile.
- Cards de curso com progresso, status e data de expiracao.
- Responsividade completa para mobile, tablet e desktop.
- Contraste adequado com paleta proprietaria baseada em verde petroleo, tons claros neutros e acentos suaves.
- Estados de loading com skeletons.
- Estados vazios claros.
- Estados de erro recuperaveis.
- Feedback de sucesso.
- Componentes acessiveis com labels, `aria-current`, `aria-live`, skip link e progressbar semantico.
- Logo autorizada de `sysdoc.vercel.app`.

## Paginas obrigatorias

### Admin

- Login
- Dashboard
- Cursos
- Modulos
- Aulas
- Alunos
- Matriculas

### Aluno

- Login
- Dashboard de cursos
- Pagina do curso
- Pagina da aula
- Meus Cadernos
- Caderno do curso

## Revisao executada em 2026-05-04

### Implementado

- Shell do aluno com sidebar desktop, header mobile e bottom navigation.
- Logo proprietaria autorizada carregada via `next/image`.
- Navegacao com estado ativo por rota e atributos acessiveis.
- Dashboard com cards de curso responsivos.
- Pagina de curso com cabecalho mais claro, resumo de progresso e lista de aulas com estados visuais.
- Pagina de aula com player destacado, feedback de conclusao e editor de anotacoes com status acessivel.
- Pagina `Meus Cadernos` com filtros rotulados, busca com icone, estados vazios e agrupamento visual.
- Loading state com skeletons.
- Error boundary da area do aluno com acao de tentar novamente.

### Acessibilidade

- `lang="pt-BR"` mantido no layout raiz.
- Skip link adicionado no shell do aluno.
- Navegacao principal rotulada em desktop e mobile.
- Link ativo usa `aria-current="page"`.
- Barra de progresso usa `role="progressbar"` e valores ARIA.
- Status de autosave usa `aria-live="polite"`.
- Controles de formulario possuem labels visiveis ou `sr-only`.
- Botoes possuem area de toque minima adequada.

### Identidade visual

- Nao foram usados logo, textos, assets ou identidade visual da Hotmart.
- A identidade aplicada e proprietaria, com logo Sysdoc autorizada e paleta propria.
