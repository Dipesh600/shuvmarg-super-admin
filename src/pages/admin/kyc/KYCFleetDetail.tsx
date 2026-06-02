import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, ExternalLink, Bus, Building2,
  ImageIcon, Loader2, LayoutGrid, Route, AlertTriangle, ShieldCheck, Clock
} from "lucide-react";
import { toast } from "sonner";
import { useFetchFleetDetail, useUpdateOwnerFleet } from "@/hooks/useOwnerFleets";
import { resubmitFleetById } from "@/api/busOwnerFleetApi";
import { MiniSeatMapPreview } from "@/components/busowners/operator_tabs/MiniSeatMapPreview";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrandsByOwner } from "@/api/operatorBrandApi";

/* ─── Types ─────────────────────────────────────────────────────── */
type DocStatus = { verified: boolean; rejectionReason: string | null };

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

/* ─── Badge helper ───────────────────────────────────────────────── */
const ApprovalBadge = ({ status }: { status: string }) => {
  if (status === "APPROVED") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black uppercase tracking-widest text-[10px]"><ShieldCheck className="h-3 w-3 mr-1" />Approved</Badge>;
  if (status === "REJECTED") return <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-black uppercase tracking-widest text-[10px]"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-black uppercase tracking-widest text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
};

export default function KYCFleetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: fleetResponse, isLoading, isError } = useFetchFleetDetail(id!);
  const fleet = fleetResponse?.data;

  /* Brand context */
  const { data: brandsData } = useQuery({
    queryKey: ["ownerBrands", fleet?.ownerId?._id],
    queryFn: () => getBrandsByOwner(fleet?.ownerId?._id),
    enabled: !!fleet?.ownerId?._id,
  });
  const ownerBrand = brandsData?.data?.find((b: any) => b._id === fleet?.brandId) ?? brandsData?.data?.[0] ?? null;

  /* Build document sections from fleet data */
  const documentSections = useMemo(() => {
    if (!fleet) return [];
    return [
      {
        title: "Fleet Images",
        key: "fleetImages",
        icon: <ImageIcon className="h-4 w-4" />,
        documents: fleet.fleetImages || [],
        details: [{ label: "Count", value: `${fleet.fleetImages?.length || 0} photos` }],
      },
      {
        title: "Fitness Certificate",
        key: "fitnessCert",
        icon: <FileText className="h-4 w-4" />,
        documents: fleet.fleetDocuments?.fitnessCert?.url ? [fleet.fleetDocuments.fitnessCert.url] : [],
        details: [{ label: "Valid Till", value: fmtDate(fleet.fleetDocuments?.fitnessCert?.validTill) }],
      },
      {
        title: "Route Permit",
        key: "routePermit",
        icon: <FileText className="h-4 w-4" />,
        documents: fleet.fleetDocuments?.routePermit?.url ? [fleet.fleetDocuments.routePermit.url] : [],
        details: [{ label: "Valid Till", value: fmtDate(fleet.fleetDocuments?.routePermit?.validTill) }],
      },
      {
        title: "Insurance Certificate",
        key: "insurance",
        icon: <FileText className="h-4 w-4" />,
        documents: fleet.fleetDocuments?.insurance?.url ? [fleet.fleetDocuments.insurance.url] : [],
        details: [
          { label: "Policy No.", value: fleet.fleetDocuments?.insurance?.policyNumber || "N/A" },
          { label: "Valid Till", value: fmtDate(fleet.fleetDocuments?.insurance?.validTill) },
        ],
      },
      {
        title: "Bluebook (Registration)",
        key: "bluebook",
        icon: <FileText className="h-4 w-4" />,
        documents: fleet.fleetDocuments?.bluebook?.url ? [fleet.fleetDocuments.bluebook.url] : [],
        details: [{ label: "Status", value: "Uploaded" }],
      },
    ];
  }, [fleet]);

  /* Per-doc verification state — fresh each review session, no localStorage */
  const defaultStatuses = useMemo<Record<string, DocStatus>>(() => {
    const result: Record<string, DocStatus> = {};
    documentSections.forEach(s => {
      result[s.key] = { verified: false, rejectionReason: null };
    });
    return result;
  }, [documentSections]);

  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(defaultStatuses);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  /* Approval mutation — invalidates both fleet detail and roster caches */
  const updateMutation = useUpdateOwnerFleet(id!);
  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: async (formData: FormData) => {
      await updateMutation.mutateAsync(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
      queryClient.invalidateQueries({ queryKey: ["unified_kyc"] });
      queryClient.invalidateQueries({ queryKey: ["getAllKyc"] });
      toast.success("Fleet KYC approved! Bus is ready for operations.");
      setFinalApprovalDialog(false);
      navigate("/admin/kyc");
    },
    onError: () => toast.error("Failed to update fleet status."),
  });

  /* Resubmit mutation — moves REJECTED fleet back to PENDING */
  const { mutate: resubmit, isPending: isResubmitting } = useMutation({
    mutationFn: () => resubmitFleetById(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleetDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
      queryClient.invalidateQueries({ queryKey: ["unified_kyc"] });
      queryClient.invalidateQueries({ queryKey: ["getAllKyc"] });
      toast.success("Fleet resubmitted — it is now PENDING review.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to resubmit fleet."),
  });

  /* Sections that have at least one uploaded file */
  const reviewableSections = documentSections.filter(s => s.documents.length > 0);
  /* allVerified = admin has explicitly verified every uploaded section (optional, for display) */
  const allVerified = reviewableSections.length > 0 && reviewableSections.every(s => docStatuses[s.key]?.verified);
  /* hasRejections = admin explicitly flagged at least one section — this BLOCKS final approval */
  const hasRejections = Object.values(docStatuses).some(s => s.rejectionReason);
  /* canApprove = no explicit flags and there is at least one document on record */
  const canApprove = !hasRejections && reviewableSections.length > 0;

  const handleVerify = (key: string) => {
    setDocStatuses(prev => ({ ...prev, [key]: { verified: true, rejectionReason: null } }));
    toast.success("Document section verified ✓");
  };

  const openRejectDialog = (key: string) => {
    setCurrentRejectKey(key);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (currentRejectKey && rejectionReason.trim()) {
      setDocStatuses(prev => ({ ...prev, [currentRejectKey]: { verified: false, rejectionReason: rejectionReason.trim() } }));
      setRejectDialogOpen(false);
      toast.warning("Section flagged for rejection.");
    }
  };

  const handleFinalApproval = () => {
    const fd = new FormData();
    fd.append("approvalStatus", "APPROVED");
    fd.append("status", "ACTIVE");
    approve(fd);
  };

  const handleFinalRejection = async () => {
    const fd = new FormData();
    fd.append("approvalStatus", "REJECTED");
    fd.append("rejectionReason", finalRejectionReason);
    fd.append("status", "INACTIVE");

    // ── Persist per-document review decisions ─────────────────────────────────
    // Convert local docStatuses to documentReviews format so the bus owner
    // can see exactly which document failed and why, instead of a single string.
    const documentReviews: Record<string, { status: string; reason: string | null }> = {};
    Object.entries(docStatuses).forEach(([key, val]) => {
      documentReviews[key] = {
        status: val.verified ? "approved" : val.rejectionReason ? "rejected" : "pending",
        reason: val.rejectionReason || null,
      };
    });
    fd.append("documentReviews", JSON.stringify(documentReviews));

    approve(fd);
    setFinalRejectionDialog(false);
    navigate("/admin/kyc");
  };

  /* ── Loading / Error ────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Fleet KYC...</p>
    </div>
  );

  if (isError || !fleet) return (
    <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
      <p className="text-lg font-bold text-destructive">Failed to load fleet details.</p>
      <Button onClick={() => navigate("/admin/kyc")}>Go Back</Button>
    </div>
  );

  const approvalStatus = fleet.approvalStatus ?? "PENDING";

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/kyc")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Fleet KYC Review</h1>
            <p className="text-muted-foreground text-sm">
              Reviewing documents for <span className="font-semibold text-foreground">{fleet.busName}</span>
              <span className="font-mono ml-2 text-xs bg-muted px-2 py-0.5 rounded uppercase">{fleet.busNumber}</span>
            </p>
          </div>
          <ApprovalBadge status={approvalStatus} />
        </div>

        {/* Rejection banner */}
        {approvalStatus === "REJECTED" && fleet.rejectionReason && (
          <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-2xl flex gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-rose-800 text-sm uppercase tracking-widest mb-1">Previously Rejected</p>
              <p className="text-sm text-rose-700">{fleet.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Brand Context Card */}
        {ownerBrand && (
          <Card className="border-primary/20 bg-primary/3">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                {ownerBrand.logo
                  ? <img src={ownerBrand.logo} alt={ownerBrand.brandName} className="h-full w-full object-cover" />
                  : <Building2 className="h-6 w-6 text-primary/50" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-black tracking-tight">{ownerBrand.brandName}</p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">{ownerBrand.brandCode}</span>
                  <Badge variant="outline" className={`text-[10px] font-black uppercase border-none ${ownerBrand.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ownerBrand.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{ownerBrand.baseCity} · {ownerBrand.fleetCount || 0} vehicles registered</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Operator</p>
                <p className="font-bold text-sm">{fleet.ownerId?.name}</p>
                <p className="text-xs text-muted-foreground">{fleet.ownerId?.phone || fleet.ownerId?.email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Info + Seat Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bus className="h-5 w-5" /> Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 items-start flex-wrap">
              {fleet.seatConfig && (
                <div className="shrink-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" /> Declared Seat Layout
                  </p>
                  <MiniSeatMapPreview config={fleet.seatConfig} size="sm" showLabels />
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3 flex-1 min-w-0">
                {[
                  { label: "Bus Name", value: fleet.busName },
                  { label: "Bus Number", value: fleet.busNumber?.toUpperCase() },
                  { label: "Class", value: fleet.busType },
                  { label: "Capacity", value: `${fleet.totalSeats} seats` },
                  { label: "Layout", value: fleet.seatLayout },
                  { label: "Reg. Year", value: fleet.registrationYear || "N/A" },
                  { label: "Fleet ID", value: fleet.fleetId },
                  { label: "Submitted", value: fmtDate(fleet.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route / Corridor Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" /> Route Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {fleet.corridorId ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-sm text-emerald-800">Corridor Assigned</p>
                  <div className="flex flex-col mt-0.5">
                    <span className="font-mono text-xs font-bold text-emerald-800">{fleet.corridorId?.code}</span>
                    {fleet.corridorId?.originId?.name && (
                      <span className="text-[10px] text-emerald-700">
                        {fleet.corridorId.originId.name} → {fleet.corridorId.destinationId?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : fleet.routeRequestId ? (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-black text-sm text-amber-800">Route Request Pending</p>
                  <p className="text-xs text-amber-700">
                    {fleet.routeRequestId?.originCity && fleet.routeRequestId?.destinationCity
                      ? `${fleet.routeRequestId.originCity} → ${fleet.routeRequestId.destinationCity}`
                      : "Request submitted — awaiting platform registry assignment"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/30 border border-muted rounded-xl">
                <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground font-medium">No route or corridor assigned yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Sections */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
            {approvalStatus === "PENDING"
              ? `Document Review — ${reviewableSections.length} of ${documentSections.length} sections have files`
              : approvalStatus === "APPROVED"
              ? `Documents on Record — ${reviewableSections.length} files submitted`
              : `Submitted Documents (read-only audit record)`}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documentSections.map((section) => {
              const st = docStatuses[section.key] ?? { verified: false, rejectionReason: null };
              const hasDocuments = section.documents.length > 0;
              const isPending = approvalStatus === "PENDING";
              return (
                <Card
                  key={section.key}
                  className={
                    !hasDocuments ? "opacity-60 border-dashed" :
                    (isPending && st.verified) || approvalStatus === "APPROVED" ? "border-emerald-200 bg-emerald-50/50" :
                    (isPending && st.rejectionReason) || approvalStatus === "REJECTED" ? "border-rose-300 bg-rose-50/30" : ""
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {section.icon} {section.title}
                      </CardTitle>
                      {/* Status chip */}
                      {!hasDocuments ? (
                        <Badge variant="secondary" className="text-[10px] font-black uppercase">Not Uploaded</Badge>
                      ) : approvalStatus === "APPROVED" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : approvalStatus === "REJECTED" ? (
                        <Badge className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                      ) : (
                        st.verified
                          ? <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                          : st.rejectionReason
                          ? <Badge className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase"><XCircle className="h-3 w-3 mr-1" />Flagged</Badge>
                          : <Badge className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Pending Review</Badge>
                      )}
                    </div>
                    {isPending && st.rejectionReason && (
                      <CardDescription className="text-rose-600 text-xs mt-1">
                        Reason: {st.rejectionReason}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.details && (
                      <div className="grid gap-1">
                        {section.details.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{d.label}:</span>
                            <span className="font-medium text-right max-w-[60%] truncate">{d.value || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasDocuments ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No file uploaded for this section.</p>
                    ) : (
                      <div className="space-y-1">
                        {section.documents.map((url: string, idx: number) => (
                          <Button key={idx} variant="outline" size="sm" className="w-full justify-start text-xs"
                            onClick={() => window.open(url, "_blank")}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            {section.key === "fleetImages" ? `View Image #${idx + 1}` : "View Document"}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Verify / Flag buttons — ONLY in PENDING mode */}
                    {isPending && hasDocuments && !st.verified && !st.rejectionReason && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1 text-xs" onClick={() => handleVerify(section.key)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => openRejectDialog(section.key)}>
                          <XCircle className="h-3 w-3 mr-1" /> Flag Issue
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Final Decision Card */}
        <Card className={
          approvalStatus === "APPROVED" ? "border-emerald-200 bg-emerald-50/30" :
          approvalStatus === "REJECTED" ? "border-rose-200 bg-rose-50/20" : ""
        }>
          <CardHeader>
            <CardTitle>KYC Decision Record</CardTitle>
            <CardDescription>
              {approvalStatus === "APPROVED"
                ? "This fleet has been approved and is cleared for operations."
                : approvalStatus === "REJECTED"
                ? "This application was rejected. The bus owner must resubmit with corrected documentation."
                : hasRejections
                ? "One or more document sections have been flagged — resolve flags or reject the application."
                : canApprove
                ? `${allVerified ? "All sections verified — " : ""}Ready to make a final decision.`
                : "No documents have been uploaded yet — cannot approve."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            {approvalStatus === "APPROVED" ? (
              /* ── APPROVED state: sealed record, no actions ── */
              <div className="flex items-center gap-3 text-emerald-700 font-semibold bg-emerald-100/60 px-5 py-4 rounded-xl border border-emerald-200 w-full">
                <ShieldCheck className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-black text-sm">Fleet Approved</p>
                  <p className="text-xs font-normal text-emerald-600 mt-0.5">
                    Approved on {fmtDate(fleet.approvedAt)} · Bus is ACTIVE and operational.
                  </p>
                </div>
              </div>
            ) : approvalStatus === "REJECTED" ? (
              /* ── REJECTED state: show reason + allow resubmission ── */
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-start gap-3 text-rose-700 bg-rose-100/60 px-5 py-4 rounded-xl border border-rose-200">
                  <XCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-sm">Fleet Registration Rejected</p>
                    {fleet.rejectionReason && (
                      <p className="text-xs font-normal text-rose-600 mt-1">
                        Reason on record: {fleet.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="outline"
                    disabled={isResubmitting}
                    onClick={() => resubmit()}
                    className="border-amber-400 text-amber-700 hover:bg-amber-50"
                  >
                    {isResubmitting
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <AlertTriangle className="h-4 w-4 mr-2" />}
                    Resubmit for Review
                  </Button>
                  <p className="text-xs text-muted-foreground">Reset to PENDING so a new review cycle can begin.</p>
                </div>
              </div>
            ) : (
              /* ── PENDING state: active decision controls ── */
              <>
                <Button
                  size="lg"
                  disabled={isApproving || !canApprove}
                  onClick={() => setFinalApprovalDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                >
                  {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve Fleet Registration
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={isApproving}
                  onClick={() => setFinalRejectionDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Fleet Registration
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Single doc rejection dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document Section</DialogTitle>
            <DialogDescription>Provide a clear reason — it will be visible to the bus owner.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Enter rejection reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final approval dialog */}
      <Dialog open={finalApprovalDialog} onOpenChange={setFinalApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <DialogTitle>Approve Fleet Registration</DialogTitle>
            </div>
            <DialogDescription>
              You are approving <strong>{fleet.busName}</strong> ({fleet.busNumber?.toUpperCase()}). The bus will be marked <span className="font-bold text-emerald-600">ACTIVE</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleFinalApproval} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black">
              {isApproving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final rejection dialog */}
      <Dialog open={finalRejectionDialog} onOpenChange={setFinalRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Fleet Registration</DialogTitle>
            <DialogDescription>Provide an overall rejection reason — this will be visible to the bus owner.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Enter overall rejection reason..." value={finalRejectionReason} onChange={(e) => setFinalRejectionReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalRejectionDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFinalRejection} disabled={!finalRejectionReason.trim() || isApproving}>
              {isApproving ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
