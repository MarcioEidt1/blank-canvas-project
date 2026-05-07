import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

test.describe("Visitante anônimo - listagem pública", () => {
  test("home carrega e exibe pelo menos um veículo público", async ({ page }) => {
    // Sanity check: a view public_vehicles deve retornar algo via API anônima
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("public_vehicles")
      .select("id, brand, model")
      .limit(1);

    expect(error).toBeNull();
    expect(data, "Nenhum veículo público no banco — cadastre um com show_on_website=true").toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);

    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);

    // Aguarda render de cards de veículo (marca/modelo do primeiro registro)
    const v = data![0];
    const card = page.getByText(new RegExp(`${v.brand}.*${v.model}`, "i")).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
  });
});
