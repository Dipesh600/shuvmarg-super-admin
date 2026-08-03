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
    burstGenerateTrips,
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
    CANCELLED:   { bg: "bg-white/5",    text: "text-white",    label: "Cancelled" },
    RESCHEDULED: { bg: "bg-white/5",  text: "text-white",  label: "Rescheduled" },
    EXTRA_RUN:   { bg: "bg-white/5", text: "text-white", label: "Extra Run" },
    NONE:        { bg: "bg-white/5",         text: "text-white/60", label: "Normal" },
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
    scheduled:    { bg: "bg-white/5",    text: "text-white" },
    boarding:     { bg: "bg-white/5",   text: "text-white" },
    "in-transit": { bg: "bg-white/5",  text: "text-white" },
    completed:    { bg: "bg-white/5", text: "text-white" },
    cancelled:    { bg: "bg-white/5",     text: "text-white" },
};

const StatusBadge = ({ status }: { status: TripStatus }) => {
    const s = STATUS_STYLES[status] || { bg: "bg-white/5", text: "text-white/60" };
    return (
        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border-0 ${s.bg} ${s.text}`}>
            {status.replace("-", " ")}
        </Badge>
    );
};

// ── Health Status Badge ──────────────────────────────────────────────────────

const HEALTH_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    CRITICAL: { bg: "bg-white/5",     text: "text-white",     icon: <XCircle className="w-3.5 h-3.5" /> },
    WARNING:  { bg: "bg-white/5",   text: "text-white",   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    HEALTHY:  { bg: "bg-white/5", text: "text-white", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
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
    <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">{label}</p>
                    <p className={`text-2xl font-black tracking-tighter mt-1 ${accent}`}>{value}</p>
                    {sub && <p className="text-[11px] text-white/60 mt-0.5">{sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
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
                    accent={kpis?.todayExceptions ? "text-white" : "text-white/60"}
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
                    accent={kpis?.revenueAtRisk ? "text-white" : "text-white/60"}
                />
                <KpiCard
                    label="Stuck Trips"
                    value={kpis?.stuckTrips ?? "—"}
                    icon={<Clock className="w-5 h-5" />}
                    accent={kpis?.stuckTrips ? "text-white" : "text-white"}
                    sub="boarding >3h or transit >24h"
                />
                <KpiCard
                    label="Pending Refunds"
                    value={kpis?.pendingRefunds ?? "—"}
                    icon={<IndianRupee className="w-5 h-5" />}
                    accent={kpis?.pendingRefunds ? "text-white" : "text-white/60"}
                    sub="platform-wide"
                />
            </div>

            {/* Stuck Trips Alert */}
            {stuckTrips.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-white" />
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                            {stuckTrips.length} Stuck Trip{stuckTrips.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {stuckTrips.map((trip) => (
                            <div key={trip._id} className="flex items-center justify-between bg-[#121212]/30 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={trip.status} />
                                    <span className="text-sm font-bold">{trip.directionLabel || "—"}</span>
                                    <span className="text-xs text-white/60">
                                        {trip.brandId?.brandName} · {fmtDate(trip.tripDate)} · {trip.departureTime}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => trip.busId?._id && navigate(`/admin/fleets/${trip.busId._id}/workstation`)}
                                    className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 rounded-lg text-xs font-bold gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" /> Workstation
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Exception Table */}
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <AlertTriangle className="h-4 w-4" /> Exception Trips
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-8 rounded-lg">
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-white/60">Failed to load exception data.</p>
                            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : exceptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <CheckCircle2 className="h-10 w-10 text-white/60" />
                            <p className="font-bold text-white/60">No exceptions in the selected window</p>
                            <p className="text-sm text-white/50">All trips are running normally.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/5 border-b border-white/5 bg-white/5 border-b border-white/5">
                                    <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors bg-white/5">
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Direction</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Exception</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Bookings</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Revenue Impact</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Reason</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exceptions.map((trip) => {
                                        const bs = trip.bookingStats;
                                        const rs = trip.refundStats;
                                        return (
                                            <TableRow key={trip._id} className="hover:bg-white/5">
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtDate(trip.tripDate)}</div>
                                                    <div className="text-[11px] text-white/60">{trip.departureTime}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-bold">{trip.brandId?.brandName || "—"}</span>
                                                </TableCell>
                                                <TableCell className="text-sm">{getDirection(trip)}</TableCell>
                                                <TableCell><ExceptionBadge type={trip.exceptionType} /></TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <span className="font-bold">{bs?.booked || 0}</span>
                                                        <span className="text-white/60"> booked</span>
                                                    </div>
                                                    {(bs?.cancelled ?? 0) > 0 && (
                                                        <div className="text-[11px] text-white">{bs?.cancelled} cancelled</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtCurrency(bs?.revenue || 0)}</div>
                                                    {(rs?.pendingCount ?? 0) > 0 && (
                                                        <div className="text-[11px] text-white">
                                                            {rs?.pendingCount} refund{(rs?.pendingCount ?? 0) > 1 ? "s" : ""} pending
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <p className="text-xs text-white/60 truncate">
                                                        {trip.cancellationReason || trip.rescheduleReason || "—"}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => trip.busId?._id && navigate(`/admin/fleets/${trip.busId._id}/workstation`)}
                                                        className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 rounded-lg text-xs font-bold gap-1"
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
                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white font-bold rounded-lg"
                            >
                                ← Previous
                            </Button>
                            <span className="text-xs text-white/60">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} exceptions
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={page === pagination.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white font-bold rounded-lg"
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
    const navigate = useNavigate();
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["schedule-health"],
        queryFn: () => getScheduleHealth(),
        staleTime: 60_000,
    });

    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleBurstGenerate = async (scheduleId: string) => {
        setGeneratingId(scheduleId);
        try {
            const result = await burstGenerateTrips(scheduleId);
            // Show inline feedback via refetch
            await refetch();
            // Simple alert — can swap for toast later
            alert(`Generation complete: ${result.generated} trips created, ${result.skipped} skipped.`);
        } catch {
            alert("Failed to regenerate trips. Check server logs.");
        } finally {
            setGeneratingId(null);
        }
    };

    const kpis = data?.kpis;
    const schedules = data?.schedules || [];
    const suspended = data?.suspended || [];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <KpiCard
                    label="Active Schedules"
                    value={kpis?.totalActive ?? "—"}
                    icon={<Activity className="w-5 h-5" />}
                    accent="text-white"
                />
                <KpiCard
                    label="Suspended"
                    value={kpis?.totalSuspended ?? "—"}
                    icon={<PauseCircle className="w-5 h-5" />}
                    accent={kpis?.totalSuspended ? "text-white" : "text-white/60"}
                />
                <KpiCard
                    label="Critical"
                    value={kpis?.critical ?? "—"}
                    icon={<XCircle className="w-5 h-5" />}
                    accent={kpis?.critical ? "text-white" : "text-white/60"}
                    sub="generation gap >7 days"
                />
                <KpiCard
                    label="Warnings"
                    value={kpis?.warnings ?? "—"}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    accent={kpis?.warnings ? "text-white" : "text-white/60"}
                    sub="generation gap 3-7 days"
                />
                <KpiCard
                    label="Healthy"
                    value={kpis?.healthy ?? "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent="text-white"
                />
                <KpiCard
                    label="Missing Trips"
                    value={kpis?.totalMissing ?? "—"}
                    icon={<AlertCircle className="w-5 h-5" />}
                    accent={kpis?.totalMissing ? "text-white" : "text-white"}
                    sub="across all active schedules"
                />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SUSPENDED SCHEDULES — now with full impact data
               ══════════════════════════════════════════════════════════════════ */}
            {suspended.length > 0 && (
                <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden border-white/10">
                    <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <PauseCircle className="w-4 h-4 text-white" />
                            <CardTitle className="flex items-center gap-2 text-white">
                                {suspended.length} Suspended Schedule{suspended.length > 1 ? "s" : ""}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {suspended.map((entry) => {
                                const si = entry.suspensionInfo;
                                const h = entry.health;
                                const s = entry.schedule;
                                return (
                                    <div key={s._id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                                        {/* Row 1: Brand, Route, Timing */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-sm font-bold">{s.brandId?.brandName || "—"}</span>
                                                <span className="text-xs text-white/60">
                                                    {getSchedDirection(entry)} · {s.departureTime} → {s.arrivalTime}
                                                </span>
                                                {s.busId && (
                                                    <span className="text-[10px] text-white/60 bg-white/5 px-1.5 py-0.5 rounded">
                                                        {s.busId.busName || s.busId.busNumber || "—"}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => s.busId?._id && navigate(`/admin/fleets/${s.busId._id}/workstation`)}
                                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 rounded-lg text-xs font-bold gap-1 shrink-0"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Workstation
                                            </Button>
                                        </div>

                                        {/* Row 2: Suspension reason */}
                                        {si?.reason && (
                                            <div className="mt-1.5 flex items-start gap-1.5">
                                                <AlertTriangle className="w-3 h-3 text-white mt-0.5 shrink-0" />
                                                <p className="text-xs text-white">{si.reason}</p>
                                            </div>
                                        )}

                                        {/* Row 3: Impact metrics */}
                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                                            {si && (
                                                <>
                                                    <div>
                                                        <span className="text-white/60">Suspended for </span>
                                                        <span className="font-bold text-white">{si.daysSuspended} day{si.daysSuspended !== 1 ? "s" : ""}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/60">Missed trips: </span>
                                                        <span className="font-bold text-white">{si.missedTrips}</span>
                                                    </div>
                                                    {si.autoResumeDate && (
                                                        <div>
                                                            <span className="text-white/60">Auto-resume: </span>
                                                            <span className="font-bold text-white">{fmtDateFull(si.autoResumeDate)}</span>
                                                        </div>
                                                    )}
                                                    {!si.autoResumeDate && (
                                                        <div>
                                                            <span className="font-bold text-white">Manual resume required</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div>
                                                <span className="text-white/60">Last generated: </span>
                                                <span className="font-bold">{h.lastGeneratedDate ? fmtDateFull(h.lastGeneratedDate) : "Never"}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/60">Upcoming trips: </span>
                                                <span className="font-bold">{h.upcomingTrips}</span>
                                            </div>
                                            {h.cancelledTrips > 0 && (
                                                <div>
                                                    <span className="text-white/60">Cancelled: </span>
                                                    <span className="font-bold text-white">{h.cancelledTrips}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                GENERATION HEALTH TABLE — with missing dates + regenerate action
               ══════════════════════════════════════════════════════════════════ */}
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Activity className="h-4 w-4" /> Generation Health
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-8 rounded-lg"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-white/60">Failed to load schedule health.</p>
                            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <Activity className="h-10 w-10 text-white/20" />
                            <p className="font-bold text-white/60">No active schedules found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/5 border-b border-white/5 bg-white/5 border-b border-white/5">
                                    <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors bg-white/5">
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Health</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Route</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Timing</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Trip Horizon</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Gap</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Missing</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Last Generated</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Trips</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Bus</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest w-[120px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.map((entry) => {
                                        const h = entry.health;
                                        const s = entry.schedule;
                                        const isExpanded = expandedRow === s._id;
                                        const isGenerating = generatingId === s._id;
                                        return (
                                            <>
                                                <TableRow
                                                    key={s._id}
                                                    className={`hover:bg-white/5 ${h.status === "CRITICAL" ? "bg-white/5" : ""}`}
                                                >
                                                    <TableCell><HealthBadge status={h.status} /></TableCell>
                                                    <TableCell className="font-bold text-sm">{s.brandId?.brandName || "—"}</TableCell>
                                                    <TableCell className="text-sm">{getSchedDirection(entry)}</TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-bold">{s.departureTime}</span>
                                                        <span className="text-white/30"> → </span>
                                                        <span className="text-sm text-white/60">{s.arrivalTime}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <span className="font-bold">{fmtDate(h.actualHorizon)}</span>
                                                            <span className="text-white/30"> / </span>
                                                            <span className="text-white/60">{fmtDate(h.expectedHorizon)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-white/40">actual / expected</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`text-sm font-black ${
                                                            h.gapDays > 7 ? "text-white" :
                                                            h.gapDays > 3 ? "text-white" :
                                                            "text-white"
                                                        }`}>
                                                            {h.gapDays > 0 ? `${h.gapDays}d short` : "On track"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {h.missingCount > 0 ? (
                                                            <button
                                                                onClick={() => setExpandedRow(isExpanded ? null : s._id)}
                                                                className="flex items-center gap-1 group"
                                                            >
                                                                <span className="text-sm font-black text-white">
                                                                    {h.missingCount} trip{h.missingCount > 1 ? "s" : ""}
                                                                </span>
                                                                <ChevronDown className={`w-3 h-3 text-white transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-white font-bold">All good</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-bold">
                                                            {h.lastGeneratedDate ? fmtDate(h.lastGeneratedDate) : "—"}
                                                        </div>
                                                        {h.lastGeneratedAt && (
                                                            <div className="text-[10px] text-white/40">
                                                                ran {fmtDateFull(h.lastGeneratedAt)}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <span className="font-bold">{h.upcomingTrips}</span>
                                                            <span className="text-white/60"> upcoming</span>
                                                        </div>
                                                        {h.cancelledTrips > 0 && (
                                                            <div className="text-[11px] text-white">{h.cancelledTrips} cancelled</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-white/60">
                                                        {s.busId?.busName || s.busId?.busNumber || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {h.missingCount > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isGenerating}
                                                                onClick={() => handleBurstGenerate(s._id)}
                                                                className={`bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 rounded-lg text-xs font-bold gap-1 ${
                                                                    h.status === "CRITICAL"
                                                                        ? "border-white/10 text-white hover:bg-white/5"
                                                                        : "border-white/10 text-white hover:bg-white/5"
                                                                }`}
                                                            >
                                                                {isGenerating ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="w-3 h-3" />
                                                                )}
                                                                {isGenerating ? "Generating…" : "Regenerate"}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded: Show missing dates */}
                                                {isExpanded && h.missingDates.length > 0 && (
                                                    <TableRow key={`${s._id}-expanded`} className="bg-white/5">
                                                        <TableCell colSpan={11} className="py-3 px-6">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                                                                    <span className="text-xs font-black text-white uppercase tracking-wider">
                                                                        Missing Trip Dates ({h.missingCount})
                                                                    </span>
                                                                    <span className="text-[10px] text-white/60">
                                                                        — Trips expected but not generated for these dates
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {h.missingDates.slice(0, 60).map((dateStr) => {
                                                                        const d = new Date(dateStr);
                                                                        const isNear = (d.getTime() - Date.now()) < 7 * 86400000;
                                                                        return (
                                                                            <span
                                                                                key={dateStr}
                                                                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                                    isNear
                                                                                        ? "bg-white/5 text-white border border-white/10"
                                                                                        : "bg-white/5 text-white border border-white/10"
                                                                                }`}
                                                                            >
                                                                                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {h.missingDates.length > 60 && (
                                                                        <span className="text-[10px] text-white/60 font-bold px-2 py-0.5">
                                                                            +{h.missingDates.length - 60} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-white/60">
                                                                        <span className="inline-block w-2 h-2 rounded-sm bg-white/5 border border-white/10 mr-1 align-middle" />
                                                                        Within 7 days (urgent)
                                                                    </span>
                                                                    <span className="text-[10px] text-white/60">
                                                                        <span className="inline-block w-2 h-2 rounded-sm bg-white/5 border border-white/10 mr-1 align-middle" />
                                                                        Future
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
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

    // Today's trip (or nearest upcoming)
    const today = new Date().toISOString().slice(0, 10);
    const todayTrip = trips.find(t => t.tripDate?.slice(0, 10) === today)
                   ?? trips.find(t => t.tripDate >= today);

    return (
        <div className="border-b border-white/5 last:border-0">
            {/* Bus header row — always visible */}
            <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                onClick={() => setOpen(o => !o)}
            >
                {/* Expand icon */}
                <span className="text-white/60 shrink-0">
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
                            <span className="text-[10px] text-white/60 bg-white/5 px-1.5 py-0.5 rounded">
                                {busNum}
                            </span>
                        )}
                        <Badge variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white text-[10px] font-semibold">{brand}</Badge>
                        {todayTrip && (
                            <StatusBadge status={todayTrip.status} />
                        )}
                        {exceptions > 0 && (
                            <Badge className="text-[10px] font-black bg-white/5 text-white border-0">
                                {exceptions} exception{exceptions > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-white/60 mt-0.5 truncate">
                        {route} · {departs}
                    </div>
                </div>

                {/* Summary stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
                    <div>
                        <p className="text-[10px] text-white/60 uppercase tracking-wide">Trips</p>
                        <p className="font-bold text-sm">{totalTrips}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-white/60 uppercase tracking-wide">Avg Occ</p>
                        <p className={`font-bold text-sm ${
                            avgOcc >= 80 ? "text-white" :
                            avgOcc >= 50 ? "text-white" :
                            "text-white/60"
                        }`}>{avgOcc}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-white/60 uppercase tracking-wide">Revenue</p>
                        <p className="font-bold text-sm">{fmtCurrency(totalRevenue)}</p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 text-xs gap-1 rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/fleets/${busId}/workstation`);
                        }}
                    >
                        <ExternalLink className="h-3 w-3" /> Workstation
                    </Button>
                </div>
            </button>

            {/* Expanded trip details */}
            {open && (
                <div className="p-4 bg-white/5 space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-white/60 font-bold text-xs">Date</TableHead>
                                <TableHead className="text-white/60 font-bold text-xs text-center">Status</TableHead>
                                <TableHead className="text-white/60 font-bold text-xs text-center">Occupancy</TableHead>
                                <TableHead className="text-white/60 font-bold text-xs text-right">Revenue</TableHead>
                                <TableHead className="text-white/60 font-bold text-xs text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trips.map(trip => {
                                const totalSeatsNum = trip.busId?.totalSeats || 0;
                                const occPct = totalSeatsNum > 0 ? Math.round(((trip.bookingStats?.seatsSold || 0) / totalSeatsNum) * 100) : 0;
                                return (
                                    <TableRow key={trip._id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-medium text-xs text-white">
                                            {fmtDateFull(trip.tripDate)}
                                            {trip.exceptionType && trip.exceptionType !== "NONE" && (
                                                <Badge className="ml-2 text-[9px] bg-white/5 text-white border-0">
                                                    {trip.exceptionType}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={trip.status} />
                                        </TableCell>
                                        <TableCell className="text-center text-xs">
                                            <span className="font-bold text-white">{trip.bookingStats?.seatsSold || 0}</span>
                                            <span className="text-white/60"> / {trip.busId?.totalSeats || "?"} ({occPct}%)</span>
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-white">
                                            {fmtCurrency(trip.bookingStats?.revenue || 0)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-7 text-xs rounded-lg"
                                                onClick={() => navigate(`/admin/trips/${trip._id}`)}
                                            >
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
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
                <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-9 rounded-lg">
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Result summary */}
            {pagination && (
                <p className="text-xs text-white/60">
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
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Bus className="h-4 w-4" /> Fleet Trip View
                        </CardTitle>
                        <p className="text-xs text-white/60">
                            Click a bus to expand its trips
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-white/60">Failed to load trips.</p>
                            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : busGroups.size === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <Bus className="h-10 w-10 text-white/20" />
                            <p className="font-bold text-white/60">No trips found</p>
                            <p className="text-sm text-white/50">Try adjusting your filters.</p>
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
                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white font-bold rounded-lg"
                            >
                                ← Previous
                            </Button>
                            <span className="text-xs text-white/60">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} trips
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={page === pagination.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white font-bold rounded-lg"
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
    CRITICAL: { bg: "bg-white/5",     text: "text-white",     bar: "bg-white/5",     label: "Critical",  icon: <TrendingDown className="w-3.5 h-3.5" /> },
    LOW:      { bg: "bg-white/5",   text: "text-white",   bar: "bg-white/5",   label: "Low",       icon: <TrendingDown className="w-3.5 h-3.5" /> },
    MODERATE: { bg: "bg-white/5",    text: "text-white",    bar: "bg-white/5",    label: "Moderate",  icon: <Minus className="w-3.5 h-3.5" /> },
    HEALTHY:  { bg: "bg-white/5", text: "text-white", bar: "bg-white/5", label: "Healthy",   icon: <TrendingUp className="w-3.5 h-3.5" /> },
    NO_DATA:  { bg: "bg-white/5",      text: "text-white/60", bar: "bg-white/5",  label: "No Data",   icon: <Minus className="w-3.5 h-3.5" /> },
};

const LoadBar = ({ value, tier }: { value: number | null; tier: PerformanceTier }) => {
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const cfg = PERF_CONFIG[tier];
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5/40 rounded-full overflow-hidden">
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
                            ? kpis.avgLoadFactor >= 70 ? "text-white"
                            : kpis.avgLoadFactor >= 55 ? "text-white"
                            : kpis.avgLoadFactor >= 30 ? "text-white"
                            : "text-white"
                            : "text-white/60"
                    }
                    sub="platform average"
                />
                <KpiCard
                    label="Avg Completion Rate"
                    value={kpis ? `${kpis.avgCompletionRate}%` : "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent={kpis?.avgCompletionRate !== undefined && kpis.avgCompletionRate >= 90 ? "text-white" : "text-white"}
                    sub="trips that ran vs scheduled"
                />
                <KpiCard
                    label="Critical Routes"
                    value={kpis?.critical ?? "—"}
                    icon={<XCircle className="w-5 h-5" />}
                    accent={kpis?.critical ? "text-white" : "text-white"}
                    sub="load factor <30% or cancel >20%"
                />
                <KpiCard
                    label="Healthy Routes"
                    value={kpis?.healthy ?? "—"}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    accent="text-white"
                    sub={`of ${kpis?.totalRoutes ?? 0} total`}
                />
            </div>

            {/* Table */}
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <TrendingDown className="h-4 w-4" /> Route Performance
                            <span className="text-xs font-normal text-white/40 normal-case tracking-normal">
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
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white h-8 rounded-lg">
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-12">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-white/60">Failed to load route performance.</p>
                            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white" size="sm" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-16">
                            <BarChart3 className="h-10 w-10 text-white/20" />
                            <p className="font-bold text-white/60">No active schedules found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/5 border-b border-white/5 bg-white/5 border-b border-white/5">
                                    <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors bg-white/5">
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Performance</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Route</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Timing</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest w-[160px]">Load Factor</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Completion</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Cancellation</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Revenue</TableHead>
                                        <TableHead className="text-white/80 font-semibold text-[10px] font-black uppercase tracking-widest">Trips</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {routes.map((entry) => {
                                        const m = entry.metrics;
                                        const cfg = PERF_CONFIG[m.performance];
                                        return (
                                            <TableRow
                                                key={entry.schedule._id}
                                                className={`hover:bg-white/5 ${m.performance === "CRITICAL" ? cfg.bg : ""}`}
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
                                                    <span className="text-white/30"> → </span>
                                                    <span className="text-sm text-white/60">{entry.schedule.arrivalTime}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <LoadBar value={m.loadFactor} tier={m.performance} />
                                                    {m.busSeats > 0 && m.totalSeatsSold > 0 && (
                                                        <p className="text-[10px] text-white/40 mt-0.5">
                                                            {m.totalSeatsSold} seats / {m.completedTrips} trips
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-black ${
                                                        m.completionRate === null ? "text-white/60" :
                                                        m.completionRate >= 90 ? "text-white" :
                                                        m.completionRate >= 70 ? "text-white" : "text-white"
                                                    }`}>
                                                        {m.completionRate !== null ? `${m.completionRate}%` : "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-black ${
                                                        !m.cancellationRate ? "text-white" :
                                                        m.cancellationRate > 20 ? "text-white" :
                                                        m.cancellationRate > 10 ? "text-white" : "text-white"
                                                    }`}>
                                                        {m.cancellationRate !== null ? `${m.cancellationRate}%` : "—"}
                                                    </span>
                                                    {m.cancelledTrips > 0 && (
                                                        <p className="text-[10px] text-white/40">{m.cancelledTrips} trips</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{fmtCurrency(m.totalRevenue)}</div>
                                                    {m.avgRevenuePerTrip > 0 && (
                                                        <div className="text-[10px] text-white/40">
                                                            {fmtCurrency(m.avgRevenuePerTrip)} / trip
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-bold">{m.totalTrips}</div>
                                                    <div className="text-[10px] text-white/40">
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
            <div className="flex flex-wrap gap-4 text-xs text-white/60 px-1">
                <span className="font-bold uppercase tracking-wider">Load Factor Thresholds:</span>
                <span><span className="text-white font-bold">&lt;30%</span> Critical</span>
                <span><span className="text-white font-bold">30–54%</span> Low</span>
                <span><span className="text-white font-bold">55–69%</span> Moderate</span>
                <span><span className="text-white font-bold">≥70%</span> Healthy</span>
                <span className="text-white/30">·</span>
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
                <p className="text-sm text-white/60 mt-1">
                    Platform-wide trip oversight — exception triage, generation health, and global search.
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                            ${activeTab === tab.key
                                ? "bg-[#121212]/30 shadow-sm text-foreground"
                                : "text-white/60 hover:text-foreground hover:bg-white/5"
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
