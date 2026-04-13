import { Target, Star, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Mission {
  title: string;
  title_ar: string;
  description: string;
  reward_points: number;
  total_days: number;
}

export function DailyMission() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayKey = `daily_mission_${new Date().toISOString().slice(0, 10)}`;

  const fetchMission = useCallback(async () => {
    if (!user) return;

    // Check if we have a cached mission for today
    const cachedMission = localStorage.getItem(`${todayKey}_mission_${user.id}`);
    if (cachedMission) {
      try {
        setMission(JSON.parse(cachedMission));
        setLoading(false);
        return;
      } catch {}
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-daily-mission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ type: "daily" }),
      });

      if (!resp.ok) throw new Error("Failed to fetch mission");

      const data = await resp.json();
      if (data.mission) {
        setMission(data.mission);
        localStorage.setItem(`${todayKey}_mission_${user.id}`, JSON.stringify(data.mission));
      }
    } catch (e) {
      console.error("Failed to fetch daily mission:", e);
      setMission({
        title: "Energy Awareness",
        title_ar: "وعي الطاقة ⚡",
        description: "Note your meter reading today",
        reward_points: 15,
        total_days: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [user, todayKey]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  const generateAndSetNewMission = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-daily-mission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ type: "daily" }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.mission) {
          setMission(data.mission);
          localStorage.setItem(`${todayKey}_mission_${user!.id}`, JSON.stringify(data.mission));
          
        }
      }
    } catch (e) {
      console.error("Failed to generate new mission:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user || saving || !mission) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("user_challenges").insert({
        user_id: user.id,
        title: mission.title,
        title_ar: mission.title_ar,
        description: `Daily mission - ${mission.description}`,
        reward_points: mission.reward_points,
        total_days: 1,
        progress_days: 1,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["challenges"] });

      toast.success(`🎉 +${mission.reward_points} نقطة! أحسنت يا بطل!`);

      // Immediately generate a new mission instead of showing empty/completed state
      localStorage.removeItem(`${todayKey}_mission_${user.id}`);
      await generateAndSetNewMission();
    } catch (e) {
      console.error("Failed to save daily mission:", e);
      toast.error("حصل مشكلة، جرب تاني");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl p-5 gradient-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">جاري تحضير التحدي اليومي...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 gradient-primary text-primary-foreground shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5" />
        <h3 className="font-bold text-sm">Daily Mission</h3>
        <div className="ml-auto flex items-center gap-1 text-xs opacity-90">
          <Star className="w-3.5 h-3.5" />
          <span>+{mission?.reward_points || 0} pts</span>
        </div>
      </div>
      {mission && (
        <>
          <p className="text-sm font-medium mb-1">{mission.title}</p>
          <p className="text-xs opacity-80 mb-1" dir="rtl">{mission.title_ar}</p>
          <p className="text-xs opacity-70 mb-4">{mission.description}</p>
        </>
      )}
      <button
        onClick={handleComplete}
        disabled={saving}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all bg-primary-foreground/90 text-primary hover:bg-primary-foreground disabled:opacity-50"
      >
        {saving ? "⏳ جاري الحفظ..." : "Mark as Done ✅"}
      </button>
    </div>
  );
}
