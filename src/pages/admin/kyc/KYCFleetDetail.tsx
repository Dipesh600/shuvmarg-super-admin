import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, Eye, Bus, Building2,
  ImageIcon, Loader2, LayoutGrid, Route, AlertTriangle, ShieldCheck, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import DocumentViewerModal from "@/components/DocumentViewerModal";
import { toast } from "sonner";
import { useFetchFleetDetail } from "@/hooks/useOwnerFleets";
import { decideFleetApproval, saveFleetReviewItem, type SecureFleetDocumentRequest } from "@/api/busOwnerFleetApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrandsByOwner } from "@/api/operatorBrandApi";
import SeatLayoutCanvas from "@/features/seat-layout-v3/SeatLayoutCanvas";

/* ─── Types ─────────────────────────────────────────────────────── */
type DocStatus = { verified: boolean; rejectionReason: string | null };
type ReviewDecision = { status: "APPROVED" | "REJECTED"; reason: string | null };
const SECTION_REVIEW_KEYS = [
  { key: "vehicleDetails", title: "Vehicle details", description: "Identity, registration, type and amenities" },
  { key: "seatLayout", title: "Seat layout", description: "Physical layout and passenger place count" },
  { key: "routeSetup", title: "Route and stops", description: "Journey, road path, stops and meeting places" },
] as const;

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

/* ─── Badge helper ───────────────────────────────────────────────── */
const ApprovalBadge = ({ status }: { status: string }) => {
  if (status === "APPROVED") return <Badge className="bg-white/5 text-white border-white/10 font-black uppercase tracking-widest text-[10px]"><ShieldCheck className="h-3 w-3 mr-1" />Approved</Badge>;
  if (status === "REJECTED") return <Badge className="bg-white/5 text-white border-white/10 font-black uppercase tracking-widest text-[10px]"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
  return <Badge className="bg-white/5 text-white border-white/10 font-black uppercase tracking-widest text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
};

