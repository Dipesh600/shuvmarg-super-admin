import React, { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bus, MapPin, Users, Settings, Activity, Calendar, Eye, ShieldCheck,
  Map, Wifi, FileText, AlertTriangle, Route, Clock,
  XCircle, LayoutGrid, Loader2, CheckCircle2, Upload
} from "lucide-react";
import { useFetchFleetDetail } from "@/hooks/useOwnerFleets";
import { Separator } from "@/components/ui/separator";
import { reuploadFleetDocument } from "@/api/busOwnerFleetApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DocumentViewerModal from "@/components/DocumentViewerModal";
import { getFleetSeatLayoutAssignment } from "@/api/seatLayoutV3Api";
import type { SecureFleetDocumentRequest } from "@/api/busOwnerFleetApi";
import type { FleetAmenity } from "@/api/busOwnerFleetApi";
import { getErrorMessage } from "@/lib/error-message";

interface ViewOwnerFleetModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

// Document slots shown in the rejection review section
const DOC_SLOTS: Array<{ key: SecureFleetDocumentRequest["slot"]; label: string; icon: React.ReactNode }> = [
  { key: "fleetImages",  label: "Fleet Photos",          icon: <Bus className="h-3.5 w-3.5" /> },
  { key: "fitnessCert",  label: "Fitness Certificate",   icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "insurance",    label: "Insurance Certificate", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "bluebook",     label: "Bluebook (Reg.)",       icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "routePermit",  label: "Route Permit",          icon: <FileText className="h-3.5 w-3.5" /> },
];

