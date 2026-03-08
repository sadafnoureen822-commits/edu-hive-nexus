import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { institution_id, recipient_ids, title, message, type = "info", channel = "in_app", metadata = {} } =
      await req.json();

    if (!institution_id || !recipient_ids?.length || !title || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = recipient_ids.map((rid: string) => ({
      institution_id,
      recipient_id: rid,
      title,
      message,
      type,
      channel,
      metadata,
    }));

    const { data, error } = await supabase.from("notifications").insert(rows).select("id");
    if (error) throw error;

    // Log activity
    await supabase.from("activity_logs").insert({
      institution_id,
      action: "sent_notification",
      entity_type: "notification",
      new_data: { recipient_count: recipient_ids.length, title, channel },
    });

    return new Response(JSON.stringify({ success: true, count: data.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
