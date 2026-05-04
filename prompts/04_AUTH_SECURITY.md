# Prompt 4 — Autenticação e segurança

Leia:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/SECURITY.md`
- `prompts/00_MASTER_INSTRUCTIONS.md`

Implemente apenas autenticação, autorização e segurança base.

Criar:

- Supabase Auth;
- login;
- logout;
- sessão;
- RBAC com ADMIN e STUDENT;
- middleware;
- proteção de `/admin`;
- proteção de `/app`;
- helpers server-side de autenticação;
- helpers server-side de permissão;
- validações com Zod;
- RLS policies no Supabase.

Regras:

- ADMIN acessa `/admin`;
- STUDENT acessa `/app`;
- aluno não acessa admin;
- usuário não autenticado vai para login;
- nunca confiar no frontend;
- toda autorização crítica deve ocorrer no servidor;
- secrets nunca devem ser expostos no frontend;
- service role key nunca deve ser usada em Client Components.

Ao finalizar:

- criar testes de autorização;
- rodar lint;
- rodar typecheck;
- rodar testes;
- atualizar `docs/SECURITY.md`;
- atualizar `docs/TODO.md`;
- atualizar `docs/REVIEW.md`;
- registrar decisões em `docs/DECISIONS.md`.

Trabalhe em modo autônomo. Não peça confirmação para decisões técnicas triviais.
