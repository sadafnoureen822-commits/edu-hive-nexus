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

    // Admin client using service role — can create users + bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify caller is a platform admin
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

    // Only platform admins can create users
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

    const pwd = password || (Math.random().toString(36).slice(-8) + "Aa1!");

    // Create the user with service role (does NOT affect caller session)
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: pwd,
      email_confirm: true,
      user_metadata: { full_name: full_name?.trim() ?? "" },
    });

    let userId: string;
    let alreadyExisted = false;

    if (createError) {
      // User might already exist — look them up by email using admin list with filter
      if (
        createError.message.toLowerCase().includes("already registered") ||
        createError.message.toLowerCase().includes("already exists") ||
        createError.message.toLowerCase().includes("unique constraint")
      ) {
        // Search by email using the filter parameter
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const normalizedEmail = email.trim().toLowerCase();
        const existing = listData?.users?.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );
        if (!existing) {
          // Fallback: try page 2+ (shouldn't be needed for most projects)
          return new Response(JSON.stringify({ error: "User already exists but could not be located. Please assign role manually." }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = existing.id;
        alreadyExisted = true;
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = newUserData.user!.id;
    }

    // Upsert profile
    await supabaseAdmin.from("profiles").upsert(
      { user_id: userId, full_name: full_name?.trim() ?? "" },
      { onConflict: "user_id" }
    );

    // Upsert institution membership
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
