import { expect, test } from "@playwright/test";

test("area do aluno exige login", async ({ request }) => {
  const response = await request.get("/app/review", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/login");
});

test("PWA: manifest, tela offline e service worker respondem", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).name).toBeTruthy();

  expect((await request.get("/offline.html")).ok()).toBe(true);
  expect((await request.get("/sw.js")).ok()).toBe(true);
  expect((await request.get("/icons/icon-192.png")).ok()).toBe(true);
});

test("certificado inexistente nao quebra a verificacao publica", async ({ request }) => {
  const response = await request.get("/verificar/CODIGO-INEXISTENTE");

  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Nenhum certificado encontrado");
});

test("cron de lembretes recusa chamada sem segredo", async ({ request }) => {
  const response = await request.get("/api/cron/study-reminders");

  expect([401, 503]).toContain(response.status());
});

test("cabecalhos de seguranca estao presentes", async ({ request }) => {
  const response = await request.get("/login/client");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBeTruthy();
  expect(headers["content-security-policy-report-only"]).toContain("default-src 'self'");
});
