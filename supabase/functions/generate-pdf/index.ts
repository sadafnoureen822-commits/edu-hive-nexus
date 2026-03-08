import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Renders a certificate or report card to HTML, then returns it for client-side printing.
// For full server-side PDF, integrate a headless browser service here.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, id } = await req.json();

    if (type === "certificate") {
      const { data: cert, error } = await supabase
        .from("issued_certificates")
        .select("*, certificate_templates(*), institutions(name, logo_url)")
        .eq("id", id)
        .single();
      if (error || !cert) throw new Error("Certificate not found");

      const certData = cert.certificate_data as Record<string, string> || {};
      let html = cert.certificate_templates?.template_html || "<div>Certificate</div>";

      // Replace template variables
      Object.entries(certData).forEach(([key, val]) => {
        html = html.replaceAll(`{{${key}}}`, String(val));
      });
      html = html.replaceAll("{{serial_number}}", cert.serial_number);
      html = html.replaceAll("{{institution_name}}", (cert.institutions as any)?.name || "");
      html = html.replaceAll("{{issued_date}}", new Date(cert.issued_at).toLocaleDateString());

      const fullHtml = `<!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Certificate - ${cert.serial_number}</title>
        <style>
          body { font-family: Georgia, serif; margin: 0; padding: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${html}</body></html>`;

      return new Response(JSON.stringify({ html: fullHtml, serial: cert.serial_number }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "report_card") {
      // Fetch exam results for a student
      const { data: marks, error } = await supabase
        .from("student_marks")
        .select(`
          *,
          exam_subjects(*, subjects(name, code), exams(name, exam_type, classes(name)))
        `)
        .eq("student_id", id)
        .eq("status", "approved");

      if (error) throw error;

      const rows = (marks || []).map((m: any) => `
        <tr>
          <td>${m.exam_subjects?.subjects?.name || ""}</td>
          <td>${m.exam_subjects?.subjects?.code || ""}</td>
          <td>${m.theory_marks ?? "-"}</td>
          <td>${m.practical_marks ?? "-"}</td>
          <td>${m.total_marks ?? "-"} / ${m.exam_subjects?.total_marks ?? "-"}</td>
          <td>${m.is_absent ? "Absent" : (m.total_marks >= m.exam_subjects?.passing_marks ? "Pass" : "Fail")}</td>
        </tr>`).join("");

      const html = `<!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Report Card</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width:100%; border-collapse: collapse; }
          th, td { border:1px solid #ccc; padding: 8px; text-align:left; }
          th { background:#f0f0f0; }
        </style>
      </head><body>
        <h2>Report Card</h2>
        <table>
          <thead><tr><th>Subject</th><th>Code</th><th>Theory</th><th>Practical</th><th>Total</th><th>Result</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`;

      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid type. Use 'certificate' or 'report_card'");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
