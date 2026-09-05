import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createConductor, getConductorsByBrand, updateConductorStatus,
  type ConductorProfile, type ConductorStatus } from "@/api/conductorApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, History, Loader2, MoreVertical,
  Pencil, Phone, Plus, RotateCcw, ShieldAlert, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import StaffFormModal from "./StaffFormModal";
import StaffStatusModal from "./StaffStatusModal";

interface Props { brandId: string; brandName: string; }
const statusDot = (status: ConductorStatus) => ({
  AVAILABLE: "bg-emerald-500", ON_DUTY: "bg-blue-500", OFF_DUTY: "bg-gray-400",
  SUSPENDED: "bg-red-500", INACTIVE: "bg-gray-300",
}[status]);
const accountBadge = (staff: ConductorProfile) => {
  if (staff.accessStatus === "INVITED") return <Badge className="border-amber-200 bg-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-700">Account setup pending</Badge>;
  if (staff.accessStatus === "ACTIVE") return <Badge className="border-emerald-200 bg-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">Account active</Badge>;
  if (staff.accessStatus === "NOT_LINKED") return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">Registry only</Badge>;
  return <Badge className="border-red-200 bg-red-100 text-[9px] font-black uppercase tracking-widest text-red-700">Access {staff.accessStatus.toLowerCase()}</Badge>;
};
const routeLabel = (trip: ConductorProfile["assignedTrips"][number]) => trip.route?.routeName
  || `${trip.route?.fromCity || "Route"} to ${trip.route?.toCity || "destination"}`;

