import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeChallenges() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user-challenges-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_challenges", filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["challenges"] });
          const c = payload.new as any;
          toast.info(`🎯 تحدي جديد: ${c.title_ar || c.title}`, { duration: 5000 });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_challenges", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["challenges"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "achievements", filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["achievements"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
          const a = payload.new as any;
          toast.success(`🏆 إنجاز جديد: ${a.title_ar || a.title}!`, { duration: 8000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);
}
