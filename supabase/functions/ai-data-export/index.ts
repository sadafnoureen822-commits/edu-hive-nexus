import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, data } = await req.json();

    if (!prompt || !data) {
      return new Response(JSON.stringify({ error: "Missing prompt or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a data assistant. You receive raw portal data as JSON and a user prompt/query. 
Your job is to:
1. Understand what the user wants from the data
2. Filter, summarize, or transform the data based on the prompt
3. Return a JSON array of plain objects with string/number values suitable for spreadsheet export.
4. Each object represents one row. Use clear, human-readable column names.
5. If the user asks for a summary/report, include a summary row at the end.
6. ALWAYS return valid JSON array only — no explanation, no markdown, no code blocks.
7. If no data matches, return [{"Message": "No data found matching your query"}].`;

    const userMessage = `User query: "${prompt}"

Available data:
${JSON.stringify(data, null, 2).slice(0, 8000)}

Return only a JSON array of objects for export.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `AI error: ${err}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const rawText = aiResponse.choices?.[0]?.message?.content ?? "[]";

    // Clean the response — strip markdown code blocks if present
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>[];
    try {
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) parsed = [{ Result: cleaned }];
    } catch {
      parsed = [{ Result: "Could not parse AI response. Raw: " + cleaned.slice(0, 200) }];
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
