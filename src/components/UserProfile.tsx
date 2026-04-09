import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, History, Zap } from "lucide-react";

export function UserProfile() {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
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

  const { data: history } = useQuery({
    queryKey: ["usage_history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user || !profile) return null;

  const initials = (profile.display_name || profile.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">حسابي</h1>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-5 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{profile.display_name}</p>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            <div className="flex items-center gap-1 mt-1 text-primary">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">{profile.points} نقطة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">سجل الاستهلاك</h2>
        </div>
        {history && history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="bg-card rounded-xl p-4 shadow-sm flex items-center justify-between"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{h.month}</p>
                  <p className="text-xs text-muted-foreground">الشريحة {h.bracket_id || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{h.kwh_usage} kWh</p>
                  {h.bill_amount && (
                    <p className="text-xs text-muted-foreground">{h.bill_amount} EGP</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 text-center shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">مفيش سجل استهلاك لسة</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ بإدخال قراءة العداد من صفحة الحاسبة</p>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <Button onClick={signOut} variant="outline" className="w-full gap-2">
        <LogOut className="w-4 h-4" />
        تسجيل الخروج
      </Button>
    </div>
  );
}
