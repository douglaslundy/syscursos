# AGENTS


# Camada de contexto para Codex

Antes de alterar código:
1. Leia `.codex/context/PROJECT_BRIEF.md`.
2. Leia `.codex/context/ARCHITECTURE.md`.
3. Leia `.codex/context/CURRENT_STATE.md`.
4. Use somente evidências do repositório.
5. Não invente APIs, rotas, schemas, regras de negócio ou variáveis de ambiente.
6. Se algo não estiver claro, escreva “não identificado no repositório”.
7. Faça mudanças pequenas e testáveis.
8. Ao final, atualize `.codex/context/CURRENT_STATE.md`.

## Objetivo

Este arquivo define regras globais para qualquer agente de IA, Codex, Codex CLI ou assistente que atuar neste projeto.

O projeto deve evoluir a plataforma SysCursos conforme os requisitos funcionais, tecnicos, arquiteturais, de seguranca e qualidade definidos em `docs/PROJECT_CONTEXT.md`.

## Modo de trabalho

- Trabalhar em modo autonomo.
- Tomar decisoes tecnicas comuns sem interromper o fluxo.
- Em caso de ambiguidade, escolher a alternativa mais segura, simples, escalavel e facil de manter.
- Registrar decisoes tecnicas relevantes em `docs/DECISIONS.md`.

## Leitura obrigatoria antes de qualquer tarefa

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

## Regras obrigatorias gerais

- Trabalhar por etapas.
- Nao implementar funcionalidades fora da etapa atual.
- Nao usar `any`.
- Nao ignorar erros silenciosamente.
- Nao criar codigo duplicado.
- Nao criar componentes monoliticos.
- Nao misturar UI com regra de negocio.
- Nao expor secrets.
- Nao confiar no frontend para autorizacao.
- Atualizar documentacao ao final de cada etapa.

## Criterios de decisao

Quando houver mais de uma alternativa valida, priorizar:

1. seguranca;
2. simplicidade;
3. escalabilidade;
4. manutencao;
5. alinhamento ao stack do projeto;
6. adequacao para producao.

## Regra adicional para tarefas de reestilizacao visual

Quando a tarefa for explicitamente de reestilizacao UI/theme, aplicar tambem as regras abaixo:

- Nao alterar logica de negocio.
- Nao alterar rotas.
- Nao alterar APIs.
- Nao alterar banco de dados.
- Nao alterar fluxo de autenticacao ou pagamentos.
- Nao quebrar responsividade.
- Nao introduzir inconsistencia visual.

### Direcao visual (LMS dark premium)

```css
:root {
  --color-primary: #FF4D00;
  --color-primary-hover: #FF6A2A;

  --bg-main: #0F1115;
  --bg-elevated: #15181D;
  --bg-surface: #1A1D21;
  --bg-surface-hover: #20242A;

  --border-subtle: #2A2F36;
  --border-strong: #3A4048;

  --text-primary: #FFFFFF;
  --text-secondary: #A0A6AD;
  --text-muted: #6F7680;

  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
}
```

## Checklist obrigatorio antes de concluir etapa

1. Executar lint.
2. Executar typecheck.
3. Executar testes relevantes.
4. Executar build quando aplicavel.
5. Revisar seguranca.
6. Revisar legibilidade e duplicacoes.
7. Atualizar `docs/TODO.md`.
8. Atualizar `docs/REVIEW.md`.
9. Registrar decisoes em `docs/DECISIONS.md`.

## Padrao esperado

O projeto deve manter qualidade equivalente a aplicacoes SaaS modernas em producao.
