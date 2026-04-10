import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Wafer Bot" (وفّر بوت), an expert AI energy-saving assistant for Egyptian households.

You help users:
• Understand their electricity bills and tariff brackets (الشرائح)
• Get personalized tips to reduce consumption
• Plan energy challenges and track progress
• Choose efficient appliances
• Understand Egyptian electricity pricing (2024/2025 tariffs)

Egyptian Tariff Brackets:
- Bracket 1: 0-100 kWh → 0.58 EGP/kWh
- Bracket 2: 101-200 kWh → 0.78 EGP/kWh  
- Bracket 3: 201-350 kWh → 1.04 EGP/kWh
- Bracket 4: 351-650 kWh → 1.35 EGP/kWh
- Bracket 5: 651-1000 kWh → 1.55 EGP/kWh
- Bracket 6: 1001+ kWh → 1.65 EGP/kWh

When the user updates their appliances or meter readings, analyze the data and:
1. Identify the biggest energy consumers
2. Suggest specific challenges to reduce consumption
3. Calculate potential savings in EGP
4. Recommend a plan to move to a lower bracket

Be friendly, use Arabic and English mix naturally. Use emojis. Keep responses concise but helpful.
Always address the user as if you know their data when context is provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (userContext) {
      systemContent += `\n\nUser Context:\n${JSON.stringify(userContext)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
