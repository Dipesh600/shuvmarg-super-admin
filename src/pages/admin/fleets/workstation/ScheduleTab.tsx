import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    CalendarDays, Clock, RotateCcw, ArrowRightLeft, Layers, MapPin,
    AlertTriangle, Play, PauseCircle, CheckCircle2, Loader2, Calendar, X,
    GitBranch, ArrowRight
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeSchedule, suspendSchedule, createScheduleVersion } from "@/api/scheduleApi";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import type { WorkstationSchedule } from "@/api/fleetWorkstationApi";
import { getErrorMessage } from "@/lib/error-message";

interface ScheduleTabProps {
    schedules: WorkstationSchedule[];
}

const scheduleStatusStyles: Record<string, string> = {
    ACTIVE:    "bg-white/5 text-white border-white/10",
    SUSPENDED: "bg-white/5 text-white border-white/10",
    DRAFT:     "bg-white/5 text-white border-white/10",
    INACTIVE:  "bg-white/5 text-white border-white/10",
};

const recurrenceLabel = (rec: string, days: number[] = []) => {
    if (rec === "DAILY") return "Every day";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (days?.length) return days.map(d => dayNames[d]).join(", ");
    return rec;
};

const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getDirection = (variant?: WorkstationSchedule["variantId"]) => {
    if (!variant?.corridorId) return "—";
    const o = variant.corridorId.originId?.name || "?";
    const d = variant.corridorId.destinationId?.name || "?";
    return variant.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
};

