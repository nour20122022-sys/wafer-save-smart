import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useUsageHistory, useMeterReadings } from "@/hooks/useUserData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UsageChart() {
  const { data: history } = useUsageHistory();
  const { data: readings } = useMeterReadings();

  const historyData = (history || []).slice(0, 12).reverse().map((h: any) => ({
    month: h.month?.slice(0, 7) || "",
    kwh: Number(h.kwh_usage),
    bill: Number(h.bill_amount || 0),
  }));

  const readingsData = (readings || []).slice(0, 12).reverse().map((r: any) => ({
    date: r.reading_date?.slice(5) || "",
    kwh: Number(r.reading_kwh),
  }));

  const chartData = historyData.length > 0 ? historyData : readingsData.map((r: any) => ({ month: r.date, kwh: r.kwh, bill: 0 }));

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-sm text-center text-sm text-muted-foreground" style={{ boxShadow: "var(--shadow-card)" }}>
        لا يوجد بيانات استهلاك بعد. أضف قراءات العداد من الحاسبة 📊
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
      <Tabs defaultValue="kwh">
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="kwh">استهلاك kWh</TabsTrigger>
          <TabsTrigger value="bill">الفاتورة EGP</TabsTrigger>
        </TabsList>
        <TabsContent value="kwh">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="kwh" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="kWh" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="bill">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="bill" stroke="hsl(var(--energy-amber))" strokeWidth={2} dot={{ r: 4 }} name="EGP" />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
