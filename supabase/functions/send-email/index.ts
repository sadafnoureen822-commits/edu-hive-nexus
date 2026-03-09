import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const {
      institution_id,
      sent_by,
      recipient_email,
      recipient_name,
      subject,
      body,
      audience,
      from_name = "EduHive Nexus",
      from_email = "notifications@eduhive.app",
    } = await req.json();

    // Validate inputs
    if (!institution_id || !recipient_email || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: institution_id, recipient_email, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (subject.length > 500 || body.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Subject or body exceeds maximum length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert log entry first
    const { data: log, error: logErr } = await supabase
      .from("email_logs")
      .insert({
        institution_id,
        sent_by: sent_by ?? null,
        recipient_email,
        recipient_name: recipient_name ?? null,
        subject,
        body,
        audience: audience ?? "individual",
        status: "pending",
      })
      .select()
      .single();

    if (logErr) throw logErr;

    if (!resendApiKey) {
      await supabase
        .from("email_logs")
        .update({ status: "failed", error_message: "RESEND_API_KEY not configured" })
        .eq("id", log.id);

      return new Response(
        JSON.stringify({ success: false, error: "Email API not configured. Please add RESEND_API_KEY secret." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${from_name} <${from_email}>`,
        to: recipient_name ? `${recipient_name} <${recipient_email}>` : recipient_email,
        subject,
        html: body.replace(/\n/g, "<br/>"),
        text: body,
      }),
    });

    const resendData = await resendResp.json();

    if (resendResp.ok && resendData.id) {
      await supabase
        .from("email_logs")
        .update({ status: "sent", message_id: resendData.id })
        .eq("id", log.id);

      return new Response(
        JSON.stringify({ success: true, log_id: log.id, message_id: resendData.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errMsg = resendData.message ?? resendData.name ?? "Unknown Resend error";
      await supabase
        .from("email_logs")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", log.id);

      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
