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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { log_id, phone, message, institution_id } = await req.json();

    if (!whatsappToken || !whatsappPhoneId) {
      // Update log as failed - API not configured
      await supabase
        .from("whatsapp_logs")
        .update({ status: "failed", error_message: "WhatsApp API not configured. Please add WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets." })
        .eq("id", log_id);

      return new Response(
        JSON.stringify({ success: false, error: "WhatsApp API credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via WhatsApp Business API (Meta Cloud API)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone.replace(/\s+/g, "").replace(/^\+/, ""),
          type: "text",
          text: { preview_url: false, body: message },
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result.messages?.[0]?.id) {
      await supabase
        .from("whatsapp_logs")
        .update({ status: "sent", message_id: result.messages[0].id })
        .eq("id", log_id);
      return new Response(
        JSON.stringify({ success: true, message_id: result.messages[0].id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errMsg = result.error?.message || "Unknown WhatsApp API error";
      await supabase
        .from("whatsapp_logs")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", log_id);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("send-whatsapp error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
