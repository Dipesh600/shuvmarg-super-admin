import { useState } from "react";
// import {  useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, CheckCircle2, XCircle, ExternalLink, Building2} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ownerKYCData = {
  id: "KYC001",
  company: "Nepal Express Pvt. Ltd.",
  owner: "Ram Bahadur Thapa",
  email: "ram@nepalexpress.com",
  phone: "+977 9841234567",
  address: "Kathmandu, Nepal",
  submittedAt: "2026-01-02T10:30:00Z",
  verificationStatus: "pending",
  companyRegistration: {
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440100/bus_owner_kyc/company_registration/lqmftmadjh8u1pmhgemn.pdf"
    ],
    verified: false,
    rejectionReason: null
  },
  taxRegistration: {
    panNumber: "123456789",
    vatNumber: "VAT123456",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440102/bus_owner_kyc/tax_registration/wlvurgol6ypw2kczh8vb.jpg"
    ],
    verified: false,
    rejectionReason: null
  },
  transportLicense: {
    licenseNumber: "TL-2025-1234",
    validTill: "2027-12-31",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440103/bus_owner_kyc/transport_license/gv7dwzo5onhx6gzwv8jn.pdf"
    ],
    verified: false,
    rejectionReason: null
  },
  insuranceCertificates: [
    {
      insurerName: "Nepal Insurance Co.",
      policyNumber: "NIC-2025-5678",
      validTill: "2026-12-31",
      documentUrls: [
        "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440104/bus_owner_kyc/insurance/esnouamsg6d47qgbcghz.pdf"
      ],
      verified: false,
      rejectionReason: null,
      _id: "6958fee8f0a452e1114673ed"
    }
  ]
};

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
  
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, { verified: boolean; rejectionReason: string | null }>>({
    companyRegistration: { verified: ownerKYCData.companyRegistration.verified, rejectionReason: ownerKYCData.companyRegistration.rejectionReason },
    taxRegistration: { verified: ownerKYCData.taxRegistration.verified, rejectionReason: ownerKYCData.taxRegistration.rejectionReason },
    transportLicense: { verified: ownerKYCData.transportLicense.verified, rejectionReason: ownerKYCData.transportLicense.rejectionReason },
    insurance: { verified: ownerKYCData.insuranceCertificates[0].verified, rejectionReason: ownerKYCData.insuranceCertificates[0].rejectionReason },
  });
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  const documentSections: DocumentSection[] = [
    {
      title: "Company Registration",
      key: "companyRegistration",
      documents: ownerKYCData.companyRegistration.documentUrls,
      verified: documentStatuses.companyRegistration.verified,
      rejectionReason: documentStatuses.companyRegistration.rejectionReason,
    },
    {
      title: "Tax Registration",
      key: "taxRegistration",
      documents: ownerKYCData.taxRegistration.documentUrls,
      verified: documentStatuses.taxRegistration.verified,
      rejectionReason: documentStatuses.taxRegistration.rejectionReason,
      details: [
        { label: "PAN Number", value: ownerKYCData.taxRegistration.panNumber },
        { label: "VAT Number", value: ownerKYCData.taxRegistration.vatNumber },
      ]
    },
    {
      title: "Transport License",
      key: "transportLicense",
      documents: ownerKYCData.transportLicense.documentUrls,
      verified: documentStatuses.transportLicense.verified,
      rejectionReason: documentStatuses.transportLicense.rejectionReason,
      details: [
        { label: "License Number", value: ownerKYCData.transportLicense.licenseNumber },
        { label: "Valid Till", value: ownerKYCData.transportLicense.validTill },
      ]
    },
    {
      title: "Insurance Certificate",
      key: "insurance",
      documents: ownerKYCData.insuranceCertificates[0].documentUrls,
      verified: documentStatuses.insurance.verified,
      rejectionReason: documentStatuses.insurance.rejectionReason,
      details: [
        { label: "Insurer", value: ownerKYCData.insuranceCertificates[0].insurerName },
        { label: "Policy Number", value: ownerKYCData.insuranceCertificates[0].policyNumber },
        { label: "Valid Till", value: ownerKYCData.insuranceCertificates[0].validTill },
      ]
    },
  ];

  const handleVerify = (key: string) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [key]: { verified: true, rejectionReason: null }
    }));
    toast.success("Document verified successfully");
  };

  const openRejectDialog = (key: string) => {
    setCurrentRejectKey(key);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (currentRejectKey && rejectionReason.trim()) {
      setDocumentStatuses(prev => ({
        ...prev,
        [currentRejectKey]: { verified: false, rejectionReason: rejectionReason.trim() }
      }));
      setRejectDialogOpen(false);
      toast.error("Document rejected");
    }
  };

  const allVerified = Object.values(documentStatuses).every(s => s.verified);
  const hasRejections = Object.values(documentStatuses).some(s => s.rejectionReason);

  const handleFinalApproval = () => {
    toast.success("KYC application approved successfully!");
    setFinalApprovalDialog(false);
    // navigate("/kyc");
  };

  const handleFinalRejection = () => {
    toast.error("KYC application rejected");
    setFinalRejectionDialog(false);
    // navigate("/kyc");
  };

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
            <p className="text-muted-foreground">Review and verify KYC documents for {ownerKYCData.company}</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
        </div>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{ownerKYCData.company}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Name</p>
                <p className="font-medium">{ownerKYCData.owner}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{ownerKYCData.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{ownerKYCData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{ownerKYCData.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <p className="font-medium">{new Date(ownerKYCData.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {documentSections.map((section) => (
            <Card key={section.key} className={section.verified ? "border-green-200 bg-green-50/50" : section.rejectionReason ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {section.title}
                  </CardTitle>
                  {section.verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : section.rejectionReason ? (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
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
                {section.details && (
                  <div className="grid gap-2 text-sm">
                    {section.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">{detail.label}:</span>
                        <span className="font-medium">{detail.value || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Documents:</p>
                  {section.documents.map((url, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document {idx + 1}
                    </Button>
                  ))}
                </div>

                {!section.verified && !section.rejectionReason && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleVerify(section.key)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openRejectDialog(section.key)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Final Decision</CardTitle>
            <CardDescription>
              {allVerified
                ? "All documents have been verified. You can approve this KYC application."
                : hasRejections
                ? "Some documents have been rejected. You can reject the entire application."
                : "Please review and verify all documents before making a final decision."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                size="lg"
                disabled={!allVerified}
                onClick={() => setFinalApprovalDialog(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve KYC Application
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setFinalRejectionDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject KYC Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Document Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Approval Dialog */}
      <Dialog open={finalApprovalDialog} onOpenChange={setFinalApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this KYC application? The bus owner will be verified and can start operations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalApproval}>
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
            <DialogDescription>
              Please provide a reason for rejecting this KYC application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="final-rejection-reason">Rejection Reason</Label>
              <Textarea
                id="final-rejection-reason"
                placeholder="Enter the reason for rejecting the entire application..."
                value={finalRejectionReason}
                onChange={(e) => setFinalRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalRejectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFinalRejection} disabled={!finalRejectionReason.trim()}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
