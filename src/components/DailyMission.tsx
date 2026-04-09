import { DAILY_MISSIONS } from "@/lib/tariff";
import { Target, Star } from "lucide-react";
import { useState, useMemo } from "react";

export function DailyMission() {
  const mission = useMemo(() => {
    const today = new Date().getDate();
    return DAILY_MISSIONS[today % DAILY_MISSIONS.length];
  }, []);

  const [completed, setCompleted] = useState(false);

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
        onClick={() => setCompleted(true)}
        disabled={completed}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          completed
            ? "bg-primary-foreground/20 cursor-default"
            : "bg-primary-foreground/90 text-primary hover:bg-primary-foreground"
        }`}
      >
        {completed ? "✅ Completed!" : "Mark as Done"}
      </button>
    </div>
  );
}
