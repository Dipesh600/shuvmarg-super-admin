import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, Route, Bus, User, Building2, MapPin,
  ChevronRight, Loader2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAllCorridors, reviewRouteRequest } from "@/api/platformRegistryApi";

interface RouteRequestReviewModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  requestData: any;
}

const RouteRequestReviewModal: React.FC<RouteRequestReviewModalProps> = ({
  requestId,
  isOpen,
  onClose,
  requestData,
}) => {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [createCorridor, setCreateCorridor] = useState(true);
  const [selectedCorridorId, setSelectedCorridorId] = useState("");
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: corridorsData } = useQuery({
    queryKey: ["corridors"],
    queryFn: getAllCorridors,
    enabled: isOpen,
  });
  const corridors: any[] = corridorsData?.data || [];

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: (payload: any) => reviewRouteRequest(requestId!, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Route request reviewed successfully.");
      queryClient.invalidateQueries({ queryKey: ["routeRequests"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to review request.");
    },
  });

  const handleSubmit = () => {
    if (!requestId) return;
    if (action === "APPROVE") {
      if (createCorridor) {
        if (!originCode.trim() || !destinationCode.trim()) {
          toast.error("Origin and destination city codes are required.");
          return;
        }
        submitReview({ action: "APPROVE", createCorridor: true, originCode, destinationCode, adminNotes });
      } else {
        if (!selectedCorridorId) {
          toast.error("Please select an existing corridor.");
          return;
        }
        submitReview({ action: "APPROVE", corridorId: selectedCorridorId, adminNotes });
      }
    } else {
      if (!rejectionReason.trim()) {
        toast.error("Rejection reason is required.");
        return;
      }
      submitReview({ action: "REJECT", rejectionReason, adminNotes });
    }
  };

  const req = requestData;

  const handleClose = () => {
    setAction("APPROVE");
    setCreateCorridor(true);
    setSelectedCorridorId("");
    setOriginCode("");
    setDestinationCode("");
    setRejectionReason("");
    setAdminNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Route className="h-5 w-5 text-[#D3D925]" />
            Review Route Request
          </DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-5 py-2">
          {/* ── Left: Request Context ─────────────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 border-b pb-1">
              Request Details
            </h4>

            {/* Route */}
            <div className="p-4 rounded-xl border-2 border-[#D3D925]/20 bg-[#D3D925]/10 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D3D925]">Requested Route</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{req?.originCity}</span>
                <ChevronRight className="h-4 w-4 text-white/50" />
                <span className="font-bold text-sm">{req?.destinationCity}</span>
              </div>
              {req?.viaStops?.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <MapPin className="h-3 w-3 text-white/50" />
                  <span className="text-xs text-white/50">Via: {req.viaStops.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Fleet */}
            {req?.fleetId && (
              <div className="p-3 rounded-xl border bg-white/[0.04] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <Bus className="h-3 w-3" /> Fleet
                </p>
                <p className="font-bold text-sm">{req.fleetId.busName}</p>
                <p className="text-xs text-white/50">{req.fleetId.busNumber}</p>
                <Badge variant="outline" className="text-[9px]">
                  {req.fleetId.approvalStatus || "PENDING"}
                </Badge>
              </div>
            )}

            {/* Owner */}
            {req?.ownerId && (
              <div className="p-3 rounded-xl border bg-white/[0.04] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <User className="h-3 w-3" /> Owner
                </p>
                <p className="font-bold text-sm">{req.ownerId.name}</p>
                <p className="text-xs text-white/50">{req.ownerId.phone}</p>
              </div>
            )}

            {/* Brand */}
            {req?.brandId && (
              <div className="p-3 rounded-xl border bg-white/[0.04] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Brand
                </p>
                <p className="font-bold text-sm">{req.brandId.brandName}</p>
                <p className="text-xs text-white/50">{req.brandId.brandCode}</p>
              </div>
            )}

            <p className="text-xs text-white/50">
              Submitted: {req?.createdAt ? new Date(req.createdAt).toLocaleDateString("en-NP", { dateStyle: "medium" }) : "—"}
            </p>
          </div>

          {/* ── Right: Admin Decision ─────────────────────────────── */}
          {/* ── Right: Admin Decision / Resolution ──────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 border-b pb-1">
              {req?.status === "PENDING" ? "Your Decision" : "Resolution Details"}
            </h4>

            {req?.status === "PENDING" ? (
              <>
                {/* Action Toggle */}
                <div className="flex bg-white/[0.04] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAction("APPROVE")}
                    className={cn(
                      "flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5",
                      action === "APPROVE"
                        ? "bg-[#D3D925]/100 text-white shadow-sm"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("REJECT")}
                    className={cn(
                      "flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5",
                      action === "REJECT"
                        ? "bg-white/5 hover:bg-white/5 text-white shadow-sm"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>

                {/* APPROVE options */}
                {action === "APPROVE" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Create vs. Select toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => setCreateCorridor(!createCorridor)}
                        className="text-[#D3D925]"
                      >
                        {createCorridor
                          ? <ToggleRight className="h-6 w-6" />
                          : <ToggleLeft className="h-6 w-6 text-white/50" />}
                      </button>
                      <div>
                        <p className="text-xs font-bold">
                          {createCorridor ? "Create New Corridor" : "Select Existing Corridor"}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {createCorridor
                            ? "A new corridor will be auto-created in the Platform Registry."
                            : "Pick a corridor that already exists in the registry."}
                        </p>
                      </div>
                    </div>

                    {createCorridor ? (
                      <div className="space-y-3 p-4 border-2 border-dashed border-[#D3D925]/30 rounded-xl bg-[#D3D925]/10">
                        <p className="text-xs font-bold text-[#D3D925]">New Corridor Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Origin Code *</Label>
                            <Input
                              placeholder={`e.g. KTM`}
                              value={originCode}
                              onChange={(e) => setOriginCode(e.target.value.toUpperCase())}
                              className="font-bold uppercase h-10"
                            />
                            <p className="text-[10px] text-white/50">Suggested: based on "{req?.originCity}"</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Destination Code *</Label>
                            <Input
                              placeholder={`e.g. BRD`}
                              value={destinationCode}
                              onChange={(e) => setDestinationCode(e.target.value.toUpperCase())}
                              className="font-bold uppercase h-10"
                            />
                            <p className="text-[10px] text-white/50">Suggested: based on "{req?.destinationCity}"</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/50">
                          This will create stop records if they don't exist, then create the corridor <strong>{originCode || "ORI"}-{destinationCode || "DST"}</strong> and link it to the fleet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Select Corridor *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border-2 border-muted bg-[#0a0a0a] px-3 text-sm font-bold focus-visible:outline-none"
                          value={selectedCorridorId}
                          onChange={(e) => setSelectedCorridorId(e.target.value)}
                        >
                          <option value="">Choose a corridor...</option>
                          {corridors.map((c: any) => (
                            <option key={c._id} value={c._id}>
                              {c.code} — {c.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* REJECT options */}
                {action === "REJECT" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Rejection Reason *</Label>
                      <Textarea
                        placeholder="Explain why this route request is being declined..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="resize-none font-medium min-h-[90px] border-white/10 focus:border-white/10"
                      />
                    </div>
                  </div>
                )}

                {/* Admin Notes (always visible) */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Internal Notes (optional)</Label>
                  <Textarea
                    placeholder="Any internal notes for your team..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="resize-none font-medium min-h-[60px]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Status</span>
                    {req?.status === "APPROVED" ? (
                      <Badge className="bg-[#D3D925]/10 text-[#D3D925] hover:bg-[#D3D925]/10 border-[#D3D925]/20">Approved</Badge>
                    ) : (
                      <Badge className="bg-white/5 text-white hover:bg-white/5 border-white/10">Rejected</Badge>
                    )}
                  </div>
                  
                  {req?.status === "APPROVED" && req?.fleetId?.corridorId && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#D3D925] mb-1">Assigned Corridor</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm bg-[#D3D925]/10 text-white/90 px-2 py-0.5 rounded-md border border-[#D3D925]/10">
                            {req.fleetId.corridorId.code}
                          </span>
                        </div>
                        {req.fleetId.corridorId.originId?.name && (
                          <p className="text-xs font-bold text-white/50 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {req.fleetId.corridorId.originId.name} <ArrowRight className="h-3 w-3" /> {req.fleetId.corridorId.destinationId?.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {req?.status === "REJECTED" && req?.rejectionReason && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">Rejection Reason</p>
                      <p className="text-sm font-medium text-white bg-white/5 p-2 rounded-lg border border-white/10">
                        {req.rejectionReason}
                      </p>
                    </div>
                  )}

                  {req?.resolvedBy && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Resolved By</p>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-white/50" />
                        <span className="text-xs font-bold">{req.resolvedBy.name}</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        {new Date(req.resolvedAt).toLocaleString("en-NP")}
                      </p>
                    </div>
                  )}

                  {req?.adminNotes && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Admin Notes</p>
                      <p className="text-xs italic text-white/50 bg-white/5 p-2 rounded-lg">
                        "{req.adminNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2 flex-row justify-end">
          {req?.status === "PENDING" ? (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={isPending}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className={cn(
                  "font-bold min-w-[160px]",
                  action === "APPROVE"
                    ? "bg-[#D3D925] text-black hover:bg-[#D9CD25] text-white"
                    : "bg-white/5 hover:bg-white/5 hover:bg-white/5 text-white"
                )}
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                ) : action === "APPROVE" ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Link Corridor</>
                ) : (
                  <><XCircle className="h-4 w-4 mr-2" /> Reject Request</>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="font-bold">Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteRequestReviewModal;
