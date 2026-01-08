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
import { ArrowLeft, FileText, CheckCircle2, XCircle, ExternalLink, Bus, Building2 } from "lucide-react";
import { toast } from "sonner";

const fleetKYCData = {
  id: "FLT001",
  busNumber: "BA 1 KHA 1234",
  ownerCompany: "Nepal Express Pvt. Ltd.",
  ownerName: "Ram Bahadur Thapa",
  busType: "Deluxe",
  seatingCapacity: 45,
  manufacturingYear: "2022",
  submittedAt: "2026-01-03T09:15:00Z",
  verificationStatus: "pending",
  vehicleRegistration: {
    registrationNumber: "BA 1 KHA 1234",
    registeredDate: "2022-03-15",
    validTill: "2027-03-14",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440100/fleet_kyc/vehicle_registration/sample.pdf"
    ],
    verified: false,
    rejectionReason: null
  },
  roadworthinesssCertificate: {
    certificateNumber: "RW-2025-5678",
    issuedDate: "2025-06-01",
    validTill: "2026-05-31",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440102/fleet_kyc/roadworthiness/sample.jpg"
    ],
    verified: false,
    rejectionReason: null
  },
  routePermit: {
    permitNumber: "RP-2025-1234",
    routes: ["Kathmandu - Pokhara", "Kathmandu - Chitwan"],
    validTill: "2026-12-31",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440103/fleet_kyc/route_permit/sample.pdf"
    ],
    verified: false,
    rejectionReason: null
  },
  insuranceCertificate: {
    insurerName: "Nepal Insurance Co.",
    policyNumber: "NIC-VEH-2025-9012",
    coverageType: "Comprehensive",
    validTill: "2026-12-31",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440104/fleet_kyc/insurance/sample.pdf"
    ],
    verified: false,
    rejectionReason: null
  },
  pollutionCertificate: {
    certificateNumber: "PUC-2025-3456",
    issuedDate: "2025-10-01",
    validTill: "2026-03-31",
    documentUrls: [
      "https://res.cloudinary.com/dwagseu4o/image/upload/v1767440105/fleet_kyc/pollution/sample.jpg"
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

export default function KYCFleetDetail() {
  const navigate = useNavigate();
  
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, { verified: boolean; rejectionReason: string | null }>>({
    vehicleRegistration: { verified: fleetKYCData.vehicleRegistration.verified, rejectionReason: fleetKYCData.vehicleRegistration.rejectionReason },
    roadworthinessCertificate: { verified: fleetKYCData.roadworthinesssCertificate.verified, rejectionReason: fleetKYCData.roadworthinesssCertificate.rejectionReason },
    routePermit: { verified: fleetKYCData.routePermit.verified, rejectionReason: fleetKYCData.routePermit.rejectionReason },
    insuranceCertificate: { verified: fleetKYCData.insuranceCertificate.verified, rejectionReason: fleetKYCData.insuranceCertificate.rejectionReason },
    pollutionCertificate: { verified: fleetKYCData.pollutionCertificate.verified, rejectionReason: fleetKYCData.pollutionCertificate.rejectionReason },
  });
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRejectKey, setCurrentRejectKey] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [finalApprovalDialog, setFinalApprovalDialog] = useState(false);
  const [finalRejectionDialog, setFinalRejectionDialog] = useState(false);
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  const documentSections: DocumentSection[] = [
    {
      title: "Vehicle Registration",
      key: "vehicleRegistration",
      documents: fleetKYCData.vehicleRegistration.documentUrls,
      verified: documentStatuses.vehicleRegistration.verified,
      rejectionReason: documentStatuses.vehicleRegistration.rejectionReason,
      details: [
        { label: "Registration Number", value: fleetKYCData.vehicleRegistration.registrationNumber },
        { label: "Registered Date", value: fleetKYCData.vehicleRegistration.registeredDate },
        { label: "Valid Till", value: fleetKYCData.vehicleRegistration.validTill },
      ]
    },
    {
      title: "Roadworthiness Certificate",
      key: "roadworthinessCertificate",
      documents: fleetKYCData.roadworthinesssCertificate.documentUrls,
      verified: documentStatuses.roadworthinessCertificate.verified,
      rejectionReason: documentStatuses.roadworthinessCertificate.rejectionReason,
      details: [
        { label: "Certificate Number", value: fleetKYCData.roadworthinesssCertificate.certificateNumber },
        { label: "Issued Date", value: fleetKYCData.roadworthinesssCertificate.issuedDate },
        { label: "Valid Till", value: fleetKYCData.roadworthinesssCertificate.validTill },
      ]
    },
    {
      title: "Route Permit",
      key: "routePermit",
      documents: fleetKYCData.routePermit.documentUrls,
      verified: documentStatuses.routePermit.verified,
      rejectionReason: documentStatuses.routePermit.rejectionReason,
      details: [
        { label: "Permit Number", value: fleetKYCData.routePermit.permitNumber },
        { label: "Routes", value: fleetKYCData.routePermit.routes.join(", ") },
        { label: "Valid Till", value: fleetKYCData.routePermit.validTill },
      ]
    },
    {
      title: "Insurance Certificate",
      key: "insuranceCertificate",
      documents: fleetKYCData.insuranceCertificate.documentUrls,
      verified: documentStatuses.insuranceCertificate.verified,
      rejectionReason: documentStatuses.insuranceCertificate.rejectionReason,
      details: [
        { label: "Insurer", value: fleetKYCData.insuranceCertificate.insurerName },
        { label: "Policy Number", value: fleetKYCData.insuranceCertificate.policyNumber },
        { label: "Coverage", value: fleetKYCData.insuranceCertificate.coverageType },
        { label: "Valid Till", value: fleetKYCData.insuranceCertificate.validTill },
      ]
    },
    {
      title: "Pollution Under Control (PUC)",
      key: "pollutionCertificate",
      documents: fleetKYCData.pollutionCertificate.documentUrls,
      verified: documentStatuses.pollutionCertificate.verified,
      rejectionReason: documentStatuses.pollutionCertificate.rejectionReason,
      details: [
        { label: "Certificate Number", value: fleetKYCData.pollutionCertificate.certificateNumber },
        { label: "Issued Date", value: fleetKYCData.pollutionCertificate.issuedDate },
        { label: "Valid Till", value: fleetKYCData.pollutionCertificate.validTill },
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
    toast.success("Fleet KYC approved! Bus is ready for operations.");
    setFinalApprovalDialog(false);
    navigate("/kyc");
  };

  const handleFinalRejection = () => {
    toast.error("Fleet KYC application rejected");
    setFinalRejectionDialog(false);
    navigate("/kyc");
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
            <h1 className="text-3xl font-bold tracking-tight">Fleet KYC Review</h1>
            <p className="text-muted-foreground">Review and verify documents for bus {fleetKYCData.busNumber}</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
        </div>

        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Bus Number</p>
                <p className="font-medium">{fleetKYCData.busNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bus Type</p>
                <p className="font-medium">{fleetKYCData.busType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seating Capacity</p>
                <p className="font-medium">{fleetKYCData.seatingCapacity} seats</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturing Year</p>
                <p className="font-medium">{fleetKYCData.manufacturingYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{fleetKYCData.ownerCompany}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Name</p>
                <p className="font-medium">{fleetKYCData.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <p className="font-medium">{new Date(fleetKYCData.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Sections */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documentSections.map((section) => (
            <Card key={section.key} className={section.verified ? "border-green-200 bg-green-50/50" : section.rejectionReason ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
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
                  <CardDescription className="text-destructive text-xs">
                    Reason: {section.rejectionReason}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {section.details && (
                  <div className="grid gap-1 text-sm">
                    {section.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{detail.label}:</span>
                        <span className="font-medium text-right max-w-[60%] truncate">{detail.value || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-1">
                  {section.documents.map((url, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Document
                    </Button>
                  ))}
                </div>

                {!section.verified && !section.rejectionReason && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleVerify(section.key)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs"
                      onClick={() => openRejectDialog(section.key)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
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
                ? "All documents have been verified. You can approve this fleet registration."
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
                Approve Fleet Registration
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setFinalRejectionDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Fleet Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <DialogTitle>Approve Fleet Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this fleet registration? The bus will be activated and can start operations.
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
            <DialogTitle>Reject Fleet Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this fleet registration.
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
              Reject Fleet Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  );
}