// ─── Suspend Modal ────────────────────────────────────────────────────────────
function SuspendModal({ scheduleId, onClose, onSuccess }: {
    scheduleId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [reason, setReason] = useState("");
    const [suspendUntil, setSuspendUntil] = useState("");

    const mutation = useMutation({
        mutationFn: () => suspendSchedule(scheduleId, reason, suspendUntil || undefined),
        onSuccess: (data) => {
            toast.success(data.message || "Schedule suspended.");
            onSuccess();
            onClose();
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to suspend schedule."));
        },
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-md p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2">
                        <PauseCircle className="w-4 h-4 text-white" /> Suspend Service
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground">
                    Suspending will stop future trip generation immediately. Past trips and existing bookings are unaffected.
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                            Reason <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Vehicle maintenance, Route change..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                            Auto-Resume Date <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                            type="date"
                            value={suspendUntil}
                            min={tomorrow()}
                            onChange={e => setSuspendUntil(e.target.value)}
                            className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {suspendUntil && (
                            <p className="text-[11px] text-white font-bold mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Service will auto-resume on {new Date(suspendUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 font-bold rounded-xl">Cancel</Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!reason.trim() || mutation.isPending}
                        className="flex-1 font-bold rounded-xl bg-white/5 hover:bg-white/5 text-white"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PauseCircle className="w-4 h-4 mr-2" />}
                        Suspend
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Plan Version Change Modal ─────────────────────────────────────────────────
function PlanVersionModal({ sched, onClose, onSuccess }: {
    sched: WorkstationSchedule;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [departureTime, setDepartureTime] = useState(sched.departureTime || "");
    const [arrivalTime, setArrivalTime]     = useState(sched.arrivalTime || "");
    const [effectiveFrom, setEffectiveFrom] = useState("");
    const [notes, setNotes]                 = useState("");

    const mutation = useMutation({
        mutationFn: () => createScheduleVersion(sched._id, { departureTime, arrivalTime, effectiveFrom, notes: notes || undefined }),
        onSuccess: (data) => {
            toast.success(data.message || "New version planned successfully.");
            onSuccess();
            onClose();
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to create version."));
        },
    });

    const sealDate = effectiveFrom
        ? new Date(new Date(effectiveFrom).getTime() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-lg p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-primary" /> Plan Version Change
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            v{(sched.versionNumber || 1) + 1} — current service continues until the day before the new version starts
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Visual diff: current → new */}
                <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timing Change</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Current (v{sched.versionNumber || 1})</p>
                            <p className="text-xl font-black text-muted-foreground/60">{sched.departureTime} → {sched.arrivalTime}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                        <div className="flex-1 text-center">
                            <p className="text-[10px] text-primary font-bold uppercase mb-1">New (v{(sched.versionNumber || 1) + 1})</p>
                            <p className="text-xl font-black text-primary">{departureTime || "—"} → {arrivalTime || "—"}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                            New Departure <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="time"
                            value={departureTime}
                            onChange={e => setDepartureTime(e.target.value)}
                            className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                            New Arrival <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="time"
                            value={arrivalTime}
                            onChange={e => setArrivalTime(e.target.value)}
                            className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Effective From <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="date"
                        value={effectiveFrom}
                        min={tomorrow()}
                        onChange={e => setEffectiveFrom(e.target.value)}
                        className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {sealDate && (
                        <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
                            <p className="font-bold text-primary flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Zero disruption
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                                Current schedule runs until <strong>{sealDate}</strong>, then seamlessly transitions to the new timings.
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Change Notes <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Route adjustment, Off-peak schedule..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 font-bold rounded-xl">Cancel</Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!departureTime || !arrivalTime || !effectiveFrom || mutation.isPending}
                        className="flex-1 font-bold rounded-xl bg-primary"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitBranch className="w-4 h-4 mr-2" />}
                        Plan v{(sched.versionNumber || 1) + 1}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────
function ScheduleCard({ sched, onAction }: { sched: WorkstationSchedule; onAction: () => void }) {
    const qc = useQueryClient();
    const [showSuspendModal, setShowSuspendModal]     = useState(false);
    const [showVersionModal, setShowVersionModal]     = useState(false);

    const resumeMut = useMutation({
        mutationFn: () => resumeSchedule(sched._id),
        onSuccess: (data) => {
            toast.success(data.message || "Schedule resumed! Trips are being regenerated.");
            qc.invalidateQueries({ queryKey: ["fleetWorkstation"] });
            onAction();
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to resume schedule."));
        },
    });

    const isSuspended = sched.status === "SUSPENDED";
    const isActive    = sched.status === "ACTIVE";
    const hasPending  = !!sched.pendingVersionId;

    return (
        <>
            <Card className="overflow-hidden hover:shadow-md transition-shadow group">
                {/* Suspension banner */}
                {isSuspended && (
                    <div className="bg-white/5 border-b border-white/10 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-white uppercase tracking-wider">Service Suspended</p>
                                    {sched.suspensionReason && (
                                        <p className="text-xs text-white/60 font-medium mt-0.5 truncate">{sched.suspensionReason}</p>
                                    )}
                                    {sched.suspendUntil && (
                                        <p className="text-[11px] font-bold text-white mt-0.5">
                                            Auto-resume: {formatDate(sched.suspendUntil)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => resumeMut.mutate()}
                                disabled={resumeMut.isPending}
                                className="h-8 px-3 rounded-lg font-bold text-xs shrink-0 bg-white/5 hover:bg-white/5 text-white shadow-sm"
                            >
                                {resumeMut.isPending
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <><Play className="w-3.5 h-3.5 mr-1" /> Resume</>
                                }
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pending version banner */}
                {isActive && hasPending && (
                    <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="text-xs font-black text-primary">
                                Version {(sched.versionNumber || 1) + 1} planned
                            </p>
                            {sched.effectiveUntil && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    — current timings run until <strong>{formatDate(sched.effectiveUntil)}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <MapPin className="h-4 w-4 text-primary/60" />
                            {getDirection(sched.variantId)}
                            {(sched.versionNumber || 1) > 1 && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">
                                    v{sched.versionNumber}
                                </span>
                            )}
                        </CardTitle>
                        <Badge className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 border ${scheduleStatusStyles[sched.status] || "bg-muted"}`}>
                            {sched.status}
                        </Badge>
                    </div>
                    {sched.variantId?.code && (
                        <span className="text-xs text-muted-foreground/50">{sched.variantId.code}</span>
                    )}
                </CardHeader>

                <CardContent className="pt-5 space-y-4">
                    {/* Time row */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary/50" />
                            <span className="text-2xl font-black tracking-tighter">{sched.departureTime}</span>
                        </div>
                        <span className="text-muted-foreground/40">→</span>
                        <span className="text-2xl font-black tracking-tighter text-muted-foreground/60">{sched.arrivalTime}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider ml-auto">{sched.shift}</Badge>
                    </div>

                    <Separator className="opacity-30" />

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={RotateCcw} label="Recurrence" value={recurrenceLabel(sched.recurrence, sched.daysOfWeek)} />
                        <InfoItem icon={ArrowRightLeft} label="Model" value={sched.operationalModel === "TURNAROUND" ? "Turnaround" : "Relay"} />
                        <InfoItem icon={Layers} label="Trips Generated" value={`${sched.tripCount || 0}`} />
                        <InfoItem icon={CalendarDays} label="Next Trip" value={sched.nextTripDate ? formatDate(sched.nextTripDate) : "None"} />
                    </div>

                    <Separator className="opacity-30" />

                    {/* Effective period */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>From: <span className="font-bold text-foreground">{formatDate(sched.effectiveFrom)}</span></span>
                        <span>Until: <span className={`font-bold ${sched.effectiveUntil ? "text-white" : "text-foreground"}`}>
                            {sched.effectiveUntil ? formatDate(sched.effectiveUntil) : "Indefinite"}
                        </span></span>
                    </div>

                    {/* Driver */}
                    {sched.driverId && (
                        <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                            Driver: <span className="font-bold text-foreground">{sched.driverId.fullName}</span>
                        </div>
                    )}

                    {/* Fare override */}
                    {sched.fareOverride && (
                        <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                            Fare Override: <span className="font-bold text-white">₹{sched.fareOverride}</span>
                        </div>
                    )}

                    {/* Action bar — only for ACTIVE schedules */}
                    {isActive && (
                        <div className="flex gap-2 pt-1">
                            {!hasPending && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowVersionModal(true)}
                                    className="flex-1 h-8 rounded-lg font-bold text-xs border-primary/30 text-primary hover:bg-primary/10"
                                >
                                    <GitBranch className="w-3.5 h-3.5 mr-1.5" /> Plan Version Change
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowSuspendModal(true)}
                                className="flex-1 h-8 rounded-lg font-bold text-xs border-white/10 text-white hover:bg-white/5"
                            >
                                <PauseCircle className="w-3.5 h-3.5 mr-1.5" /> Suspend
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showSuspendModal && (
                <SuspendModal
                    scheduleId={sched._id}
                    onClose={() => setShowSuspendModal(false)}
                    onSuccess={() => {
                        qc.invalidateQueries({ queryKey: ["fleetWorkstation"] });
                        onAction();
                    }}
                />
            )}
            {showVersionModal && (
                <PlanVersionModal
                    sched={sched}
                    onClose={() => setShowVersionModal(false)}
                    onSuccess={() => {
                        qc.invalidateQueries({ queryKey: ["fleetWorkstation"] });
                        onAction();
                    }}
                />
            )}
        </>
    );
}

// ─── Main ScheduleTab ─────────────────────────────────────────────────────────
const ScheduleTab = ({ schedules }: ScheduleTabProps) => {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: ["fleetWorkstation"] });

    if (!schedules || schedules.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/5">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-bold text-muted-foreground">No schedules configured for this fleet</p>
                    <p className="text-sm text-muted-foreground/60">Create a schedule from the Brand Dashboard to start generating trips.</p>
                </CardContent>
            </Card>
        );
    }

    const hasSuspended = schedules.some(s => s.status === "SUSPENDED");

    return (
        <div className="space-y-4">
            {/* Health banner */}
            {hasSuspended && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                    <div>
                        <p className="text-sm font-black text-white">Service Partially Suspended</p>
                        <p className="text-xs text-white/60">One or more schedules are suspended. Use the Resume button on each card to restore operations.</p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {schedules.map((sched) => (
                    <ScheduleCard key={sched._id} sched={sched} onAction={refresh} />
                ))}
            </div>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{label}</p>
            <p className="font-bold text-sm leading-tight">{value}</p>
        </div>
    </div>
);

export default ScheduleTab;
