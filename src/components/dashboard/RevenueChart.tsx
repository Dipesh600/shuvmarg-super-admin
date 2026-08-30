import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { ReactNode } from "react";

type ChartPayload = { color?: string; fill?: string; name: string; value: number };
type ChartTooltipProps = { active?: boolean; payload?: ChartPayload[]; label?: ReactNode };

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-2xl text-sm min-w-[160px]">
        <p className="font-semibold text-white mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-white/70 font-medium">{entry.name}</span>
              </div>
              <span className="font-semibold text-white tabular-nums">
                {entry.name === "Revenue" || entry.name.includes("Amount") || entry.name.includes("revenue")
                  ? `Rs. ${entry.value.toLocaleString("en-IN")}`
                  : entry.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueChart({revenueData}: {revenueData?: { month: string; revenue: number; netRevenue: number }[]}) {
  return (
    <Card className="col-span-full lg:col-span-2 w-full border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-white">Revenue Overview</CardTitle>
        <CardDescription className="text-white/50 text-sm">
          Monthly revenue trend (in Rs.)
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full h-[220px] sm:h-[260px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />

              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                dy={10}
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: "16px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }} />

              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Gross Revenue" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorGross)" 
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="netRevenue" 
                name="Net Revenue" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorNet)" 
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
