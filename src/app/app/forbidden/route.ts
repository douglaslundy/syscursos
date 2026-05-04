export function GET() {
  return new Response(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acesso negado</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #111827; }
      main { max-width: 560px; margin: 64px auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
      p { color: #6b7280; line-height: 1.5; }
      a { color: #2563eb; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <strong>403</strong>
      <h1>Acesso negado</h1>
      <p>Voce nao possui matricula ativa para acessar este conteudo.</p>
      <a href="/app">Voltar para meus cursos</a>
    </main>
  </body>
</html>`,
    {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
