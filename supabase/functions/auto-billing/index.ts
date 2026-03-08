import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Auto-billing edge function:
 * - Generates monthly invoices for active subscriptions
 * - Marks overdue invoices
 * - Suspends institutions that are >30 days overdue
 * 
 * Call this function via a cron job or manually from the admin panel.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = { invoices_created: 0, overdue_marked: 0, suspended: 0, errors: [] as string[] };
    const now = new Date();

    // 1. Fetch active subscriptions with their plans
    const { data: subscriptions, error: subErr } = await supabase
      .from("institution_subscriptions")
      .select("*, subscription_plans(*), institutions(id, name, status)")
      .in("status", ["active", "trial"]);

    if (subErr) throw subErr;

    for (const sub of subscriptions || []) {
      try {
        const plan = sub.subscription_plans as any;
        const institution = sub.institutions as any;
        if (!plan || !institution) continue;

        // Check if invoice already created this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("id")
          .eq("institution_id", sub.institution_id)
          .gte("created_at", monthStart)
          .maybeSingle();

        if (!existingInvoice && sub.status === "active") {
          // Generate invoice number
          const { data: invNum } = await supabase.rpc("generate_invoice_number", {
            p_institution_id: sub.institution_id,
          });

          const amount = sub.billing_cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + 15);

          await supabase.from("invoices").insert({
            institution_id: sub.institution_id,
            subscription_id: sub.id,
            invoice_number: invNum,
            amount,
            currency: "USD",
            status: "pending",
            due_date: dueDate.toISOString().split("T")[0],
            billing_period_start: monthStart,
            billing_period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
            line_items: [{ description: `${plan.name} Plan - ${sub.billing_cycle}`, amount }],
          });
          results.invoices_created++;
        }
      } catch (e: any) {
        results.errors.push(`Sub ${sub.id}: ${e.message}`);
      }
    }

    // 2. Mark overdue invoices (past due date and still pending)
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, institution_id, due_date")
      .eq("status", "pending")
      .lt("due_date", now.toISOString().split("T")[0]);

    for (const inv of overdueInvoices || []) {
      await supabase.from("invoices").update({ status: "overdue" }).eq("id", inv.id);
      results.overdue_marked++;
    }

    // 3. Suspend institutions with overdue invoices > 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: longOverdue } = await supabase
      .from("invoices")
      .select("institution_id, due_date")
      .eq("status", "overdue")
      .lt("due_date", thirtyDaysAgo.toISOString().split("T")[0]);

    const toSuspend = [...new Set((longOverdue || []).map((i) => i.institution_id))];
    for (const instId of toSuspend) {
      await supabase.from("institutions").update({ status: "suspended" }).eq("id", instId);
      await supabase.from("institution_subscriptions")
        .update({ status: "suspended", suspended_at: now.toISOString(), suspension_reason: "Non-payment (30+ days overdue)" })
        .eq("institution_id", instId);
      results.suspended++;

      await supabase.from("activity_logs").insert({
        institution_id: instId,
        action: "auto_suspended",
        entity_type: "institution",
        new_data: { reason: "Non-payment", suspended_at: now.toISOString() },
      });
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
