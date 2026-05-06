import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { email, password } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Only allow if there is no existing master admin yet
    const { data: existingMasters } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .eq("is_master", true)
      .limit(1);

    if (existingMasters && existingMasters.length > 0) {
      return new Response(JSON.stringify({ error: "Master admin already exists. Remove this function or use manage-admin-users." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
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

    return new Response(JSON.stringify({ success: true, user_id: user!.id, email }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
