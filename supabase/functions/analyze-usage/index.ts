import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Egyptian tariff brackets for context
const TARIFF_BRACKETS = [
  { id: 1, maxKwh: 100, price: 0.58 },
  { id: 2, maxKwh: 200, price: 0.78 },
  { id: 3, maxKwh: 350, price: 1.04 },
  { id: 4, maxKwh: 650, price: 1.35 },
  { id: 5, maxKwh: 1000, price: 1.55 },
  { id: 6, maxKwh: Infinity, price: 1.65 },
];

// Challenge templates for smart selection
const CHALLENGE_TEMPLATES = {
  phantom_power: [
    { title: "Phantom Power Hunt", title_ar: "صيد الطاقة الشبح 👻", description: "Unplug all standby devices before sleeping for 7 days", total_days: 7, reward_points: 70 },
    { title: "Smart Plug Challenge", title_ar: "تحدي الفيشة الذكية 🔌", description: "Use power strips to cut phantom loads for 5 days", total_days: 5, reward_points: 50 },
  ],
  peak_usage: [
    { title: "Peak Shift Master", title_ar: "سيد تحويل الذروة ⏰", description: "Run heavy appliances after 11 PM for 7 days", total_days: 7, reward_points: 80 },
    { title: "Cool Night Washing", title_ar: "غسيل الليل البارد 🌙", description: "Only use washing machine after 10 PM for 5 days", total_days: 5, reward_points: 60 },
  ],
  ac_optimization: [
    { title: "24°C Challenge", title_ar: "تحدي الـ 24 درجة ❄️", description: "Keep AC at 24°C or higher for 7 days", total_days: 7, reward_points: 90 },
    { title: "Fan First Strategy", title_ar: "المروحة أولاً 🌀", description: "Use fan instead of AC for 3 hours daily for 5 days", total_days: 5, reward_points: 60 },
  ],
  lighting: [
    { title: "LED Revolution", title_ar: "ثورة الـ LED 💡", description: "Replace at least 3 bulbs with LED and track savings", total_days: 3, reward_points: 100 },
    { title: "Natural Light Day", title_ar: "يوم النور الطبيعي ☀️", description: "Use only natural light until sunset for 5 days", total_days: 5, reward_points: 50 },
  ],
  water_heater: [
    { title: "Heater Timer Pro", title_ar: "برو تايمر السخان 🔥", description: "Limit water heater to 30 min before shower only for 7 days", total_days: 7, reward_points: 80 },
  ],
  general: [
    { title: "Meter Reading Habit", title_ar: "عادة قراءة العداد 📊", description: "Record your meter reading daily for 7 days", total_days: 7, reward_points: 40 },
    { title: "Energy Detective", title_ar: "محقق الطاقة 🔍", description: "Find and eliminate 3 energy waste sources this week", total_days: 7, reward_points: 70 },
    { title: "Family Energy Meeting", title_ar: "اجتماع العائلة للطاقة 👨‍👩‍👧‍👦", description: "Discuss energy saving with family and set 3 rules for 5 days", total_days: 5, reward_points: 50 },
  ],
};

