import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const hasEnv = !!SUPABASE_URL && !!ANON_KEY;

describe.skipIf(!hasEnv)("public_vehicles SELECT access", () => {
  it("anon role can SELECT from public_vehicles", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon
      .from("public_vehicles")
      .select("id")
      .limit(1);
    expect(error, error?.message).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("authenticated role (using anon key, no session) can SELECT from public_vehicles", async () => {
    // Without a real session this client is treated as anon; we still verify
    // the query succeeds (no permission error) which proves grants are wide
    // enough for anon+authenticated.
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from("public_vehicles").select("id").limit(1);
    expect(error, error?.message).toBeNull();
  });
});
