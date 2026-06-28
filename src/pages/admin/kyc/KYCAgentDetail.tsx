import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  CreditCard,
  Clock,
  Info,
  AlertTriangle,
  Eye,
  Loader2,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAgentById,
  reviewAgentApplication,
  type AgentReviewPayload,
} from "@/api/agentApi";

// ── Status badge helper ──────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending Review", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    APPROVED: { label: "Approved", className: "bg-green-500/15 text-green-400 border-green-500/30" },
    REJECTED: { label: "Rejected", className: "bg-red-500/15 text-red-400 border-red-500/30" },
    MORE_INFO: { label: "More Info Needed", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    SUSPENDED: { label: "Suspended", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    DRAFT: { label: "Draft", className: "bg-white/5 text-white/40 border-white/10" },
  };
  const s = map[status] ?? { label: status, className: "bg-white/5 text-white/40 border-white/10" };
  return (
    <Badge className={`border ${s.className}`}>{s.label}</Badge>
  );
};

// ── Agent Type → readable label ───────────────────────────────────────────────
const AGENT_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  DEFAULT:         { label: "Self-Service Agent",   className: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  OPERATOR_LINKED: { label: "Operator-Linked Agent", className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
};

// ── Operation Type → readable label ──────────────────────────────────────────
const OPERATION_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  // Current model enum values
  ticket_counter: { label: "Ticket Counter",  className: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  travel_agent:   { label: "Travel Agency",   className: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  mobile_shop:    { label: "Mobile Shop",     className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  hotel:          { label: "Hotel / Lodge",   className: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  individual:     { label: "Individual",      className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  other:          { label: "Other",           className: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30" },
  // Legacy values (in case any old records used these)
  shop:           { label: "Shop / Outlet",   className: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  agency:         { label: "Travel Agency",   className: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
};

function TypeBadge({
  value,
  labelMap,
}: {
  value?: string | null;
  labelMap: Record<string, { label: string; className: string }>;
}) {
  if (!value) return <span className="text-sm font-medium text-white/40">—</span>;
  const entry = labelMap[value] ?? { label: value, className: "bg-white/5 text-white/40 border-white/10" };
  return <Badge className={`border text-xs ${entry.className}`}>{entry.label}</Badge>;
}

// ── Document type → human label (supports both uppercase and lowercase keys) ──
const docLabel: Record<string, string> = {
  // uppercase (legacy)
  CITIZENSHIP_FRONT: "Citizenship Certificate — Front",
  CITIZENSHIP_BACK: "Citizenship Certificate — Back",
  SHOP_PHOTO: "Shop / Counter Photo",
  PAN_CARD: "PAN Card",
  BANK_STATEMENT: "Bank Statement",
  AGENT_AGREEMENT: "Agent Agreement",
  OTHER: "Other Document",
  // lowercase (current backend)
  citizenship_front: "Citizenship Certificate — Front",
  citizenship_back: "Citizenship Certificate — Back",
  shop_photo: "Shop / Counter Photo",
  pan_card: "PAN Card",
  bank_statement: "Bank Statement",
  agent_agreement: "Agent Agreement",
  other: "Other Document",
};

type DocStatus = { verified: boolean | null; rejectionReason: string | null };

export default function KYCAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Fetch agent data ────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agentKyc", id],
    queryFn: () => getAgentById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const agentProfile = data?.data?.profile;
  const agentDetails = data?.data?.agentDetails;

  // ── Local per-document state (mirrors API data once loaded) ─────────────────
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>({});

  // Initialise from API data on first load
  const documents: any[] = agentDetails?.documents ?? [];
  const initialised = Object.keys(docStatuses).length > 0;
  if (documents.length > 0 && !initialised) {
    const init: Record<string, DocStatus> = {};
    documents.forEach((d: any) => {
      init[d.type] = {
        verified: d.verified ?? null,
        rejectionReason: d.rejectionReason ?? null,
      };
    });
    setDocStatuses(init);
  }

  // ── Per-doc reject dialog ───────────────────────────────────────────────────
  const [rejectDocDialog, setRejectDocDialog] = useState(false);
  const [rejectDocKey, setRejectDocKey] = useState<string | null>(null);
  const [rejectDocReason, setRejectDocReason] = useState("");

  // ── Final decision dialogs ─────────────────────────────────────────────────
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [moreInfoDialog, setMoreInfoDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [commissionRate, setCommissionRate] = useState(
    agentDetails?.commissionRate?.toString() ?? "5"
  );
  const [isPermanent, setIsPermanent] = useState(false);
  const [adminNotes, setAdminNotes] = useState(agentDetails?.adminNotes ?? "");

  // ── Review mutation ─────────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: reviewAgentApplication,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["agentKyc", id] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agentDashboard"] });

      if (vars.applicationStatus === "APPROVED") {
        toast.success("Agent application approved! SMS + email + push notification sent.");
        navigate("/admin/kyc");
      } else if (vars.applicationStatus === "REJECTED") {
        toast.error("Application rejected. Agent notified.");
        navigate("/admin/kyc");
      } else if (vars.applicationStatus === "MORE_INFO") {
        toast.info("More information requested. Agent notified.");
        navigate("/admin/kyc");
      } else {
        toast.success("Agent updated.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update agent application.");
    },
  });

  // ── Per-document verify ─────────────────────────────────────────────────────
  const handleVerifyDoc = (type: string) => {
    const newStatuses = { ...docStatuses, [type]: { verified: true, rejectionReason: null } };
    setDocStatuses(newStatuses);

    const payload: AgentReviewPayload = {
      id: agentDetails?._id ?? id!,
      documentVerifications: [{ type, verified: true }],
    };
    reviewMutation.mutate(payload);
  };

  // ── Per-document reject ─────────────────────────────────────────────────────
  const openRejectDoc = (type: string) => {
    setRejectDocKey(type);
    setRejectDocReason("");
    setRejectDocDialog(true);
  };

  const handleRejectDoc = () => {
    if (!rejectDocKey || !rejectDocReason.trim()) return;
    const newStatuses = {
      ...docStatuses,
      [rejectDocKey]: { verified: false, rejectionReason: rejectDocReason.trim() },
    };
    setDocStatuses(newStatuses);

    reviewMutation.mutate({
      id: agentDetails?._id ?? id!,
      documentVerifications: [{ type: rejectDocKey, verified: false, rejectionReason: rejectDocReason.trim() }],
    });

    setRejectDocDialog(false);
    toast.warning("Document flagged — agent will see this reason in the app.");
  };

  // ── Aggregate state ─────────────────────────────────────────────────────────
  const docValues = Object.values(docStatuses);
  const allVerified = docValues.length > 0 && docValues.every((s) => s.verified === true);
  const hasRejected = docValues.some((s) => s.verified === false);

  // ── Final approve ───────────────────────────────────────────────────────────
  const handleApprove = () => {
    reviewMutation.mutate({
      id: agentDetails?._id ?? id!,
      applicationStatus: "APPROVED",
      commissionRate: parseFloat(commissionRate) || 5,
      adminNotes: adminNotes.trim() || undefined,
    });
    setApproveDialog(false);
  };

  // ── Final reject ────────────────────────────────────────────────────────────
  const handleReject = () => {
    if (!finalRejectionReason.trim()) return;
    reviewMutation.mutate({
      id: agentDetails?._id ?? id!,
      applicationStatus: "REJECTED",
      rejectionReason: finalRejectionReason.trim(),
      isPermanentlyRejected: isPermanent,
    });
    setRejectDialog(false);
  };

  // ── More info ───────────────────────────────────────────────────────────────
  const handleMoreInfo = () => {
    if (!moreInfoMessage.trim()) return;
    reviewMutation.mutate({
      id: agentDetails?._id ?? id!,
      applicationStatus: "MORE_INFO",
      moreInfoRequest: moreInfoMessage.trim(),
    });
    setMoreInfoDialog(false);
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-white/60">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading agent application...
      </div>
    );
  }

  if (isError || !agentDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/60">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p>Failed to load agent: {error instanceof Error ? error.message : "Unknown error"}</p>
        <Button variant="ghost" onClick={() => navigate("/admin/kyc")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to KYC
        </Button>
      </div>
    );
  }

  const appStatus: string = agentDetails.applicationStatus ?? "DRAFT";

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/kyc")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Agent Onboarding Review
            </h1>
            <p className="text-white/60 mt-1 text-sm">
              Review KYC documents and approve, reject, or request more information
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(appStatus)}
            {reviewMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            )}
          </div>
        </div>

        {/* ── Applicant Info ── */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <User className="h-4 w-4" />
              Applicant Information
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <TypeBadge value={agentDetails?.agentType} labelMap={AGENT_TYPE_LABELS} />
              <TypeBadge value={agentDetails?.operationType ?? agentDetails?.businessType} labelMap={OPERATION_TYPE_LABELS} />
            </div>
          </CardHeader>
          <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow icon={<User />} label="Full Name" value={agentProfile?.name ?? (agentDetails?.user as any)?.name ?? "—"} />
              <InfoRow icon={<Phone />} label="Phone" value={agentProfile?.phone ?? (agentDetails?.user as any)?.phone ?? "—"} />
              <InfoRow icon={<Mail />} label="Email" value={agentProfile?.email ?? (agentDetails?.user as any)?.email ?? "—"} />
              <InfoRow
                icon={<MapPin />}
                label="Location"
                value={[agentDetails?.municipality, agentDetails?.district].filter(Boolean).join(", ") || agentProfile?.address}
              />
              <InfoRow
                icon={<Store />}
                label="Business Name"
                value={agentDetails?.businessName ?? "—"}
              />
              <InfoRow
                icon={<Building2 />}
                label="Business Type"
                value={
                  OPERATION_TYPE_LABELS[agentDetails?.operationType ?? agentDetails?.businessType ?? ""]?.label
                  ?? agentDetails?.operationType
                  ?? agentDetails?.businessType
                  ?? "—"
                }
              />

              <InfoRow
                icon={<MapPin />}
                label="Shop Address"
                value={agentDetails?.shopAddress ?? "—"}
              />
              <InfoRow
                icon={<CreditCard />}
                label="Settlement"
                value={
                  agentDetails?.settlementMethod
                    ? `${agentDetails.settlementMethod}${agentDetails.bankName ? ` — ${agentDetails.bankName}` : agentDetails.esewaNumber ? ` — ${agentDetails.esewaNumber}` : agentDetails.khaltiNumber ? ` — ${agentDetails.khaltiNumber}` : ""}`
                    : "—"
                }
              />
              <InfoRow
                icon={<Calendar />}
                label="Submitted On"
                value={
                  agentDetails?.submittedAt
                    ? new Date(agentDetails.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "—"
                }
              />
              <InfoRow
                icon={<Info />}
                label="Agent Type"
                value={AGENT_TYPE_LABELS[agentDetails?.agentType ?? ""]?.label ?? agentDetails?.agentType ?? "DEFAULT"}
              />

              <InfoRow
                icon={<Clock />}
                label="Monthly Volume"
                value={agentDetails?.claimedMonthlyVolume ?? "—"}
              />
              <InfoRow
                icon={<Info />}
                label="Agent ID"
                value={agentDetails?.agentId ?? "—"}
              />
            </div>

            {/* Admin note (existing) */}
            {agentDetails?.moreInfoRequest && (
              <div className="mt-4 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <p className="text-xs text-blue-400 font-medium mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Previous More-Info Request
                </p>
                <p className="text-sm text-white/80">{agentDetails.moreInfoRequest}</p>
              </div>
            )}
            {agentDetails?.rejectionReason && (
              <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                <p className="text-xs text-red-400 font-medium mb-1 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Previous Rejection Reason
                </p>
                <p className="text-sm text-white/80">{agentDetails.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Document Cards ── */}
        {documents.length === 0 ? (
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-white/40">
              <FileText className="h-10 w-10" />
              <p>No documents submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc: any) => {
              const status = docStatuses[doc.type] ?? { verified: doc.verified ?? null, rejectionReason: doc.rejectionReason ?? null };
              const url = doc.previewUrl ?? doc.fileKey;

              return (
                <Card
                  key={doc.type}
                  className={`border text-white backdrop-blur-md shadow-xl transition-colors ${
                    status.verified === true
                      ? "border-green-500/30 bg-green-900/10"
                      : status.verified === false
                      ? "border-red-500/30 bg-red-900/10"
                      : "border-white/5 bg-[#121212]/30"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white text-sm font-semibold">
                        <FileText className="h-4 w-4 text-white/60" />
                        {docLabel[doc.type] ?? doc.type.replace(/_/g, " ")}
                      </CardTitle>
                      {status.verified === true ? (
                        <Badge className="border border-green-500/30 bg-green-500/15 text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : status.verified === false ? (
                        <Badge className="border border-red-500/30 bg-red-500/15 text-red-400">
                          <XCircle className="h-3 w-3 mr-1" /> Rejected
                        </Badge>
                      ) : (
                        <Badge className="border border-white/10 bg-white/5 text-white/50">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>
                    {status.rejectionReason && (
                      <CardDescription className="text-red-400 text-xs mt-1">
                        Reason: {status.rejectionReason}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Document preview / open button */}
                    {url ? (
                      <div className="space-y-2">
                        {/* Inline image preview if it's an image URL */}
                        {/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) && (
                          <div
                            className="w-full h-32 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                            onClick={() => window.open(url, "_blank")}
                          >
                            <img
                              src={url}
                              alt={doc.type}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white"
                          onClick={() => window.open(url, "_blank")}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          View Full Document
                          <ExternalLink className="h-3 w-3 ml-2 opacity-60" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-white/40 italic">No file attached</p>
                    )}

                    {/* Per-document action buttons */}
                    {status.verified !== true && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30"
                          onClick={() => handleVerifyDoc(doc.type)}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"
                          onClick={() => openRejectDoc(doc.type)}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Flag
                        </Button>
                      </div>
                    )}

                    {/* Un-verify (revert to pending) */}
                    {status.verified === true && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-white/40 hover:text-white text-xs"
                        onClick={() => setDocStatuses((p) => ({ ...p, [doc.type]: { verified: null, rejectionReason: null } }))}
                      >
                        Undo verification
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Admin Config (before approval) ── */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="text-base text-white">Admin Configuration</CardTitle>
            <CardDescription className="text-white/60">
              Set commission rate and internal notes before approving
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white/80">Commission Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/40">Default: 5% — adjust per agreement</p>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Internal Admin Notes</Label>
              <Textarea
                placeholder="Notes visible only to admins..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm resize-none h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Progress summary ── */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="text-base text-white">Document Review Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">
                  <strong className="text-green-400">{docValues.filter(s => s.verified === true).length}</strong>
                  <span className="text-white/60"> verified</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm">
                  <strong className="text-red-400">{docValues.filter(s => s.verified === false).length}</strong>
                  <span className="text-white/60"> flagged</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/40" />
                <span className="text-sm">
                  <strong className="text-white/60">{docValues.filter(s => s.verified === null).length}</strong>
                  <span className="text-white/40"> pending</span>
                </span>
              </div>
              <div className="flex-1" />
              {allVerified && (
                <Badge className="border border-green-500/30 bg-green-500/10 text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> All Documents Verified
                </Badge>
              )}
              {hasRejected && (
                <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Has Flagged Documents
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Final Decision ── */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              Final Decision
            </CardTitle>
            <CardDescription className="text-white/60">
              {appStatus === "APPROVED"
                ? "This application has been approved. The agent is now active."
                : appStatus === "REJECTED"
                ? "This application was rejected."
                : appStatus === "SUSPENDED"
                ? "This agent account is suspended."
                : appStatus === "MORE_INFO"
                ? "More information has been requested from the agent."
                : documents.length === 0
                ? "No documents submitted. You can still approve or reject this application."
                : allVerified
                ? "All documents verified — you can approve this agent."
                : hasRejected
                ? "Some documents are flagged. Request more info or reject the application."
                : "Review all documents above before making a final decision."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── LOCKED: decision already made ── */}
            {appStatus === "APPROVED" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/10 w-fit">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-semibold">Application Approved</span>
              </div>
            )}

            {appStatus === "REJECTED" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 w-fit">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Application Rejected</span>
                </div>
                {agentDetails?.rejectionReason && (
                  <p className="text-sm text-white/50">Reason: {agentDetails.rejectionReason}</p>
                )}
                {/* Allow re-approving a rejected application */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit mt-1 border-white/20 text-white/60 hover:text-white"
                  disabled={reviewMutation.isPending}
                  onClick={() => setApproveDialog(true)}
                >
                  Override — Approve Application
                </Button>
              </div>
            )}

            {appStatus === "SUSPENDED" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-orange-500/30 bg-orange-500/10 w-fit">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400 font-semibold">Agent Suspended</span>
              </div>
            )}

            {appStatus === "MORE_INFO" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-500/30 bg-blue-500/10 w-fit">
                  <Info className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Awaiting Agent Response</span>
                </div>
                {agentDetails?.moreInfoRequest && (
                  <p className="text-sm text-white/50">Requested: {agentDetails.moreInfoRequest}</p>
                )}
                {/* Still allow approve / reject while waiting */}
                <div className="flex flex-wrap gap-3 mt-1">
                  <Button
                    size="sm"
                    className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold gap-2 disabled:opacity-40"
                    disabled={reviewMutation.isPending}
                    onClick={() => setApproveDialog(true)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-2"
                    disabled={reviewMutation.isPending}
                    onClick={() => setRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              </div>
            )}

            {/* ── ACTIVE: pending / draft — show full action buttons ── */}
            {(appStatus === "PENDING" || appStatus === "DRAFT") && (
              <div className="flex flex-wrap gap-3">
                {/* Approve — enabled when all docs verified OR no docs exist */}
                <Button
                  size="lg"
                  className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold gap-2 disabled:opacity-40"
                  disabled={(documents.length > 0 && !allVerified) || reviewMutation.isPending}
                  onClick={() => setApproveDialog(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Agent
                </Button>

                {/* More Info — always available */}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 gap-2"
                  disabled={reviewMutation.isPending}
                  onClick={() => setMoreInfoDialog(true)}
                >
                  <Info className="h-4 w-4" />
                  Request More Info
                </Button>

                {/* Reject */}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-2"
                  disabled={reviewMutation.isPending}
                  onClick={() => setRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Reject Document Dialog ── */}
      <Dialog open={rejectDocDialog} onOpenChange={setRejectDocDialog}>
        <DialogContent className="bg-[#0F1F1C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Flag Document</DialogTitle>
            <DialogDescription className="text-white/60">
              Provide a clear reason. The agent will see this in their app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason for flagging</Label>
            <Textarea
              placeholder="e.g. Image is blurry, document is expired..."
              value={rejectDocReason}
              onChange={(e) => setRejectDocReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-white/60" onClick={() => setRejectDocDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectDocReason.trim()}
              onClick={handleRejectDoc}
            >
              Flag Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ── */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="bg-[#0F1F1C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#D3D925]">Confirm Approval</DialogTitle>
            <DialogDescription className="text-white/60">
              This agent will be approved and notified immediately via SMS, email, and push notification.
              They can start booking tickets right away.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Agent</span>
              <span className="font-medium">{agentProfile?.name ?? (agentDetails?.user as any)?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Commission Rate</span>
              <span className="text-[#D3D925] font-medium">{commissionRate}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-white/60">Documents Verified</span>
              <span className="text-green-400 font-medium">{docValues.filter(s => s.verified).length} / {documents.length}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-white/60" onClick={() => setApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold"
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── More Info Dialog ── */}
      <Dialog open={moreInfoDialog} onOpenChange={setMoreInfoDialog}>
        <DialogContent className="bg-[#0F1F1C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Request More Information</DialogTitle>
            <DialogDescription className="text-white/60">
              The agent will receive this message in their app and be asked to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Message to agent</Label>
            <Textarea
              placeholder="e.g. Please upload a clearer photo of your shop front showing the business name..."
              value={moreInfoMessage}
              onChange={(e) => setMoreInfoMessage(e.target.value)}
              className="bg-white/5 border-white/10 text-white resize-none h-24"
            />
            <p className="text-xs text-white/40">The agent has 7 days to respond before the application expires.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-white/60" onClick={() => setMoreInfoDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!moreInfoMessage.trim() || reviewMutation.isPending}
              onClick={handleMoreInfo}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Application Dialog ── */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="bg-[#0F1F1C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reject Application</DialogTitle>
            <DialogDescription className="text-white/60">
              Provide a clear reason. The agent will be notified via SMS and push notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                placeholder="e.g. Business address could not be verified..."
                value={finalRejectionReason}
                onChange={(e) => setFinalRejectionReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white resize-none"
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <input
                type="checkbox"
                id="isPermanent"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="h-4 w-4 accent-red-400"
              />
              <div>
                <Label htmlFor="isPermanent" className="text-red-400 text-sm font-medium cursor-pointer">
                  Permanently reject (cannot reapply)
                </Label>
                <p className="text-xs text-white/40 mt-0.5">Use for fraud or severe violations only.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-white/60" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!finalRejectionReason.trim() || reviewMutation.isPending}
              onClick={handleReject}
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Reusable info row ─────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="h-4 w-4 text-white/40 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm font-medium text-white">{value || "—"}</p>
      </div>
    </div>
  );
}