function analyzeConsumptionPatterns(appliances: any[], readings: any[], history: any[]) {
  const patterns: string[] = [];
  const detectedIssues: string[] = [];
  const suggestedCategories: string[] = [];

  // Detect phantom power devices (devices with low wattage but 24h usage)
  const phantomDevices = appliances.filter((a: any) => a.hours_per_day >= 20 && a.wattage < 200);
  if (phantomDevices.length > 0) {
    detectedIssues.push(`PHANTOM_POWER: ${phantomDevices.map((d: any) => d.name).join(", ")} running 24/7`);
    suggestedCategories.push("phantom_power");
  }

  // Detect high AC usage
  const acDevices = appliances.filter((a: any) =>
    a.name.toLowerCase().includes("air") || a.name.toLowerCase().includes("ac") ||
    a.name_ar?.includes("تكييف") || a.wattage >= 1200
  );
  const totalAcKwh = acDevices.reduce((s: number, a: any) => s + (a.wattage * a.hours_per_day * 30) / 1000, 0);
  if (totalAcKwh > 200) {
    detectedIssues.push(`HIGH_AC: AC consuming ~${Math.round(totalAcKwh)} kWh/month`);
    suggestedCategories.push("ac_optimization");
  }

  // Detect water heater waste
  const heaters = appliances.filter((a: any) =>
    a.name.toLowerCase().includes("heater") || a.name_ar?.includes("سخان")
  );
  if (heaters.some((h: any) => h.hours_per_day > 2)) {
    detectedIssues.push("HEATER_WASTE: Water heater running > 2 hours/day");
    suggestedCategories.push("water_heater");
  }

  // Detect high lighting usage
  const lights = appliances.filter((a: any) =>
    a.name.toLowerCase().includes("light") || a.name_ar?.includes("إضاءة") || a.name_ar?.includes("لمبة")
  );
  if (lights.some((l: any) => l.hours_per_day > 10)) {
    detectedIssues.push("EXCESSIVE_LIGHTING: Lights on > 10 hours/day");
    suggestedCategories.push("lighting");
  }

  // Analyze usage trend from history
  if (history.length >= 2) {
    const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const change = ((last.kwh_usage - prev.kwh_usage) / prev.kwh_usage) * 100;
    if (change > 10) {
      patterns.push(`USAGE_SPIKE: ${Math.round(change)}% increase from ${prev.month} to ${last.month}`);
      suggestedCategories.push("peak_usage");
    } else if (change < -10) {
      patterns.push(`GOOD_TREND: ${Math.round(Math.abs(change))}% decrease`);
    }
  }

  // Calculate total consumption and bracket
  const totalKwh = appliances.reduce((s: number, a: any) => s + (a.wattage * a.hours_per_day * 30) / 1000, 0);
  const bracket = TARIFF_BRACKETS.find(b => totalKwh <= b.maxKwh) || TARIFF_BRACKETS[5];
  const nextBracketDown = TARIFF_BRACKETS[bracket.id - 2];
  if (nextBracketDown) {
    const kwhToSave = totalKwh - nextBracketDown.maxKwh;
    if (kwhToSave > 0 && kwhToSave < 100) {
      patterns.push(`BRACKET_CLOSE: Only ${Math.round(kwhToSave)} kWh away from cheaper bracket ${bracket.id - 1}`);
    }
  }

  if (suggestedCategories.length === 0) suggestedCategories.push("general");

  return { patterns, detectedIssues, suggestedCategories, totalKwh, bracketId: bracket.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // Fetch all user data
    const [appliancesRes, readingsRes, challengesRes, profileRes, historyRes] = await Promise.all([
      supabase.from("user_appliances").select("*").eq("user_id", user.id),
      supabase.from("meter_readings").select("*").eq("user_id", user.id).order("reading_date", { ascending: false }).limit(10),
      supabase.from("user_challenges").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("usage_history").select("*").eq("user_id", user.id).order("month", { ascending: true }),
    ]);

    const appliances = appliancesRes.data || [];
    const readings = readingsRes.data || [];
    const allChallenges = challengesRes.data || [];
    const activeChallenges = allChallenges.filter((c: any) => c.status === "active");
    const completedCount = allChallenges.filter((c: any) => c.status === "completed").length;
    const history = historyRes.data || [];
    const profile = profileRes.data;

    // Smart analysis
    const analysis = analyzeConsumptionPatterns(appliances, readings, history);

    // Pick challenge templates based on detected issues
    const existingTitles = new Set(allChallenges.map((c: any) => c.title));
    const candidateChallenges: any[] = [];
    for (const category of analysis.suggestedCategories) {
      const templates = CHALLENGE_TEMPLATES[category as keyof typeof CHALLENGE_TEMPLATES] || CHALLENGE_TEMPLATES.general;
      for (const t of templates) {
        if (!existingTitles.has(t.title) && candidateChallenges.length < 3) {
          candidateChallenges.push(t);
        }
      }
    }

    // If we have enough local templates, skip AI. Otherwise, ask AI for custom ones.
    let finalChallenges = candidateChallenges.slice(0, 2);
    let chatMessage = "";

    if (candidateChallenges.length === 0 || appliances.length > 3) {
      // Use AI for personalized challenges
      const prompt = `أنت محلل طاقة ذكي لتطبيق "وفّر" في مصر. حلل بيانات المستخدم وقدم تحديات مخصصة.

بيانات المستخدم:
- الأجهزة: ${JSON.stringify(appliances.map((a: any) => ({ name: a.name_ar || a.name, wattage: a.wattage, hours: a.hours_per_day })))}
- إجمالي الاستهلاك: ~${Math.round(analysis.totalKwh)} kWh/شهر (شريحة ${analysis.bracketId})
- تحديات مكتملة: ${completedCount}
- مشاكل مكتشفة: ${JSON.stringify(analysis.detectedIssues)}
- أنماط: ${JSON.stringify(analysis.patterns)}
- تحديات حالية: ${activeChallenges.map((c: any) => c.title).join(", ") || "لا يوجد"}

المطلوب: اقترح 1-2 تحديات جديدة مخصصة لهذا المستخدم. ركز على أكبر فرصة توفير.
التحديات يجب أن تكون عملية وقابلة للقياس.

رد بـ JSON فقط (بدون markdown):
{
  "challenges": [
    { "title": "English title", "title_ar": "عنوان عربي", "description": "وصف عملي", "reward_points": 50, "total_days": 7 }
  ],
  "chatMessage": "رسالة ودية للمستخدم بالعربيزي عن خطة التوفير الجديدة (استخدم إيموجي)"
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

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let content = aiData.choices?.[0]?.message?.content || "";
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        try {
          const parsed = JSON.parse(content);
          if (parsed.challenges?.length) {
            finalChallenges = parsed.challenges.filter((c: any) => !existingTitles.has(c.title)).slice(0, 2);
          }
          chatMessage = parsed.chatMessage || "";
        } catch {
          console.error("Failed to parse AI response:", content);
        }
      }
    }

    // Build chat message from templates if AI didn't provide one
    if (!chatMessage && finalChallenges.length > 0) {
      const issuesSummary = analysis.detectedIssues.length > 0
        ? `🔍 اكتشفت كذا حاجة:\n${analysis.detectedIssues.map(i => `• ${i}`).join("\n")}\n\n`
        : "";
      chatMessage = `${issuesSummary}📋 خطة توفير جديدة ليك!\n\n${finalChallenges.map((c: any) => `🎯 **${c.title_ar}** - ${c.description} (+${c.reward_points} نقطة)`).join("\n\n")}\n\nيلا نبدأ! 💪⚡`;
    }

    // Insert challenges
    if (finalChallenges.length > 0) {
      const toInsert = finalChallenges.map((c: any) => ({
        user_id: user.id,
        title: c.title,
        title_ar: c.title_ar,
        description: c.description,
        reward_points: c.reward_points || 50,
        total_days: c.total_days || 7,
      }));
      await supabase.from("user_challenges").insert(toInsert);
    }

    // Send chat message
    if (chatMessage) {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: chatMessage,
      });
    }

    return new Response(JSON.stringify({
      analysis: analysis,
      newChallenges: finalChallenges,
      message: chatMessage,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
