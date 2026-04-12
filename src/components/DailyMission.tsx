import { DAILY_MISSIONS } from "@/lib/tariff";
import { Target, Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useUserData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function DailyMission() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const mission = useMemo(() => {
    const today = new Date().getDate();
    return DAILY_MISSIONS[today % DAILY_MISSIONS.length];
  }, []);

  const todayKey = `daily_mission_${new Date().toISOString().slice(0, 10)}`;
  const [completed, setCompleted] = useState(() => {
    if (!user) return false;
    return localStorage.getItem(`${todayKey}_${user.id}`) === "done";
  });
  const [saving, setSaving] = useState(false);

  // Sync with localStorage when user changes
  useEffect(() => {
    if (user) {
      setCompleted(localStorage.getItem(`${todayKey}_${user.id}`) === "done");
    }
  }, [user, todayKey]);

  const handleComplete = async () => {
    if (!user || completed || saving) return;
    setSaving(true);

    try {
      // Insert as a completed challenge
      const { error: challengeError } = await supabase.from("user_challenges").insert({
        user_id: user.id,
        title: mission.textEn,
        title_ar: mission.textAr,
        description: `Daily mission - ${mission.textEn}`,
        reward_points: mission.points,
        total_days: 1,
        progress_days: 1,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      if (challengeError) throw challengeError;

      // The DB trigger `check_challenge_milestones` will add points automatically
      // But for daily missions we also want immediate feedback, so update points directly
      // (The trigger handles milestone bonuses on top of this)

      localStorage.setItem(`${todayKey}_${user.id}`, "done");
      setCompleted(true);

      // Invalidate queries to refresh points everywhere
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["challenges"] });

      toast.success(`🎉 +${mission.points} نقطة! أحسنت يا بطل!`);
    } catch (e) {
      console.error("Failed to save daily mission:", e);
      toast.error("حصل مشكلة، جرب تاني");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl p-5 gradient-primary text-primary-foreground shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5" />
        <h3 className="font-bold text-sm">Daily Mission</h3>
        <div className="ml-auto flex items-center gap-1 text-xs opacity-90">
          <Star className="w-3.5 h-3.5" />
          <span>+{mission.points} pts</span>
        </div>
      </div>
      <p className="text-sm font-medium mb-1">{mission.textEn}</p>
      <p className="text-xs opacity-80 mb-4" dir="rtl">{mission.textAr}</p>
      <button
        onClick={handleComplete}
        disabled={completed || saving}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          completed
            ? "bg-primary-foreground/20 cursor-default"
            : "bg-primary-foreground/90 text-primary hover:bg-primary-foreground"
        }`}
      >
        {saving ? "⏳ جاري الحفظ..." : completed ? "✅ Completed!" : "Mark as Done"}
      </button>
    </div>
  );
}
