import { getBracketForUsage, getNextBracketThreshold } from "@/lib/tariff";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface BracketAlertProps {
  currentKwh: number;
}

export function BracketAlert({ currentKwh }: BracketAlertProps) {
  const bracket = getBracketForUsage(currentKwh);
  const nextThreshold = getNextBracketThreshold(currentKwh);
  const remaining = nextThreshold ? nextThreshold - currentKwh : null;
  const isClose = remaining !== null && remaining < 50;

  return (
    <div
      className={`rounded-lg p-4 flex items-start gap-3 ${
        isClose
          ? "bg-energy-amber-light border border-energy-amber/30"
          : "bg-energy-green-light border border-energy-green/20"
      }`}
    >
      {isClose ? (
        <AlertTriangle className="w-5 h-5 text-energy-amber shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 text-energy-green shrink-0 mt-0.5" />
      )}
      <div>
        <p className="font-semibold text-sm text-foreground">
          You are in {bracket.nameEn} ({bracket.nameAr})
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isClose && remaining !== null
            ? `⚠️ Warning: Only ${remaining} kWh away from the next bracket!`
            : remaining !== null
            ? `${remaining} kWh remaining before moving to the next bracket.`
            : "You are in the highest bracket."}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rate: {bracket.pricePerKwh} EGP/kWh
        </p>
      </div>
    </div>
  );
}
