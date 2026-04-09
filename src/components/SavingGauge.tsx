import { useMemo } from "react";

interface SavingGaugeProps {
  currentKwh: number;
  previousKwh: number;
}

export function SavingGauge({ currentKwh, previousKwh }: SavingGaugeProps) {
  const { percentage, saved, color } = useMemo(() => {
    const diff = previousKwh - currentKwh;
    const pct = previousKwh > 0 ? Math.round((diff / previousKwh) * 100) : 0;
    return {
      percentage: pct,
      saved: diff,
      color: pct >= 0 ? "hsl(158, 64%, 42%)" : "hsl(0, 72%, 55%)",
    };
  }, [currentKwh, previousKwh]);

  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const displayPct = Math.min(Math.abs(percentage), 100);
  const offset = circumference - (displayPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {percentage >= 0 ? "+" : ""}{percentage}%
          </span>
          <span className="text-sm text-muted-foreground">
            {percentage >= 0 ? "Saved" : "Increased"}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {saved >= 0
          ? `You saved ${saved} kWh compared to last month 🎉`
          : `Consumption increased by ${Math.abs(saved)} kWh ⚠️`}
      </p>
    </div>
  );
}
