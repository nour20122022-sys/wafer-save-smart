import { useState } from "react";
import { DEFAULT_APPLIANCES, calculateApplianceMonthlyKwh, calculateBill, type Appliance } from "@/lib/tariff";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2 } from "lucide-react";

const COLORS = [
  "hsl(158, 64%, 42%)",
  "hsl(195, 80%, 50%)",
  "hsl(45, 93%, 58%)",
  "hsl(0, 72%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(30, 85%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(330, 60%, 55%)",
];

export function CalculatorPage() {
  const [meterReading, setMeterReading] = useState("");
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: "1", ...DEFAULT_APPLIANCES[0], hoursPerDay: 8 },
    { id: "2", ...DEFAULT_APPLIANCES[1], hoursPerDay: 24 },
    { id: "3", ...DEFAULT_APPLIANCES[5], hoursPerDay: 6 },
  ]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const chartData = appliances.map((a) => ({
    name: a.name,
    icon: a.icon,
    kwh: Math.round(calculateApplianceMonthlyKwh(a.wattage, a.hoursPerDay)),
  }));

  const totalKwh = chartData.reduce((sum, d) => sum + d.kwh, 0);
  const bill = calculateBill(totalKwh);

  const addAppliance = (idx: number) => {
    const template = DEFAULT_APPLIANCES[idx];
    setAppliances((prev) => [
      ...prev,
      { id: Date.now().toString(), ...template, hoursPerDay: 2 },
    ]);
    setShowAddPanel(false);
  };

  const removeAppliance = (id: string) => {
    setAppliances((prev) => prev.filter((a) => a.id !== id));
  };

  const updateHours = (id: string, hours: number) => {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hoursPerDay: Math.max(0, Math.min(24, hours)) } : a))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Energy Calculator</h1>
        <p className="text-sm text-muted-foreground">Track your consumption</p>
      </div>

      {/* Meter Reading */}
      <div className="bg-card rounded-xl p-5 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
        <label className="text-sm font-medium text-foreground block mb-2">
          Meter Reading (kWh)
        </label>
        <input
          type="number"
          value={meterReading}
          onChange={(e) => setMeterReading(e.target.value)}
          placeholder="Enter current reading..."
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-2">📷 Camera OCR coming soon</p>
      </div>

      {/* Consumption Chart */}
      {appliances.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">Consumption Breakdown</h2>
          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    dataKey="kwh"
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} kWh`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-foreground">{d.icon} {d.name}</span>
                  <span className="ml-auto text-muted-foreground">{d.kwh} kWh</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Estimated</p>
              <p className="text-lg font-bold text-foreground">{totalKwh} kWh</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Est. Bill</p>
              <p className="text-lg font-bold text-primary">{Math.round(bill.totalBill)} EGP</p>
            </div>
          </div>
        </div>
      )}

      {/* Appliance List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">My Appliances</h2>
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showAddPanel && (
          <div className="bg-muted rounded-xl p-3 mb-3 grid grid-cols-2 gap-2">
            {DEFAULT_APPLIANCES.map((a, i) => (
              <button
                key={i}
                onClick={() => addAppliance(i)}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-card text-xs text-foreground hover:shadow-sm transition-shadow"
              >
                <span>{a.icon}</span>
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {appliances.map((a) => (
            <div
              key={a.id}
              className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.wattage}W</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a.hoursPerDay}
                  onChange={(e) => updateHours(a.id, Number(e.target.value))}
                  className="w-14 text-center text-sm px-2 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  min={0}
                  max={24}
                />
                <span className="text-xs text-muted-foreground">hrs</span>
              </div>
              <button onClick={() => removeAppliance(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
