import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Bus, RefreshCw, AlertCircle } from "lucide-react";
import {
  Line, LineChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { getAnalyticsOverview } from "@/api/analyticsApi";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
};

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

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Analytics &amp; Business Intelligence
          </h2>
          <p className="text-muted-foreground mt-1">
            Advanced analytics and performance insights
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading live data…
          </div>
        )}
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Failed to load analytics data. Check backend connectivity.
          </p>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              User Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  {kpis?.userGrowthRate != null
                    ? `${kpis.userGrowthRate >= 0 ? "+" : ""}${kpis.userGrowthRate}%`
                    : "—"
                  }
                </div>
                <p className="text-xs text-primary">
                  {kpis?.totalUsers.toLocaleString("en-IN") ?? 0} total users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-500" />
              Booking Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  {kpis?.bookingSuccessRate ?? 0}%
                </div>
                <p className="text-xs text-teal-500">
                  From {kpis?.totalBookings.toLocaleString("en-IN") ?? 0} bookings
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bus className="h-4 w-4 text-purple-500" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">{kpis?.fleetUtilization ?? 0}%</div>
                <p className="text-xs text-purple-500">Average seat occupancy</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-indigo-700" />
              Avg. Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  Rs. {(kpis?.avgTransactionAmount ?? 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-indigo-700">Per confirmed booking</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Acquisition &amp; Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userGrowthChart.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No user data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Total Users"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="New Users"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Routes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Routes by Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topRoutes.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No route data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topRoutes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="route" type="category" className="text-xs" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number, name: string) =>
                      name === "bookings"
                        ? [value.toLocaleString("en-IN"), "Bookings"]
                        : [`Rs. ${value.toLocaleString("en-IN")}`, "Revenue"]
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="bookings"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Trend Chart + Operational Efficiency */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bookingTrendChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="bookings"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Operational Efficiency — mix of live + structural */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              [
                ["Total Platform Revenue",   `Rs. ${(kpis?.totalRevenue ?? 0).toLocaleString("en-IN")}`, "text-green-600"],
                ["Total Registered Users",   (kpis?.totalUsers ?? 0).toLocaleString("en-IN"), ""],
                ["New Users This Month",     (kpis?.usersThisMonth ?? 0).toLocaleString("en-IN"), "text-primary"],
                ["Booking Success Rate",     `${kpis?.bookingSuccessRate ?? 0}%`, "text-green-600"],
                ["Fleet Utilization",        `${kpis?.fleetUtilization ?? 0}%`, ""],
                ["Avg Transaction Value",    `Rs. ${(kpis?.avgTransactionAmount ?? 0).toLocaleString("en-IN")}`, ""],
              ].map(([label, value, className]) => (
                <div className="flex justify-between" key={label}>
                  <span className="text-sm">{label}</span>
                  <span className={`font-semibold ${className}`}>{value}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Analytics;
