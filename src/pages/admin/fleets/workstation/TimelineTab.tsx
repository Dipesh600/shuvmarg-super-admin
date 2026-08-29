/**
 * TimelineTab.tsx
 *
 * Phase 3 — Gantt-style Schedule Timeline
 *
 * Renders a scrollable horizontal timeline showing:
 *   - Each schedule as a colored bar spanning its effective period
 *   - Version chains (v1 → v2 → v3) as consecutive linked bars
 *   - Suspended periods in amber
 *   - Individual trip dots (recent + upcoming) plotted on the timeline
 *   - Exception trips (CANCELLED, RESCHEDULED, EXTRA_RUN) in distinct colors
 *   - A "today" vertical marker
 *   - Tooltips on hover for schedule and trip details
 *
 * All rendering is done with pure CSS/HTML — no chart library dependencies.
 */

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, GitBranch, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineTabProps {
    schedules: any[];
    recentTrips: any[];
    upcomingTrips: any[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WINDOW_DAYS  = 90;   // total days shown on canvas
const PAST_DAYS    = 20;   // days before today shown on left
const FUTURE_DAYS  = WINDOW_DAYS - PAST_DAYS;
const DAY_PX       = 14;   // pixels per day
const ROW_HEIGHT   = 64;   // px per schedule row
const HEADER_H     = 48;   // px for date header
const CANVAS_W     = WINDOW_DAYS * DAY_PX;

// Status color config
const SCHED_COLORS: Record<string, { bar: string; text: string; border: string }> = {
    ACTIVE:    { bar: "bg-white/5",  text: "text-white",  border: "border-white/10" },
    SUSPENDED: { bar: "bg-white/5",    text: "text-white",    border: "border-white/10" },
    DRAFT:     { bar: "bg-white/5",     text: "text-white",     border: "border-white/10" },
    INACTIVE:  { bar: "bg-slate-400",    text: "text-slate-50",    border: "border-slate-500" },
};

const TRIP_COLORS: Record<string, string> = {
    scheduled:  "bg-white/5 border-white/10",
    boarding:   "bg-white/5 border-white/10",
    "in-transit": "bg-white/5 border-white/10",
    completed:  "bg-slate-400 border-slate-500",
    cancelled:  "bg-white/5 border-white/10",
    RESCHEDULED: "bg-white/5 border-white/10",
    EXTRA_RUN:  "bg-white/5 border-white/10",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dayOffset = (date: Date | string | null, origin: Date): number => {
    if (!date) return -9999;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - origin.getTime()) / 86400000);
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const fmtMonth = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] rounded-lg bg-popover border shadow-xl px-3 py-2 text-xs pointer-events-none">
                    {content}
                </div>
            )}
        </div>
    );
}

// ─── Date Header ──────────────────────────────────────────────────────────────
function DateHeader({ originDate }: { originDate: Date }) {
    const months: { label: string; startPx: number; endPx: number }[] = [];
    const ticks: { px: number; label: string; isToday: boolean }[] = [];

    for (let i = 0; i < WINDOW_DAYS; i++) {
        const d = new Date(originDate);
        d.setDate(d.getDate() + i);
        const px = i * DAY_PX;
        const isToday = i === PAST_DAYS;

        // Weekly ticks
        if (d.getDay() === 1 || isToday) {
            ticks.push({ px, label: isToday ? "Today" : `${d.getDate()}`, isToday });
        }

        // Month labels
        if (d.getDate() === 1 || i === 0) {
            const last = months[months.length - 1];
            if (last) last.endPx = px;
            months.push({ label: fmtMonth(d), startPx: px, endPx: CANVAS_W });
        }
    }

    return (
        <div className="relative border-b border-border/40" style={{ height: HEADER_H, width: CANVAS_W }}>
            {/* Month bands */}
            {months.map((m, i) => (
                <div key={i} className="absolute top-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-2 pt-1.5"
                    style={{ left: m.startPx, width: m.endPx - m.startPx }}>
                    {m.label}
                </div>
            ))}
            {/* Day ticks */}
            {ticks.map((t, i) => (
                <div key={i} className={`absolute bottom-0 flex flex-col items-center`} style={{ left: t.px }}>
                    <span className={`text-[9px] font-black mb-1 ${t.isToday ? "text-primary" : "text-muted-foreground/40"}`}>
                        {t.label}
                    </span>
                    <div className={`w-px h-2 ${t.isToday ? "bg-primary" : "bg-border/40"}`} />
                </div>
            ))}
        </div>
    );
}

