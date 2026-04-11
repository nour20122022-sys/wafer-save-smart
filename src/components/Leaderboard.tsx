import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Crown } from "lucide-react";

export function Leaderboard() {
  const { data: topUsers, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, points, avatar_url")
        .order("points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const icons = [
    <Crown className="w-5 h-5 text-yellow-500" />,
    <Medal className="w-5 h-5 text-gray-400" />,
    <Medal className="w-5 h-5 text-amber-700" />,
  ];

  if (isLoading) return <div className="text-center py-3 text-sm text-muted-foreground">جاري التحميل...</div>;
  if (!topUsers?.length) return null;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">لوحة أكثر الموفرين 🏆</h3>
      </div>
      <div className="space-y-2">
        {topUsers.map((u: any, i: number) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? "bg-primary/10" : "bg-muted/50"}`}>
            <span className="w-6 text-center font-bold text-sm text-muted-foreground">
              {i < 3 ? icons[i] : `${i + 1}`}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">⚡</span>
              )}
            </div>
            <span className="text-sm font-medium text-foreground flex-1 truncate">
              {u.display_name || "مستخدم"}
            </span>
            <span className="text-xs font-semibold text-primary">{u.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
