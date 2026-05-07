import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

test.describe("Visitante anônimo - detalhes do veículo", () => {
  test("/veiculo/:id renderiza marca, modelo e preço", async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("public_vehicles")
      .select("id, brand, model, price")
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    await page.goto(`/veiculo/${data!.id}`);

    await expect(page.getByText(new RegExp(data!.brand, "i")).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(new RegExp(data!.model, "i")).first()).toBeVisible();
  });
});
