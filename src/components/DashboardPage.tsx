import { SavingGauge } from "./SavingGauge";
import { BracketAlert } from "./BracketAlert";
import { DailyMission } from "./DailyMission";
import { Zap, Bell } from "lucide-react";
import waferLogo from "@/assets/wafer-logo.png";
import { useProfile, useUsageHistory, useAppliances, useMeterReadings } from "@/hooks/useUserData";
import { calculateApplianceMonthlyKwh, calculateBill } from "@/lib/tariff";
import { useEffect } from "react";
import { requestNotificationPermission, scheduleDailyReminder, checkBracketAlert } from "@/lib/notifications";

export function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: history } = useUsageHistory();
  const { data: appliances } = useAppliances();
  const { data: readings } = useMeterReadings();

  // Calculate from appliances if no history
  const totalKwh = appliances?.reduce((sum: number, a: any) =>
    sum + calculateApplianceMonthlyKwh(Number(a.wattage), Number(a.hours_per_day)), 0
  ) || 0;

  const currentKwh = readings?.[0] ? Number(readings[0].reading_kwh) : Math.round(totalKwh);
  const previousKwh = readings?.[1] ? Number(readings[1].reading_kwh) : Math.round(totalKwh * 1.2);

  const bill = calculateBill(currentKwh);
  const dailyAvg = currentKwh > 0 ? (currentKwh / 30).toFixed(1) : "0";

  // Request notification permission on first load
  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleDailyReminder();
        checkBracketAlert(currentKwh, [100, 200, 350, 650, 1000]);
      }
    });
  }, [currentKwh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-energy-green-light text-energy-green px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Your PTS: {profile?.points || 0}</span>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-foreground">
            {profile?.display_name ? `أهلاً ${profile.display_name}` : "Wafer"} <span className="text-muted-foreground font-medium text-base">(وفّر)</span>
          </h1>
          <p className="text-xs text-muted-foreground">Save energy, save money</p>
        </div>
        <img src={waferLogo} alt="Wafer" width={40} height={40} />
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 text-center">This Month's Saving</h2>
        <SavingGauge currentKwh={currentKwh} previousKwh={previousKwh} />
      </div>

      <BracketAlert currentKwh={currentKwh} />
      <DailyMission />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs text-muted-foreground">Est. Bill</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Math.round(bill.totalBill)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs text-muted-foreground">Daily Avg</p>
          <p className="text-2xl font-bold text-foreground mt-1">{dailyAvg} <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
        </div>
      </div>
    </div>
  );
}
