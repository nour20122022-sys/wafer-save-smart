import { getRank, RANKS } from "@/lib/tariff";
import { Trophy, Star, Gift, ChevronRight } from "lucide-react";

export function ChallengesPage() {
  const points = 340;
  const rank = getRank(points);
  const nextRank = RANKS.find((r) => r.minPoints > points);
  const progress = nextRank
    ? ((points - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100
    : 100;

  const rewards = [
    { brand: "Carrefour Egypt", discount: "10% off", points: 500, emoji: "🛒" },
    { brand: "B.TECH", discount: "15% off ACs", points: 800, emoji: "❄️" },
    { brand: "Uber Egypt", discount: "Free ride", points: 300, emoji: "🚗" },
    { brand: "Costa Coffee", discount: "Free drink", points: 200, emoji: "☕" },
  ];

  const challenges = [
    { title: "7-Day AC Challenge", desc: "Keep AC at 24°C for 7 days", reward: 100, days: 3, total: 7 },
    { title: "Unplug Week", desc: "Unplug 3 appliances daily", reward: 75, days: 5, total: 7 },
    { title: "Peak Hour Avoider", desc: "Reduce usage during peak hours", reward: 50, days: 1, total: 5 },
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
              <span>{rank.nameEn}</span>
              <span>{nextRank.nameEn}</span>
            </div>
            <div className="h-2.5 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-foreground/90 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs opacity-80 mt-1.5">
              {nextRank.minPoints - points} points to {nextRank.nameEn}
            </p>
          </div>
        )}
      </div>

      {/* Active Challenges */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Active Challenges</h2>
        <div className="space-y-2.5">
          {challenges.map((c, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-energy-green-light px-2 py-1 rounded-full">
                  +{c.reward} pts
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{c.days}/{c.total} days</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(c.days / c.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Catalog */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Rewards Catalog</h2>
        <div className="space-y-2.5">
          {rewards.map((r, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{r.brand}</p>
                <p className="text-xs text-muted-foreground">{r.discount}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3" />
                <span>{r.points}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
