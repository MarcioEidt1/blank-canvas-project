import { test, expect } from "@playwright/test";

/**
 * Valida que o admin consegue logar e acessar /admin.
 *
 * Requer as variáveis de ambiente:
 *   E2E_ADMIN_EMAIL
 *   E2E_ADMIN_PASSWORD
 *
 * Use um usuário DEDICADO para E2E (não o seu admin real).
 * O teste é pulado automaticamente se as credenciais não existirem.
 */
test.describe("Admin - login", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para rodar este teste",
  );

  test("admin loga e é redirecionado para /admin", async ({ page }) => {
    await page.goto("/admin/login");

    await page
      .getByLabel(/e-?mail/i)
      .first()
      .fill(process.env.E2E_ADMIN_EMAIL!);
    await page
      .getByLabel(/senha|password/i)
      .first()
      .fill(process.env.E2E_ADMIN_PASSWORD!);

    await page.getByRole("button", { name: /entrar|login|acessar/i }).click();

    await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  });
});
