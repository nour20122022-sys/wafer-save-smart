import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAppliances() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["appliances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_appliances")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useSaveAppliance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appliance: { name: string; name_ar?: string; icon?: string; wattage: number; hours_per_day: number }) => {
      const { error } = await supabase.from("user_appliances").insert({
        user_id: user!.id,
        ...appliance,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appliances"] });
      triggerAnalysis();
    },
  });
}

export function useDeleteAppliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_appliances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appliances"] }),
  });
}

export function useUpdateApplianceHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hours_per_day }: { id: string; hours_per_day: number }) => {
      const { error } = await supabase.from("user_appliances").update({ hours_per_day }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appliances"] }),
  });
}

export function useMeterReadings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["meter_readings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("user_id", user!.id)
        .order("reading_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useSaveMeterReading() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reading: { reading_kwh: number; reading_date?: string }) => {
      const { error } = await supabase.from("meter_readings").insert({
        user_id: user!.id,
        ...reading,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meter_readings"] });
      triggerAnalysis();
    },
  });
}

export function useUsageHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["usage_history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("month", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useChallenges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["challenges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useUpdateChallengeProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, progress_days, status }: { id: string; progress_days: number; status?: string }) => {
      const updates: any = { progress_days };
      if (status) {
        updates.status = status;
        if (status === "completed") updates.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("user_challenges").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });
}

export function useAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["achievements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user!.id)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useChatMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat_messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

async function triggerAnalysis() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({}),
    });
  } catch (e) {
    console.error("Analysis trigger failed:", e);
  }
}
