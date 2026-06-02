import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Loader2, Play, Pause, Plus, MoreHorizontal, CornerDownRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getSchedulesByBrand, activateSchedule, suspendSchedule, deactivateSchedule, deleteSchedule } from "@/api/scheduleApi";
import CreateScheduleModal from "./CreateScheduleModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "ACTIVE":
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-emerald-200">ACTIVE</Badge>;
        case "DRAFT":
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-amber-200">DRAFT</Badge>;
        case "SUSPENDED":
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-amber-200">PAUSED</Badge>;
        case "INACTIVE":
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-red-200">INACTIVE</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const BrandSchedulesTab = ({ brandId, ownerId }: { brandId: string, ownerId: string }) => {
    const qc = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deletingSched, setDeletingSched] = useState<any>(null);
    const [deactivatingSched, setDeactivatingSched] = useState<any>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["brand-schedules", brandId],
        queryFn: () => getSchedulesByBrand(brandId),
        enabled: !!brandId,
    });

    const activateMut = useMutation({
        mutationFn: activateSchedule,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand-schedules", brandId] });
            toast.success("Schedule activated. Trips will be generated automatically.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to activate schedule"),
    });

    const suspendMut = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => suspendSchedule(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand-schedules", brandId] });
            toast.success("Schedule suspended. No further trips will be generated.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to suspend schedule"),
    });

    const deactivateMut = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => deactivateSchedule(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand-schedules", brandId] });
            toast.success("Schedule deactivated permanently.");
            setDeactivatingSched(null);
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || "Failed to deactivate schedule");
            setDeactivatingSched(null);
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => deleteSchedule(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand-schedules", brandId] });
            toast.success("DRAFT schedule deleted.");
            setDeletingSched(null);
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || "Failed to delete schedule");
            setDeletingSched(null);
        },
    });

    const schedules = data?.data || [];

    const groupedSchedules = useMemo(() => {
        if (!schedules.length) return [];
        const seen = new Set();
        const grouped = [];

        for (const sched of schedules) {
            if (seen.has(sched._id)) continue;
            seen.add(sched._id);

            let returnSched = null;
            if (sched.returnScheduleId) {
                returnSched = schedules.find((s: any) => s._id === sched.returnScheduleId);
                if (returnSched) {
                    seen.add(returnSched._id);
                }
            }

            if (sched.variantId?.direction === "RETURN" && returnSched && returnSched.variantId?.direction !== "RETURN") {
                 grouped.push({
                     primary: returnSched,
                     returnSched: sched
                 });
            } else {
                 grouped.push({
                     primary: sched,
                     returnSched: returnSched
                 });
            }
        }
        return grouped;
    }, [schedules]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Schedules</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-destructive font-bold">
                Error loading schedules.
            </div>
        );
    }

    return (
        <ErrorBoundaryFallback>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted">
                <div>
                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" /> Master Schedules
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium italic opacity-70">
                        The source of truth for trip generation.
                    </p>
                </div>
                <Button className="font-bold rounded-xl h-10 shadow-sm" onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Schedule
                </Button>
            </div>

            <Card className="border-2 border-muted shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle className="text-lg font-black tracking-tighter leading-none">Schedule Registry</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                        {schedules.length} schedules found
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <p className="text-lg font-black tracking-tighter">No Schedules Found</p>
                            <p className="text-sm text-muted-foreground font-medium max-w-sm mt-1">
                                Create a schedule to automate trip generation for this brand's fleet.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md overflow-x-auto min-h-[300px]">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Fleet & Route</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Timing</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Recurrence</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Status</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedSchedules.map(({ primary, returnSched }: any) => (
                                        <TableRow key={primary._id} className="hover:bg-muted/5 font-medium transition-colors">
                                            <TableCell className="align-top py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm text-foreground">
                                                            {primary.busId?.busNumber || "Unknown Bus"}
                                                        </span>
                                                        {returnSched && <span className="text-[9px] bg-blue-100 text-blue-700 font-black uppercase px-1.5 py-0.5 rounded tracking-widest">Round Trip</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                                                        <MapPin className="h-3 w-3" />
                                                        {primary.variantId?.corridorId?.originId?.name && primary.variantId?.corridorId?.destinationId?.name ? (
                                                            primary.variantId.direction === "RETURN"
                                                                ? `${primary.variantId.corridorId.destinationId.name} → ${primary.variantId.corridorId.originId.name}`
                                                                : `${primary.variantId.corridorId.originId.name} → ${primary.variantId.corridorId.destinationId.name}`
                                                        ) : (primary.variantId?.name || "Unknown Route")}
                                                        {primary.variantId?.type && (
                                                            <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                                                                {primary.variantId.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* ALWAYS show the return direction because corridors are bidirectional */}
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mt-1">
                                                        <CornerDownRight className="h-3 w-3 text-rose-500" />
                                                        {primary.variantId?.corridorId?.originId?.name && primary.variantId?.corridorId?.destinationId?.name ? (
                                                            primary.variantId.direction === "RETURN"
                                                                ? `${primary.variantId.corridorId.originId.name} → ${primary.variantId.corridorId.destinationId.name}`
                                                                : `${primary.variantId.corridorId.destinationId.name} → ${primary.variantId.corridorId.originId.name}`
                                                        ) : "Return Route"}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-black text-foreground bg-muted/50 px-2 py-0.5 rounded-md text-[11px] font-mono whitespace-nowrap">
                                                        {primary.departureTime} - {primary.arrivalTime || "TBD"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {primary.shift}
                                                    </span>
                                                </div>
                                                {returnSched ? (
                                                    <div className="flex flex-col items-center gap-1 mt-2 pt-2 border-t border-dashed border-border/50">
                                                        <span className="font-black text-foreground bg-muted/50 px-2 py-0.5 rounded-md text-[11px] font-mono whitespace-nowrap">
                                                            {returnSched.departureTime} - {returnSched.arrivalTime || "TBD"}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {returnSched.shift}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 mt-2 pt-2 border-t border-dashed border-border/50 opacity-80">
                                                        <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest border border-rose-200">
                                                            Missing Time
                                                        </span>
                                                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                                                            Action Required
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-center">
                                                <span className="text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                                                    {primary.recurrence}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <StatusBadge status={primary.status} />
                                                    {returnSched && <StatusBadge status={returnSched.status} />}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                                        <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Schedule Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        
                                                        {primary.status === "DRAFT" || primary.status === "SUSPENDED" ? (
                                                            <DropdownMenuItem
                                                                className="font-bold text-emerald-600 focus:text-emerald-700 cursor-pointer flex items-center gap-2"
                                                                onClick={async () => {
                                                                    await activateMut.mutateAsync(primary._id);
                                                                    if (returnSched) await activateMut.mutateAsync(returnSched._id);
                                                                }}
                                                            >
                                                                <Play className="w-4 h-4" /> Activate Service
                                                            </DropdownMenuItem>
                                                        ) : null}

                                                        {primary.status === "ACTIVE" ? (
                                                            <DropdownMenuItem
                                                                className="font-bold text-amber-600 focus:text-amber-700 cursor-pointer flex items-center gap-2"
                                                                onClick={async () => {
                                                                    const reason = window.prompt("Reason for suspension?");
                                                                    if (reason) {
                                                                        await suspendMut.mutateAsync({ id: primary._id, reason });
                                                                        if (returnSched) await suspendMut.mutateAsync({ id: returnSched._id, reason });
                                                                    }
                                                                }}
                                                            >
                                                                <Pause className="w-4 h-4" /> Pause Service
                                                            </DropdownMenuItem>
                                                        ) : null}

                                                        {primary.status !== "INACTIVE" && primary.status !== "DRAFT" ? (
                                                            <DropdownMenuItem
                                                                className="font-bold text-red-600 focus:text-red-700 cursor-pointer flex items-center gap-2"
                                                                onClick={() => setDeactivatingSched({ primary, returnSched })}
                                                            >
                                                                <Pause className="w-4 h-4" /> Deactivate (Stop Forever)
                                                            </DropdownMenuItem>
                                                        ) : null}

                                                        {primary.status === "DRAFT" ? (
                                                            <DropdownMenuItem
                                                                className="font-bold text-red-600 focus:text-red-700 cursor-pointer flex items-center gap-2"
                                                                onClick={() => setDeletingSched({ primary, returnSched })}
                                                            >
                                                                <Pause className="w-4 h-4" /> Delete Draft
                                                            </DropdownMenuItem>
                                                        ) : null}

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateScheduleModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                brandId={brandId}
                ownerId={ownerId}
            />

            {/* Deactivate Dialog */}
            <Dialog open={!!deactivatingSched} onOpenChange={() => setDeactivatingSched(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            Deactivate Schedule?
                        </DialogTitle>
                        <DialogDescription className="pt-1 text-sm text-muted-foreground">
                            This will permanently deactivate this schedule. It will remain in the system for historical record, but no new trips will be generated and you will not be able to activate it again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDeactivatingSched(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (deactivatingSched) {
                                    await deactivateMut.mutateAsync({ id: deactivatingSched.primary._id, reason: "Deactivated by admin" });
                                    if (deactivatingSched.returnSched) {
                                        await deactivateMut.mutateAsync({ id: deactivatingSched.returnSched._id, reason: "Deactivated by admin" });
                                    }
                                }
                            }}
                            disabled={deactivateMut.isPending}
                        >
                            {deactivateMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Permanently Deactivate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletingSched} onOpenChange={() => setDeletingSched(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            Delete Draft Schedule?
                        </DialogTitle>
                        <DialogDescription className="pt-1 text-sm text-muted-foreground">
                            This will permanently delete the draft schedule. Since it was never active, it has no trip history. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDeletingSched(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (deletingSched) {
                                    await deleteMut.mutateAsync(deletingSched.primary._id);
                                    if (deletingSched.returnSched) {
                                        await deleteMut.mutateAsync(deletingSched.returnSched._id);
                                    }
                                }
                            }}
                            disabled={deleteMut.isPending}
                        >
                            {deleteMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Delete Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </ErrorBoundaryFallback>
    );
};

class ErrorBoundaryFallback extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 bg-red-100 font-mono">ERROR: {this.state.error?.toString()}<br/>{this.state.error?.stack}</div>;
    }
    return this.props.children;
  }
}

export default BrandSchedulesTab;
