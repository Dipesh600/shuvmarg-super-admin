import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDriversByBrand, rejectDriver, resendDriverAccessMessage } from "@/api/driverApi";
import type { DriverProfile, DriverApprovalStatus } from "@/api/driverApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCheck, UserX, MoreVertical, Plus, Loader2, Phone, CreditCard,
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Pencil, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import DriverFormModal from "./CreateDriverModal";
import RejectDriverModal from "./RejectDriverModal";
import DriverDocumentPreview from "./DriverDocumentPreview";
import { getErrorMessage } from "@/lib/error-message";

interface DriversTabProps {
  brandId: string;
  brandName: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const approvalBadge = (s: DriverApprovalStatus) => {
  const map: Record<DriverApprovalStatus, { label: string; className: string }> = {
    APPROVED: { label: "Approved",   className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    PENDING:  { label: "Security update required", className: "bg-amber-100 text-amber-700 border-amber-200" },
    REJECTED: { label: "Rejected",   className: "bg-red-100 text-red-700 border-red-200" },
  };
  const { label, className } = map[s] || map.PENDING;
  return <Badge className={`uppercase text-[9px] font-black tracking-widest ${className}`}>{label}</Badge>;
};

const statusDot = (s: string) => {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-emerald-500",
    ON_DUTY:   "bg-blue-500",
    OFF_DUTY:  "bg-gray-400",
    SUSPENDED: "bg-red-500",
    INACTIVE:  "bg-gray-300",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[s] || "bg-gray-300"}`} />;
};

const expiryWarning = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const diff   = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (diff < 0)  return (
    <span className="flex items-center gap-1 text-[10px] font-black text-red-600">
      <AlertTriangle className="h-3 w-3" /> EXPIRED
    </span>
  );
  if (diff < 30) return (
    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600">
      <AlertTriangle className="h-3 w-3" /> Expires in {diff}d
    </span>
  );
  return <span className="text-[10px] text-muted-foreground">{expiry.toLocaleDateString()}</span>;
};

// ── Driver Card ────────────────────────────────────────────────────────────────

const DriverCard: React.FC<{
  driver: DriverProfile;
  onReject:   (driver: DriverProfile) => void;
  onEdit:     (driver: DriverProfile) => void;
  onSendAccess: (driver: DriverProfile) => void;
  sendingAccess: boolean;
}> = ({ driver, onReject, onEdit, onSendAccess, sendingAccess }) => {
  const [renderedAt] = useState(() => Date.now());
  const licenseExpired   = driver.licenseExpiry   && new Date(driver.licenseExpiry).getTime() < renderedAt;
  const licenseExpiring  = !licenseExpired && driver.licenseExpiry &&
    Math.ceil((new Date(driver.licenseExpiry).getTime() - renderedAt) / 86400000) < 30;
  const hasCompliance    = licenseExpired || licenseExpiring;

  return (
    <Card className={`p-5 border backdrop-blur-md shadow-xl transition-colors ${
      hasCompliance
        ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
        : "border-white/5 bg-[#121212]/30 hover:border-white/10"
    }`}>
      <div className="flex items-start justify-between gap-3">

        {/* Left — identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-sm tracking-tight text-white/90">{driver.fullName}</p>
              {statusDot(driver.status)}
              <span className="text-[9px] font-bold text-white/50 uppercase">{driver.status}</span>
              {driver.accessStatus === "INVITED" && <Badge className="border-amber-200 bg-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-700"><Clock className="mr-1 h-2.5 w-2.5" />Account setup pending</Badge>}
              {driver.accessStatus === "ACTIVE" && <Badge className="border-blue-200 bg-blue-100 text-[9px] font-black uppercase tracking-widest text-blue-700"><CheckCircle2 className="mr-1 h-2.5 w-2.5" />Account active</Badge>}
              {driver.accessStatus === "NOT_LINKED" && <Badge className="border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/60">Registry only</Badge>}
              {driver.accessStatus === "SUSPENDED" && <Badge className="border-red-200 bg-red-100 text-[9px] font-black uppercase tracking-widest text-red-700">Account access suspended</Badge>}
              {driver.accessStatus === "REMOVED" && <Badge className="border-gray-200 bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-700">Crew access removed</Badge>}
              {driver.accessStatus === "INVITED" && driver.invitationDeliveryStatus === "PENDING" && <Badge className="border-amber-200 bg-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-700">Setup SMS pending</Badge>}
              {driver.accessStatus === "INVITED" && driver.invitationDeliveryStatus === "FAILED" && <Badge className="border-red-200 bg-red-100 text-[9px] font-black uppercase tracking-widest text-red-700">Setup SMS failed</Badge>}
              {driver.accessStatus === "INVITED" && driver.invitationDeliveryStatus === "QUEUED" && <Badge className="border-emerald-200 bg-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">Setup SMS queued</Badge>}
              {hasCompliance && (
                <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">
                  <AlertTriangle className="h-2.5 w-2.5" /> Compliance
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Phone className="h-3 w-3 text-white/40" />
              <span className="text-xs text-white/60">{driver.phone}</span>
            </div>
          </div>
        </div>

        {/* Right — approval badge + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {approvalBadge(driver.approvalStatus)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-44">
              {driver.userId && driver.accessStatus === "INVITED" && <DropdownMenuItem
                className="font-bold text-xs text-amber-700"
                disabled={sendingAccess}
                onClick={() => onSendAccess(driver)}
              >
                <RotateCcw className="mr-2 h-3 w-3" />Retry setup SMS
              </DropdownMenuItem>}
              {/* Edit — available for all statuses */}
              <DropdownMenuItem
                className="font-bold text-xs"
                onClick={() => onEdit(driver)}
              >
                <Pencil className="w-3 h-3 mr-2" />
                {driver.approvalStatus === "PENDING" ? "Complete Security Check" : "Edit Details"}
              </DropdownMenuItem>

              {/* Reject — for PENDING and APPROVED (revoke) */}
              {driver.approvalStatus !== "REJECTED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 font-bold text-xs"
                    onClick={() => onReject(driver)}
                  >
                    <UserX className="w-3 h-3 mr-2" />
                    {driver.approvalStatus === "APPROVED" ? "Revoke Approval" : "Reject"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="my-3 bg-white/5" />

      {/* Compliance row */}
      <div>
        <div className={`rounded-lg p-2.5 space-y-0.5 ${licenseExpired ? "bg-red-500/10 border border-red-500/20 text-red-400" : licenseExpiring ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-white/5 border border-white/5"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className="h-3 w-3 text-[#D3D925]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">License</span>
          </div>
          <p className="text-xs font-black tracking-wider text-white/90">{driver.licenseNumber}</p>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 border-white/10 text-white/70">{driver.licenseType}</Badge>
            {expiryWarning(driver.licenseExpiry)}
          </div>
        </div>

      </div>

      <DriverDocumentPreview driver={driver} />
      {!driver.userId && (
        <p className="mt-2 text-xs text-muted-foreground">Registry profile only. Operator crew onboarding is required for app access.</p>
      )}

      {/* Assigned bus */}
      {driver.assignedBusId && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-white/50 font-bold">
          <Clock className="h-3 w-3" />
          Primary bus: <span className="text-white/90">{driver.assignedBusId.busName} · {driver.assignedBusId.busNumber}</span>
        </div>
      )}

      {driver.rejectionReason && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-red-600 font-bold bg-red-50 rounded-lg p-2">
          <ShieldAlert className="h-3 w-3 flex-shrink-0" />
          {driver.rejectionReason}
        </div>
      )}
    </Card>
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────

const DriversTab: React.FC<DriversTabProps> = ({ brandId, brandName }) => {
  const qc = useQueryClient();
  const [showCreate,    setShowCreate]    = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<DriverProfile | null>(null);
  const [activeFilter,  setActiveFilter]  = useState<"all" | DriverApprovalStatus>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["brand-drivers", brandId, activeFilter],
    queryFn:  () => getDriversByBrand(brandId, activeFilter !== "all" ? { approvalStatus: activeFilter } : {}),
    enabled:  !!brandId,
  });
  const drivers = data?.data || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["brand-drivers", brandId] });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectDriver(id, reason),
    onSuccess:  () => { invalidate(); setRejectTarget(null); toast.success("Driver rejected."); },
    onError:    (error: unknown) => toast.error(getErrorMessage(error, "Rejection failed")),
  });
  const accessMessageMut = useMutation({
    mutationFn: resendDriverAccessMessage,
    onSuccess: (result) => {
      if ("notificationStatus" in result.data && result.data.notificationStatus === "QUEUED") {
        toast.success("Driver access SMS queued.");
      } else {
        toast.error(result.message || "The driver access SMS could not be queued.");
      }
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Unable to send driver access SMS")),
  });

  // Compliance counts for header summary
  const expiredCount = drivers.filter((d) => {
    const licExpired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
    return licExpired;
  }).length;

  const filters: Array<{ key: "all" | DriverApprovalStatus; label: string }> = [
    { key: "all",      label: "All" },
    { key: "APPROVED", label: "Approved" },
    { key: "PENDING",  label: "Security Update" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Driver Registry</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground font-bold">
              {data?.results || 0} drivers · {brandName}
            </p>
            {expiredCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-2.5 w-2.5" />
                {expiredCount} compliance issue{expiredCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="h-9 px-4 rounded-xl font-black gap-2 text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Driver
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeFilter === key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
            <UserX className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No drivers found</p>
          <p className="text-[10px] text-muted-foreground">Add drivers to this brand before creating schedules.</p>
          <Button size="sm" className="h-8 rounded-xl font-black text-xs" onClick={() => setShowCreate(true)}>
            Add First Driver
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <DriverCard
              key={driver._id}
              driver={driver}
              onReject={(driver)   => setRejectTarget(driver)}
              onEdit={(driver)     => setEditingDriver(driver)}
              onSendAccess={(driver) => accessMessageMut.mutate(driver)}
              sendingAccess={accessMessageMut.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showCreate && (
        <DriverFormModal
          brandId={brandId}
          brandName={brandName}
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { invalidate(); setShowCreate(false); }}
        />
      )}

      {editingDriver && (
        <DriverFormModal
          brandId={brandId}
          brandName={brandName}
          driver={editingDriver}
          isOpen={!!editingDriver}
          onClose={() => setEditingDriver(null)}
          onSuccess={() => { invalidate(); setEditingDriver(null); }}
        />
      )}

      {rejectTarget && (
        <RejectDriverModal
          driverName={rejectTarget.fullName}
          isOpen={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => rejectMut.mutate({ id: rejectTarget._id, reason })}
          isPending={rejectMut.isPending}
        />
      )}
    </div>
  );
};

export default DriversTab;
