import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Clock, Users, CalendarOff,
    LogOut, CheckCircle, XCircle, RefreshCw, Calendar, X, Loader2, AlertTriangle,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import { useUpdateTripStatus } from "@/hooks/useFleetWorkstation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { toast } from "sonner";
import { ManifestDrawer } from "./ManifestDrawer";
import type {
    WorkstationFleet,
    WorkstationSchedule,
    WorkstationToday,
    WorkstationTrip,
} from "@/api/fleetWorkstationApi";
import type { TripStatus, TripVariant } from "@/api/tripApi";
import { getErrorMessage } from "@/lib/error-message";

interface OperationsTabProps {
    today?: WorkstationToday | null;
    recentTrips?: WorkstationTrip[];
    fleet: WorkstationFleet;
    fleetId: string;
    schedules?: WorkstationSchedule[];
}

// ─── STATUS HELPERS ──────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
    scheduled: "bg-white/5 text-white border-white/10",
    boarding: "bg-white/5 text-white border-white/10",
    "in-transit": "bg-white/5 text-white border-white/10",
    completed: "bg-white/5 text-white border-white/10",
    cancelled: "bg-white/5 text-white border-white/10",
};

const statusDot: Record<string, string> = {
    scheduled: "bg-white/5",
    boarding: "bg-white/5",
    "in-transit": "bg-white/5",
    completed: "bg-white/5",
    cancelled: "bg-white/5",
};

const statusBorder: Record<string, string> = {
    scheduled: "border-l-blue-500",
    boarding: "border-l-amber-500",
    "in-transit": "border-l-violet-500",
    completed: "border-l-emerald-500",
    cancelled: "border-l-red-500",
};

const statusBg: Record<string, string> = {
    scheduled: "bg-white/5 hover:bg-white/5",
    boarding: "bg-white/5 hover:bg-white/5",
    "in-transit": "bg-white/5 hover:bg-white/5",
    completed: "bg-white/5 hover:bg-white/5",
    cancelled: "bg-white/5 hover:bg-white/5",
};



const getDirection = (variant?: TripVariant, trip?: WorkstationTrip) => {
    if (trip?.directionLabel) return trip.directionLabel;
    if (!variant?.corridorId) return "—";
    const o = variant.corridorId.originId?.name || "?";
    const d = variant.corridorId.destinationId?.name || "?";
    return variant.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

// ─── CALENDAR HELPERS ────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ date: daysInPrevMonth - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        days.push({ date: d, month, year, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows
    for (let d = 1; d <= remaining; d++) {
        days.push({ date: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
    }

    return days;
};

const dateKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const isToday = (y: number, m: number, d: number) => {
    const now = new Date();
    return now.getFullYear() === y && now.getMonth() === m && now.getDate() === d;
};

// ─── TRIP CARD (Calendar Cell) ───────────────────────────────────────────────
const TripChip = ({ trip, totalSeats, onClick }: { trip: WorkstationTrip; totalSeats: number; onClick: () => void }) => {
    const s = trip.stats || {};
    const occ = s.occupancyPct || 0;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-lg border-l-[3px] px-2 py-1.5 transition-all duration-200 cursor-pointer group ${statusBorder[trip.status] || "border-l-muted"} ${statusBg[trip.status] || "bg-muted/5 hover:bg-muted/10"}`}
        >
            <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold leading-none">{trip.departureTime}</span>
                <Badge className={`text-[7px] uppercase font-black tracking-wider px-1 py-0 border-0 leading-tight ${statusStyles[trip.status] || "bg-muted"}`}>
                    {trip.status === "in-transit" ? "transit" : trip.status === "scheduled" ? "sched" : trip.status === "completed" ? "done" : trip.status}
                </Badge>
            </div>

            {/* Direction */}
            <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">
                {getDirection(trip.variantId, trip)}
            </p>

            {/* Occupancy bar */}
            {trip.status !== "cancelled" && (
                <div className="mt-1 flex items-center gap-1">
                    <div className="flex-1 h-[3px] bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${occ >= 80 ? "bg-white/5" : occ >= 50 ? "bg-white/5" : "bg-white/5"}`}
                            style={{ width: `${Math.min(100, occ)}%` }}
                        />
                    </div>
                    <span className={`text-[8px] font-black ${occ >= 80 ? "text-white" : occ >= 50 ? "text-white" : "text-white"}`}>
                        {s.booked || 0}/{totalSeats}
                    </span>
                </div>
            )}

            {/* Revenue for non-cancelled */}
            {trip.status !== "cancelled" && (s.revenue ?? 0) > 0 && (
                <p className="text-[8px] font-bold text-muted-foreground mt-0.5">
                    Rs.{s.revenue?.toLocaleString()}
                </p>
            )}

            {/* Cancellation reason for cancelled */}
            {trip.status === "cancelled" && trip.cancellationReason && (
                <p className="text-[8px] text-white truncate mt-0.5 italic">{trip.cancellationReason}</p>
            )}

            {trip.exceptionType === "EXTRA_RUN" && (
                <span className="text-[7px] font-black text-white uppercase">Extra Run</span>
            )}
            {trip.exceptionType === "RESCHEDULED" && (
                <span className="text-[7px] font-black text-white uppercase">Rescheduled</span>
            )}
        </button>
    );
};

