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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: platformRole } = await supabaseAdmin
      .from("platform_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    if (platformRole?.role !== "platform_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: platform admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, full_name, institution_id, role } = body;

    if (!email || !institution_id || !role) {
      return new Response(JSON.stringify({ error: "email, institution_id and role are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pwd = password || (Math.random().toString(36).slice(-8) + "Aa1!");

    let userId: string;
    let alreadyExisted = false;

    // Try to create the user first
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: pwd,
      email_confirm: true,
      user_metadata: { full_name: full_name?.trim() ?? "" },
    });

    if (createError) {
      // User already exists — find them via listUsers with page search
      const isAlreadyExists =
        createError.message.toLowerCase().includes("already") ||
        createError.message.toLowerCase().includes("registered") ||
        createError.message.toLowerCase().includes("exists") ||
        createError.message.toLowerCase().includes("unique");

      if (!isAlreadyExists) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the existing user's ID via DB function (bypasses listUsers pagination issues)
      const { data: existingUserId, error: lookupError } = await supabaseAdmin
        .rpc("get_user_id_by_email", { p_email: normalizedEmail });

      if (lookupError || !existingUserId) {
        return new Response(
          JSON.stringify({ error: "User already exists but could not be located. Please assign the role manually." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = existingUserId;
      alreadyExisted = true;
    } else {
      userId = newUserData.user!.id;
    }

    // Upsert profile
    await supabaseAdmin.from("profiles").upsert(
      { user_id: userId, full_name: full_name?.trim() ?? "" },
      { onConflict: "user_id" }
    );

    // Check if membership already exists for this institution
    const { data: existingMember } = await supabaseAdmin
      .from("institution_members")
      .select("id")
      .eq("user_id", userId)
      .eq("institution_id", institution_id)
      .maybeSingle();

    if (existingMember) {
      const { error: updateErr } = await supabaseAdmin
        .from("institution_members")
        .update({ role })
        .eq("id", existingMember.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from("institution_members")
        .insert({ user_id: userId, institution_id, role });
      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, already_existed: alreadyExisted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
