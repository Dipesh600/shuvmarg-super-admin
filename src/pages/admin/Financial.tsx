import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent, Clock, RefreshCw, AlertCircle } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { getFinancialOverview } from "@/api/financialApi";

const CHART_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#6366f1", "#ef4444"];

const Financial = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["financialOverview"],
    queryFn: getFinancialOverview,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const chartData = data?.monthlyChart ?? [];
  const paymentBreakdown = data?.paymentBreakdown ?? [];
  const totalPaymentTxns = paymentBreakdown.reduce((s, p) => s + p.count, 0);

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Management</h2>
        <p className="text-muted-foreground mt-1">Revenue analytics and financial monitoring</p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Platform Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  Rs. {(data?.revenue.total ?? 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-green-600">
                  {(data?.revenue.totalBookings ?? 0).toLocaleString("en-IN")} confirmed bookings
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-500" />
              Commission Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  Rs. {(data?.commission.totalCollected ?? 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-blue-500">
                  From {data?.commission.paidCount ?? 0} paid settlements
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Transaction Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">{data?.transactionSuccessRate ?? 0}%</div>
                <p className="text-xs text-green-500">Live booking success rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              Pending Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">
                  Rs. {(data?.pendingSettlements.amount ?? 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-orange-400">
                  {data?.pendingSettlements.count ?? 0} pending
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      {isError ? (
        <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load financial data.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                        fill="url(#revenueGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Commission Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`Rs. ${value.toLocaleString("en-IN")}`, "Commission"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar
                        dataKey="commission"
                        fill="hsl(var(--secondary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Payment Method Distribution — live breakdown ─────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : paymentBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No payment data available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {paymentBreakdown.map((p, i) => {
                    const pct = totalPaymentTxns > 0
                      ? Math.round((p.count / totalPaymentTxns) * 100)
                      : 0;
                    return (
                      <div key={p.gateway} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{p.gateway}</span>
                            <span className="text-sm text-muted-foreground">
                              {p.count.toLocaleString("en-IN")} txns ·{" "}
                              Rs. {p.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default Financial;