// ─── CALENDAR VIEW COMPONENT ─────────────────────────────────────────────────
const CalendarView = ({
    trips,
    totalSeats,
    onTripClick,
}: {
    trips: WorkstationTrip[];
    totalSeats: number;
    onTripClick: (id: string) => void;
}) => {
    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Group trips by date key
    const tripsByDate = useMemo(() => {
        const map = new Map<string, WorkstationTrip[]>();
        for (const trip of trips) {
            const d = new Date(trip.tripDate);
            const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(trip);
        }
        // Sort each day's trips by departure time
        for (const [, dayTrips] of map) {
            dayTrips.sort((a, b) => (a.departureTime || "").localeCompare(b.departureTime || ""));
        }
        return map;
    }, [trips]);

    // Calendar grid
    const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

    // Stats for current view
    const monthStats = useMemo(() => {
        let scheduled = 0, completed = 0, cancelled = 0, inTransit = 0, boarding = 0, totalRevenue = 0, totalBooked = 0;
        for (const trip of trips) {
            const d = new Date(trip.tripDate);
            if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
                const s = trip.stats || {};
                switch (trip.status) {
                    case "scheduled": scheduled++; break;
                    case "completed": completed++; break;
                    case "cancelled": cancelled++; break;
                    case "in-transit": inTransit++; break;
                    case "boarding": boarding++; break;
                }
                totalRevenue += s.revenue || 0;
                totalBooked += s.booked || 0;
            }
        }
        return { scheduled, completed, cancelled, inTransit, boarding, totalRevenue, totalBooked, total: scheduled + completed + cancelled + inTransit + boarding };
    }, [trips, viewYear, viewMonth]);

    const navigateMonth = (delta: number) => {
        let m = viewMonth + delta;
        let y = viewYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setViewMonth(m);
        setViewYear(y);
    };

    const goToToday = () => {
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
    };

    return (
        <div className="space-y-4">
            {/* Month Summary Cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl bg-muted/30 border px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                    <p className="text-xl font-black">{monthStats.total}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">Scheduled</p>
                    <p className="text-xl font-black text-white">{monthStats.scheduled}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">Completed</p>
                    <p className="text-xl font-black text-white">{monthStats.completed}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">Cancelled</p>
                    <p className="text-xl font-black text-white">{monthStats.cancelled}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">In Transit</p>
                    <p className="text-xl font-black text-white">{monthStats.inTransit + monthStats.boarding}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">Revenue</p>
                    <p className="text-lg font-black text-white">₹{monthStats.totalRevenue.toLocaleString()}</p>
                </div>
            </div>

            {/* Calendar Header */}
            <Card className="overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)} className="h-8 w-8 p-0 rounded-lg">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h3 className="text-lg font-black tracking-tight min-w-[200px] text-center">
                                    {MONTH_NAMES[viewMonth]} {viewYear}
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)} className="h-8 w-8 p-0 rounded-lg">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg px-3">
                                Today
                            </Button>
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-1.5">
                            {[
                                { key: "all", label: "All", color: "bg-muted" },
                                { key: "scheduled", label: "Scheduled", color: "bg-white/5" },
                                { key: "completed", label: "Completed", color: "bg-white/5" },
                                { key: "cancelled", label: "Cancelled", color: "bg-white/5" },
                                { key: "in-transit", label: "In Transit", color: "bg-white/5" },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                                        statusFilter === f.key
                                            ? "bg-foreground text-background shadow-sm"
                                            : "text-muted-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-t border-b bg-muted/20">
                        {DAY_NAMES.map((day) => (
                            <div key={day} className="px-2 py-2 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const key = dateKey(day.year, day.month, day.date);
                            const dayTrips = (tripsByDate.get(key) || []).filter(
                                (trip) => statusFilter === "all" || trip.status === statusFilter
                            );
                            const isTodayCell = isToday(day.year, day.month, day.date);
                            const hasCancelled = dayTrips.some((trip) => trip.status === "cancelled");
                            const hasScheduled = dayTrips.some((trip) => trip.status === "scheduled");

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[120px] border-b border-r p-1.5 transition-colors ${
                                        !day.isCurrentMonth ? "bg-muted/10 opacity-40" : ""
                                    } ${isTodayCell ? "bg-primary/3 ring-1 ring-inset ring-primary/20" : ""}`}
                                >
                                    {/* Date number */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold leading-none ${
                                            isTodayCell
                                                ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                                : "text-muted-foreground"
                                        }`}>
                                            {day.date}
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            {hasCancelled && <span className="w-1.5 h-1.5 rounded-full bg-white/5" />}
                                            {hasScheduled && <span className="w-1.5 h-1.5 rounded-full bg-white/5" />}
                                        </div>
                                    </div>

                                    {/* Trip chips */}
                                    <div className="space-y-1">
                                        {dayTrips.slice(0, 4).map((trip) => (
                                            <TripChip
                                                key={trip._id}
                                                trip={trip}
                                                totalSeats={totalSeats}
                                                onClick={() => onTripClick(trip._id)}
                                            />
                                        ))}
                                        {dayTrips.length > 4 && (
                                            <p className="text-[9px] font-bold text-muted-foreground text-center py-0.5">
                                                +{dayTrips.length - 4} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
                <span className="font-bold uppercase tracking-wider">Status:</span>
                {Object.entries(statusDot).map(([status, dotClass]) => (
                    <span key={status} className="flex items-center gap-1 capitalize">
                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                        {status.replace("-", " ")}
                    </span>
                ))}
            </div>
        </div>
    );
};


// ─── MAIN OPERATIONS TAB ─────────────────────────────────────────────────────
const OperationsTab = ({ today, recentTrips, fleet, fleetId, schedules }: OperationsTabProps) => {
    const qc = useQueryClient();
    const todayTrip = today?.trip;
    
    // Modal states
    const [showCancelTripModal, setShowCancelTripModal] = useState<{ tripId: string; tripDate: string } | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState<{ tripId: string; departureTime: string; arrivalTime: string } | null>(null);
    const [showCancelRange, setShowCancelRange]         = useState(false);
    
    // Manifest Drawer state
    const [manifestTripId, setManifestTripId] = useState<string | null>(null);

    // Cancel Range states
    const [rangeFrom, setRangeFrom] = useState("");
    const [rangeTo, setRangeTo] = useState("");
    const [rangeReason, setRangeReason] = useState("");
    const [rangeSchedule, setRangeSchedule] = useState("");

    const cancelRangeMut = useMutation({
        mutationFn: () => api.post<{ message?: string }>(`/schedules/${rangeSchedule}/cancel-range`, { fromDate: rangeFrom, toDate: rangeTo, reason: rangeReason }),
        onSuccess: (response) => { toast.success(response.data.message || "Date-range exception applied."); setShowCancelRange(false); qc.invalidateQueries({ queryKey: ["fleetWorkstation"] }); },
        onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to cancel date range.")),
    });

    const updateStatusMutation = useUpdateTripStatus();
    const handleUpdateStatus = (tripId: string, newStatus: TripStatus, confirmationMsg: string) => {
        if (!confirm(confirmationMsg)) return;
        updateStatusMutation.mutate(
            { fleetId, tripId, payload: { status: newStatus } },
            {
                onSuccess: () => toast.success(`Trip marked as ${newStatus}`),
                onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to update trip status"))
            }
        );
    };

    return (
        <div className="space-y-6">
            
            {/* Manifest Drawer (Slide-in) */}
            <ManifestDrawer 
                fleetId={fleetId} 
                tripId={manifestTripId} 
                open={!!manifestTripId} 
                onOpenChange={(open) => !open && setManifestTripId(null)} 
            />

            {/* Date-Range Exception Card */}
            <Card className="border-white/10 bg-white/5">
                <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-white">Date-Range Exception</p>
                                <p className="text-xs text-white/60 mt-0.5">Cancel all trips between two dates (maintenance, road closure). Master schedule is NOT suspended.</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowCancelRange(true)} className="h-8 px-3 rounded-lg font-bold text-xs shrink-0 border-white/10 text-white hover:bg-white/5">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Set Exception Window
                        </Button>
                    </div>

                    {showCancelRange && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">Schedule</label>
                                    <select value={rangeSchedule} onChange={e => setRangeSchedule(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30">
                                        <option value="">Select schedule...</option>
                                        {(schedules || []).filter((schedule) => schedule.status === "ACTIVE").map((schedule) => (
                                            <option key={schedule._id} value={schedule._id}>{schedule.departureTime} → {schedule.arrivalTime} ({schedule.operationalModel})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">Reason</label>
                                    <input type="text" placeholder="e.g. Vehicle maintenance..." value={rangeReason} onChange={e => setRangeReason(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30" />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">From</label>
                                    <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30" />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">To</label>
                                    <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30" />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setShowCancelRange(false)} className="font-bold rounded-lg">Cancel</Button>
                                <Button size="sm" onClick={() => cancelRangeMut.mutate()} disabled={!rangeSchedule || !rangeFrom || !rangeTo || !rangeReason || cancelRangeMut.isPending} className="font-bold rounded-lg bg-white/5 hover:bg-white/5 text-white">
                                    {cancelRangeMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />} Apply Exception
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TABBED INTERFACE */}
            <Tabs defaultValue="today" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/30 border">
                    <TabsTrigger value="today" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Clock className="w-3.5 h-3.5" /> Today
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" /> Trip Calendar
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 text-[9px] bg-muted-foreground/20">{recentTrips?.length || 0}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* 1. TODAY TAB */}
                <TabsContent value="today" className="mt-4 outline-none">
                    {todayTrip ? (
                        <div className="space-y-4">
                            {/* Pulse Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Departure</p>
                                        <p className="text-2xl font-black text-white">{todayTrip.departureTime}</p>
                                        <Badge className={`text-[9px] uppercase font-bold border-0 px-2 py-0 ${statusStyles[todayTrip.status]}`}>{todayTrip.status}</Badge>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Seats Booked</p>
                                        <p className="text-2xl font-black text-white">{today.stats?.seatsSold || 0} / {fleet?.totalSeats || 0}</p>
                                        <p className="text-xs font-medium text-white/60">{today.stats?.occupancyPct || 0}% Occupancy</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Boarded</p>
                                        <p className="text-2xl font-black text-white">{today.stats?.boardingConfirmed || 0} / {today.stats?.totalBooked || 0}</p>
                                        <p className="text-xs font-medium text-white/60">Verified by Conductor</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Revenue</p>
                                        <p className="text-2xl font-black text-white">Rs. {(today.stats?.revenue || 0).toLocaleString()}</p>
                                        <p className="text-xs font-medium text-white/60">Today's collections</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Trip Actions */}
                            <Card className="bg-muted/10">
                                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-sm font-bold">{getDirection(todayTrip.variantId, todayTrip)}</p>
                                            <p className="text-xs text-muted-foreground">{todayTrip.driverId?.fullName || "Unassigned"} • {todayTrip.driverId?.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="font-bold border-primary/20 text-primary hover:bg-primary/10" onClick={() => setManifestTripId(todayTrip._id)}>
                                            <Users className="w-4 h-4 mr-2" /> View Manifest
                                        </Button>
                                        
                                        {(todayTrip.status === "scheduled" || todayTrip.status === "boarding") && (
                                            <Button variant="outline" className="font-bold border-white/10 text-white bg-white/5 hover:bg-white/5" onClick={() => handleUpdateStatus(todayTrip._id, "in-transit", "Mark trip as Departed?")}>
                                                <LogOut className="w-4 h-4 mr-2" /> Mark Departed
                                            </Button>
                                        )}
                                        {todayTrip.status === "in-transit" && (
                                            <Button variant="outline" className="font-bold border-white/10 text-white bg-white/5 hover:bg-white/5" onClick={() => handleUpdateStatus(todayTrip._id, "completed", "Mark trip as Arrived?")}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Arrived
                                            </Button>
                                        )}
                                        {(todayTrip.status === "scheduled" || todayTrip.status === "boarding") && (
                                            <Button variant="destructive" className="font-bold" onClick={() => handleUpdateStatus(todayTrip._id, "cancelled", "Cancel this trip and trigger refunds?")}>
                                                <XCircle className="w-4 h-4 mr-2" /> Cancel Trip
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="border-dashed border-2 bg-muted/5">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CalendarOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="font-bold text-muted-foreground">No trips scheduled for today</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* 2. CALENDAR TAB */}
                <TabsContent value="calendar" className="mt-4 outline-none">
                    <CalendarView
                        trips={recentTrips || []}
                        totalSeats={fleet?.totalSeats || 0}
                        onTripClick={(id) => setManifestTripId(id)}
                    />
                </TabsContent>
            </Tabs>

            {/* MODALS */}
            {showCancelTripModal && (
                <CancelTripModal
                    tripId={showCancelTripModal.tripId}
                    tripDate={showCancelTripModal.tripDate}
                    onClose={() => setShowCancelTripModal(null)}
                    onSuccess={() => qc.invalidateQueries({ queryKey: ["fleetWorkstation"] })}
                />
            )}
            {showRescheduleModal && (
                <RescheduleTripModal
                    tripId={showRescheduleModal.tripId}
                    currentDep={showRescheduleModal.departureTime}
                    currentArr={showRescheduleModal.arrivalTime}
                    onClose={() => setShowRescheduleModal(null)}
                    onSuccess={() => qc.invalidateQueries({ queryKey: ["fleetWorkstation"] })}
                />
            )}
        </div>
    );
};

// ─── MODAL COMPONENTS (Internal) ─────────────────────────────────────────────

interface CancelTripModalProps {
    tripId: string;
    tripDate: string;
    onClose: () => void;
    onSuccess: () => void;
}

function CancelTripModal({ tripId, tripDate, onClose, onSuccess }: CancelTripModalProps) {
    const [reason, setReason] = useState("");
    const mutation = useMutation({
        mutationFn: () => api.patch<{ message?: string }>(`/trips/${tripId}/cancel`, { reason }),
        onSuccess: (response) => { toast.success(response.data.message || "Trip cancelled."); onSuccess(); onClose(); },
        onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to cancel trip.")),
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> Cancel Trip</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm">
                    <p className="font-black text-destructive">⚠ Cancels {new Date(tripDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} trip only</p>
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Reason <span className="text-destructive">*</span></label>
                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-destructive/30" />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 font-bold rounded-xl">Back</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!reason.trim() || mutation.isPending} className="flex-1 font-bold rounded-xl bg-destructive hover:bg-destructive/90 text-white">
                        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Cancel Trip
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface RescheduleTripModalProps {
    tripId: string;
    currentDep: string;
    currentArr: string;
    onClose: () => void;
    onSuccess: () => void;
}

function RescheduleTripModal({ tripId, currentDep, currentArr, onClose, onSuccess }: RescheduleTripModalProps) {
    const [newDep, setNewDep] = useState(currentDep);
    const [newArr, setNewArr] = useState(currentArr);
    const [reason, setReason] = useState("");
    const mutation = useMutation({
        mutationFn: () => api.patch<{ message?: string }>(`/trips/${tripId}/reschedule`, { newDepartureTime: newDep, newArrivalTime: newArr, reason }),
        onSuccess: (response) => { toast.success(response.data.message || "Trip rescheduled."); onSuccess(); onClose(); },
        onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to reschedule trip.")),
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Reschedule Trip</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">New Dep</label>
                        <input type="time" value={newDep} onChange={e => setNewDep(e.target.value)} className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium" />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">New Arr</label>
                        <input type="time" value={newArr} onChange={e => setNewArr(e.target.value)} className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Reason <span className="text-destructive">*</span></label>
                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium" />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 font-bold rounded-xl">Back</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!reason.trim() || mutation.isPending} className="flex-1 font-bold rounded-xl bg-primary">
                        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Reschedule
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default OperationsTab;
