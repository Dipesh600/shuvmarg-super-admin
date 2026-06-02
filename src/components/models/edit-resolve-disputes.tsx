import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-model-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveDispute } from "@/api/disputeApi";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";

export function ResolveDisputeDialog() {
  const { onClose, data: disputeData, type, isOpen } = useModal();
  const queryClient = useQueryClient();

  const isModelOpen = isOpen && type === "editResolveDisputes";

  // State values
  const [refundNote, setRefundNote] = useState("");
  const [refundStatus, setRefundStatus] = useState("COMPLETED");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notifyUser, setNotifyUser] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModelOpen) {
      setRefundNote("");
      setRefundStatus("COMPLETED");
      setProofFile(null);
      setImagePreview(null);
      setNotifyUser(true);
    }
  }, [isModelOpen]);

  // Handle image preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, WebP, GIF).",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB.",
          variant: "destructive",
        });
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setProofFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Mutation for resolving dispute
  const { mutate: handleResolve, isPending } = useMutation({
    mutationFn: async () => {
      if (!disputeData?._id) throw new Error("Transaction ID is missing");
      
      const formData = new FormData();
      formData.append("refundNote", refundNote);
      formData.append("refundStatus", refundStatus);
      if (proofFile) {
        formData.append("proofImage", proofFile);
      }
      return await resolveDispute(disputeData._id, formData);
    },
    onSuccess: () => {
      toast({
        title: "Dispute Resolved Successfully",
        description: `Dispute Case #${disputeData?._id?.substring(0, 8)} has been refunded and marked as resolved.`,
      });
      // Invalidate both disputes and active alerts lists
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: "Resolution Failed",
        description: err.message || "An error occurred while resolving this dispute.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundNote.trim()) {
      toast({
        title: "Missing Refund Note",
        description: "Please enter a detailed manual refund note/receipt reference first.",
        variant: "destructive",
      });
      return;
    }

    if (refundStatus === "COMPLETED" && !proofFile) {
      toast({
        title: "Missing Proof of Work",
        description: "Please upload the refund confirmation screenshot as proof of work before resolving this dispute.",
        variant: "destructive",
      });
      return;
    }

    handleResolve();
  };

  if (!disputeData) return null;

  // Extract user details
  const userName = disputeData.userId?.name || "Unknown Passenger";
  const userPhone = disputeData.userId?.phone || "N/A";
  const userEmail = disputeData.userId?.email || "N/A";

  // Extract trip context
  const hasTrip = !!disputeData.tripId;
  const tripRoute = hasTrip
    ? `${disputeData.tripId?.fromStopName} ➔ ${disputeData.tripId?.toStopName}`
    : "Trip context not available";
  const tripDate = disputeData.tripId?.tripDate
    ? new Date(disputeData.tripId.tripDate).toLocaleDateString("en-IN")
    : "N/A";
  const seats = disputeData.seats && disputeData.seats.length > 0
    ? disputeData.seats.join(", ").toUpperCase()
    : "N/A";

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive font-semibold mb-1">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs tracking-wider uppercase">High Priority Dispute</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center justify-between">
            Resolve Dispute Center
          </DialogTitle>
          <DialogDescription>
            Process verification and record manual eSewa/Khalti refunds for Case ID: <span className="font-mono font-medium">{disputeData._id}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Dispute Summary Context */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Customer/Passenger</span>
              <p className="font-semibold mt-0.5">{userName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{userPhone} | {userEmail}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Amount Charged</span>
              <p className="font-semibold text-destructive text-lg mt-0.5">
                Rs. {disputeData.totalAmount?.toLocaleString("en-IN") ?? "0"}
              </p>
              <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                Paid via {disputeData.gateway ?? "Gateway"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Trip Booking context */}
          <div className="text-xs sm:text-sm space-y-2">
            <span className="text-muted-foreground block text-xs uppercase tracking-wide font-medium">Failed Booking Details</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground/80 text-[11px] block">Route & Trip</span>
                <span className="font-medium">{tripRoute}</span>
              </div>
              <div>
                <span className="text-muted-foreground/80 text-[11px] block">Trip Date</span>
                <span className="font-medium">{tripDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground/80 text-[11px] block">Booked Seats</span>
                <div>
                  <Badge variant="secondary" className="text-xs rounded-md py-0 px-2 mt-0.5">
                    Seats {seats}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground/80 text-[11px] block">Gateway Txn ID</span>
                <span className="font-mono text-xs break-all">{disputeData.transactionId || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="refundStatus" className="text-sm font-semibold">
              Refund Settlement Status
            </Label>
            <Select value={refundStatus} onValueChange={setRefundStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select refund status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETED">
                  COMPLETED (Refund successfully credited to customer)
                </SelectItem>
                <SelectItem value="PENDING">
                  PENDING (Refund initiated / waiting bank cycle)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refund note / audit trail description */}
          <div className="space-y-1.5">
            <Label htmlFor="refundNote" className="text-sm font-semibold flex items-center justify-between">
              <span>Manual Refund Reference Note *</span>
              <span className="text-xs text-muted-foreground font-normal">Visible to customer</span>
            </Label>
            <Textarea
              id="refundNote"
              placeholder="e.g., eSewa merchant refund completed. Reference transaction #TRX-89301. Amount returned to wallet."
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Upload Verification Screenshot */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span>Upload Refund Screenshot *</span>
              <span className="text-xs text-muted-foreground font-medium">Proof of Work Verification</span>
            </Label>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/50 cursor-pointer rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-2 group text-center"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Click to upload refund receipt</p>
                <p className="text-xs text-muted-foreground">Supports PNG, JPG, WebP (Max 5MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-border bg-muted/30 rounded-lg p-3 overflow-hidden flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Refund Proof preview"
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{proofFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(proofFile!.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="notifyUser"
              checked={notifyUser}
              onCheckedChange={(checked) => setNotifyUser(checked as boolean)}
            />
            <label htmlFor="notifyUser" className="text-xs text-muted-foreground cursor-pointer select-none">
              Auto-notify customer via App Notification + SMS refund receipts
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-6 flex items-center gap-1.5"
            >
              {isPending ? (
                <>Resolving Dispute...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Mark Dispute Resolved
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
