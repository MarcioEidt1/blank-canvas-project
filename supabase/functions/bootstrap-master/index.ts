import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { email, password, bootstrap_token } = await req.json();
    const expected = Deno.env.get("BOOTSTRAP_TOKEN");
    if (!expected || bootstrap_token !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      user = created.user;
    } else {
      await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    }

    await admin.from("user_roles").upsert(
      { user_id: user!.id, role: "admin", is_master: true, permissions: [] },
      { onConflict: "user_id,role" }
    );

    await admin.from("user_profiles").upsert(
      { user_id: user!.id, recovery_email: email },
      { onConflict: "user_id" }
    );

    return new Response(JSON.stringify({ success: true, user_id: user!.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