const ViewOwnerFleetModal: React.FC<ViewOwnerFleetModalProps> = ({ id, isOpen, onClose }) => {
  const qc = useQueryClient();
  const { data: response, isLoading, isError, refetch } = useFetchFleetDetail(id || "");
  const data = response?.data;
  const selectedAmenities: Array<string | FleetAmenity> = Array.isArray(data?.vehicle?.features)
    ? data.vehicle.features
    : [];
  const approvalStatus = data?.approvalStatus ?? "PENDING";
  const { data: seatAssignment } = useQuery({
    queryKey: ["seat-layout-v3", "fleet-assignment", id],
    queryFn: () => getFleetSeatLayoutAssignment(id!),
    enabled: isOpen && !!id,
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Secure document viewer state ─────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState<string>("Document");
  const [fleetDocumentRequest, setFleetDocumentRequest] = useState<SecureFleetDocumentRequest | null>(null);

  const openSubmittedFleetDocument = (slot: SecureFleetDocumentRequest["slot"], label: string, imageIndex?: number) => {
    if (!id) return;
    setFleetDocumentRequest({ fleetId: id, slot, imageIndex });
    setViewerTitle(label);
    setViewerOpen(true);
  };

  // Re-upload mutation for a single document slot
  const reuploadMutation = useMutation({
    mutationFn: ({ slot, files }: { slot: SecureFleetDocumentRequest["slot"]; files: File[] }) =>
      reuploadFleetDocument(id!, slot, files),
    onSuccess: (_, { slot }) => {
      toast.success(`${slot} replaced successfully.`);
      qc.invalidateQueries({ queryKey: ["fleetDetail", id] });
      refetch();
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Upload failed.")),
  });

  const handleFileSelect = (slot: SecureFleetDocumentRequest["slot"], files: File[]) => {
    reuploadMutation.mutate({ slot, files });
  };

  const reviews = data?.reviewRequirements || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Fleet Overview</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Read-only details</p>
              </div>
            </div>

            {data && (
              <div className="flex items-center gap-2">
                <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"} className="uppercase text-[10px] font-black tracking-widest py-1 px-3">
                  {data.status || "Unknown"}
                </Badge>
                {approvalStatus === "APPROVED" && (
                  <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" /> Approved
                  </div>
                )}
                {approvalStatus === "REJECTED" && (
                  <div className="flex items-center gap-1 text-rose-700 text-[10px] font-black uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    <XCircle className="h-3 w-3" /> Rejected
                  </div>
                )}
                {approvalStatus === "PENDING" && (
                  <div className="flex items-center gap-1 text-amber-700 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Clock className="h-3 w-3" /> KYC Pending
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin p-3 bg-primary/10 rounded-full">
              <Bus className="h-8 w-8 text-primary" />
            </div>
            <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Gathering Fleet Intelligence...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 px-10 text-center">
            <Activity className="h-12 w-12 text-destructive opacity-50" />
            <h3 className="font-black text-lg">Load Failed</h3>
            <Button onClick={() => refetch()} variant="outline" className="mt-4 font-bold h-10 px-6">Retry Fetch</Button>
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col min-h-0 pt-6">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pt-0 space-y-7">

              {/* ── REJECTED or APPROVED: Per-document breakdown with re-upload ── */}
              {(approvalStatus === "REJECTED" || approvalStatus === "APPROVED") && (
                <div className={cn("border-2 rounded-xl overflow-hidden", approvalStatus === "REJECTED" ? "border-rose-200" : "border-blue-200")}>
                  {/* Header */}
                  <div className={cn("px-5 py-4 flex items-start gap-3 border-b", approvalStatus === "REJECTED" ? "bg-rose-50 border-rose-200" : "bg-blue-50 border-blue-200")}>
                    {approvalStatus === "REJECTED" ? (
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn("font-black text-sm", approvalStatus === "REJECTED" ? "text-rose-800" : "text-blue-800")}>
                        {approvalStatus === "REJECTED" ? "Application Rejected" : "Compliance Documents"}
                      </p>
                      {approvalStatus === "REJECTED" && data.rejectionReason && (
                        <p className="text-sm text-rose-700 mt-0.5">{data.rejectionReason}</p>
                      )}
                      <p className={cn("text-[11px] mt-1", approvalStatus === "REJECTED" ? "text-rose-600" : "text-blue-600")}>
                        {approvalStatus === "REJECTED" 
                          ? <span>Review the failed documents below. The bus owner must correct and resubmit them from their dashboard.</span>
                          : "You can renew expiring documents here without taking your fleet offline."}
                      </p>
                    </div>
                  </div>

                  {/* Per-document rows */}
                  <div className={cn("divide-y bg-white", approvalStatus === "REJECTED" ? "divide-rose-100" : "divide-blue-100")}>
                    {DOC_SLOTS.map((slot) => {
                      const review = reviews[slot.key];
                      const status = (review?.status || "PENDING").toUpperCase();
                      const reason = review?.reason;
                      const isRejected = status === "REJECTED";
                      const isFixed = status === "FIXED";
                      const isApproved = status === "APPROVED";
                      const isUploading = reuploadMutation.isPending && reuploadMutation.variables?.slot === slot.key;

                      const showUploadBtn = isRejected || approvalStatus === "APPROVED";

                      return (
                        <div key={slot.key} className={`flex items-center gap-4 px-5 py-3.5 ${isRejected ? "bg-rose-50/40" : isFixed ? "bg-emerald-50/30" : ""}`}>
                          {/* Status icon */}
                          <div className="shrink-0">
                            {isApproved && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            {isRejected && <XCircle className="h-4 w-4 text-rose-500" />}
                            {isFixed && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                            {status === "PENDING" && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                          </div>

                          {/* Label + reason */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{slot.icon}</span>
                              <p className={`text-sm font-bold ${isRejected ? "text-rose-800" : isFixed ? "text-blue-700" : "text-foreground"}`}>
                                {slot.label}
                              </p>
                              {isFixed && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">Re-uploaded</span>
                              )}
                              {isApproved && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">Passed</span>
                              )}
                              {status === "PENDING" && approvalStatus === "APPROVED" && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Pending Renewal</span>
                              )}
                            </div>
                            {isRejected && reason && (
                              <p className="text-xs text-rose-600 mt-0.5 font-medium">↳ {reason}</p>
                            )}
                          </div>

                          {/* Re-upload button for rejected slots or renewals */}
                          {showUploadBtn && (
                            <>
                              <input
                                type="file"
                                multiple={slot.key === "fleetImages"}
                                accept="image/*,application/pdf"
                                className="hidden"
                                ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length) handleFileSelect(slot.key, files);
                                  e.target.value = "";
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUploading}
                                onClick={() => fileInputRefs.current[slot.key]?.click()}
                                className={cn("shrink-0 h-8 text-xs gap-1.5 font-bold", 
                                  isRejected ? "border-rose-300 text-rose-700 hover:bg-rose-50" : "border-blue-300 text-blue-700 hover:bg-blue-50"
                                )}
                              >
                                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                {isUploading ? "Uploading..." : (approvalStatus === "APPROVED" ? "Renew" : "Re-upload")}
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Photo Gallery */}
              {(data.documents?.fleetImages?.count || 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Fleet Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: data.documents?.fleetImages?.count || 0 }, (_, index) => (
                      <Button key={index} variant="outline" className="h-20 flex-col gap-1" onClick={() => openSubmittedFleetDocument("fleetImages", `Fleet photo ${index + 1}`, index)}>
                        <Eye className="h-4 w-4" />
                        <span className="text-[10px]">Photo {index + 1}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Bus className="h-4 w-4 opacity-50" /> No Images Assigned
                  </p>
                </div>
              )}

              {/* Core Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-muted bg-primary/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 mb-1 flex items-center gap-1.5"><Bus className="h-3 w-3" /> Bus Name</p>
                  <h4 className="font-black text-lg tracking-tight leading-none">{data.vehicle.busName}</h4>
                </div>
                <div className="p-4 rounded-xl border border-muted bg-muted/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-1">Registration #</p>
                  <h4 className="font-mono font-bold text-lg tracking-wider text-primary leading-none uppercase">{data.vehicle.busNumber}</h4>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Seat Configuration</p>
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="font-bold">{seatAssignment?.assignment ? "V3 canonical layout assigned" : "No V3 layout assigned"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{seatAssignment?.assignment?.activeRevision?.totalPlaces ?? data.vehicle.totalSeats ?? 0} passenger places</p>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Specifications</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Settings className="h-4 w-4" />, label: "Class", value: data.vehicle.busType },
                    { icon: <Users className="h-4 w-4" />, label: "Capacity", value: `${data.vehicle.totalSeats} Seats` },
                    { icon: <Calendar className="h-4 w-4" />, label: "Reg. Year", value: data.vehicle.registrationYear },
                    { icon: <MapPin className="h-4 w-4" />, label: "Layout", value: data.seatLayout?.assigned ? "Assigned" : "Not assigned" },
                    { icon: <Activity className="h-4 w-4" />, label: "Fleet ID", value: data.fleetCode || data.fleetId, span: 2 },
                  ].map(({ icon, label, value, span }) => (
                    <div key={label} className={`p-3 bg-muted/20 rounded-lg border text-center ${span ? `col-span-${span}` : ""}`}>
                      <div className="flex justify-center mb-1 text-muted-foreground">{icon}</div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">{label}</p>
                      <p className={`font-bold ${span ? "text-xs font-mono" : "text-sm"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Route / Corridor Status */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1"><Route className="h-3 w-3" /> Route Assignment</p>
                {data.assignment.corridor ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-black text-sm text-emerald-800">Corridor Assigned</p>
                      <span className="font-mono text-xs font-bold text-emerald-800">{data.assignment.corridor.code}</span>
                      {data.assignment.corridor.origin && (
                        <span className="text-[10px] text-emerald-700 block">
                          {data.assignment.corridor.origin} → {data.assignment.corridor.destination}
                        </span>
                      )}
                    </div>
                  </div>
                ) : data.assignment.routeRequest ? (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-black text-sm text-amber-800">Route Request Pending Platform Review</p>
                      <p className="text-xs text-amber-700">
                        {data.assignment.routeRequest.origin && data.assignment.routeRequest.destination
                          ? `${data.assignment.routeRequest.origin} → ${data.assignment.routeRequest.destination}`
                          : "Request submitted — awaiting registry assignment"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 border border-muted rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground font-medium">No route assigned yet.</p>
                  </div>
                )}
              </div>

              {/* Fleet Documents */}
              {data.documents && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1"><FileText className="h-3 w-3" /> Fleet Documents</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "fitnessCert", label: "Fitness Certificate", validTill: data.documents.fitnessCert?.validTill, present: data.documents.fitnessCert?.present },
                      { key: "insurance", label: "Insurance", validTill: data.documents.insurance?.validTill, present: data.documents.insurance?.present, extra: data.documents.insurance?.policyNumber },
                      { key: "bluebook", label: "Bluebook (Reg.)", present: data.documents.bluebook?.present },
                      { key: "routePermit", label: "Route Permit", validTill: data.documents.routePermit?.validTill, present: data.documents.routePermit?.present },
                    ].map(({ key, label, validTill, present, extra }) => (
                      <div key={key} className="p-3 bg-muted/10 border rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                          {present
                            ? <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                            : <div className="h-2 w-2 bg-muted-foreground/30 rounded-full" />}
                        </div>
                        {extra && <p className="text-[10px] text-muted-foreground mb-1">Policy: {extra}</p>}
                        {validTill && <p className="text-[10px] text-muted-foreground mb-1">Valid till: {fmtDate(validTill)}</p>}
                        {present ? (
                          <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1.5" onClick={() => openSubmittedFleetDocument(key as SecureFleetDocumentRequest["slot"], label)}>
                            <Eye className="h-3 w-3" /> View Document
                          </Button>
                        ) : (
                          <p className="text-[10px] italic text-muted-foreground/60 text-center pt-1">Not uploaded</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="opacity-50" />

              {/* Amenities & Boarding */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1.5 ml-1">
                    <Wifi className="h-3 w-3" /> Amenities Bundle
                  </p>
                  {selectedAmenities.length > 0 ? (
                    <div className="bg-muted/10 border p-3 rounded-xl">
                      <ul className="space-y-2">
                        {selectedAmenities.map((am, idx) => (
                          <li key={typeof am === "string" ? am : am.id || am._id || idx} className="flex gap-2 items-start text-xs border-b border-muted/50 pb-2 last:border-0 last:pb-0">
                            <span className="h-4 w-4 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5"><Wifi className="h-2 w-2 text-primary" /></span>
                            <div>
                              <p className="font-bold">{typeof am === "string" ? am : am.name}</p>
                              {typeof am !== "string" && am.description && <p className="text-[9px] text-muted-foreground opacity-80">{am.description}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <p className="text-xs font-bold text-muted-foreground">Not Assigned</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1.5 ml-1">
                    <Map className="h-3 w-3" /> Boarding Route
                  </p>
                  {(data.route?.servedStops?.length || 0) > 0 ? (
                    <div className="bg-muted/10 border p-3 rounded-xl">
                      <div className="mb-2 pb-2 border-b">
                        <p className="text-[10px] font-black tracking-widest uppercase opacity-40 mb-1">Reviewed route</p>
                        <p className="text-sm font-bold text-primary">{data.route?.origin} → {data.route?.destination}</p>
                      </div>
                      <ul className="space-y-3 pt-1">
                        {data.route?.servedStops.map((stop, idx) => (
                          <li key={stop.stopId || idx} className="flex gap-2 items-start text-xs">
                            <span className="h-4 w-4 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-primary mt-0.5">{idx + 1}</span>
                            <div>
                              <p className="font-bold flex justify-between">{stop.name} <span className="font-mono bg-muted px-1 rounded">{stop.usage || "STOP"}</span></p>
                              {stop.meetingDetails?.counterNumber && <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">Counter {stop.meetingDetails.counterNumber}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <p className="text-xs font-bold text-muted-foreground">Not Assigned</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <DialogFooter className="p-6 bg-muted/20 border-t flex-shrink-0 mt-auto">
              {approvalStatus === "REJECTED" ? (
                <div className="flex items-center justify-between gap-4 w-full">
                  <p className="flex-1 text-xs text-muted-foreground">
                    The bus owner controls corrections and resubmission from their dashboard.
                  </p>
                  <div className="flex items-center gap-3 shrink-0">
                    <DialogClose asChild>
                      <Button variant="ghost" size="sm" className="font-bold text-xs h-10">Close</Button>
                    </DialogClose>
                  </div>
                </div>
              ) : (
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="font-black uppercase tracking-widest text-xs h-12 w-full hover:bg-primary hover:text-primary-foreground transition-all border-none shadow-md">
                    Close Overview
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
      <DocumentViewerModal
        open={viewerOpen}
        s3Key={null}
        fleetDocumentRequest={fleetDocumentRequest}
        title={viewerTitle}
        onClose={() => setViewerOpen(false)}
      />
    </Dialog>
  );
};

export default ViewOwnerFleetModal;
