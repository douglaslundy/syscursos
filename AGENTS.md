# AGENTS

## Objetivo

Este arquivo define as regras globais para qualquer agente de IA, Codex, Codex CLI ou assistente de desenvolvimento que atuar neste projeto.

A IA deve desenvolver uma plataforma de cursos online com área administrativa e área do aluno, respeitando integralmente os requisitos funcionais, técnicos, arquiteturais, de segurança e qualidade definidos em `docs/PROJECT_CONTEXT.md`.

## Modo de trabalho

A IA deve trabalhar em modo autônomo.

Isso significa que ela deve tomar decisões técnicas adequadas sem interromper o desenvolvimento para perguntas triviais. Quando houver ambiguidade, a IA deve escolher a alternativa mais segura, simples, escalável e fácil de manter.

A IA deve registrar decisões técnicas relevantes em `docs/DECISIONS.md`.

## Leitura obrigatória antes de qualquer tarefa

Antes de implementar qualquer coisa, a IA deve ler:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/TODO.md`
- `docs/DECISIONS.md`
- `docs/REVIEW.md`

## Regras obrigatórias

- Trabalhar por etapas.
- Não implementar funcionalidades fora da etapa atual.
- Não pedir confirmação para decisões técnicas comuns.
- Não usar `any`.
- Não ignorar erros silenciosamente.
- Não criar código duplicado.
- Não criar componentes monolíticos.
- Não misturar UI com regras de negócio.
- Não expor secrets.
- Não confiar no frontend para autorização.
- Não copiar identidade visual, marca, logo, textos ou assets da Hotmart.
- Atualizar documentação ao final de cada etapa.

## Critérios de decisão

Quando precisar decidir entre alternativas, escolher a solução:

1. mais segura;
2. mais simples;
3. mais escalável;
4. mais fácil de manter;
5. mais alinhada ao stack definido;
6. mais adequada para produção.

## Checklist obrigatório antes de concluir etapa

Antes de declarar uma etapa como concluída, executar:

1. lint;
2. typecheck;
3. testes relevantes;
4. build quando aplicável;
5. revisão de segurança;
6. revisão de legibilidade;
7. atualização de `docs/TODO.md`;
8. atualização de `docs/REVIEW.md`;
9. registro de decisões em `docs/DECISIONS.md`.

## Padrão esperado

O projeto deve seguir padrão de qualidade comparável a aplicações SaaS modernas de produção.