function StaffCard({ staff, pending, onEdit, onStatus, onStatusDialog, onRetry }: {
  staff: ConductorProfile; pending: boolean; onEdit: () => void;
  onStatus: (status: "AVAILABLE" | "OFF_DUTY") => void;
  onStatusDialog: (mode: "suspend" | "restore") => void; onRetry: () => void;
}) {
  const latestHistory = staff.statusHistory.at(-1);
  const activeTrips = staff.assignedTrips.filter(trip => !["completed", "cancelled"].includes(trip.status));
  const removed = Boolean(staff.removedAt) || staff.status === "INACTIVE";
  return <Card className={`border p-5 shadow-xl backdrop-blur-md transition-colors ${staff.status === "SUSPENDED"
    ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-[#121212]/30 hover:border-white/10"}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><UserRoundCheck className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black tracking-tight text-white/90">{staff.fullName}</p>
          <span className={`h-2 w-2 rounded-full ${statusDot(staff.status)}`} /><span className="text-[9px] font-bold uppercase text-white/50">{staff.status.replaceAll("_", " ")}</span></div>
          <div className="mt-0.5 flex items-center gap-2"><Phone className="h-3 w-3 text-white/40" /><span className="text-xs text-white/60">{staff.phone}</span></div></div></div>
      <div className="flex shrink-0 items-center gap-2">{accountBadge(staff)}
        {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "FAILED" && <Badge className="border-red-200 bg-red-100 text-[9px] font-black uppercase tracking-widest text-red-700">Setup SMS failed</Badge>}
        {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "QUEUED" && <Badge className="border-emerald-200 bg-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">Setup SMS queued</Badge>}
        {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "PENDING" && <Badge className="border-amber-200 bg-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-700">Setup SMS pending</Badge>}
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl"><DropdownMenuItem className="text-xs font-bold" onClick={onEdit}><Pencil className="mr-2 h-3 w-3" />Edit Details</DropdownMenuItem>
          {staff.accessStatus === "INVITED" && !removed && <DropdownMenuItem className="text-xs font-bold text-amber-700" onClick={onRetry} disabled={pending}><RotateCcw className="mr-2 h-3 w-3" />Retry Invitation</DropdownMenuItem>}
          {!removed && staff.status !== "ON_DUTY" && staff.status !== "SUSPENDED" && <><DropdownMenuSeparator />
            {staff.status !== "AVAILABLE" && <DropdownMenuItem className="text-xs font-bold text-emerald-600" onClick={() => onStatus("AVAILABLE")}><CheckCircle2 className="mr-2 h-3 w-3" />Mark Available</DropdownMenuItem>}
            {staff.status !== "OFF_DUTY" && <DropdownMenuItem className="text-xs font-bold" onClick={() => onStatus("OFF_DUTY")}><Clock className="mr-2 h-3 w-3" />Mark Off Duty</DropdownMenuItem>}</>}
          {!removed && staff.status !== "SUSPENDED" && <><DropdownMenuSeparator /><DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => onStatusDialog("suspend")}><ShieldAlert className="mr-2 h-3 w-3" />Suspend Staff</DropdownMenuItem></>}
          {staff.status === "SUSPENDED" && !removed && <><DropdownMenuSeparator /><DropdownMenuItem className="text-xs font-bold text-emerald-600" onClick={() => onStatusDialog("restore")}><RotateCcw className="mr-2 h-3 w-3" />Return to Service</DropdownMenuItem></>}
        </DropdownMenuContent></DropdownMenu></div>
    </div>
    <Separator className="my-3 bg-white/5" />
    <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-white/5 bg-white/5 p-3"><div className="mb-1 flex items-center gap-1.5"><CalendarClock className="h-3 w-3 text-[#D3D925]" /><span className="text-[9px] font-black uppercase tracking-widest text-white/50">Trip access</span></div>
      <p className="text-sm font-black text-white/90">{activeTrips.length} active assignment{activeTrips.length === 1 ? "" : "s"}</p>
      {activeTrips.slice(0, 2).map(trip => <p key={trip._id} className="mt-1 truncate text-[10px] text-white/50">{routeLabel(trip)} · {new Date(trip.tripDate).toLocaleDateString()}</p>)}</div>
      <div className="rounded-lg border border-white/5 bg-white/5 p-3"><div className="mb-1 flex items-center gap-1.5"><History className="h-3 w-3 text-[#D3D925]" /><span className="text-[9px] font-black uppercase tracking-widest text-white/50">Administrative record</span></div>
        <p className="text-xs font-black text-white/90">Created by {staff.createdBy === "ADMIN" ? "admin" : "operator"}</p>
        <p className="mt-1 text-[10px] text-white/50">{latestHistory ? `${latestHistory.from} → ${latestHistory.to} · ${new Date(latestHistory.at).toLocaleDateString()}` : "No admin status changes"}</p></div></div>
    {staff.suspensionReason && <div className="mt-3 flex gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[10px] font-bold text-red-400"><ShieldAlert className="h-3 w-3 shrink-0" />{staff.suspensionReason}</div>}
    {removed && <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[10px] font-bold text-amber-400"><AlertTriangle className="h-3 w-3 shrink-0" />Removed by the operator. Only the operator can rehire this staff member.</div>}
    {staff.notes && <p className="mt-3 text-[10px] text-white/50">{staff.notes}</p>}
  </Card>;
}

export default function StaffTab({ brandId, brandName }: Props) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | ConductorStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ConductorProfile | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ staff: ConductorProfile; mode: "suspend" | "restore" } | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["brand-staff", brandId, filter],
    queryFn: () => getConductorsByBrand(brandId, filter === "all" ? {} : { status: filter }), enabled: Boolean(brandId) });
  const staff = data?.data || [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["brand-staff", brandId] });
  const statusMutation = useMutation({ mutationFn: ({ id, status, reason }: { id: string; status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED"; reason?: string }) => updateConductorStatus(id, status, reason),
    onSuccess: result => { invalidate(); setStatusTarget(null); toast.success(result.message); },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Status update failed")) });
  const retryMutation = useMutation({ mutationFn: (member: ConductorProfile) => createConductor({ brandId, name: member.fullName, phone: member.phone, resendInvite: true }),
    onSuccess: result => { invalidate(); toast.success(result.message); },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Invitation retry failed")) });
  const filters: Array<{ key: "all" | ConductorStatus; label: string }> = [
    { key: "all", label: "All" }, { key: "AVAILABLE", label: "Available" }, { key: "ON_DUTY", label: "On Trip" },
    { key: "OFF_DUTY", label: "Off Duty" }, { key: "SUSPENDED", label: "Suspended" }, { key: "INACTIVE", label: "Removed" },
  ];
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-black uppercase tracking-widest text-primary">Staff Registry</h3>
      <p className="mt-0.5 text-xs font-bold text-muted-foreground">{data?.results || 0} conductors · {brandName}</p></div>
      <Button size="sm" className="h-9 gap-2 rounded-xl px-4 text-xs font-black" onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" />Add Staff</Button></div>
    <div className="flex flex-wrap gap-2">{filters.map(item => <button key={item.key} onClick={() => setFilter(item.key)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${filter === item.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{item.label}</button>)}</div>
    {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      : staff.length === 0 ? <div className="space-y-3 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50"><UserRoundX className="h-7 w-7 text-muted-foreground/40" /></div><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No staff found</p><p className="text-[10px] text-muted-foreground">Add conductors for Partner-app passenger manifests and boarding.</p><Button size="sm" className="h-8 rounded-xl text-xs font-black" onClick={() => setShowCreate(true)}>Add First Staff Member</Button></div>
      : <div className="grid gap-4">{staff.map(member => <StaffCard key={member._id} staff={member} pending={statusMutation.isPending || retryMutation.isPending} onEdit={() => setEditing(member)}
        onRetry={() => retryMutation.mutate(member)} onStatus={status => statusMutation.mutate({ id: member._id, status })}
        onStatusDialog={mode => setStatusTarget({ staff: member, mode })} />)}</div>}
    {showCreate && <StaffFormModal brandId={brandId} brandName={brandName} open onClose={() => setShowCreate(false)} onSuccess={() => { invalidate(); setShowCreate(false); }} />}
    {editing && <StaffFormModal brandId={brandId} brandName={brandName} staff={editing} open onClose={() => setEditing(null)} onSuccess={() => { invalidate(); setEditing(null); }} />}
    {statusTarget && <StaffStatusModal staff={statusTarget.staff} mode={statusTarget.mode} pending={statusMutation.isPending} onClose={() => setStatusTarget(null)}
      onConfirm={(status, reason) => statusMutation.mutate({ id: statusTarget.staff._id, status, reason })} />}
  </div>;
}
