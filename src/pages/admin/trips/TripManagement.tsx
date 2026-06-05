/**
 * TripManagement.tsx — Trip Control Center
 *
 * Three-view tabbed layout for platform-wide trip oversight:
 *   1. Exception Triage — cancelled, rescheduled, stuck trips with financial impact
 *   2. Schedule Health  — CRON generation health per schedule across brands
 *   3. All Trips        — Enhanced search with booking stats and brand context
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    AlertTriangle, RefreshCw, Search, ExternalLink,
    AlertCircle, ShieldAlert, Clock, IndianRupee,
    Activity, CheckCircle2, XCircle, PauseCircle,
    BarChart3, Loader2, TrendingDown, TrendingUp, Minus,
    ChevronDown, ChevronRight, Bus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    getTripOverview,
    getScheduleHealth,
    searchTrips,
    getRoutePerformance,
    type AdminTrip,
    type TripStatus,
    type ExceptionType,
    type ScheduleHealthEntry,
    type RoutePerformanceEntry,
    type PerformanceTier,
} from "@/api/tripApi";

// ── Tab Config ────────────────────────────────────────────────────────────────

type TabKey = "exceptions" | "schedule-health" | "route-performance" | "all-trips";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "exceptions",        label: "Exception Triage",    icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "schedule-health",   label: "Schedule Health",     icon: <Activity className="w-4 h-4" /> },
    { key: "route-performance", label: "Route Performance",   icon: <TrendingDown className="w-4 h-4" /> },
    { key: "all-trips",         label: "All Trips",           icon: <BarChart3 className="w-4 h-4" /> },
];

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtDateFull = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtCurrency = (n: number) => `Rs. ${(n || 0).toLocaleString("en-IN")}`;

const getDirection = (trip: AdminTrip) => {
    if (trip.directionLabel) return trip.directionLabel;
    if (trip.fromStopName && trip.toStopName) return `${trip.fromStopName} → ${trip.toStopName}`;
    const v = trip.variantId;
    if (v?.corridorId) {
        const o = v.corridorId.originId?.name || "?";
        const d = v.corridorId.destinationId?.name || "?";
        return v.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
    }
    const r = trip.routeId;
    if (r?.from && r?.to) return `${r.from} → ${r.to}`;
    return "—";
};

// ── Exception Badge ──────────────────────────────────────────────────────────

const EXCEPTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    CANCELLED:   { bg: "bg-red-500/10",    text: "text-red-600",    label: "Cancelled" },
    RESCHEDULED: { bg: "bg-amber-500/10",  text: "text-amber-600",  label: "Rescheduled" },
    EXTRA_RUN:   { bg: "bg-purple-500/10", text: "text-purple-600", label: "Extra Run" },
    NONE:        { bg: "bg-muted",         text: "text-muted-foreground", label: "Normal" },
};

const ExceptionBadge = ({ type }: { type?: ExceptionType }) => {
    const s = EXCEPTION_STYLES[type || "NONE"] || EXCEPTION_STYLES.NONE;
    return (
        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border-0 ${s.bg} ${s.text}`}>
            {s.label}
        </Badge>
    );
};

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    scheduled:    { bg: "bg-blue-500/10",    text: "text-blue-600" },
    boarding:     { bg: "bg-amber-500/10",   text: "text-amber-600" },
    "in-transit": { bg: "bg-violet-500/10",  text: "text-violet-600" },
    completed:    { bg: "bg-emerald-500/10", text: "text-emerald-600" },
    cancelled:    { bg: "bg-red-500/10",     text: "text-red-600" },
};

const StatusBadge = ({ status }: { status: TripStatus }) => {
    const s = STATUS_STYLES[status] || { bg: "bg-muted", text: "text-muted-foreground" };
    return (
        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border-0 ${s.bg} ${s.text}`}>
            {status.replace("-", " ")}
        </Badge>
    );
};

// ── Health Status Badge ──────────────────────────────────────────────────────

const HEALTH_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    CRITICAL: { bg: "bg-red-500/10",     text: "text-red-600",     icon: <XCircle className="w-3.5 h-3.5" /> },
    WARNING:  { bg: "bg-amber-500/10",   text: "text-amber-600",   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    HEALTHY:  { bg: "bg-emerald-500/10", text: "text-emerald-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const HealthBadge = ({ status }: { status: string }) => {
    const s = HEALTH_STYLES[status] || HEALTH_STYLES.HEALTHY;
    return (
        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border-0 gap-1 ${s.bg} ${s.text}`}>
            {s.icon} {status}
        </Badge>
    );
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, accent = "text-foreground", sub }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent?: string;
    sub?: string;
}) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{label}</p>
                    <p className={`text-2xl font-black tracking-tighter mt-1 ${accent}`}>{value}</p>
                    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground/40">
                    {icon}
                </div>
            </div>
        </CardContent>
    </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: EXCEPTION TRIAGE
// ═══════════════════════════════════════════════════════════════════════════════

function ExceptionTriageTab() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["trip-overview", page],
        queryFn: () => getTripOverview({ page, limit: 30 }),
        staleTime: 30_000,
    });

    const kpis = data?.kpis;
    const exceptions = data?.exceptions?.trips || [];
    const pagination = data?.exceptions?.pagination;
    const stuckTrips = data?.stuckTrips || [];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    label="Today's Exceptions"
                    value={kpis?.todayExceptions ?? "—"}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    accent={kpis?.todayExceptions ? "text-red-600" : "text-muted-foreground"}
                />
                <KpiCard
                    label="Total Exceptions"
                    value={kpis?.totalExceptions ?? "—"}
                    icon={<ShieldAlert className="w-5 h-5" />}
                    sub="in selected window"
                />
                <KpiCard
                    label="Revenue At Risk"
                    value={kpis ? fmtCurrency(kpis.revenueAtRisk) : "—"}
                    icon={<IndianRupee className="w-5 h-5" />}
                    accent={kpis?.revenueAtRisk ? "text-amber-600" : "text-muted-foreground"}
                />
                <KpiCard
                    label="Stuck Trips"
                    value={kpis?.stuckTrips ?? "—"}
                    icon={<Clock className="w-5 h-5" />}
                    accent={kpis?.stuckTrips ? "text-red-600" : "text-emerald-600"}
                    sub="boarding >3h or transit >24h"
                />
                <KpiCard
                    label="Pending Refunds"
                    value={kpis?.pendingRefunds ?? "—"}
                    icon={<IndianRupee className="w-5 h-5" />}
                    accent={kpis?.pendingRefunds ? "text-amber-600" : "text-muted-foreground"}
                    sub="platform-wide"
                />
            </div>

            {/* Stuck Trips Alert */}
            {stuckTrips.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-black text-red-700 uppercase tracking-wider">
                            {stuckTrips.length} Stuck Trip{stuckTrips.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {stuckTrips.map((trip) => (
                            <div key={trip._id} className="flex items-center justify-between bg-background/60 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={trip.status} />
                                    <span className="text-sm font-bold">{trip.directionLabel || "—"}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {trip.brandId?.brandName} · {fmtDate(trip.tripDate)} · {trip.departureTime}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => trip.busId?._id && navigate(`/admin/fleets/${trip.busId._id}/workstation`)}
                                    className="h-7 rounded-lg text-xs font-bold gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" /> Workstation
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Exception Table */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Exception Trips
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 rounded-lg">
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-muted-foreground">Failed to load exception data.</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : exceptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500/40" />
                            <p className="font-bold text-muted-foreground">No exceptions in the selected window</p>
                            <p className="text-sm text-muted-foreground/60">All trips are running normally.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Direction</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Exception</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Bookings</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Revenue Impact</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Reason</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exceptions.map((trip) => {
                                        const bs = trip.bookingStats;
                                        const rs = trip.refundStats;
                                        return (
                                            <TableRow key={trip._id} className="hover:bg-muted/10">
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtDate(trip.tripDate)}</div>
                                                    <div className="text-[11px] text-muted-foreground">{trip.departureTime}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-bold">{trip.brandId?.brandName || "—"}</span>
                                                </TableCell>
                                                <TableCell className="text-sm">{getDirection(trip)}</TableCell>
                                                <TableCell><ExceptionBadge type={trip.exceptionType} /></TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-mono">
                                                        <span className="font-bold">{bs?.booked || 0}</span>
                                                        <span className="text-muted-foreground"> booked</span>
                                                    </div>
                                                    {(bs?.cancelled ?? 0) > 0 && (
                                                        <div className="text-[11px] text-red-500">{bs?.cancelled} cancelled</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtCurrency(bs?.revenue || 0)}</div>
                                                    {(rs?.pendingCount ?? 0) > 0 && (
                                                        <div className="text-[11px] text-amber-600">
                                                            {rs?.pendingCount} refund{(rs?.pendingCount ?? 0) > 1 ? "s" : ""} pending
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {trip.cancellationReason || trip.rescheduleReason || "—"}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => trip.busId?._id && navigate(`/admin/fleets/${trip.busId._id}/workstation`)}
                                                        className="h-7 rounded-lg text-xs font-bold gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <Button
                                variant="outline" size="sm"
                                disabled={page === 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="font-bold rounded-lg"
                            >
                                ← Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} exceptions
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={page === pagination.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="font-bold rounded-lg"
                            >
                                Next →
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: SCHEDULE HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

const getSchedDirection = (entry: ScheduleHealthEntry) => {
    const v = entry.schedule.variantId;
    if (!v?.corridorId) return "—";
    const o = v.corridorId.originId?.name || "?";
    const d = v.corridorId.destinationId?.name || "?";
    return v.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

function ScheduleHealthTab() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["schedule-health"],
        queryFn: () => getScheduleHealth(),
        staleTime: 60_000,
    });

    const kpis = data?.kpis;
    const schedules = data?.schedules || [];
    const suspended = data?.suspended || [];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    label="Active Schedules"
                    value={kpis?.totalActive ?? "—"}
                    icon={<Activity className="w-5 h-5" />}
                    accent="text-emerald-600"
                />
                <KpiCard
                    label="Suspended"
                    value={kpis?.totalSuspended ?? "—"}
                    icon={<PauseCircle className="w-5 h-5" />}
                    accent={kpis?.totalSuspended ? "text-amber-600" : "text-muted-foreground"}
                />
                <KpiCard
                    label="Critical"
                    value={kpis?.critical ?? "—"}
                    icon={<XCircle className="w-5 h-5" />}
                    accent={kpis?.critical ? "text-red-600" : "text-muted-foreground"}
                    sub="generation gap >7 days"
                />
                <KpiCard
                    label="Warnings"
                    value={kpis?.warnings ?? "—"}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    accent={kpis?.warnings ? "text-amber-600" : "text-muted-foreground"}
                    sub="generation gap 3-7 days"
                />
                <KpiCard
                    label="Healthy"
                    value={kpis?.healthy ?? "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent="text-emerald-600"
                />
            </div>

            {/* Suspended Schedules Warning */}
            {suspended.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <PauseCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-black text-amber-700 uppercase tracking-wider">
                            {suspended.length} Suspended Schedule{suspended.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {suspended.map((entry) => (
                            <div key={entry.schedule._id} className="flex items-center justify-between bg-background/60 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold">{entry.schedule.brandId?.brandName || "—"}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {getSchedDirection(entry)} · {entry.schedule.departureTime} → {entry.schedule.arrivalTime}
                                    </span>
                                    {entry.schedule.suspensionReason && (
                                        <span className="text-xs text-amber-600 truncate max-w-[200px]">
                                            — {entry.schedule.suspensionReason}
                                        </span>
                                    )}
                                </div>
                                {entry.schedule.suspendUntil && (
                                    <span className="text-xs font-bold text-amber-600">
                                        Auto-resume: {fmtDateFull(entry.schedule.suspendUntil)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Health Table */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Generation Health
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 rounded-lg">
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-muted-foreground">Failed to load schedule health.</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <Activity className="h-10 w-10 text-muted-foreground/30" />
                            <p className="font-bold text-muted-foreground">No active schedules found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Health</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Route</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Timing</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Trip Horizon</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Gap</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Trips</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Bus</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.map((entry) => {
                                        const h = entry.health;
                                        const s = entry.schedule;
                                        return (
                                            <TableRow key={s._id} className={`hover:bg-muted/10 ${h.status === "CRITICAL" ? "bg-red-500/3" : ""}`}>
                                                <TableCell><HealthBadge status={h.status} /></TableCell>
                                                <TableCell className="font-bold text-sm">{s.brandId?.brandName || "—"}</TableCell>
                                                <TableCell className="text-sm">{getSchedDirection(entry)}</TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-bold">{s.departureTime}</span>
                                                    <span className="text-muted-foreground/40"> → </span>
                                                    <span className="text-sm text-muted-foreground">{s.arrivalTime}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <span className="font-bold">{fmtDate(h.actualHorizon)}</span>
                                                        <span className="text-muted-foreground/40"> / </span>
                                                        <span className="text-muted-foreground">{fmtDate(h.expectedHorizon)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground/50">actual / expected</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-black ${
                                                        h.gapDays > 7 ? "text-red-600" :
                                                        h.gapDays > 3 ? "text-amber-600" :
                                                        "text-emerald-600"
                                                    }`}>
                                                        {h.gapDays > 0 ? `${h.gapDays}d short` : "On track"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <span className="font-bold">{h.upcomingTrips}</span>
                                                        <span className="text-muted-foreground"> upcoming</span>
                                                    </div>
                                                    {h.cancelledTrips > 0 && (
                                                        <div className="text-[11px] text-red-500">{h.cancelledTrips} cancelled</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {s.busId?.busName || s.busId?.busNumber || "—"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: ALL TRIPS — Bus-Grouped Accordion
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_FILTERS = ["all", "scheduled", "boarding", "in-transit", "completed", "cancelled"] as const;

/** Group a flat trip list by busId, preserving order of first appearance */
function groupByBus(trips: AdminTrip[]): Map<string, AdminTrip[]> {
    const map = new Map<string, AdminTrip[]>();
    for (const trip of trips) {
        const key = trip.busId?._id ?? "unknown";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(trip);
    }
    return map;
}

/** Single bus accordion row */
function BusGroup({ busId, trips, navigate }: {
    busId: string;
    trips: AdminTrip[];
    navigate: ReturnType<typeof useNavigate>;
}) {
    const [open, setOpen] = useState(false);

    const ref      = trips[0];
    const busName  = ref.busId?.busName  || ref.busId?.busNumber || "Unknown Bus";
    const busNum   = ref.busId?.busNumber || "";
    const route    = getDirection(ref);
    const brand    = ref.brandId?.brandName || "—";
    const departs  = ref.departureTime;
    const totalSeats = ref.busId?.totalSeats || 0;

    // Aggregate across all trips
    const totalTrips    = trips.length;
    const totalRevenue  = trips.reduce((s, t) => s + (t.bookingStats?.revenue  || 0), 0);
    const totalSold     = trips.reduce((s, t) => s + (t.bookingStats?.seatsSold || 0), 0);
    const avgOcc        = totalSeats > 0 && totalTrips > 0
        ? Math.round((totalSold / (totalSeats * totalTrips)) * 100)
        : 0;
    const exceptions    = trips.filter(t => t.exceptionType && t.exceptionType !== "NONE").length;
    const cancelled     = trips.filter(t => t.status === "cancelled").length;

    // Today's trip (or nearest upcoming)
    const today = new Date().toISOString().slice(0, 10);
    const todayTrip = trips.find(t => t.tripDate?.slice(0, 10) === today)
                   ?? trips.find(t => t.tripDate >= today);

    return (
        <div className="border-b border-border/40 last:border-0">
            {/* Bus header row — always visible */}
            <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setOpen(o => !o)}
            >
                {/* Expand icon */}
                <span className="text-muted-foreground shrink-0">
                    {open
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                </span>

                {/* Bus icon */}
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bus className="h-4 w-4 text-primary" />
                </div>

                {/* Bus name + route */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{busName}</span>
                        {busNum && busNum !== busName && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {busNum}
                            </span>
                        )}
                        <Badge variant="outline" className="text-[10px] font-semibold">{brand}</Badge>
                        {todayTrip && (
                            <StatusBadge status={todayTrip.status} />
                        )}
                        {exceptions > 0 && (
                            <Badge className="text-[10px] font-black bg-red-500/10 text-red-600 border-0">
                                {exceptions} exception{exceptions > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {route} · {departs}
                    </div>
                </div>

                {/* Summary stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trips</p>
                        <p className="font-bold text-sm">{totalTrips}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Occ</p>
                        <p className={`font-bold text-sm ${
                            avgOcc >= 80 ? "text-emerald-600" :
                            avgOcc >= 50 ? "text-amber-600" :
                            "text-muted-foreground"
                        }`}>{avgOcc}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
                        <p className="font-bold text-sm">{fmtCurrency(totalRevenue)}</p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/fleets/${busId}/workstation`);
                        }}
                    >
                        <ExternalLink className="h-3 w-3" /> Workstation
                    </Button>
                </div>
            </button>

            {/* Expanded trip list */}
            {open && (
                <div className="bg-muted/10 border-t border-border/30 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="pl-12 pr-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Departure</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seats</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Exception</th>
                                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips
                                .slice()
                                .sort((a, b) => a.tripDate.localeCompare(b.tripDate))
                                .map(trip => {
                                    const bs = trip.bookingStats;
                                    const totalSeatsT = trip.busId?.totalSeats || 0;
                                    const sold = bs?.seatsSold || 0;
                                    const occPct = totalSeatsT > 0 ? Math.round((sold / totalSeatsT) * 100) : 0;
                                    const isToday = trip.tripDate?.slice(0, 10) === today;
                                    const hasException = trip.exceptionType && trip.exceptionType !== "NONE";
                                    return (
                                        <tr
                                            key={trip._id}
                                            className={`border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors ${
                                                isToday ? "bg-primary/5" : ""
                                            }`}
                                        >
                                            <td className="pl-12 pr-3 py-2">
                                                <span className={`font-bold text-xs ${
                                                    isToday ? "text-primary" : ""
                                                }`}>
                                                    {fmtDate(trip.tripDate)}
                                                </span>
                                                {isToday && (
                                                    <span className="ml-1.5 text-[9px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        Today
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2"><StatusBadge status={trip.status} /></td>
                                            <td className="px-3 py-2 text-xs font-bold">{trip.departureTime}</td>
                                            <td className="px-3 py-2">
                                                <span className={`text-xs font-bold ${
                                                    occPct >= 80 ? "text-emerald-600" :
                                                    occPct >= 50 ? "text-amber-600" :
                                                    "text-muted-foreground"
                                                }`}>
                                                    {sold}/{totalSeatsT || "?"}
                                                </span>
                                                {totalSeatsT > 0 && (
                                                    <span className="text-[10px] text-muted-foreground ml-1">({occPct}%)</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs font-bold">{fmtCurrency(bs?.revenue || 0)}</td>
                                            <td className="px-3 py-2">
                                                {hasException
                                                    ? <ExceptionBadge type={trip.exceptionType} />
                                                    : <span className="text-xs text-muted-foreground/30">—</span>
                                                }
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => navigate(`/admin/fleets/${busId}/workstation`)}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function AllTripsTab() {
    const navigate = useNavigate();
    const [page,        setPage]        = useState(1);
    const [statusFilter,setStatus]      = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm,  setSearchTerm]  = useState("");

    // Fetch a larger page so grouping is meaningful — 100 trips
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["trip-search", statusFilter, searchTerm, page],
        queryFn: () => searchTrips({
            page,
            limit: 100,
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: searchTerm || undefined,
        }),
        staleTime: 30_000,
    });

    const trips      = data?.trips || [];
    const pagination = data?.pagination;
    const busGroups  = groupByBus(trips);

    const handleSearch = () => {
        setSearchTerm(searchInput.trim());
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2 flex-1 min-w-[240px] max-w-md">
                    <Input
                        placeholder="Search bus, direction, city…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="h-9 rounded-lg text-sm"
                    />
                    <Button size="sm" onClick={handleSearch} className="h-9 rounded-lg px-3">
                        <Search className="w-4 h-4" />
                    </Button>
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                    <SelectTrigger className="w-40 h-9 rounded-lg">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_FILTERS.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">
                                {s === "all" ? "All Statuses" : s.replace("-", " ")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 rounded-lg">
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Result summary */}
            {pagination && (
                <p className="text-xs text-muted-foreground">
                    {pagination.total} trips across{" "}
                    <strong>{busGroups.size}</strong> bus{busGroups.size !== 1 ? "es" : ""}
                    {statusFilter !== "all" && ` · filtered by "${statusFilter.replace("-", " ")}"`}
                    {searchTerm && ` · searching "${searchTerm}"`}
                    {" · "}
                    <button className="underline" onClick={() => setStatus("all")}>
                        clear filters
                    </button>
                </p>
            )}

            {/* Bus accordion list */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3 px-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Bus className="h-4 w-4" /> Fleet Trip View
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Click a bus to expand its trips
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-muted-foreground">Failed to load trips.</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : busGroups.size === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <Bus className="h-10 w-10 text-muted-foreground/30" />
                            <p className="font-bold text-muted-foreground">No trips found</p>
                            <p className="text-sm text-muted-foreground/60">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div>
                            {Array.from(busGroups.entries()).map(([busId, busTrips]) => (
                                <BusGroup
                                    key={busId}
                                    busId={busId}
                                    trips={busTrips}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <Button
                                variant="outline" size="sm"
                                disabled={page === 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="font-bold rounded-lg"
                            >
                                ← Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} trips
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={page === pagination.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="font-bold rounded-lg"
                            >
                                Next →
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: ROUTE PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

const PERF_CONFIG: Record<PerformanceTier, { bg: string; text: string; bar: string; label: string; icon: React.ReactNode }> = {
    CRITICAL: { bg: "bg-red-500/8",     text: "text-red-600",     bar: "bg-red-500",     label: "Critical",  icon: <TrendingDown className="w-3.5 h-3.5" /> },
    LOW:      { bg: "bg-amber-500/8",   text: "text-amber-600",   bar: "bg-amber-500",   label: "Low",       icon: <TrendingDown className="w-3.5 h-3.5" /> },
    MODERATE: { bg: "bg-blue-500/8",    text: "text-blue-600",    bar: "bg-blue-400",    label: "Moderate",  icon: <Minus className="w-3.5 h-3.5" /> },
    HEALTHY:  { bg: "bg-emerald-500/8", text: "text-emerald-600", bar: "bg-emerald-500", label: "Healthy",   icon: <TrendingUp className="w-3.5 h-3.5" /> },
    NO_DATA:  { bg: "bg-muted/30",      text: "text-muted-foreground", bar: "bg-muted",  label: "No Data",   icon: <Minus className="w-3.5 h-3.5" /> },
};

const LoadBar = ({ value, tier }: { value: number | null; tier: PerformanceTier }) => {
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const cfg = PERF_CONFIG[tier];
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-xs font-black w-8 text-right ${cfg.text}`}>
                {value !== null ? `${value}%` : "—"}
            </span>
        </div>
    );
};

const PerfBadge = ({ tier }: { tier: PerformanceTier }) => {
    const cfg = PERF_CONFIG[tier];
    return (
        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border-0 gap-1 ${cfg.bg} ${cfg.text}`}>
            {cfg.icon} {cfg.label}
        </Badge>
    );
};

const getRouteName = (entry: RoutePerformanceEntry) => {
    const v = entry.schedule.variantId;
    if (!v?.corridorId) return "—";
    const o = v.corridorId.originId?.name || "?";
    const d = v.corridorId.destinationId?.name || "?";
    return v.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

const WINDOW_OPTIONS = [
    { value: 7,   label: "Last 7 days" },
    { value: 30,  label: "Last 30 days" },
    { value: 90,  label: "Last 90 days" },
];

function RoutePerformanceTab() {
    const [windowDays, setWindowDays] = useState(30);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["route-performance", windowDays],
        queryFn: () => getRoutePerformance({ days: windowDays }),
        staleTime: 60_000,
    });

    const kpis   = data?.kpis;
    const routes = data?.routes || [];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Avg Load Factor"
                    value={kpis ? `${kpis.avgLoadFactor}%` : "—"}
                    icon={<TrendingUp className="w-5 h-5" />}
                    accent={
                        kpis?.avgLoadFactor !== undefined
                            ? kpis.avgLoadFactor >= 70 ? "text-emerald-600"
                            : kpis.avgLoadFactor >= 55 ? "text-blue-600"
                            : kpis.avgLoadFactor >= 30 ? "text-amber-600"
                            : "text-red-600"
                            : "text-muted-foreground"
                    }
                    sub="platform average"
                />
                <KpiCard
                    label="Avg Completion Rate"
                    value={kpis ? `${kpis.avgCompletionRate}%` : "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent={kpis?.avgCompletionRate !== undefined && kpis.avgCompletionRate >= 90 ? "text-emerald-600" : "text-amber-600"}
                    sub="trips that ran vs scheduled"
                />
                <KpiCard
                    label="Critical Routes"
                    value={kpis?.critical ?? "—"}
                    icon={<XCircle className="w-5 h-5" />}
                    accent={kpis?.critical ? "text-red-600" : "text-emerald-600"}
                    sub="load factor <30% or cancel >20%"
                />
                <KpiCard
                    label="Healthy Routes"
                    value={kpis?.healthy ?? "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent="text-emerald-600"
                    sub={`of ${kpis?.totalRoutes ?? 0} total`}
                />
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" /> Route Performance
                            <span className="text-xs font-normal text-muted-foreground/50 normal-case tracking-normal">
                                — worst performers first
                            </span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Select
                                value={String(windowDays)}
                                onValueChange={v => setWindowDays(Number(v))}
                            >
                                <SelectTrigger className="w-36 h-8 rounded-lg text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WINDOW_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={String(o.value)} className="text-xs">
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 rounded-lg">
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-muted-foreground">Failed to load route performance.</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
                            <p className="font-bold text-muted-foreground">No active schedules found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Performance</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Route</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Timing</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-[160px]">Load Factor</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Completion</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Cancellation</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Revenue</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Trips</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {routes.map((entry) => {
                                        const m = entry.metrics;
                                        const cfg = PERF_CONFIG[m.performance];
                                        return (
                                            <TableRow
                                                key={entry.schedule._id}
                                                className={`hover:bg-muted/10 ${m.performance === "CRITICAL" ? cfg.bg : ""}`}
                                            >
                                                <TableCell>
                                                    <PerfBadge tier={m.performance} />
                                                </TableCell>
                                                <TableCell className="font-bold text-sm">
                                                    {entry.schedule.brandId?.brandName || "—"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {getRouteName(entry)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-bold">{entry.schedule.departureTime}</span>
                                                    <span className="text-muted-foreground/40"> → </span>
                                                    <span className="text-sm text-muted-foreground">{entry.schedule.arrivalTime}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <LoadBar value={m.loadFactor} tier={m.performance} />
                                                    {m.busSeats > 0 && m.totalSeatsSold > 0 && (
                                                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                                            {m.totalSeatsSold} seats / {m.completedTrips} trips
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-black ${
                                                        m.completionRate === null ? "text-muted-foreground" :
                                                        m.completionRate >= 90 ? "text-emerald-600" :
                                                        m.completionRate >= 70 ? "text-amber-600" : "text-red-600"
                                                    }`}>
                                                        {m.completionRate !== null ? `${m.completionRate}%` : "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-black ${
                                                        !m.cancellationRate ? "text-emerald-600" :
                                                        m.cancellationRate > 20 ? "text-red-600" :
                                                        m.cancellationRate > 10 ? "text-amber-600" : "text-emerald-600"
                                                    }`}>
                                                        {m.cancellationRate !== null ? `${m.cancellationRate}%` : "—"}
                                                    </span>
                                                    {m.cancelledTrips > 0 && (
                                                        <p className="text-[10px] text-muted-foreground/50">{m.cancelledTrips} trips</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtCurrency(m.totalRevenue)}</div>
                                                    {m.avgRevenuePerTrip > 0 && (
                                                        <div className="text-[10px] text-muted-foreground/50">
                                                            {fmtCurrency(m.avgRevenuePerTrip)} / trip
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-bold">{m.totalTrips}</div>
                                                    <div className="text-[10px] text-muted-foreground/50">
                                                        {m.completedTrips}✓ · {m.cancelledTrips}✗
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
                <span className="font-bold uppercase tracking-wider">Load Factor Thresholds:</span>
                <span><span className="text-red-600 font-bold">&lt;30%</span> Critical</span>
                <span><span className="text-amber-600 font-bold">30–54%</span> Low</span>
                <span><span className="text-blue-600 font-bold">55–69%</span> Moderate</span>
                <span><span className="text-emerald-600 font-bold">≥70%</span> Healthy</span>
                <span className="text-muted-foreground/40">·</span>
                <span>Based on last {windowDays} days of completed trips</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TripManagement() {
    const [activeTab, setActiveTab] = useState<TabKey>("exceptions");

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Trip Control Center</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Platform-wide trip oversight — exception triage, generation health, and global search.
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                            ${activeTab === tab.key
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <Separator className="opacity-30" />

            {/* Tab Content */}
            {activeTab === "exceptions"        && <ExceptionTriageTab />}
            {activeTab === "schedule-health"   && <ScheduleHealthTab />}
            {activeTab === "route-performance" && <RoutePerformanceTab />}
            {activeTab === "all-trips"         && <AllTripsTab />}
        </div>
    );
}
