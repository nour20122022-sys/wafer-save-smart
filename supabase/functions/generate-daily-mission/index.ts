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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type } = await req.json().catch(() => ({ type: "daily" }));

    // Always generate a new mission - no blocking

    // Fetch user data for personalization
    const [appliancesRes, readingsRes, challengesRes, profileRes] = await Promise.all([
      supabase.from("user_appliances").select("name, name_ar, wattage, hours_per_day").eq("user_id", user.id),
      supabase.from("meter_readings").select("reading_kwh, reading_date").eq("user_id", user.id).order("reading_date", { ascending: false }).limit(3),
      supabase.from("user_challenges").select("title, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("points, display_name").eq("user_id", user.id).single(),
    ]);

    const appliances = appliancesRes.data || [];
    const readings = readingsRes.data || [];
    const recentChallenges = challengesRes.data || [];
    const completedCount = recentChallenges.filter((c: any) => c.status === "completed").length;
    const recentTitles = recentChallenges.map((c: any) => c.title).join(", ");
    const profile = profileRes.data;

    const totalKwh = appliances.reduce((s: number, a: any) => s + (a.wattage * a.hours_per_day * 30) / 1000, 0);
    const today = new Date().toISOString().slice(0, 10);

    const missionType = type === "daily" ? "مهمة يومية قصيرة (يوم واحد)" : "تحدي جديد (3-7 أيام)";
    const pointsRange = type === "daily" ? "10-30" : "40-100";

    const prompt = `أنت محلل طاقة ذكي لتطبيق "وفّر" في مصر. اصنع ${missionType} مخصصة للمستخدم.

بيانات المستخدم:
- الأجهزة: ${JSON.stringify(appliances.map((a: any) => ({ name: a.name_ar || a.name, wattage: a.wattage, hours: a.hours_per_day })))}
- إجمالي الاستهلاك: ~${Math.round(totalKwh)} kWh/شهر
- آخر قراءات العداد: ${JSON.stringify(readings.map((r: any) => ({ kwh: r.reading_kwh, date: r.reading_date })))}
- تحديات مكتملة: ${completedCount}
- نقاط: ${profile?.points || 0}
- تاريخ اليوم: ${today}
- اليوم في الأسبوع: ${new Date().toLocaleDateString('en', { weekday: 'long' })}

تحديات سابقة (لا تكررها): ${recentTitles || "لا يوجد"}

المطلوب: اقترح ${type === "daily" ? "مهمة يومية واحدة فقط" : "تحدي واحد"} مخصص بناءً على بيانات المستخدم الفعلية.
- يجب أن يكون مختلف تماماً عن التحديات السابقة
- يجب أن يكون عملي وقابل للتطبيق في مصر
- النقاط بين ${pointsRange}
${type === "daily" ? "- total_days يجب أن يكون 1" : "- total_days بين 3 و 7"}

رد بـ JSON فقط (بدون markdown):
{
  "title": "English title",
  "title_ar": "عنوان عربي مع إيموجي",
  "description": "وصف عملي بالإنجليزي",
  "reward_points": number,
  "total_days": number
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "أنت محلل طاقة ذكي. رد بـ JSON صالح فقط بدون markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let mission;
    try {
      mission = JSON.parse(content);
    } catch {
      // Fallback mission
      mission = {
        title: "Energy Check",
        title_ar: "فحص الطاقة ⚡",
        description: "Check all standby devices and unplug unused ones",
        reward_points: 15,
        total_days: type === "daily" ? 1 : 5,
      };
    }

    return new Response(JSON.stringify({ mission, already_completed: false }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-daily-mission error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
