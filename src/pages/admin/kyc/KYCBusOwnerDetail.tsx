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
} from "lucide-react";
import { toast } from "sonner";
import { useOwerKycDetails } from "@/hooks/useKycDetails";

type DocumentSection = {
  title: string;
  key: string;
  documents: string[];
  verified: boolean;
  rejectionReason: string | null;
  details?: { label: string; value: string | null }[];
};

export default function KYCBusOwnerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isLoading, isError, error } = useOwerKycDetails(id);
  const kyc = data?.data ;

  

  /* -------------------- Document Status State -------------------- */
  const initialStatuses = useMemo(
    () => ({
      companyRegistration: {
        verified: kyc?.companyRegistration.verified,
        rejectionReason: kyc?.companyRegistration.rejectionReason,
      },
      taxRegistration: {
        verified: kyc?.taxRegistration.verified,
        rejectionReason: kyc?.taxRegistration.rejectionReason,
      },
      transportLicense: {
        verified: kyc?.transportLicense.verified,
        rejectionReason: kyc?.transportLicense.rejectionReason,
      },
      insurance: {
        verified: kyc?.insuranceCertificates[0]?.verified ?? false,
        rejectionReason:
          kyc?.insuranceCertificates[0]?.rejectionReason ?? null,
      },
    }),
    [kyc],
  );

  const [documentStatuses, setDocumentStatuses] =
    useState(initialStatuses);

  useEffect(() => {
    setDocumentStatuses(initialStatuses);
  }, [initialStatuses]);

  /* -------------------- Dialog States -------------------- */
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");
/* -------------------- Loading / Error -------------------- */
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>{JSON.stringify(error)}</div>;
  if (!kyc) return null;
  /* -------------------- Document Sections -------------------- */
  const documentSections: DocumentSection[] = [
    {
      title: "Company Registration",
      key: "companyRegistration",
      documents: kyc.companyRegistration.documentUrls,
      verified: documentStatuses.companyRegistration.verified,
      rejectionReason: documentStatuses.companyRegistration.rejectionReason,
    },
    {
      title: "Tax Registration",
      key: "taxRegistration",
      documents: kyc.taxRegistration.documentUrls,
      verified: documentStatuses.taxRegistration.verified,
      rejectionReason: documentStatuses.taxRegistration.rejectionReason,
      details: [
        { label: "PAN Number", value: kyc.taxRegistration.panNumber },
        { label: "VAT Number", value: kyc.taxRegistration.vatNumber },
      ],
    },
    {
      title: "Transport License",
      key: "transportLicense",
      documents: kyc.transportLicense.documentUrls,
      verified: documentStatuses.transportLicense.verified,
      rejectionReason: documentStatuses.transportLicense.rejectionReason,
      details: [
        { label: "License Number", value: kyc.transportLicense.licenseNumber },
        { label: "Valid Till", value: kyc.transportLicense.validTill },
      ],
    },
    {
      title: "Insurance Certificate",
      key: "insurance",
      documents: kyc.insuranceCertificates.flatMap(
        (i: any) => i.documentUrls,
      ),
      verified: documentStatuses.insurance.verified,
      rejectionReason: documentStatuses.insurance.rejectionReason,
      details: [
        {
          label: "Insurer",
          value: kyc.insuranceCertificates[0]?.insurerName,
        },
        {
          label: "Policy Number",
          value: kyc.insuranceCertificates[0]?.policyNumber,
        },
        {
          label: "Valid Till",
          value: kyc.insuranceCertificates[0]?.validTill,
        },
      ],
    },
  ];

  /* -------------------- Handlers -------------------- */
  const handleVerify = (key: string) => {
    setDocumentStatuses((prev) => ({
      ...prev,
      [key]: { verified: true, rejectionReason: null },
    }));
    toast.success("Document verified");
  };

  const openRejectDialog = (key: string) => {
    setCurrentRejectKey(key);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!currentRejectKey || !rejectionReason.trim()) return;

    setDocumentStatuses((prev) => ({
      ...prev,
      [currentRejectKey]: {
        verified: false,
        rejectionReason: rejectionReason.trim(),
      },
    }));

    toast.error("Document rejected");
    setRejectDialogOpen(false);
  };

  const allVerified = Object.values(documentStatuses).every(
    (s) => s.verified,
  );
  const hasRejections = Object.values(documentStatuses).some(
    (s) => s.rejectionReason,
  );

  const handleFinalApproval = async () => {
    toast.success("KYC approved successfully");
    navigate("/admin/kyc");
  };

  const handleFinalRejection = async () => {
    toast.error("KYC rejected");
    navigate("/admin/kyc");
  };

  /* -------------------- UI -------------------- */
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/kyc")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Bus Owner KYC Review
            </h1>
            <p className="text-muted-foreground">
              Review KYC for {kyc.user.name}
            </p>
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
            {kyc.verificationStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Applicant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Info label="Name" value={kyc.user.name} />
            <Info label="Email" value={kyc.user.email} />
            <Info label="Phone" value={kyc.user.phone} />
            <Info label="Bus Owner ID" value={kyc.busOwnerId} />
            <Info
              label="Submitted On"
              value={new Date(kyc.createdAt).toLocaleDateString()}
            />
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="grid gap-4 md:grid-cols-2">
          {documentSections.map((section) => (
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
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {section.title}
                  </CardTitle>

                  {section.verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  ) : section.rejectionReason ? (
                    <Badge variant="destructive">Rejected</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>

                {section.rejectionReason && (
                  <CardDescription className="text-destructive">
                    Reason: {section.rejectionReason}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {section.details?.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {d.label}
                    </span>
                    <span className="font-medium">
                      {d.value ?? "N/A"}
                    </span>
                  </div>
                ))}

                {section.documents.map((url, i) => (
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
                ))}

                {!section.verified && !section.rejectionReason && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleVerify(section.key)}
                    >
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
          ))}
        </div>

        {/* Final Decision */}
        <Card>
          <CardHeader>
            <CardTitle>Final Decision</CardTitle>
            <CardDescription>
              {allVerified
                ? "All documents verified."
                : hasRejections
                ? "Some documents rejected."
                : "Please review all documents."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              size="lg"
              disabled={allVerified}
              onClick={() => setFinalApprovalDialog(true)}
            >
              Approve KYC
            </Button>
            <Button
              size="lg"
              className={allVerified ? "cursor-not-allowed":"cursor-pointer"}
              disabled={allVerified}
              variant="destructive"
              onClick={() => setFinalRejectionDialog(true)}
            >
              Reject KYC
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={finalApprovalDialog}
        onOpenChange={setFinalApprovalDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFinalApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFinalApproval}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Rejection Dialog */}
      <Dialog
        open={finalRejectionDialog}
        onOpenChange={setFinalRejectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={finalRejectionReason}
            onChange={(e) =>
              setFinalRejectionReason(e.target.value)
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFinalRejectionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalRejection}
              disabled={!finalRejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------- Helper -------------------- */
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "N/A"}</p>
    </div>
  );
}
