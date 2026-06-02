"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useOwerKycDetails } from "@/hooks/useKycDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateOwnerKycStatus } from "@/api/kycApi";
import { getBrandsByOwner } from "@/api/operatorBrandApi";

/* ─── Types ─────────────────────────────────────────────────── */
type DocumentSection = {
  title: string;
  key: string;
  documents: string[];
  verified: boolean | undefined;
  rejectionReason: string | null | undefined;
  details?: { label: string; value: string | null | undefined }[];
};

/* ─── Helpers ───────────────────────────────────────────────── */
/** Format a date to "02 May 2026" — unambiguous across locales. */
const formatDate = (raw: string | undefined | null): string => {
  if (!raw) return "N/A";
  return new Date(raw).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Return the display email — hide system-generated internal addresses. */
const displayEmail = (email: string | undefined | null): string => {
  if (!email) return "No email provided";
  if (email.endsWith("@shuvmarg.internal")) return "No email provided";
  return email;
};

/* ─── Badge helpers ─────────────────────────────────────────── */
const sectionBadge = (verified: boolean | undefined, rejectionReason: string | null | undefined, hasDocuments: boolean) => {
  if (!hasDocuments) return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Not Submitted</Badge>;
  if (verified) return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
  if (rejectionReason) return <Badge variant="destructive">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

/* ─── Component ─────────────────────────────────────────────── */
export default function KYCBusOwnerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  /* Fetch KYC data */
  const { data, isLoading, isError, error } = useOwerKycDetails(id);
  const kyc = data?.data;

  /* Document status state */
  const initialStatuses = useMemo(
    () => ({
      companyRegistration: {
        verified: kyc?.companyRegistration?.verified,
        rejectionReason: kyc?.companyRegistration?.rejectionReason,
      },
      ownerIdentity: {
        verified: kyc?.ownerIdentity?.verified,
        rejectionReason: kyc?.ownerIdentity?.rejectionReason,
      },
      taxRegistration: {
        verified: kyc?.taxRegistration?.verified,
        rejectionReason: kyc?.taxRegistration?.rejectionReason,
      },
      bankDetails: {
        verified: false as boolean | undefined,
        rejectionReason: null as string | null | undefined,
      },
    }),
    [kyc],
  );

  const [documentStatuses, setDocumentStatuses] = useState(initialStatuses);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  useEffect(() => {
    setDocumentStatuses(initialStatuses);
  }, [initialStatuses]);

  /* Fetch associated brands */
  const { data: brandsData, isLoading: isLoadingBrands } = useQuery({
    queryKey: ["ownerBrands", kyc?.busOwnerId || kyc?._id],
    queryFn: () => getBrandsByOwner(kyc?.busOwnerId || kyc?._id),
    enabled: !!(kyc?.busOwnerId || kyc?._id),
  });
  const brands = brandsData?.data || [];

  /* Mutation — MUST be before any conditional return (React Rules of Hooks) */
  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: updateOwnerKycStatus,
    onSuccess: (res) => {
      toast.success(res.message || "KYC status updated successfully");
      // Invalidate all caches that display KYC or bus owner status
      queryClient.invalidateQueries({ queryKey: ["getAllKyc"] });   // KYC verification list page
      queryClient.invalidateQueries({ queryKey: ["owner"] });       // Bus owner detail pages
      queryClient.invalidateQueries({ queryKey: ["busOwners"] });   // Bus owners list
      queryClient.invalidateQueries({ queryKey: ["ownerKyc", id] }); // This detail page
      navigate("/admin/kyc");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update KYC status");
    },
  });

  /* ── Loading / Error / Empty ──────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading KYC details…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">Failed to load KYC details.</p>
        <p className="text-sm text-muted-foreground">{(error as any)?.message}</p>
        <Button variant="outline" onClick={() => navigate("/admin/kyc")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to KYC List
        </Button>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">KYC record not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin/kyc")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to KYC List
        </Button>
      </div>
    );
  }

  /* ── Document Sections (after kyc is confirmed non-null) ──── */
  /*
   * Industry Standard for Bus Owner KYC:
   *   1. Company Registration Certificate
   *   2. Owner Identity / Citizenship
   *   3. Tax Registration (PAN / VAT)
   *   4. Bank Authorization Letter
   *
   * Transport License and Insurance are intentionally excluded here —
   * they are vehicle-level documents collected during Fleet onboarding.
   */
  const isGlobalApproved = kyc.verificationStatus === "approved";

  const documentSections: DocumentSection[] = [
    {
      title: "Company Registration",
      key: "companyRegistration",
      documents: kyc.companyRegistration?.documentUrls || [],
      verified: isGlobalApproved || documentStatuses.companyRegistration?.verified,
      rejectionReason: isGlobalApproved ? null : documentStatuses.companyRegistration?.rejectionReason,
    },
    {
      title: "Owner Identity / Citizenship",
      key: "ownerIdentity",
      documents: kyc.ownerIdentity?.documentUrls || [],
      verified: isGlobalApproved || documentStatuses.ownerIdentity?.verified,
      rejectionReason: isGlobalApproved ? null : documentStatuses.ownerIdentity?.rejectionReason,
    },
    {
      title: "Tax Registration",
      key: "taxRegistration",
      documents: kyc.taxRegistration?.documentUrls || [],
      verified: isGlobalApproved || documentStatuses.taxRegistration?.verified,
      rejectionReason: isGlobalApproved ? null : documentStatuses.taxRegistration?.rejectionReason,
      details: [
        { label: "PAN Number", value: kyc.taxRegistration?.panNumber ?? "Not provided" },
        { label: "VAT Number", value: kyc.taxRegistration?.vatNumber ?? "Not provided" },
        { label: "Registration Number", value: kyc.taxRegistration?.registrationNumber ?? "Not provided" },
      ],
    },
    {
      title: "Bank Authorization Letter",
      key: "bankDetails",
      documents: kyc.bankDetails?.documentUrls || [],
      verified: isGlobalApproved || documentStatuses.bankDetails?.verified,
      rejectionReason: isGlobalApproved ? null : documentStatuses.bankDetails?.rejectionReason,
      details: [
        { label: "Bank Name", value: kyc.bankDetails?.bankName },
        { label: "Account Number", value: kyc.bankDetails?.accountNumber },
        { label: "Account Holder", value: kyc.bankDetails?.accountHolderName },
        { label: "Branch", value: kyc.bankDetails?.branchName },
      ],
    },
  ];

  /* Only sections that have documents need to be reviewed */
  const reviewableSections = documentSections.filter(s => s.documents.length > 0);
  /* allVerified = admin explicitly clicked Verify on every uploaded section (optional) */
  const allVerified = reviewableSections.length > 0 && reviewableSections.every(s => s.verified);
  /* hasRejections = admin explicitly flagged at least one section — BLOCKS approval */
  const hasRejections = reviewableSections.some(s => s.rejectionReason);
  /* canApprove = no flags, at least one document submitted */
  const canApprove = !hasRejections && reviewableSections.length > 0;

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleVerify = (key: string) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [key]: { verified: true, rejectionReason: null },
    }));
    toast.success("Document marked as verified");
  };

  const openRejectDialog = (key: string) => {
    setCurrentRejectKey(key);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!currentRejectKey || !rejectionReason.trim()) return;
    setDocumentStatuses(prev => ({
      ...prev,
      [currentRejectKey]: { verified: false, rejectionReason: rejectionReason.trim() },
    }));
    toast.error("Document marked as rejected");
    setRejectDialogOpen(false);
  };

  const handleFinalApproval = () => {
    // Auto-elevate all uploaded-but-unreviewed sections to verified=true.
    // Per-section "Verify" is optional detail work; the final Approve is the binding decision.
    const resolveStatus = (key: string) => ({
      verified: true,
      rejectionReason: null,
    });
    submitReview({
      id: kyc._id,
      verificationStatus: "approved",
      companyRegistration: resolveStatus("companyRegistration"),
      ownerIdentity: resolveStatus("ownerIdentity"),
      taxRegistration: resolveStatus("taxRegistration"),
    });
    setFinalApprovalDialog(false);
  };

  const handleFinalRejection = () => {
    // Include all section verdicts so they are persisted in MongoDB
    // and can be displayed correctly on the "View Decision" page
    submitReview({
      id: kyc._id,
      verificationStatus: "rejected",
      rejectionReason: finalRejectionReason,
      companyRegistration: {
        verified: documentStatuses.companyRegistration.verified ?? false,
        rejectionReason: documentStatuses.companyRegistration.rejectionReason || null,
      },
      ownerIdentity: {
        verified: documentStatuses.ownerIdentity.verified ?? false,
        rejectionReason: documentStatuses.ownerIdentity.rejectionReason || null,
      },
      taxRegistration: {
        verified: documentStatuses.taxRegistration.verified ?? false,
        rejectionReason: documentStatuses.taxRegistration.rejectionReason || null,
      },
    });
    setFinalRejectionDialog(false);
  };

  /* ── UI ───────────────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/kyc")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Bus Owner KYC Review</h1>
            <div className="flex flex-col">
              <p className="text-muted-foreground">
                Reviewing application for <span className="font-medium text-foreground">{kyc.companyName ?? kyc.user?.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Owner ID: {kyc.busOwnerId || kyc._id}
              </p>
            </div>
          </div>
          <Badge
            className={
              kyc.verificationStatus === "approved"
                ? "bg-green-100 text-green-800"
                : kyc.verificationStatus === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            {kyc.verificationStatus?.toUpperCase()}
          </Badge>
        </div>

        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Info label="Owner Name" value={kyc.user?.name} />
            <Info label="Email" value={displayEmail(kyc.user?.email)} />
            <Info label="Phone" value={kyc.user?.phone} />
            <Info label="Company Name" value={kyc.companyName} />
            <Info label="Bus Owner ID" value={kyc.busOwnerId} />
            <Info label="Submitted On" value={formatDate(kyc.createdAt)} />
          </CardContent>
        </Card>

        {/* Associated Brands Information */}
        {brands.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Associated Brands ({brands.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand: any) => (
                  <div key={brand._id} className="p-4 border rounded-xl bg-muted/20 flex flex-col gap-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                           {brand.logo ? (
                             <img src={brand.logo} alt={brand.brandName} className="h-full w-full object-cover" />
                           ) : (
                             <Building2 className="h-5 w-5 text-primary/50" />
                           )}
                        </div>
                        <div>
                          <p className="font-bold tracking-tight text-sm leading-tight">{brand.brandName}</p>
                          <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest">{brand.brandCode}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest px-1.5 py-0 border-none ${brand.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {brand.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t text-xs">
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-0.5">Base City</p>
                        <p className="font-medium truncate">{brand.baseCity || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-0.5">Fleet</p>
                        <p className="font-medium">{brand.fleetCount || 0} Vehicles</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-0.5">Contact</p>
                        <p className="font-medium truncate">{brand.contactEmail || "N/A"} • {brand.contactPhone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KYC Document Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {documentSections.map((section) => {
            const hasDocuments = section.documents.length > 0;
            return (
              <Card
                key={section.key}
                className={
                  section.verified
                    ? "border-green-200 bg-green-50/50"
                    : section.rejectionReason
                    ? "border-destructive/50 bg-destructive/5"
                    : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      {section.title}
                    </CardTitle>
                    {sectionBadge(section.verified, section.rejectionReason, hasDocuments)}
                  </div>
                  {section.rejectionReason && (
                    <CardDescription className="text-destructive text-xs">
                      Rejection reason: {section.rejectionReason}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Meta details (PAN, bank info, etc.) */}
                  {section.details?.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-medium">{d.value ?? "Not provided"}</span>
                    </div>
                  ))}

                  {/* Document links */}
                  {hasDocuments ? (
                    section.documents.map((url, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Document {i + 1}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No document uploaded for this section.
                    </p>
                  )}

                  {/* Verify / Reject actions (only if documents exist and not yet decided) */}
                  {kyc.verificationStatus === "pending" && hasDocuments && !section.verified && !section.rejectionReason && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" onClick={() => handleVerify(section.key)}>
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => openRejectDialog(section.key)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Final Decision */}
        <Card className={kyc.verificationStatus === "approved" ? "border-green-200 bg-green-50/30" : kyc.verificationStatus === "rejected" ? "border-destructive/20 bg-destructive/5" : ""}>
          <CardHeader>
            <CardTitle>Final Decision</CardTitle>
            <CardDescription>
              {kyc.verificationStatus === "approved"
                ? "This KYC application has been approved and the owner is active."
                : kyc.verificationStatus === "rejected"
                ? "This KYC application was rejected."
                : hasRejections
                ? "One or more documents have been flagged — resolve flags or reject the application."
                : canApprove
                ? `${allVerified ? "All sections verified — " : ""}Ready to make a final decision.`
                : "No documents have been submitted yet — cannot approve."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {kyc.verificationStatus === "approved" ? (
              <div className="flex items-center gap-2 text-green-700 font-medium bg-green-100/50 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5" />
                Application Approved
              </div>
            ) : kyc.verificationStatus === "rejected" ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20 w-fit">
                  <XCircle className="h-5 w-5" />
                  Application Rejected
                </div>
                <Button 
                   variant="outline" 
                   className="w-fit mt-2"
                   onClick={() => setFinalApprovalDialog(true)}
                   disabled={isPending || reviewableSections.length === 0 || hasRejections}
                >
                  Change to Approved
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  disabled={isPending || !canApprove}
                  onClick={() => setFinalApprovalDialog(true)}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve KYC
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={isPending || reviewableSections.length === 0}
                  onClick={() => setFinalRejectionDialog(true)}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reject KYC
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Single Document Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Provide a clear rejection reason for the bus owner…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Approval Dialog */}
      <Dialog open={finalApprovalDialog} onOpenChange={setFinalApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm KYC Approval</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Approving this application will activate the Bus Owner's account. They will be able to add
            fleets and accept bookings. This action can be reversed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleFinalApproval} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Rejection Dialog */}
      <Dialog open={finalRejectionDialog} onOpenChange={setFinalRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Provide an overall rejection reason for the bus owner…"
            value={finalRejectionReason}
            onChange={(e) => setFinalRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalRejectionDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleFinalRejection}
              disabled={!finalRejectionReason.trim() || isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Info Helper ───────────────────────────────────────────── */
function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value ?? "N/A"}</p>
    </div>
  );
}
