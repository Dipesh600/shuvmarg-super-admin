import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 850000 },
  { month: "Feb", revenue: 920000 },
  { month: "Mar", revenue: 1050000 },
  { month: "Apr", revenue: 1180000 },
  { month: "May", revenue: 1320000 },
  { month: "Jun", revenue: 1545600 },
];

export function RevenueChart() {
  return (
    <Card className="col-span-full lg:col-span-2 w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">Revenue Overview</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Monthly revenue trend (in Rs.)
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full h-[220px] sm:h-[260px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-50" />

              <XAxis 
                dataKey="month" 
                className="text-[10px] sm:text-xs"
                tickMargin={5}
              />

              <YAxis 
                className="text-[10px] sm:text-xs"
                tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`}
              />

              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
