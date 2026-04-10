import { useState } from "react";
import { DEFAULT_APPLIANCES, calculateApplianceMonthlyKwh, calculateBill } from "@/lib/tariff";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppliances, useSaveAppliance, useDeleteAppliance, useUpdateApplianceHours, useMeterReadings, useSaveMeterReading } from "@/hooks/useUserData";
import { toast } from "sonner";

const COLORS = [
  "hsl(158, 64%, 42%)", "hsl(195, 80%, 50%)", "hsl(45, 93%, 58%)", "hsl(0, 72%, 55%)",
  "hsl(270, 60%, 55%)", "hsl(30, 85%, 55%)", "hsl(180, 60%, 45%)", "hsl(330, 60%, 55%)",
];

export function CalculatorPage() {
  const { user } = useAuth();
  const { data: dbAppliances, isLoading } = useAppliances();
  const { data: readings } = useMeterReadings();
  const saveAppliance = useSaveAppliance();
  const deleteAppliance = useDeleteAppliance();
  const updateHours = useUpdateApplianceHours();
  const saveMeterReading = useSaveMeterReading();

  const [meterReading, setMeterReading] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);

  const appliances = dbAppliances || [];

  const chartData = appliances.map((a: any) => ({
    name: a.name,
    icon: a.icon || "⚡",
    kwh: Math.round(calculateApplianceMonthlyKwh(Number(a.wattage), Number(a.hours_per_day))),
  }));

  const totalKwh = chartData.reduce((sum, d) => sum + d.kwh, 0);
  const bill = calculateBill(totalKwh);

  const addAppliance = (idx: number) => {
    const template = DEFAULT_APPLIANCES[idx];
    saveAppliance.mutate({
      name: template.name,
      name_ar: template.nameAr,
      icon: template.icon,
      wattage: template.wattage,
      hours_per_day: 2,
    }, {
      onSuccess: () => toast.success("تم إضافة الجهاز ✅"),
    });
    setShowAddPanel(false);
  };

  const handleSaveMeterReading = () => {
    const value = Number(meterReading);
    if (!value || value <= 0) { toast.error("أدخل قراءة صحيحة"); return; }
    saveMeterReading.mutate({ reading_kwh: value }, {
      onSuccess: () => {
        toast.success("تم حفظ القراءة ✅ الذكاء الاصطناعي بيحلل استهلاكك...");
        setMeterReading("");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Energy Calculator</h1>
        <p className="text-sm text-muted-foreground">Track your consumption</p>
      </div>

      {/* Meter Reading */}
      <div className="bg-card rounded-xl p-5 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
        <label className="text-sm font-medium text-foreground block mb-2">Meter Reading (kWh)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={meterReading}
            onChange={(e) => setMeterReading(e.target.value)}
            placeholder="Enter current reading..."
            className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSaveMeterReading}
            disabled={saveMeterReading.isPending}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
        {readings && readings.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            آخر قراءة: {Number(readings[0].reading_kwh)} kWh ({readings[0].reading_date})
          </p>
        )}
      </div>

      {/* Chart */}
      {appliances.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">Consumption Breakdown</h2>
          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="kwh" strokeWidth={2} stroke="hsl(var(--card))">
                    {chartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
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
          <button onClick={() => setShowAddPanel(!showAddPanel)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showAddPanel && (
          <div className="bg-muted rounded-xl p-3 mb-3 grid grid-cols-2 gap-2">
            {DEFAULT_APPLIANCES.map((a, i) => (
              <button key={i} onClick={() => addAppliance(i)} className="flex items-center gap-2 p-2.5 rounded-lg bg-card text-xs text-foreground hover:shadow-sm transition-shadow">
                <span>{a.icon}</span><span>{a.name}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : appliances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">أضف أجهزتك لحساب استهلاكك 📊</div>
        ) : (
          <div className="space-y-2">
            {appliances.map((a: any) => (
              <div key={a.id} className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <span className="text-2xl">{a.icon || "⚡"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{Number(a.wattage)}W</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={Number(a.hours_per_day)}
                    onChange={(e) => updateHours.mutate({ id: a.id, hours_per_day: Math.max(0, Math.min(24, Number(e.target.value))) })}
                    className="w-14 text-center text-sm px-2 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min={0} max={24}
                  />
                  <span className="text-xs text-muted-foreground">hrs</span>
                </div>
                <button onClick={() => deleteAppliance.mutate(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