// ─── Schedule Row ─────────────────────────────────────────────────────────────
function ScheduleRow({ sched, trips, originDate }: {
    sched: any;
    trips: any[];
    originDate: Date;
}) {
    const colors = SCHED_COLORS[sched.status] || SCHED_COLORS.DRAFT;

    // Bar bounds
    const startOff = dayOffset(sched.effectiveFrom, originDate);
    const endOff   = sched.effectiveUntil
        ? dayOffset(sched.effectiveUntil, originDate)
        : WINDOW_DAYS;

    const barLeft  = clamp(startOff * DAY_PX, 0, CANVAS_W);
    const barRight = clamp(endOff * DAY_PX, 0, CANVAS_W);
    const barWidth = Math.max(barRight - barLeft, 2);

    // Direction label
    const orig = sched.variantId?.corridorId?.originId?.name || "";
    const dest = sched.variantId?.corridorId?.destinationId?.name || "";
    const dir  = sched.variantId?.direction === "RETURN" ? `${dest} → ${orig}` : `${orig} → ${dest}`;

    // Filter trips that belong to this schedule
    const rowTrips = trips.filter(t => t.scheduleId?.toString() === sched._id?.toString());

    return (
        <div className="relative border-b border-border/20 flex items-center" style={{ height: ROW_HEIGHT, width: CANVAS_W }}>
            {/* Grid lines */}
            {Array.from({ length: WINDOW_DAYS }).map((_, i) => (
                <div key={i} className={`absolute top-0 bottom-0 w-px ${i === PAST_DAYS ? "bg-primary/30" : "bg-border/10"}`}
                    style={{ left: i * DAY_PX }} />
            ))}

            {/* Schedule bar */}
            <Tooltip content={
                <div className="space-y-1">
                    <p className="font-black">{dir || "Schedule"}</p>
                    <p className="text-muted-foreground">{sched.departureTime} → {sched.arrivalTime}</p>
                    <p className="text-muted-foreground">
                        {fmtDate(sched.effectiveFrom)} → {sched.effectiveUntil ? fmtDate(sched.effectiveUntil) : "Open-ended"}
                    </p>
                    {sched.versionNumber > 1 && <p className="text-primary font-bold">v{sched.versionNumber}</p>}
                    {sched.status === "SUSPENDED" && sched.suspensionReason && (
                        <p className="text-white font-bold">⚠ {sched.suspensionReason}</p>
                    )}
                </div>
            }>
                <div
                    className={`absolute rounded-md flex items-center px-2 overflow-hidden cursor-default
                        ${colors.bar} ${colors.text} border ${colors.border} shadow-sm
                        transition-opacity hover:opacity-90`}
                    style={{ left: barLeft, width: barWidth, top: 14, height: 28 }}
                >
                    <span className="text-[10px] font-black truncate whitespace-nowrap">
                        {sched.departureTime} → {sched.arrivalTime}
                        {sched.versionNumber > 1 && <span className="ml-1.5 opacity-80">v{sched.versionNumber}</span>}
                    </span>
                </div>
            </Tooltip>

            {/* Trip dots */}
            {rowTrips.map((trip, i) => {
                const off = dayOffset(trip.tripDate, originDate);
                if (off < 0 || off >= WINDOW_DAYS) return null;
                const dotX = off * DAY_PX + DAY_PX / 2 - 4;
                const colorKey = trip.exceptionType && trip.exceptionType !== "NONE"
                    ? trip.exceptionType
                    : trip.status;
                const dotColor = TRIP_COLORS[colorKey] || TRIP_COLORS.completed;

                return (
                    <Tooltip key={i} content={
                        <div className="space-y-0.5">
                            <p className="font-black">{fmtDate(trip.tripDate)}</p>
                            <p className="text-muted-foreground">{trip.departureTime} → {trip.arrivalTime}</p>
                            <p className={`font-bold capitalize ${trip.status === "cancelled" ? "text-white" : "text-white"}`}>
                                {trip.exceptionType && trip.exceptionType !== "NONE" ? trip.exceptionType : trip.status}
                            </p>
                        </div>
                    }>
                        <div
                            className={`absolute rounded-full border-2 ${dotColor} cursor-pointer hover:scale-125 transition-transform`}
                            style={{ left: dotX, top: 46, width: 8, height: 8 }}
                        />
                    </Tooltip>
                );
            })}
        </div>
    );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
const LegendItem = ({ color, label }: { color: string; label: string }) => (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
        {label}
    </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TimelineTab = ({ schedules, recentTrips, upcomingTrips }: TimelineTabProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Origin = PAST_DAYS before today
    const originDate = new Date();
    originDate.setHours(0, 0, 0, 0);
    originDate.setDate(originDate.getDate() - PAST_DAYS);

    const todayPx = PAST_DAYS * DAY_PX;

    // Merge recent + upcoming trips for the trip dots
    const allTrips = [
        ...(recentTrips || []).map(t => ({ ...t, _source: "recent" })),
        ...(upcomingTrips || []).map(t => ({ ...t, _source: "upcoming" })),
    ];

    // Sort schedules: ACTIVE first, then SUSPENDED, then DRAFT, then INACTIVE
    const statusOrder: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, DRAFT: 2, INACTIVE: 3 };
    const sortedSchedules = [...(schedules || [])].sort((a, b) =>
        (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    );

    const scroll = (dir: "left" | "right") => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    };

    if (!schedules || schedules.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/5">
                <CardContent className="flex flex-col items-center justify-center py-20 space-y-3">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/20" />
                    <p className="font-bold text-muted-foreground">No schedules to display</p>
                    <p className="text-sm text-muted-foreground/60">Create a schedule to see the service timeline.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" /> Service Timeline
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        90-day view — {PAST_DAYS} days past · {FUTURE_DAYS} days ahead
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => scroll("left")} className="h-8 w-8 p-0 rounded-lg">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => scroll("right")} className="h-8 w-8 p-0 rounded-lg">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-1">
                <LegendItem color="bg-white/5" label="Active" />
                <LegendItem color="bg-white/5"   label="Suspended" />
                <LegendItem color="bg-slate-400"   label="Inactive / Sealed" />
                <LegendItem color="bg-white/5"    label="Draft" />
                <div className="w-px h-4 bg-border/40 self-center" />
                <LegendItem color="bg-white/5 border border-white/10 rounded-full" label="Scheduled trip" />
                <LegendItem color="bg-white/5 border border-white/10 rounded-full"    label="Cancelled trip" />
                <LegendItem color="bg-white/5 border border-white/10 rounded-full" label="Rescheduled" />
                <LegendItem color="bg-white/5 border border-white/10 rounded-full" label="Extra run" />
            </div>

            {/* Canvas */}
            <Card className="overflow-hidden">
                <div className="flex">
                    {/* Row Labels (sticky left) */}
                    <div className="shrink-0 border-r border-border/40 bg-muted/20" style={{ width: 180 }}>
                        {/* Header spacer */}
                        <div style={{ height: HEADER_H }} className="border-b border-border/40 flex items-end pb-1 px-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Schedule</span>
                        </div>
                        {sortedSchedules.map((sched) => {
                            const orig = sched.variantId?.corridorId?.originId?.name || "";
                            const dest = sched.variantId?.corridorId?.destinationId?.name || "";
                            const dir = sched.variantId?.direction === "RETURN"
                                ? `${dest} → ${orig}` : `${orig} → ${dest}`;
                            const colors = SCHED_COLORS[sched.status] || SCHED_COLORS.DRAFT;
                            return (
                                <div key={sched._id} className="border-b border-border/20 px-3 flex flex-col justify-center gap-0.5"
                                    style={{ height: ROW_HEIGHT }}>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`inline-block w-2 h-2 rounded-full ${colors.bar} shrink-0`} />
                                        <span className="text-xs font-black truncate">{sched.departureTime} → {sched.arrivalTime}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 truncate pl-3.5">{dir}</span>
                                    <div className="flex items-center gap-1 pl-3.5">
                                        <Badge className={`text-[8px] uppercase font-black tracking-wider px-1.5 py-0 border ${
                                            sched.status === "ACTIVE" ? "border-white/10 bg-white/5 text-white" :
                                            sched.status === "SUSPENDED" ? "border-white/10 bg-white/5 text-white" :
                                            sched.status === "INACTIVE" ? "border-white/10 bg-white/5 text-white" :
                                            "border-white/10 bg-white/5 text-white"
                                        }`}>{sched.status}</Badge>
                                        {(sched.versionNumber || 1) > 1 && (
                                            <span className="text-[8px] font-black text-primary flex items-center gap-0.5">
                                                <GitBranch className="w-2.5 h-2.5" />v{sched.versionNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable Timeline Canvas */}
                    <div ref={scrollRef} className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                        style={{ scrollSnapType: "x proximity" }}>
                        <div style={{ width: CANVAS_W, minWidth: CANVAS_W }}>
                            {/* Date Header */}
                            <DateHeader originDate={originDate} />

                            {/* Today line (absolute, spans all rows) */}
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
                                    style={{ left: todayPx }} />

                                {/* Schedule Rows */}
                                {sortedSchedules.map((sched) => (
                                    <ScheduleRow
                                        key={sched._id}
                                        sched={sched}
                                        trips={allTrips}
                                        originDate={originDate}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats summary below */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Active Schedules"  value={schedules.filter(s => s.status === "ACTIVE").length}    accent="text-white" />
                <StatCard label="Suspended"          value={schedules.filter(s => s.status === "SUSPENDED").length} accent="text-white" />
                <StatCard label="Upcoming Trips"     value={upcomingTrips?.length || 0}  accent="text-primary" />
                <StatCard label="Exception Trips"    value={allTrips.filter(t => t.exceptionType && t.exceptionType !== "NONE").length} accent="text-white" />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
    <Card>
        <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</p>
            <p className={`text-3xl font-black tracking-tighter mt-1 ${accent}`}>{value}</p>
        </CardContent>
    </Card>
);

export default TimelineTab;
