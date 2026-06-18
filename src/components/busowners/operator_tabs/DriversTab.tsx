import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDriversByBrand, approveDriver, rejectDriver,
  DriverProfile, DriverApprovalStatus,
} from "@/api/driverApi";
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
  ShieldCheck, ShieldAlert, AlertTriangle, Clock, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import DriverFormModal from "./CreateDriverModal";
import RejectDriverModal from "./RejectDriverModal";

interface DriversTabProps {
  brandId: string;
  brandName: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const approvalBadge = (s: DriverApprovalStatus) => {
  const map: Record<DriverApprovalStatus, { label: string; className: string }> = {
    APPROVED: { label: "Approved",   className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    PENDING:  { label: "Pending",    className: "bg-amber-100 text-amber-700 border-amber-200" },
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
  onApprove:  (id: string) => void;
  onReject:   (driver: DriverProfile) => void;
  onEdit:     (driver: DriverProfile) => void;
  approving:  boolean;
}> = ({ driver, onApprove, onReject, onEdit, approving }) => {
  const licenseExpired   = driver.licenseExpiry   && new Date(driver.licenseExpiry)   < new Date();
  const medicalExpired   = driver.medicalCertExpiry && new Date(driver.medicalCertExpiry) < new Date();
  const licenseExpiring  = !licenseExpired && driver.licenseExpiry &&
    Math.ceil((new Date(driver.licenseExpiry).getTime() - Date.now()) / 86400000) < 30;
  const medicalExpiring  = !medicalExpired && driver.medicalCertExpiry &&
    Math.ceil((new Date(driver.medicalCertExpiry).getTime() - Date.now()) / 86400000) < 30;
  const hasCompliance    = licenseExpired || medicalExpired || licenseExpiring || medicalExpiring;

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
              {/* Edit — available for all statuses */}
              <DropdownMenuItem
                className="font-bold text-xs"
                onClick={() => onEdit(driver)}
              >
                <Pencil className="w-3 h-3 mr-2" />
                Edit Details
              </DropdownMenuItem>

              {/* Approve — only for PENDING */}
              {driver.approvalStatus === "PENDING" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-emerald-600 font-bold text-xs"
                    onClick={() => onApprove(driver._id)}
                    disabled={approving}
                  >
                    {approving
                      ? <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      : <UserCheck className="w-3 h-3 mr-2" />
                    }
                    Approve Driver
                  </DropdownMenuItem>
                </>
              )}

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
      <div className="grid grid-cols-2 gap-3">
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

        <div className={`rounded-lg p-2.5 space-y-0.5 ${medicalExpired ? "bg-red-500/10 border border-red-500/20 text-red-400" : medicalExpiring ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-white/5 border border-white/5"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3 w-3 text-[#D3D925]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Medical Cert</span>
          </div>
          {driver.medicalCertExpiry ? (
            expiryWarning(driver.medicalCertExpiry)
          ) : (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-bold">Not uploaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Assigned bus */}
      {driver.assignedBusId && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-white/50 font-bold">
          <Clock className="h-3 w-3" />
          Primary bus: <span className="text-white/90">{(driver.assignedBusId as any).busName} · {(driver.assignedBusId as any).busNumber}</span>
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

  const approveMut = useMutation({
    mutationFn: (id: string) => approveDriver(id),
    onSuccess:  () => { invalidate(); toast.success("Driver approved."); },
    onError:    (e: any) => toast.error(e.response?.data?.message || "Approval failed"),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectDriver(id, reason),
    onSuccess:  () => { invalidate(); setRejectTarget(null); toast.success("Driver rejected."); },
    onError:    (e: any) => toast.error(e.response?.data?.message || "Rejection failed"),
  });

  // Compliance counts for header summary
  const expiredCount = drivers.filter((d) => {
    const licExpired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
    const medExpired = d.medicalCertExpiry && new Date(d.medicalCertExpiry) < new Date();
    return licExpired || medExpired;
  }).length;

  const filters: Array<{ key: "all" | DriverApprovalStatus; label: string }> = [
    { key: "all",      label: "All" },
    { key: "APPROVED", label: "Approved" },
    { key: "PENDING",  label: "Pending Review" },
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
              onApprove={(id)      => approveMut.mutate(id)}
              onReject={(driver)   => setRejectTarget(driver)}
              onEdit={(driver)     => setEditingDriver(driver)}
              approving={approveMut.isPending}
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
