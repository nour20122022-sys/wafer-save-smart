import { SavingGauge } from "./SavingGauge";
import { BracketAlert } from "./BracketAlert";
import { DailyMission } from "./DailyMission";
import { Zap } from "lucide-react";
import waferLogo from "@/assets/wafer-logo.png";

export function DashboardPage() {
  // Mock data — will come from backend later
  const currentKwh = 280;
  const previousKwh = 350;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img src={waferLogo} alt="Wafer" width={40} height={40} />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Wafer <span className="text-muted-foreground font-medium text-base">(وفّر)</span>
          </h1>
          <p className="text-xs text-muted-foreground">Save energy, save money</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-energy-green-light text-energy-green px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">340 pts</span>
        </div>
      </div>

      {/* Saving Gauge */}
      <div className="bg-card rounded-2xl p-6 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 text-center">This Month's Saving</h2>
        <SavingGauge currentKwh={currentKwh} previousKwh={previousKwh} />
      </div>

      {/* Bracket Alert */}
      <BracketAlert currentKwh={currentKwh} />

      {/* Daily Mission */}
      <DailyMission />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs text-muted-foreground">Est. Bill</p>
          <p className="text-2xl font-bold text-foreground mt-1">185 <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs text-muted-foreground">Daily Avg</p>
          <p className="text-2xl font-bold text-foreground mt-1">9.3 <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
        </div>
      </div>
    </div>
  );
}
