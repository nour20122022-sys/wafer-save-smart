import { getRankByChallenges, RANKS } from "@/lib/tariff";
import { Trophy, Star, Gift, ChevronRight, CheckCircle } from "lucide-react";
import { useProfile, useChallenges, useUpdateChallengeProgress, useAchievements } from "@/hooks/useUserData";
import { toast } from "sonner";

export function ChallengesPage() {
  const { data: profile } = useProfile();
  const { data: challenges, isLoading } = useChallenges();
  const { data: achievements } = useAchievements();
  const updateProgress = useUpdateChallengeProgress();

  const points = profile?.points || 0;
  const rank = getRank(points);
  const nextRank = RANKS.find((r) => r.minPoints > points);
  const progress = nextRank ? ((points - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100 : 100;

  const activeChallenges = challenges?.filter((c: any) => c.status === "active") || [];
  const completedChallenges = challenges?.filter((c: any) => c.status === "completed") || [];

  const handleProgress = (challenge: any) => {
    const newProgress = challenge.progress_days + 1;
    const isComplete = newProgress >= challenge.total_days;
    updateProgress.mutate({
      id: challenge.id,
      progress_days: newProgress,
      status: isComplete ? "completed" : undefined,
    }, {
      onSuccess: () => {
        if (isComplete) toast.success(`🎉 أحسنت! أكملت تحدي "${challenge.title}"! +${challenge.reward_points} نقطة`);
        else toast.success(`يوم ${newProgress}/${challenge.total_days} ✅`);
      },
    });
  };

  const rewards = [
    { brand: "Carrefour Egypt", discount: "10% off", points: 500, emoji: "🛒" },
    { brand: "B.TECH", discount: "15% off ACs", points: 800, emoji: "❄️" },
    { brand: "Uber Egypt", discount: "Free ride", points: 300, emoji: "🚗" },
    { brand: "Costa Coffee", discount: "Free drink", points: 200, emoji: "☕" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Challenges & Rewards</h1>
        <p className="text-sm text-muted-foreground">Earn points, level up, win rewards</p>
      </div>

      {/* Rank Card */}
      <div className="gradient-primary rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8" />
          <div>
            <p className="text-xs opacity-80">Current Rank</p>
            <p className="text-lg font-bold">{rank.nameEn} ({rank.nameAr})</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span className="font-bold">{points}</span>
          </div>
        </div>
        {nextRank && (
          <div>
            <div className="flex justify-between text-xs opacity-80 mb-1">
              <span>{rank.nameEn}</span><span>{nextRank.nameEn}</span>
            </div>
            <div className="h-2.5 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary-foreground/90 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs opacity-80 mt-1.5">{nextRank.minPoints - points} points to {nextRank.nameEn}</p>
          </div>
        )}
      </div>

      {/* Active Challenges */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Active Challenges</h2>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
        ) : activeChallenges.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            لسه مفيش تحديات. أضف أجهزتك في الحاسبة والذكاء الاصطناعي هيقترح تحديات مخصصة ليك! 🤖
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeChallenges.map((c: any) => (
              <div key={c.id} className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.title_ar || c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                  <span className="text-xs font-medium text-primary bg-energy-green-light px-2 py-1 rounded-full">+{c.reward_points} pts</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span><span>{c.progress_days}/{c.total_days} days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(c.progress_days / c.total_days) * 100}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => handleProgress(c)}
                  disabled={updateProgress.isPending}
                  className="mt-3 w-full py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                  سجّل يوم ✅
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Completed 🎉</h2>
          <div className="space-y-2">
            {completedChallenges.slice(0, 3).map((c: any) => (
              <div key={c.id} className="bg-energy-green-light rounded-xl p-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{c.title_ar || c.title}</span>
                <span className="ml-auto text-xs text-primary font-medium">+{c.reward_points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Achievements 🏆</h2>
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

      {/* Rewards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Rewards Catalog</h2>
        <div className="space-y-2.5">
          {rewards.map((r, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{r.brand}</p>
                <p className="text-xs text-muted-foreground">{r.discount}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3" /><span>{r.points}</span><ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
