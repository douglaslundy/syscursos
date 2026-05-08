import { expect, test } from "@playwright/test";

test("renders the public home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /Venda, organize e entregue seus cursos/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sou cliente" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sou administrador" })).toBeVisible();
});

test("renders responsive public content on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Sou cliente" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sou administrador" })).toBeVisible();
});
