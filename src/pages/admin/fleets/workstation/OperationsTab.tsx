import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, CheckCircle2, IndianRupee, CalendarOff, ArrowRight, Phone, User, LogOut, CheckCircle, XCircle, RefreshCw, Calendar, X, Loader2, AlertTriangle, AlertCircle, History, List } from "lucide-react";
import { useUpdateTripStatus } from "@/hooks/useFleetWorkstation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { toast } from "sonner";
import { ManifestDrawer } from "./ManifestDrawer";

interface OperationsTabProps {
    today: any;
    upcomingTrips: any[];
    completedTrips: any[];
    cancelledTrips: any[];
    recentTrips: any[];
    fleet: any;
    fleetId: string;
    schedules?: any[];
}

// ─── STATUS HELPERS ──────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    boarding: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    "in-transit": "bg-violet-500/10 text-violet-600 border-violet-500/30",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
};

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDirection = (variant: any, trip?: any) => {
    if (trip?.directionLabel) return trip.directionLabel;
    if (!variant?.corridorId) return "—";
    const o = variant.corridorId.originId?.name || "?";
    const d = variant.corridorId.destinationId?.name || "?";
    return variant.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

// ─── TRIP TABLE COMPONENT (REUSABLE) ─────────────────────────────────────────
const TripTable = ({ trips, fleet, onRowClick, onCancel, onReschedule }: { trips: any[]; fleet: any; onRowClick: (id: string) => void; onCancel?: (trip: any) => void; onReschedule?: (trip: any) => void; }) => {
    const totalSeats = fleet?.totalSeats || 0;

    if (!trips || trips.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/5">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="font-bold">No trips found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Direction</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Dep</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Booked</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Revenue</TableHead>
                            {(onCancel || onReschedule) && <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trips.map((trip: any) => {
                            const s = trip.stats || {};
                            return (
                                <TableRow key={trip._id} className="cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => onRowClick(trip._id)}>
                                    <TableCell className="font-bold text-sm">
                                        {formatDate(trip.tripDate)}
                                        {trip.exceptionType === "EXTRA_RUN" && <Badge variant="secondary" className="ml-2 text-[8px] uppercase tracking-widest">Extra</Badge>}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{getDirection(trip.variantId, trip)}</TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">{trip.departureTime}</span>
                                        {trip.exceptionType === "RESCHEDULED" && <span className="text-[10px] text-amber-600 block leading-none font-bold">Rescheduled</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0 border ${statusStyles[trip.status] || "bg-muted"}`}>
                                            {trip.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-mono text-sm">{s.booked || 0}/{totalSeats}</span>
                                        <span className={`block text-[10px] font-bold ${(s.occupancyPct || 0) >= 80 ? "text-emerald-600" : (s.occupancyPct || 0) >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                            {s.occupancyPct || 0}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm">Rs. {(s.revenue || 0).toLocaleString()}</TableCell>
                                    
                                    {(onCancel || onReschedule) && (
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                {onReschedule && trip.status === "scheduled" && (
                                                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold text-primary border-primary/20 hover:bg-primary/10" onClick={() => onReschedule(trip)}>
                                                        Reschedule
                                                    </Button>
                                                )}
                                                {onCancel && trip.status === "scheduled" && (
                                                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => onCancel(trip)}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
};

// ─── MAIN OPERATIONS TAB ─────────────────────────────────────────────────────
const OperationsTab = ({ today, upcomingTrips, completedTrips, cancelledTrips, recentTrips, fleet, fleetId, schedules }: OperationsTabProps) => {
    const qc = useQueryClient();
    
    // Modal states
    const [showCancelTripModal, setShowCancelTripModal] = useState<any>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState<any>(null);
    const [showCancelRange, setShowCancelRange]         = useState(false);
    
    // Manifest Drawer state
    const [manifestTripId, setManifestTripId] = useState<string | null>(null);

    // Cancel Range states
    const [rangeFrom, setRangeFrom] = useState("");
    const [rangeTo, setRangeTo] = useState("");
    const [rangeReason, setRangeReason] = useState("");
    const [rangeSchedule, setRangeSchedule] = useState("");

    const cancelRangeMut = useMutation({
        mutationFn: () => api.post(`/schedules/${rangeSchedule}/cancel-range`, { fromDate: rangeFrom, toDate: rangeTo, reason: rangeReason }),
        onSuccess: (res: any) => { toast.success(res.data.message); setShowCancelRange(false); qc.invalidateQueries({ queryKey: ["fleetWorkstation"] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to cancel date range."),
    });

    const updateStatusMutation = useUpdateTripStatus();
    const handleUpdateStatus = (tripId: string, newStatus: string, confirmationMsg: string) => {
        if (!confirm(confirmationMsg)) return;
        updateStatusMutation.mutate(
            { fleetId, tripId, payload: { status: newStatus } },
            {
                onSuccess: () => toast.success(`Trip marked as ${newStatus}`),
                onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update trip status")
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
            <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-amber-700">Date-Range Exception</p>
                                <p className="text-xs text-amber-600/80 mt-0.5">Cancel all trips between two dates (maintenance, road closure). Master schedule is NOT suspended.</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowCancelRange(true)} className="h-8 px-3 rounded-lg font-bold text-xs shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Set Exception Window
                        </Button>
                    </div>

                    {showCancelRange && (
                        <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">Schedule</label>
                                    <select value={rangeSchedule} onChange={e => setRangeSchedule(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30">
                                        <option value="">Select schedule...</option>
                                        {(schedules || []).filter((s: any) => s.status === "ACTIVE").map((s: any) => (
                                            <option key={s._id} value={s._id}>{s.departureTime} → {s.arrivalTime} ({s.operationalModel})</option>
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
                                <Button size="sm" onClick={() => cancelRangeMut.mutate()} disabled={!rangeSchedule || !rangeFrom || !rangeTo || !rangeReason || cancelRangeMut.isPending} className="font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
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
                    <TabsTrigger value="upcoming" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" /> Upcoming
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 text-[9px] bg-muted-foreground/20">{upcomingTrips?.length || 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" /> Cancelled
                        {cancelledTrips?.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 ml-1" />}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider ml-auto text-muted-foreground">
                        <List className="w-3.5 h-3.5" /> All Trips
                    </TabsTrigger>
                </TabsList>

                {/* 1. TODAY TAB */}
                <TabsContent value="today" className="mt-4 outline-none">
                    {today?.trip ? (
                        <div className="space-y-4">
                            {/* Pulse Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-blue-500/5 border-blue-500/20">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Departure</p>
                                        <p className="text-2xl font-black text-blue-700">{today.trip.departureTime}</p>
                                        <Badge className={`text-[9px] uppercase font-bold border-0 px-2 py-0 ${statusStyles[today.trip.status]}`}>{today.trip.status}</Badge>
                                    </CardContent>
                                </Card>
                                <Card className="bg-violet-500/5 border-violet-500/20">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Seats Booked</p>
                                        <p className="text-2xl font-black text-violet-700">{today.stats?.seatsSold || 0} / {fleet?.totalSeats || 0}</p>
                                        <p className="text-xs font-medium text-violet-600/70">{today.stats?.occupancyPct || 0}% Occupancy</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-500/5 border-emerald-500/20">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Boarded</p>
                                        <p className="text-2xl font-black text-emerald-700">{today.stats?.boardingConfirmed || 0} / {today.stats?.totalBooked || 0}</p>
                                        <p className="text-xs font-medium text-emerald-600/70">Verified by Conductor</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-500/5 border-amber-500/20">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Revenue</p>
                                        <p className="text-2xl font-black text-amber-700">Rs. {(today.stats?.revenue || 0).toLocaleString()}</p>
                                        <p className="text-xs font-medium text-amber-600/70">Today's collections</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Trip Actions */}
                            <Card className="bg-muted/10">
                                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-sm font-bold">{getDirection(today.trip.variantId, today.trip)}</p>
                                            <p className="text-xs text-muted-foreground">{today.trip.driverId?.fullName || "Unassigned"} • {today.trip.driverId?.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="font-bold border-primary/20 text-primary hover:bg-primary/10" onClick={() => setManifestTripId(today.trip._id)}>
                                            <Users className="w-4 h-4 mr-2" /> View Manifest
                                        </Button>
                                        
                                        {(today.trip.status === "scheduled" || today.trip.status === "boarding") && (
                                            <Button variant="outline" className="font-bold border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100" onClick={() => handleUpdateStatus(today.trip._id, "in-transit", "Mark trip as Departed?")}>
                                                <LogOut className="w-4 h-4 mr-2" /> Mark Departed
                                            </Button>
                                        )}
                                        {today.trip.status === "in-transit" && (
                                            <Button variant="outline" className="font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => handleUpdateStatus(today.trip._id, "completed", "Mark trip as Arrived?")}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Arrived
                                            </Button>
                                        )}
                                        {(today.trip.status === "scheduled" || today.trip.status === "boarding") && (
                                            <Button variant="destructive" className="font-bold" onClick={() => handleUpdateStatus(today.trip._id, "cancelled", "Cancel this trip and trigger refunds?")}>
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

                {/* 2. UPCOMING TAB */}
                <TabsContent value="upcoming" className="mt-4 outline-none">
                    <TripTable 
                        trips={upcomingTrips} 
                        fleet={fleet} 
                        onRowClick={(id) => setManifestTripId(id)}
                        onCancel={(t) => setShowCancelTripModal({ tripId: t._id, tripDate: t.tripDate })}
                        onReschedule={(t) => setShowRescheduleModal({ tripId: t._id, tripDate: t.tripDate, departureTime: t.departureTime, arrivalTime: t.arrivalTime })}
                    />
                </TabsContent>

                {/* 3. COMPLETED TAB */}
                <TabsContent value="completed" className="mt-4 outline-none">
                    <TripTable trips={completedTrips} fleet={fleet} onRowClick={(id) => setManifestTripId(id)} />
                </TabsContent>

                {/* 4. CANCELLED TAB */}
                <TabsContent value="cancelled" className="mt-4 outline-none">
                    <TripTable trips={cancelledTrips} fleet={fleet} onRowClick={(id) => setManifestTripId(id)} />
                </TabsContent>

                {/* 5. ALL TRIPS TAB */}
                <TabsContent value="all" className="mt-4 outline-none">
                    <TripTable trips={recentTrips} fleet={fleet} onRowClick={(id) => setManifestTripId(id)} />
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
                    tripDate={showRescheduleModal.tripDate}
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

function CancelTripModal({ tripId, tripDate, onClose, onSuccess }: any) {
    const [reason, setReason] = useState("");
    const mutation = useMutation({
        mutationFn: () => api.patch(`/trips/${tripId}/cancel`, { reason }),
        onSuccess: (res: any) => { toast.success(res.data.message); onSuccess(); onClose(); },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to cancel trip."),
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

function RescheduleTripModal({ tripId, tripDate, currentDep, currentArr, onClose, onSuccess }: any) {
    const [newDep, setNewDep] = useState(currentDep);
    const [newArr, setNewArr] = useState(currentArr);
    const [reason, setReason] = useState("");
    const mutation = useMutation({
        mutationFn: () => api.patch(`/trips/${tripId}/reschedule`, { newDepartureTime: newDep, newArrivalTime: newArr, reason }),
        onSuccess: (res: any) => { toast.success(res.data.message); onSuccess(); onClose(); },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to reschedule trip."),
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
