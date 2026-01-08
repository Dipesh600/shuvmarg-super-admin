import { useState } from "react";
import {  useNavigate } from "react-router-dom";
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
import { ArrowLeft, FileText, CheckCircle2, XCircle, ExternalLink, User, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const agentKYCData = {
  id: "AGT001",
  name: "Rajesh Thapa",
  email: "rajesh.thapa@gmail.com",
  phone: "+977 9812345678",
  location: "Kathmandu, Nepal",
  address: "Thamel, Kathmandu",
  submittedAt: "2026-01-02T14:20:00Z",
  verificationStatus: "pending",
  citizenshipCertificate: {
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1766754052/agent_kyc/citizenship/p173mtfhctjkazgkupnh.png"
    ],
    verified: false,
    rejectionReason: null
  },
  agentAgreement: {
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1766754053/agent_kyc/agreement/ucmndgyoig3e9dyzhfnb.png"
    ],
    verified: false,
    rejectionReason: null
  },
  bankAccount: {
    accountNumber: "****5678",
    bankName: "Nepal Bank Ltd",
    branch: "Thamel Branch",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1766754055/agent_kyc/bank/n0omppx68mtrqlqviie8.png"
    ],
    verified: false,
    rejectionReason: null
  },
  addressProof: {
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1766754054/agent_kyc/address_proof/emvjrskorc8xtu9fit79.png"
    ],
    verified: false,
    rejectionReason: null
  }
};

type DocumentSection = {
  title: string;
  key: string;
  documents: string[];
  verified: boolean;
  rejectionReason: string | null;
  details?: { label: string; value: string | null }[];
};

export default function KYCAgentDetail() {
  const navigate = useNavigate();
  
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, { verified: boolean; rejectionReason: string | null }>>({
    citizenshipCertificate: { verified: agentKYCData.citizenshipCertificate.verified, rejectionReason: agentKYCData.citizenshipCertificate.rejectionReason },
    agentAgreement: { verified: agentKYCData.agentAgreement.verified, rejectionReason: agentKYCData.agentAgreement.rejectionReason },
    bankAccount: { verified: agentKYCData.bankAccount.verified, rejectionReason: agentKYCData.bankAccount.rejectionReason },
    addressProof: { verified: agentKYCData.addressProof.verified, rejectionReason: agentKYCData.addressProof.rejectionReason },
  });
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  const documentSections: DocumentSection[] = [
    {
      title: "Citizenship Certificate",
      key: "citizenshipCertificate",
      documents: agentKYCData.citizenshipCertificate.documentUrls,
      verified: documentStatuses.citizenshipCertificate.verified,
      rejectionReason: documentStatuses.citizenshipCertificate.rejectionReason,
    },
    {
      title: "Agent Agreement",
      key: "agentAgreement",
      documents: agentKYCData.agentAgreement.documentUrls,
      verified: documentStatuses.agentAgreement.verified,
      rejectionReason: documentStatuses.agentAgreement.rejectionReason,
    },
    {
      title: "Bank Account Details",
      key: "bankAccount",
      documents: agentKYCData.bankAccount.documentUrls,
      verified: documentStatuses.bankAccount.verified,
      rejectionReason: documentStatuses.bankAccount.rejectionReason,
      details: [
        { label: "Bank Name", value: agentKYCData.bankAccount.bankName },
        { label: "Branch", value: agentKYCData.bankAccount.branch },
        { label: "Account Number", value: agentKYCData.bankAccount.accountNumber },
      ]
    },
    {
      title: "Address Proof",
      key: "addressProof",
      documents: agentKYCData.addressProof.documentUrls,
      verified: documentStatuses.addressProof.verified,
      rejectionReason: documentStatuses.addressProof.rejectionReason,
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
    toast.success("Agent KYC approved successfully!");
    setFinalApprovalDialog(false);
    navigate("/admin/kyc");
  };

  const handleFinalRejection = () => {
    toast.error("Agent KYC application rejected");
    setFinalRejectionDialog(false);
    navigate("/admin/kyc");
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
            <h1 className="text-3xl font-bold tracking-tight">Agent KYC Review</h1>
            <p className="text-muted-foreground">Review and verify KYC documents for {agentKYCData.name}</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
        </div>

        {/* Agent Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Agent Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{agentKYCData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{agentKYCData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{agentKYCData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{agentKYCData.location}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{agentKYCData.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <p className="font-medium">{new Date(agentKYCData.submittedAt).toLocaleDateString()}</p>
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
                ? "All documents have been verified. You can approve this agent."
                : hasRejections
                ? "Some documents have been rejected."
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
                Approve Agent
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setFinalRejectionDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Agent
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
            <DialogTitle>Approve Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this agent? They will be able to start selling tickets.
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
            <DialogTitle>Reject Agent</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this agent application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="final-rejection-reason">Rejection Reason</Label>
              <Textarea
                id="final-rejection-reason"
                placeholder="Enter the reason for rejection..."
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
              Reject Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
