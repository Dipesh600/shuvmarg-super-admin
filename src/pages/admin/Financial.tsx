/**
 * Financial.tsx — Platform Financial Command Center
 *
 * Layout (top to bottom):
 *   1. System Health Bar      — single verdict + signal list
 *   2. Money Flow Spine       — GBV node (with 4 sub-stats) → take rate → Net Revenue node → Operator Debt → Refund Liability
 *   3. Action Surface         — conditional: only rendered when something needs a decision
 *   4. Revenue Trend Chart    — GBV / commission / refunds / discounts; 3M/6M/12M toggle
 *   5. Dual detail row        — [Booking Breakdown | Coupon Impact] side-by-side
 *   6. Operator Leaderboard   — top 8 brands by GBV with share bar, avg ticket, this-month
 *   7. Gateway Mix            — volume share bars + avg ticket + this-month breakdown
 *   8. Settlement Queue       — pending/processing with gross → commission → net breakdown per row
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, ArrowRight, ChevronRight,
  AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  Tag, Users, Ticket, BarChart2, Wallet, AlertCircle,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getFinancialOverview, type FinancialOverview, type ChartPeriod } from "@/api/financialApi";

// ── Formatters ────────────────────────────────────────────────────────────────

const Rs = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(1)}L`
  : n >= 1_000     ? `₹${(n / 1_000).toFixed(0)}K`
  : `₹${Math.round(n).toLocaleString("en-IN")}`;

const RsFull = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
const N = (n: number)     => n.toLocaleString("en-IN");

const GW_COLORS: Record<string, string> = {
  ESEWA: "#60BB47", KHALTI: "#5C2D8B", IME_PAY: "#F47920",
  CONNECT_IPS: "#1B5FAD", CARD: "#6366F1", CASH: "#22C55E",
  SM_WALLET: "#0EA5E9", SM_WALLET_SPLIT: "#38BDF8",
  AGENT: "#F59E0B", OTHER: "#94A3B8", unknown: "#94A3B8",
};
const GW_LABELS: Record<string, string> = {
  ESEWA: "eSewa", KHALTI: "Khalti", IME_PAY: "IME Pay",
  CONNECT_IPS: "ConnectIPS", CARD: "Card", CASH: "Cash",
  SM_WALLET: "SM Money", SM_WALLET_SPLIT: "SM Split",
  AGENT: "Agent", OTHER: "Other", unknown: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  booked: "#22c55e", cancelled: "#ef4444",
  pending: "#f59e0b", failed: "#6b7280",
};

// ── System Health computation ─────────────────────────────────────────────────
function computeHealth(d: FinancialOverview | undefined) {
  if (!d) return { level: "WATCH" as const, signals: ["Loading…"] };
  const signals: string[] = [];
  let crits = 0, warns = 0;
  const sr  = d.transactionSuccessRate ?? 0;
  const rr  = d.refundHealth?.refundRate ?? 0;
  const pc  = d.pendingSettlements?.count ?? 0;
  const mxg = Math.max(0, ...(d.paymentBreakdown ?? []).map(g => g.volumeShare));
  const δgbv = d.gbv?.momDelta;

  if (sr < 80)   { crits++; signals.push(`Critical: txn success ${sr}%`); }
  else if (sr < 92) { warns++; signals.push(`Txn success ${sr}%`); }
  if (rr > 8)    { crits++; signals.push(`Refund rate ${rr}% of GBV`); }
  else if (rr > 4) { warns++; signals.push(`Refund rate ${rr}%`); }
  if (pc > 15)   { warns++; signals.push(`${pc} settlements overdue`); }
  if (mxg > 80)  { warns++; signals.push(`${Math.round(mxg)}% volume on single gateway`); }
  if (δgbv !== null && δgbv !== undefined && δgbv < -10) { warns++; signals.push(`GBV down ${Math.abs(δgbv)}% MoM`); }

  if (!signals.length) signals.push("All financial signals nominal");
  if (crits) return { level: "CRITICAL" as const, signals };
  if (warns)  return { level: "WATCH"    as const, signals };
  return       { level: "HEALTHY"  as const, signals };
}

// ── Delta pill ────────────────────────────────────────────────────────────────
function Delta({ v, inverted = false }: { v: number | null | undefined; inverted?: boolean }) {
  if (v == null) return <span className="text-[10px] text-muted-foreground/40 italic">no prior data</span>;
  const positive = inverted ? v <= 0 : v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {v >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {v > 0 ? "+" : ""}{v}% MoM
    </span>
  );
}

// ── Stat row — used inside spine nodes ───────────────────────────────────────
function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[10px] text-muted-foreground/60 truncate">{label}</span>
      <span className={`text-[11px] font-black tabular-nums whitespace-nowrap ${accent ?? ""}`}>{value}</span>
    </div>
  );
}

// ── Flow Node ─────────────────────────────────────────────────────────────────
function FlowNode({
  label, mainValue, delta, deltaInverted, children, accent, warning, onClick,
}: {
  label:          string;
  mainValue:      string;
  delta?:         number | null;
  deltaInverted?: boolean;
  children?:      React.ReactNode;
  accent?:        boolean;
  warning?:       boolean;
  onClick?:       () => void;
}) {
  const base = warning
    ? "border-amber-400/40 bg-amber-500/5 hover:bg-amber-500/8"
    : accent
    ? "border-primary/25 bg-primary/5 hover:bg-primary/8"
    : "border-border/50 bg-card hover:bg-muted/20";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex-1 min-w-[180px] text-left p-4 rounded-xl border transition-all duration-200 ${base} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/50 mb-2">{label}</p>
      <p className={`text-2xl font-black tracking-tight tabular-nums leading-none mb-1.5 ${warning ? "text-amber-600" : accent ? "text-primary" : "text-foreground"}`}>
        {mainValue}
      </p>
      {delta !== undefined && <div className="mb-3"><Delta v={delta} inverted={deltaInverted} /></div>}
      {children && (
        <div className="mt-2 pt-2 border-t border-border/20 space-y-0.5">
          {children}
        </div>
      )}
      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/60">
          View <ArrowRight className="h-2.5 w-2.5" />
        </div>
      )}
    </button>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur shadow-xl p-3 text-xs min-w-[170px]">
      <p className="font-black mb-2 pb-2 border-b border-border/40">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.name}
          </span>
          <span className="font-bold">{Rs(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Financial() {
  const nav = useNavigate();
  const [period, setPeriod] = useState<ChartPeriod>(6);

  const { data: d, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey:  ["financialOverview", period],
    queryFn:   () => getFinancialOverview(period),
    staleTime: 5 * 60 * 1000,
  });

  const health   = computeHealth(d);
  const gateways = d?.paymentBreakdown       ?? [];
  const chart    = d?.monthlyChart           ?? [];
  const queue    = d?.settlementQueue        ?? [];
  const ops      = d?.operatorLeaderboard    ?? [];
  const maxGw    = Math.max(0, ...gateways.map(g => g.volumeShare));

  // Action items — things that need a decision
  const actions: { text: string; sub: string; href: string; sev: "critical" | "warn" }[] = [];
  if ((d?.refundLiability?.amount ?? 0) > 0) actions.push({
    text: `${d!.refundLiability.count} refunds pending approval`,
    sub:  `${RsFull(d!.refundLiability.amount)} cash liability`,
    href: "/admin/refunds", sev: d!.refundLiability.amount > 50000 ? "critical" : "warn",
  });
  if ((d?.pendingSettlements?.count ?? 0) > 0) actions.push({
    text: `${d!.pendingSettlements.count} operator settlements outstanding`,
    sub:  `${RsFull(d!.pendingSettlements.amount)} owed · ${d!.pendingSettlements.pending} pending, ${d!.pendingSettlements.processing} processing`,
    href: "/admin/settlements", sev: d!.pendingSettlements.count > 10 ? "critical" : "warn",
  });
  if (maxGw > 75) {
    const dom = gateways.find(g => g.volumeShare === maxGw);
    if (dom) actions.push({
      text: `Gateway concentration risk: ${Math.round(maxGw)}% via ${GW_LABELS[dom.gateway] ?? dom.gateway}`,
      sub:  "Single gateway dependency — diversify payment methods",
      href: "/admin/gateway-fees", sev: "warn",
    });
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-muted-foreground text-sm">Failed to load financial data</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  // Booking status breakdown (only known statuses)
  const statusDist = d?.bookingStatusDist ?? {};
  const totalBkCount = Object.values(statusDist).reduce((s, v) => s + v.count, 0);
  const bkStatuses = Object.entries(statusDist).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Financial Command Center</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Platform money flow · GBV → Commission captured → Operator payouts → Net position
          </p>
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"
          onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ══ 1. SYSTEM HEALTH ════════════════════════════════════════════════ */}
      <div className={`rounded-xl border px-5 py-3 flex items-center gap-4 ${
        health.level === "HEALTHY"  ? "border-emerald-500/30 bg-emerald-500/5"
        : health.level === "WATCH" ? "border-amber-500/30 bg-amber-500/5"
        :                            "border-red-500/40 bg-red-500/5"
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          health.level === "HEALTHY"  ? "bg-emerald-500 shadow-[0_0_8px_3px_rgba(34,197,94,0.4)]"
          : health.level === "WATCH" ? "bg-amber-500 shadow-[0_0_8px_3px_rgba(245,158,11,0.4)]"
          :                            "bg-red-500 shadow-[0_0_8px_3px_rgba(239,68,68,0.4)]"
        }`} />
        <div className="flex-1">
          <span className={`font-black text-sm ${
            health.level === "HEALTHY" ? "text-emerald-700" : health.level === "WATCH" ? "text-amber-700" : "text-red-700"
          }`}>
            {health.level === "HEALTHY" ? "All Clear —" : health.level === "WATCH" ? "Attention —" : "Critical —"}
          </span>
          <span className="text-xs text-muted-foreground ml-2">{health.signals.join(" · ")}</span>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 ${
          health.level === "HEALTHY" ? "bg-emerald-100 text-emerald-800"
          : health.level === "WATCH" ? "bg-amber-100 text-amber-800"
          :                            "bg-red-100 text-red-800"
        }`}>{health.level}</span>
      </div>

      {/* ══ 2. MONEY FLOW SPINE ═════════════════════════════════════════════ */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
          Money Flow · This Month
        </p>
        <div className="flex flex-col lg:flex-row items-stretch gap-2">

          {/* Node 1: GBV — richest node */}
          <FlowNode label="Gross Booking Value" mainValue={Rs(d?.gbv?.thisMonth ?? 0)}
            delta={d?.gbv?.momDelta} accent>
            <Stat label="Bookings this month"  value={N(d?.gbv?.thisMonthCount  ?? 0)} />
            <Stat label="Seats sold"           value={N(d?.gbv?.thisMonthSeats  ?? 0)} />
            <Stat label="Discounts applied"    value={Rs(d?.gbv?.thisMonthDiscount ?? 0)} accent="text-amber-600" />
            <Stat label="Avg ticket (all time)" value={Rs(d?.gbv?.avgTicket ?? 0)} />
          </FlowNode>

          {/* Connector: Take Rate */}
          <div className="flex lg:flex-col items-center justify-center px-2 gap-1 shrink-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 lg:rotate-0 rotate-90" />
            <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary whitespace-nowrap">
              {d?.takeRate?.thisMonth ?? 0}% take rate
              {d?.takeRate?.isEstimated && (
                <span className="ml-1 opacity-50 font-normal">(est.)</span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 lg:rotate-0 rotate-90 hidden lg:block" />
          </div>

          {/* Node 2: Net Revenue */}
          <FlowNode label="Net Platform Revenue" mainValue={Rs(d?.netRevenue?.thisMonth ?? 0)}
            delta={d?.netRevenue?.momDelta}>
            <Stat label="All-time commission"   value={Rs(d?.netRevenue?.allTime ?? 0)} />
            <Stat label="From settlements paid" value={N(d?.netRevenue?.paidCount ?? 0)} />
            <Stat label="Gross settled to ops"  value={Rs(d?.netRevenue?.grossSettled ?? 0)} />
            <Stat label="Take rate (all-time)"  value={`${d?.takeRate?.allTime ?? 0}%`} />
          </FlowNode>

          <div className="flex lg:flex-col items-center justify-center px-1 shrink-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 lg:rotate-0 rotate-90" />
          </div>

          {/* Node 3: Pending Settlements */}
          <FlowNode label="Owed to Operators" mainValue={Rs(d?.pendingSettlements?.amount ?? 0)}
            warning={(d?.pendingSettlements?.count ?? 0) > 0}
            onClick={() => nav("/admin/settlements")}>
            <Stat label="Total settlements"  value={N(d?.pendingSettlements?.count ?? 0)} />
            <Stat label="Pending"            value={N(d?.pendingSettlements?.pending ?? 0)}    accent="text-amber-600" />
            <Stat label="Processing"         value={N(d?.pendingSettlements?.processing ?? 0)} accent="text-blue-500" />
          </FlowNode>

          <div className="flex lg:flex-col items-center justify-center px-1 shrink-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 lg:rotate-0 rotate-90" />
          </div>

          {/* Node 4: Refund Liability */}
          <FlowNode label="Refund Liability" mainValue={Rs(d?.refundLiability?.amount ?? 0)}
            warning={(d?.refundLiability?.amount ?? 0) > 0}
            onClick={() => nav("/admin/refunds")}>
            <Stat label="Pending refunds"      value={N(d?.refundLiability?.count ?? 0)} />
            <Stat label="Paid out (all-time)"  value={Rs(d?.refundHealth?.totalPaid ?? 0)} />
            <Stat label="Cancellation income"  value={Rs(d?.refundHealth?.cancellationIncome ?? 0)} accent="text-emerald-600" />
            <Stat label="Refund rate of GBV"   value={`${d?.refundHealth?.refundRate ?? 0}%`}
              accent={(d?.refundHealth?.refundRate ?? 0) > 5 ? "text-red-500" : "text-muted-foreground"} />
          </FlowNode>

        </div>

        {/* Health bar below spine */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[10px] text-muted-foreground">
            <span className={`font-black ${(d?.transactionSuccessRate ?? 0) >= 92 ? "text-emerald-600" : "text-amber-600"}`}>
              {d?.transactionSuccessRate ?? 0}%
            </span>{" "}txn success
          </span>
          <span className="text-muted-foreground/30 hidden sm:block">·</span>
          <span className="text-[10px] text-muted-foreground">
            <span className="font-black">{N(d?.gbv?.totalBookings ?? 0)}</span> total bookings
          </span>
          <span className="text-muted-foreground/30 hidden sm:block">·</span>
          <span className="text-[10px] text-muted-foreground">
            <span className="font-black">{Rs(d?.gbv?.totalDiscount ?? 0)}</span> in discounts issued
          </span>
          <span className="text-muted-foreground/30 hidden sm:block">·</span>
          <span className="text-[10px] text-muted-foreground">
            <span className="font-black">{N(d?.gbv?.totalSeats ?? 0)}</span> seats sold total
          </span>
        </div>
      </div>

      {/* ══ 3. ACTION SURFACE ═══════════════════════════════════════════════ */}
      {actions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Requires Action
          </p>
          {actions.map((a, i) => (
            <button key={i} onClick={() => nav(a.href)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-md ${
                a.sev === "critical"
                  ? "border-red-400/40 bg-red-500/5 hover:bg-red-500/8"
                  : "border-amber-400/40 bg-amber-500/5 hover:bg-amber-500/8"
              }`}>
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.sev === "critical" ? "text-red-500" : "text-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* ══ 4. REVENUE TREND CHART ══════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-0 border-b border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-sm font-black">Revenue Trend</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="text-primary opacity-60">■</span> GBV ·{" "}
                <span className="text-emerald-500">—</span> Commission ·{" "}
                <span className="text-red-400 opacity-70">■</span> Refunds ·{" "}
                <span className="text-amber-400 opacity-70">■</span> Discounts
              </p>
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              {([3, 6, 12] as ChartPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    period === p ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {p}M
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-2">
          {chart.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chart} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={Rs} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="gbv"      name="GBV"        fill="hsl(var(--primary))" opacity={0.15} radius={[3,3,0,0]} />
                <Bar dataKey="discount" name="Discounts"  fill="#f59e0b" opacity={0.45} radius={[3,3,0,0]} />
                <Bar dataKey="refunds"  name="Refunds"    fill="#ef4444" opacity={0.55} radius={[3,3,0,0]} />
                <Line type="monotone" dataKey="commission" name="Commission"
                  stroke="#22c55e" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                  activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ══ 5. DUAL DETAIL ROW: Booking Breakdown + Coupon Impact ════════════ */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground/50" />
              Booking Status Breakdown
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">{N(totalBkCount)} total bookings across all time</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {bkStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : bkStatuses.map(([status, { count, value }]) => {
              const pct = totalBkCount > 0 ? (count / totalBkCount * 100) : 0;
              const color = STATUS_COLORS[status] ?? "#94A3B8";
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-bold capitalize">{status}</span>
                      <span className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black tabular-nums">{N(count)}</span>
                      {value > 0 && <span className="text-[10px] text-muted-foreground ml-1.5">{Rs(value)}</span>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Coupon Impact */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground/50" />
              Coupon &amp; Discount Impact
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">How promotions affect revenue</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Coupon bookings",    value: N(d?.couponImpact?.bookingsWithCoupon ?? 0), sub: `${d?.couponImpact?.couponUsageRate ?? 0}% of all bookings` },
                { label: "Total discount given", value: Rs(d?.couponImpact?.discountGiven ?? 0),    sub: "Cash off for users", accent: "text-amber-600" },
                { label: "Revenue from coupon bookings", value: Rs(d?.couponImpact?.revenueFromCoupon ?? 0), sub: "Despite discount" },
                { label: "Discount as % of GBV", value: `${d?.gbv?.allTime > 0 ? ((d?.gbv?.totalDiscount ?? 0) / d.gbv.allTime * 100).toFixed(1) : 0}%`,
                  sub: Rs(d?.gbv?.totalDiscount ?? 0) + " total",
                  accent: (d?.gbv?.allTime > 0 && (d?.gbv?.totalDiscount ?? 0) / d.gbv.allTime > 0.1) ? "text-amber-600" : "" },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1">{item.label}</p>
                  <p className={`text-lg font-black tabular-nums ${item.accent ?? ""}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══ 6. OPERATOR LEADERBOARD ═════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground/50" />
                Operator Revenue Leaderboard
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Top brands by all-time GBV contribution</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No operator data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/10">
                    {["#", "Operator Brand", "All-time GBV", "Share", "Bookings", "Avg Ticket", "Discounts", "This Month"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ops.map((op, i) => (
                    <tr key={op.brandId} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-black text-muted-foreground/40 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{op.brandName}</p>
                        <p className="text-muted-foreground/60">{N(op.seats)} seats</p>
                      </td>
                      <td className="px-4 py-3 font-black tabular-nums">{Rs(op.gbv)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${op.share}%` }} />
                          </div>
                          <span className="font-bold tabular-nums">{op.share}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-bold">{N(op.count)}</td>
                      <td className="px-4 py-3 tabular-nums">{Rs(op.avgTicket)}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-600 font-bold">{Rs(op.discount)}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-600 font-bold">{Rs(op.thisMonth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══ 7 + 8. GATEWAY MIX + SETTLEMENT QUEUE ══════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Gateway Mix */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground/50" />
              Payment Gateway Mix
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Volume share · avg ticket · this month</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {gateways.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : gateways.map(g => {
              const color = GW_COLORS[g.gateway] ?? "#94A3B8";
              const label = GW_LABELS[g.gateway] ?? g.gateway;
              return (
                <div key={g.gateway}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-bold">{label}</span>
                      {g.volumeShare > 70 && (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-700 border-amber-400/30 border px-1.5">dominant</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black tabular-nums">{Rs(g.total)}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{g.volumeShare}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${g.volumeShare}%`, background: color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                      {N(g.count)} txns · avg {Rs(g.avgTicket)} · {Rs(g.thisMonth)} this mo.
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Settlement Queue */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground/50" />
                  Settlement Queue
                  {(d?.pendingSettlements?.count ?? 0) > 0 && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {d?.pendingSettlements?.count}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Oldest first · gross → commission → net</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7"
                onClick={() => nav("/admin/settlements")}>
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-500/40" />
                <p className="text-sm text-muted-foreground font-bold">All settled</p>
              </div>
            ) : (
              queue.map(s => (
                <div key={s._id} className={`px-4 py-3 border-b border-border/25 last:border-0 ${s.daysAgo > 14 ? "bg-amber-500/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{s.brandName}</p>
                      <p className="text-[10px] text-muted-foreground">{s.ownerName} · {N(s.ticketsSold)} tickets</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black tabular-nums">{Rs(s.netPayable)}</p>
                      <p className={`text-[10px] font-bold ${s.daysAgo > 14 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {s.daysAgo === 0 ? "Today" : `${s.daysAgo}d ago`}
                      </p>
                    </div>
                  </div>
                  {/* Gross → commission → net breakdown per row */}
                  <div className="mt-1.5 flex items-center gap-2 text-[9px] text-muted-foreground/60">
                    <span className="tabular-nums">{Rs(s.grossAmount)} gross</span>
                    <span>→</span>
                    <span className="text-primary tabular-nums">{Rs(s.commission)} ({s.commissionRate}%)</span>
                    <span>→</span>
                    <span className="font-black text-foreground tabular-nums">{Rs(s.netPayable)} net</span>
                    <span className="ml-auto">
                      <Badge variant="outline" className={`text-[9px] font-black uppercase px-1.5 py-0 ${
                        s.status === "processing" ? "border-blue-400/40 text-blue-600" : "border-amber-400/40 text-amber-700"
                      }`}>
                        {s.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
