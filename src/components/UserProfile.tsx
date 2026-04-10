import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUsageHistory, useAchievements, useChallenges, useAppliances } from "@/hooks/useUserData";
import { getRank, calculateBill, calculateApplianceMonthlyKwh } from "@/lib/tariff";
import { LogOut, Trophy, Zap, Star, TrendingDown, Award, Bell } from "lucide-react";
import { requestNotificationPermission } from "@/lib/notifications";
import { toast } from "sonner";

export function UserProfile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: history } = useUsageHistory();
  const { data: achievements } = useAchievements();
  const { data: challenges } = useChallenges();
  const { data: appliances } = useAppliances();

  const points = profile?.points || 0;
  const rank = getRank(points);

  const completedChallenges = challenges?.filter((c: any) => c.status === "completed").length || 0;
  const totalAppliances = appliances?.length || 0;

  const totalKwh = appliances?.reduce((sum: number, a: any) =>
    sum + calculateApplianceMonthlyKwh(Number(a.wattage), Number(a.hours_per_day)), 0
  ) || 0;
  const bill = calculateBill(totalKwh);

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) toast.success("تم تفعيل الإشعارات ✅");
    else toast.error("الإشعارات مش مفعلة في المتصفح");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full mx-auto bg-primary/10 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">⚡</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground mt-3">{profile?.display_name || user?.email?.split("@")[0]}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {rank.nameEn} ({rank.nameAr})
          </span>
          <span className="text-xs bg-energy-amber-light text-energy-amber px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Star className="w-3 h-3" /> {points} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-sm text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Trophy className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{completedChallenges}</p>
          <p className="text-xs text-muted-foreground">تحديات مكتملة</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Zap className="w-5 h-5 mx-auto text-energy-amber mb-1" />
          <p className="text-2xl font-bold text-foreground">{totalAppliances}</p>
          <p className="text-xs text-muted-foreground">أجهزة مسجلة</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <TrendingDown className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{Math.round(totalKwh)}</p>
          <p className="text-xs text-muted-foreground">kWh شهرياً</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Award className="w-5 h-5 mx-auto text-energy-amber mb-1" />
          <p className="text-2xl font-bold text-foreground">{Math.round(bill.totalBill)}</p>
          <p className="text-xs text-muted-foreground">EGP متوقعة</p>
        </div>
      </div>

      {achievements && achievements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">الإنجازات 🏆</h2>
          <div className="grid grid-cols-3 gap-2">
            {achievements.map((a: any) => (
              <div key={a.id} className="bg-card rounded-xl p-3 text-center shadow-sm">
                <span className="text-2xl">{a.icon}</span>
                <p className="text-xs font-medium text-foreground mt-1">{a.title_ar || a.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">سجل الاستهلاك 📊</h2>
          <div className="space-y-2">
            {history.map((h: any) => (
              <div key={h.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                <div>
                  <p className="text-sm font-medium text-foreground">{h.month}</p>
                  <p className="text-xs text-muted-foreground">{Number(h.kwh_usage)} kWh</p>
                </div>
                {h.bill_amount && (
                  <span className="text-sm font-semibold text-primary">{Number(h.bill_amount)} EGP</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={enableNotifications}
          className="w-full py-3 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4" /> تفعيل الإشعارات
        </button>
        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
