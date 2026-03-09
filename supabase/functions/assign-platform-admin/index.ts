import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body for bootstrap secret
    let body: { bootstrap_secret?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use anon client to verify the JWT and get the user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Security Gate ──────────────────────────────────────────────────────
    // Check if any platform admin already exists
    const { count: existingAdminCount } = await supabaseAdmin
      .from("platform_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "platform_admin");

    if ((existingAdminCount ?? 0) > 0) {
      // Admins already exist — only allow an existing platform admin to call this
      const { data: callerRole } = await supabaseAdmin
        .from("platform_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "platform_admin")
        .maybeSingle();

      if (!callerRole) {
        return new Response(JSON.stringify({ error: "Forbidden: Platform admin already exists. Only an existing admin can grant this role." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // No admins exist yet — require the bootstrap secret for first-time setup
      const bootstrapSecret = Deno.env.get("PLATFORM_BOOTSTRAP_SECRET");
      if (!bootstrapSecret || body.bootstrap_secret !== bootstrapSecret) {
        return new Response(JSON.stringify({ error: "Forbidden: Valid bootstrap secret required for initial admin setup." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // ── End Security Gate ──────────────────────────────────────────────────

    // Check if the user already has a platform role (prevent duplicates)
    const { data: existing } = await supabaseAdmin
      .from("platform_roles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Role already assigned" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign platform_admin role
    const { error: insertError } = await supabaseAdmin
      .from("platform_roles")
      .insert({ user_id: user.id, role: "platform_admin" });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
