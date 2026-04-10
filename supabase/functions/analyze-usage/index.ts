import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user data
    const [appliancesRes, readingsRes, challengesRes, profileRes] = await Promise.all([
      supabase.from("user_appliances").select("*").eq("user_id", user.id),
      supabase.from("meter_readings").select("*").eq("user_id", user.id).order("reading_date", { ascending: false }).limit(5),
      supabase.from("user_challenges").select("*").eq("user_id", user.id).eq("status", "active"),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    const userContext = {
      appliances: appliancesRes.data || [],
      recentReadings: readingsRes.data || [],
      activeChallenges: challengesRes.data || [],
      profile: profileRes.data,
    };

    // Ask AI to analyze and suggest new challenges
    const prompt = `Based on this user's energy data, analyze their consumption and suggest 1-2 NEW personalized challenges.

User Data:
${JSON.stringify(userContext, null, 2)}

Respond in this JSON format ONLY (no markdown):
{
  "analysis": "Brief analysis in Arabic/English mix",
  "suggestedChallenges": [
    {
      "title": "Challenge title in English",
      "title_ar": "عنوان التحدي بالعربي",
      "description": "What to do",
      "reward_points": 50,
      "total_days": 7
    }
  ],
  "chatMessage": "A friendly message to send to the user about their new plan (Arabic/English mix, use emojis)"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an energy analysis AI. Respond ONLY with valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { analysis: content, suggestedChallenges: [], chatMessage: content };
    }

    // Insert suggested challenges
    if (result.suggestedChallenges?.length > 0) {
      const challengesToInsert = result.suggestedChallenges.map((c: any) => ({
        user_id: user.id,
        title: c.title,
        title_ar: c.title_ar,
        description: c.description,
        reward_points: c.reward_points || 50,
        total_days: c.total_days || 7,
      }));
      await supabase.from("user_challenges").insert(challengesToInsert);
    }

    // Insert chat message about the plan
    if (result.chatMessage) {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: result.chatMessage,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