export default function KYCFleetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: fleetResponse, isLoading, isError } = useFetchFleetDetail(id!);
  const fleet = fleetResponse?.data;
  /* Brand context */
  const { data: brandsData } = useQuery({
    queryKey: ["ownerBrands", fleet?.owner?.ownerId],
    queryFn: () => getBrandsByOwner(fleet?.owner?.ownerId),
    enabled: !!fleet?.owner?.ownerId,
  });
  const ownerBrand = brandsData?.data?.find((b: any) => b._id === fleet?.assignment?.operatorId) ?? brandsData?.data?.[0] ?? null;

  /* Build document sections from fleet data */
  const documentSections = useMemo(() => {
    if (!fleet) return [];
    const descriptor = (slot: string) => fleet.documents?.[slot] || {};
    return [
      {
        title: "Fleet Images",
        key: "fleetImages",
        icon: <ImageIcon className="h-4 w-4" />,
        documents: Array.from({ length: descriptor("fleetImages").count || 0 }, (_, index) => index),
        status: descriptor("fleetImages").status,
        reason: descriptor("fleetImages").reason,
        details: [{ label: "Count", value: `${descriptor("fleetImages").count || 0} photos` }],
      },
      {
        title: "Fitness Certificate",
        key: "fitnessCert",
        icon: <FileText className="h-4 w-4" />,
        documents: descriptor("fitnessCert").present ? [0] : [],
        status: descriptor("fitnessCert").status,
        reason: descriptor("fitnessCert").reason,
        details: [{ label: "Valid Till", value: fmtDate(descriptor("fitnessCert").validTill) }],
      },
      {
        title: "Route Permit",
        key: "routePermit",
        icon: <FileText className="h-4 w-4" />,
        documents: descriptor("routePermit").present ? [0] : [],
        status: descriptor("routePermit").status,
        reason: descriptor("routePermit").reason,
        details: [{ label: "Valid Till", value: fmtDate(descriptor("routePermit").validTill) }],
      },
      {
        title: "Insurance Certificate",
        key: "insurance",
        icon: <FileText className="h-4 w-4" />,
        documents: descriptor("insurance").present ? [0] : [],
        status: descriptor("insurance").status,
        reason: descriptor("insurance").reason,
        details: [
          { label: "Policy No.", value: descriptor("insurance").policyNumber || "N/A" },
          { label: "Valid Till", value: fmtDate(descriptor("insurance").validTill) },
        ],
      },
      {
        title: "Bluebook (Registration)",
        key: "bluebook",
        icon: <FileText className="h-4 w-4" />,
        documents: descriptor("bluebook").present ? [0] : [],
        status: descriptor("bluebook").status,
        reason: descriptor("bluebook").reason,
        details: [{ label: "Status", value: "Uploaded" }],
      },
    ];
  }, [fleet]);

  /* Review state is initialized from the backend-authoritative review contract. */
  const defaultStatuses = useMemo<Record<string, DocStatus>>(() => {
    const result: Record<string, DocStatus> = {};
    documentSections.forEach(s => {
      result[s.key] = {
        verified: String(s.status || "").toUpperCase() === "APPROVED",
        rejectionReason: String(s.status || "").toUpperCase() === "REJECTED" ? s.reason || null : null,
      };
    });
    SECTION_REVIEW_KEYS.forEach(({ key }) => {
      const review = fleet?.reviewRequirements?.[key] || {};
      result[key] = {
        verified: String(review.status || "").toUpperCase() === "APPROVED",
        rejectionReason: String(review.status || "").toUpperCase() === "REJECTED" ? review.reason || null : null,
      };
    });
    return result;
  }, [documentSections, fleet]);

  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(defaultStatuses);
  useEffect(() => {
    setDocStatuses(defaultStatuses);
  }, [defaultStatuses]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  // ── Secure document viewer state ─────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerRequest, setViewerRequest] = useState<SecureFleetDocumentRequest | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("Document");

  // ── UI States ────────────────────────────────────────────────────────────
  const [layoutExpanded, setLayoutExpanded] = useState(true);

  const openDocumentViewer = (slot: SecureFleetDocumentRequest["slot"], label: string, index?: number) => {
    setViewerRequest({ fleetId: fleet!.fleetId, slot, imageIndex: slot === "fleetImages" ? index || 0 : undefined });
    setViewerTitle(index !== undefined && index > 0 ? `${label} (${index + 1})` : label);
    setViewerOpen(true);
  };

  /* Approval mutation — invalidates both fleet detail and roster caches */
  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: decideFleetApproval,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
      queryClient.invalidateQueries({ queryKey: ["unified_kyc"] });
      queryClient.invalidateQueries({ queryKey: ["getAllKyc"] });

      if (variables.status === "REJECTED") {
        toast.success("Fleet KYC rejected successfully.");
      } else {
        toast.success("Fleet KYC approved! Bus is ready for operations.");
      }
      setFinalApprovalDialog(false);
      navigate("/admin/kyc");
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to update fleet status."),
  });
  const reviewItem = useMutation({
    mutationFn: ({ key, status, reason }: { key: string; status: "APPROVED" | "REJECTED"; reason?: string }) =>
      saveFleetReviewItem(id!, key, { status, reason }),
    onError: (error: any) => toast.error(error?.response?.data?.message || "Unable to save this review decision."),
  });

  /* Sections that have at least one uploaded file */
  const reviewableSections = documentSections.filter(s => s.documents.length > 0);
  const allReviewKeys = [...documentSections.map((section) => section.key), ...SECTION_REVIEW_KEYS.map((section) => section.key)];
  const allVerified = allReviewKeys.length > 0 && allReviewKeys.every((key) => docStatuses[key]?.verified);
  /* hasRejections = admin explicitly flagged at least one section — this BLOCKS final approval */
  const hasRejections = Object.values(docStatuses).some(s => s.rejectionReason);
  const reviewComplete = allReviewKeys.every((key) => docStatuses[key]?.verified || docStatuses[key]?.rejectionReason);
  /* canApprove = no explicit flags and there is at least one document on record */
  const canApprove = !hasRejections && allVerified && reviewableSections.length === documentSections.length;

  const buildReviews = (): Record<string, ReviewDecision> => Object.fromEntries(allReviewKeys.map((key) => [key, {
    status: docStatuses[key]?.verified ? "APPROVED" : "REJECTED",
    reason: docStatuses[key]?.rejectionReason || null,
  } as ReviewDecision]));

  const handleVerify = (key: string) => {
    reviewItem.mutate({ key, status: "APPROVED" }, {
      onSuccess: () => {
        setDocStatuses(prev => ({ ...prev, [key]: { verified: true, rejectionReason: null } }));
        toast.success("Review decision saved.");
      },
    });
  };

  const openRejectDialog = (key: string) => {
    setCurrentRejectKey(key);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (currentRejectKey && rejectionReason.trim()) {
      const key = currentRejectKey;
      const reason = rejectionReason.trim();
      reviewItem.mutate({ key, status: "REJECTED", reason }, {
        onSuccess: () => {
          setDocStatuses(prev => ({ ...prev, [key]: { verified: false, rejectionReason: reason } }));
          setRejectDialogOpen(false);
          toast.warning("Requested change saved.");
        },
      });
    }
  };

  const handleFinalApproval = () => {
    approve({ fleetId: id!, status: "APPROVED", reviews: buildReviews() });
  };

  const handleFinalRejection = async () => {
    const requestedChanges = allReviewKeys
      .filter((key) => docStatuses[key]?.rejectionReason)
      .map((key) => {
        const title = documentSections.find((section) => section.key === key)?.title
          || SECTION_REVIEW_KEYS.find((section) => section.key === key)?.title
          || key;
        return `${title}: ${docStatuses[key].rejectionReason}`;
      });
    const combinedReason = [
      finalRejectionReason.trim(),
      requestedChanges.length ? `Requested changes: ${requestedChanges.join("; ")}` : "",
    ].filter(Boolean).join("\n\n").slice(0, 500);
    approve({
      fleetId: id!,
      status: "REJECTED",
      rejectionReason: combinedReason,
      reviews: buildReviews(),
    });
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
              Reviewing documents for <span className="font-semibold text-foreground">{fleet.vehicle.busName}</span>
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded uppercase">{fleet.vehicle.busNumber}</span>
            </p>
          </div>
          <ApprovalBadge status={approvalStatus} />
        </div>

        {/* Rejection banner */}
        {approvalStatus === "REJECTED" && fleet.rejectionReason && (
          <div className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl flex gap-3">
            <AlertTriangle className="h-5 w-5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-white text-sm uppercase tracking-widest mb-1">Previously Rejected</p>
              <p className="text-sm text-white">{fleet.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Brand Context Card */}
        {ownerBrand && (
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                {ownerBrand.logo
                  ? <img src={ownerBrand.logo} alt={ownerBrand.brandName} className="h-full w-full object-cover" />
                  : <Building2 className="h-6 w-6 text-primary/50" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-black tracking-tight">{ownerBrand.brandName}</p>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">{ownerBrand.brandCode}</span>
                  <Badge variant="outline" className={`text-[10px] font-black uppercase border-none ${ownerBrand.status === "ACTIVE" ? "bg-white/5 text-white" : "bg-white/5 text-white"}`}>{ownerBrand.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{ownerBrand.baseCity} · {ownerBrand.fleetCount || 0} vehicles registered</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Operator</p>
                <p className="font-bold text-sm">{fleet.owner?.ownerName}</p>
                <p className="text-xs text-muted-foreground">{fleet.owner?.phone || fleet.owner?.email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Info + Seat Map */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Bus className="h-5 w-5" /> Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 items-start flex-wrap">
              <div className="min-w-48 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> Canonical seat layout</p>
                <p className="font-bold">{fleet.seatLayout?.assigned ? "V3 layout assigned" : "Not assigned"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fleet.seatLayout?.totalPlaces ?? fleet.vehicle.totalSeats ?? 0} passenger places</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3 flex-1 min-w-0">
                {[
                  { label: "Bus Name", value: fleet.vehicle.busName },
                  { label: "Bus Number", value: fleet.vehicle.busNumber?.toUpperCase() },
                  { label: "Class", value: fleet.vehicle.busType },
                  { label: "Vehicle Type", value: fleet.vehicle.vehicleType },
                  { label: "Capacity", value: `${fleet.vehicle.totalSeats} seats` },
                  { label: "Reg. Year", value: fleet.vehicle.registrationYear || "N/A" },
                  { label: "Fleet ID", value: fleet.fleetCode || fleet.fleetId },
                  { label: "Submitted", value: fmtDate(fleet.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                ))}
                <div className="md:col-span-3">
                  <p className="text-xs text-muted-foreground">Passenger amenities</p>
                  {fleet.vehicle.features?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fleet.vehicle.features.map((amenity: { id?: string; name?: string }) => (
                        <span key={amenity.id || amenity.name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white">
                          {amenity.name || "Amenity"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-white/60">None selected</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route / Corridor Status Card */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Route className="h-5 w-5" /> Route Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {fleet.route?.origin && fleet.route?.destination ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-white shrink-0" />
                  <div>
                    <p className="font-black text-sm text-white">Route Configured</p>
                    <span className="text-[10px] text-white">
                      {fleet.route.origin} → {fleet.route.destination}
                      {fleet.route.returnEnabled && " (Return enabled)"}
                    </span>
                  </div>
                </div>

                {/* Served stops */}
                {(fleet.route.servedStops?.length > 0 || fleet.route.addedPlaces?.length > 0) && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Served Stops &amp; Places ({(fleet.route.servedStops?.length || 0) + (fleet.route.addedPlaces?.length || 0)} total)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(fleet.route.servedStops || []).map((stop: any, idx: number) => (
                        <div key={stop.stopId || idx} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-white truncate">{stop.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              stop.usage === "PICKUP" ? "bg-blue-900/40 text-blue-300" :
                              stop.usage === "DROP" ? "bg-amber-900/40 text-amber-300" :
                              "bg-emerald-900/40 text-emerald-300"
                            }`}>{stop.usage}</span>
                          </div>
                          {stop.meetingDetails?.counterNumber && (
                            <p className="text-[10px] text-muted-foreground">Counter #{stop.meetingDetails.counterNumber}</p>
                          )}
                          {stop.meetingDetails?.contactPhone && (
                            <p className="text-[10px] text-muted-foreground">{stop.meetingDetails.contactPhone}</p>
                          )}
                        </div>
                      ))}
                      {(fleet.route.addedPlaces || []).map((place: any, idx: number) => (
                        <div key={place.clientKey || idx} className="rounded-xl border border-dashed border-amber-500/30 bg-amber-900/10 p-2.5 text-xs">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-bold text-amber-300 truncate">{place.name}</span>
                            <span className="px-1 py-0.5 rounded bg-amber-900/40 text-amber-400 text-[9px] font-bold">Custom</span>
                          </div>
                          {place.address && <p className="text-[10px] text-muted-foreground">{place.address}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : fleet.assignment?.corridor ? (
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-white shrink-0" />
                <div>
                  <p className="font-black text-sm text-white">Corridor Assigned</p>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-xs font-bold text-white">{fleet.assignment.corridor.code}</span>
                    {fleet.assignment.corridor.origin && (
                      <span className="text-[10px] text-white">
                        {fleet.assignment.corridor.origin} → {fleet.assignment.corridor.destination}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : fleet.assignment?.routeRequest ? (
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <Clock className="h-5 w-5 text-white shrink-0" />
                <div>
                  <p className="font-black text-sm text-white">Route Request Pending</p>
                  <p className="text-xs text-white">
                    {fleet.assignment.routeRequest.origin && fleet.assignment.routeRequest.destination
                      ? `${fleet.assignment.routeRequest.origin} → ${fleet.assignment.routeRequest.destination}`
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

        {/* Seat Map Display */}
        {(fleet?.seatLayout?.layout || fleet?.vehicle?.seatConfig) && (
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader
              className="cursor-pointer select-none transition-colors hover:bg-white/5"
              onClick={() => setLayoutExpanded(!layoutExpanded)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <LayoutGrid className="h-5 w-5" /> Seat Layout
                </CardTitle>
                <div className="flex items-center text-muted-foreground">
                  <span className="text-xs mr-2 font-medium tracking-wide">
                    {layoutExpanded ? "Hide Layout" : "View Layout"}
                  </span>
                  {layoutExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {layoutExpanded && (
              <CardContent className="border-t border-white/5 p-6">
                <div className="flex justify-center bg-black/20 p-8 rounded-xl border border-white/5 overflow-auto min-h-[300px] items-center">
                  <SeatLayoutCanvas
                    layout={fleet?.seatLayout?.layout || fleet?.vehicle?.seatConfig}
                    tool="SELECT"
                    selectedId={null}
                    editable={false}
                    onChange={() => {}}
                    onSelect={() => {}}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Reviewable non-document sections */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
            Application section review
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {SECTION_REVIEW_KEYS.map((section) => {
              const state = docStatuses[section.key] ?? { verified: false, rejectionReason: null };
              return (
                <Card key={section.key} className="border-white/5 bg-[#121212]/30 text-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm text-white">{section.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs text-white/50">{section.description}</CardDescription>
                      </div>
                      <Badge className="bg-white/5 text-white border-white/10 text-[10px] uppercase">
                        {state.verified ? "Accepted" : state.rejectionReason ? "Needs changes" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {state.rejectionReason && <p className="mb-3 text-xs text-red-200">{state.rejectionReason}</p>}
                    {approvalStatus === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleVerify(section.key)}>Accept</Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => openRejectDialog(section.key)}>Request change</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

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
                  className={`border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white ${
                    !hasDocuments ? "opacity-60 border-dashed" :
                    (isPending && st.verified) || approvalStatus === "APPROVED" ? "border-white/10 bg-white/5" :
                    (isPending && st.rejectionReason) || approvalStatus === "REJECTED" ? "border-white/10 bg-white/5" : ""
                  }`}
                >
                  <CardHeader className="border-b border-white/5 bg-white/5 pb-4 p-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        {section.icon} {section.title}
                      </CardTitle>
                      {/* Status chip */}
                      {!hasDocuments ? (
                        <Badge variant="secondary" className="text-[10px] font-black uppercase">Not Uploaded</Badge>
                      ) : approvalStatus === "APPROVED" ? (
                        <Badge className="bg-white/5 text-white text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : approvalStatus === "REJECTED" ? (
                        <Badge className="bg-white/5 text-white text-[10px] font-black uppercase"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                      ) : (
                        st.verified
                          ? <Badge className="bg-white/5 text-white text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                          : st.rejectionReason
                          ? <Badge className="bg-white/5 text-white text-[10px] font-black uppercase"><XCircle className="h-3 w-3 mr-1" />Flagged</Badge>
                          : <Badge className="bg-white/5 text-white text-[10px] font-black uppercase">Pending Review</Badge>
                      )}
                    </div>
                    {isPending && st.rejectionReason && (
                      <CardDescription className="text-white text-xs mt-1">
                        Reason: {st.rejectionReason}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5 p-5">
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
                      <div className="space-y-2 mt-2">
                        {section.documents.map((_documentIndex: number, idx: number) => (
                          <Button key={idx} variant="outline" size="sm" className="w-full justify-start text-xs py-4"
                            onClick={() => openDocumentViewer(section.key as SecureFleetDocumentRequest["slot"], section.title, idx)}>
                            <Eye className="h-4 w-4 mr-2 text-primary-400" />
                            {section.key === "fleetImages" ? `View Image #${idx + 1}` : "View Document"}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Verify / Flag buttons — ONLY in PENDING mode */}
                    {isPending && hasDocuments && (
                      <div className="flex gap-3 pt-3 mt-2 border-t border-white/5">
                        <Button size="sm" className="flex-1 text-xs py-4 font-semibold" onClick={() => handleVerify(section.key)}>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 text-xs py-4 font-semibold bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-200" onClick={() => openRejectDialog(section.key)}>
                          <XCircle className="h-4 w-4 mr-1.5" /> Request change
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
        <Card className={`border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white ${
          approvalStatus === "APPROVED" ? "border-white/10 bg-white/5" :
          approvalStatus === "REJECTED" ? "border-white/10 bg-white/5" : ""
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">KYC Decision Record</CardTitle>
            <CardDescription className="text-white/60">
              {approvalStatus === "APPROVED"
                ? "Compliance is approved. Complete operational setup before passenger service begins."
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
              <div className="flex items-center gap-3 text-white font-semibold bg-white/5 px-5 py-4 rounded-xl border border-white/10 w-full">
                <ShieldCheck className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-black text-sm">Fleet Approved</p>
                  <p className="text-xs font-normal text-white mt-0.5">
                    Approved on {fmtDate(fleet.review?.approvedAt)} · Eligible for driver and schedule setup.
                  </p>
                </div>
                {!fleet.setupComplete && ownerBrand?._id && (
                  <Button
                    className="ml-auto bg-white text-black hover:bg-white/90"
                    onClick={() => navigate(`/admin/bus-owners/operator/${ownerBrand._id}`)}
                  >
                    Continue Operational Setup
                  </Button>
                )}
              </div>
            ) : approvalStatus === "REJECTED" ? (
              /* ── REJECTED state: owner controls correction and resubmission ── */
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-start gap-3 text-white bg-white/5 px-5 py-4 rounded-xl border border-white/10">
                  <XCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-sm">Fleet Registration Rejected</p>
                    {fleet.rejectionReason && (
                      <p className="text-xs font-normal text-white mt-1">
                        Reason on record: {fleet.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The bus owner must correct the requested items and resubmit the fleet from their dashboard.
                </p>
              </div>
            ) : (
              /* ── PENDING state: active decision controls ── */
              <>
                <Button
                  size="lg"
                  disabled={isApproving || !canApprove}
                  onClick={() => setFinalApprovalDialog(true)}
                  className="bg-white/5 hover:bg-white/5 text-white font-black"
                >
                  {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve Fleet Registration
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={isApproving || !reviewComplete || !hasRejections}
                  onClick={() => setFinalRejectionDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Request Changes
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
            <DialogTitle>Request a change</DialogTitle>
            <DialogDescription>Provide a clear reason for the bus owner.</DialogDescription>
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
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <DialogTitle>Approve Fleet Registration</DialogTitle>
            </div>
            <DialogDescription>
              You are approving <strong>{fleet.vehicle.busName}</strong> ({fleet.vehicle.busNumber?.toUpperCase()}). It will become eligible for operational setup; passenger service begins only after schedule activation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleFinalApproval} disabled={isApproving} className="bg-white/5 hover:bg-white/5 text-white font-black">
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

      {/* ── Secure Inline Document Viewer ───────────────────────────────────── */}
      <DocumentViewerModal
        open={viewerOpen}
        s3Key={null}
        fleetDocumentRequest={viewerRequest}
        title={viewerTitle}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
