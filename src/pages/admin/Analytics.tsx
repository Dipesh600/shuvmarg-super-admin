import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Bus, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { getAnalyticsOverview } from "@/api/analyticsApi";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-2xl text-sm min-w-[160px]">
        <p className="font-semibold text-white mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-white/70 font-medium">{entry.name}</span>
              </div>
              <span className="font-semibold text-white tabular-nums">
                {entry.name === "Revenue" || entry.name.includes("Amount")
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

const KPICard = ({ title, value, subtext, trend, icon: Icon, isLoading }: any) => (
  <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
    <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
      <CardTitle className="text-sm font-semibold text-white/80">{title}</CardTitle>
      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
        <Icon className="h-4 w-4 text-[#D3D925] shrink-0" />
      </div>
    </CardHeader>
    
    <CardContent className="px-5 pb-5 pt-4">
      {isLoading ? (
        <div className="h-[52px] flex items-center">
          <RefreshCw className="h-4 w-4 animate-spin text-white/30" />
        </div>
      ) : (
        <div>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          <div className="flex items-center gap-2 mt-1 h-5">
             {trend === 'up' && (
               <span className="flex items-center text-xs font-bold text-[#D3D925] bg-[#D3D925]/10 px-2 py-0.5 rounded-md border border-[#D3D925]/20">
                 <ArrowUpRight className="h-3 w-3 mr-0.5 stroke-[3]" /> +{subtext}%
               </span>
             )}
             {trend === 'down' && (
               <span className="flex items-center text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                 <ArrowDownRight className="h-3 w-3 mr-0.5 stroke-[3]" /> {subtext}%
               </span>
             )}
             {!trend && (
               <p className="text-xs text-white/80">{subtext}</p>
             )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const Analytics = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: getAnalyticsOverview,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const kpis             = data?.kpis;
  const userGrowthChart  = data?.userGrowthChart  ?? [];
  const bookingTrendChart= data?.bookingTrendChart ?? [];
  const topRoutes        = data?.topRoutes         ?? [];

  const growthRate = kpis?.userGrowthRate;
  const growthTrend = growthRate != null ? (growthRate >= 0 ? 'up' : 'down') : undefined;

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Analytics & Intelligence</h2>
          <p className="text-sm text-white/60 mt-1 font-medium">
            Monitor your business metrics, user growth, and platform performance.
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing...
          </div>
        )}
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
          <AlertCircle className="h-4 w-4 text-white shrink-0" />
          <p className="text-sm font-medium text-white">
            Failed to connect to the analytics engine. Please try again later.
          </p>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Platform Revenue" 
          value={`Rs. ${(kpis?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
          subtext="Lifetime net revenue"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KPICard 
          title="Registered Users" 
          value={(kpis?.totalUsers ?? 0).toLocaleString("en-IN")}
          subtext={growthRate != null ? Math.abs(growthRate).toString() : "Total active accounts"}
          trend={growthTrend}
          icon={Users}
          isLoading={isLoading}
        />
        <KPICard 
          title="Booking Success Rate" 
          value={`${kpis?.bookingSuccessRate ?? 0}%`}
          subtext={`Based on ${(kpis?.totalBookings ?? 0).toLocaleString("en-IN")} total bookings`}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <KPICard 
          title="Fleet Utilization" 
          value={`${kpis?.fleetUtilization ?? 0}%`}
          subtext="Average platform-wide seat occupancy"
          icon={Bus}
          isLoading={isLoading}
        />
      </div>

      {/* TOP CHARTS ROW */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-xl border-white/5 bg-[#121212]/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Monthly Booking Volume</CardTitle>
            <CardDescription className="text-white/50">Aggregated successful bookings over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[320px]">
                <RefreshCw className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : bookingTrendChart.length === 0 ? (
              <div className="flex items-center justify-center h-[320px] text-sm text-white/40 font-medium">
                No booking data available.
              </div>
            ) : (
              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                    />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar 
                      dataKey="bookings" 
                      name="Bookings" 
                      fill="#D3D925" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={48} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-xl border-white/5 bg-[#121212]/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Audience Engagement</CardTitle>
            <CardDescription className="text-white/50">New registrations vs. Active booking users.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[320px]">
                <RefreshCw className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : userGrowthChart.length === 0 ? (
              <div className="flex items-center justify-center h-[320px] text-sm text-white/40 font-medium">
                No user data available.
              </div>
            ) : (
              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "16px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }} />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      name="Active Users" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      name="New Users" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorNew)" 
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-xl border-white/5 bg-[#121212]/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Top Performing Routes</CardTitle>
            <CardDescription className="text-white/50">Routes with the highest booking frequency.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : topRoutes.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-white/40 font-medium">
                No route data available.
              </div>
            ) : (
              <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRoutes} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis 
                      type="number" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} 
                    />
                    <YAxis 
                      dataKey="route" 
                      type="category" 
                      width={120} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.8)", fontWeight: 600 }} 
                    />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar 
                      dataKey="bookings" 
                      name="Bookings" 
                      fill="#D3D925" 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-xl border-white/5 bg-[#121212]/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Operational Overview</CardTitle>
            <CardDescription className="text-white/50">Platform efficiency and structural data.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : (
              <div className="flex flex-col space-y-4 mt-2">
                {[
                  { label: "Active Fleets", value: (data?.operationalStats?.activeFleets ?? 0).toLocaleString("en-IN") },
                  { label: "Live Trips", value: (data?.operationalStats?.activeTrips ?? 0).toLocaleString("en-IN") },
                  { label: "Registered Operators", value: (data?.operationalStats?.totalOperators ?? 0).toLocaleString("en-IN") },
                  { label: "Active Routes", value: (data?.operationalStats?.activeRoutes ?? 0).toLocaleString("en-IN") },
                  { label: "Registered Agents", value: (data?.operationalStats?.registeredAgents ?? 0).toLocaleString("en-IN") },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <span className="text-sm font-semibold text-white/60">{stat.label}</span>
                    <span className="text-base font-bold text-white tracking-tight">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
