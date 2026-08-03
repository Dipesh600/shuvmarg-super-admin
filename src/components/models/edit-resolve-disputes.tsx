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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-white/5 bg-[#121212]/95 backdrop-blur-xl shadow-2xl text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 font-semibold mb-1">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs tracking-wider uppercase">High Priority Dispute</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center justify-between text-white">
            Resolve Dispute Center
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Process verification and record manual eSewa/Khalti refunds for Case ID: <span className="font-mono font-medium text-white/90">{disputeData._id}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Dispute Summary Context */}
        <div className="bg-white/5 border border-white/5 rounded-lg p-4 mt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-white/60 block text-xs">Customer/Passenger</span>
              <p className="font-semibold mt-0.5 text-white/90">{userName}</p>
              <p className="text-xs text-white/40 mt-0.5">{userPhone} | {userEmail}</p>
            </div>
            <div>
              <span className="text-white/60 block text-xs">Amount Charged</span>
              <p className="font-semibold text-rose-500 text-lg mt-0.5">
                Rs. {disputeData.totalAmount?.toLocaleString("en-IN") ?? "0"}
              </p>
              <Badge variant="outline" className="text-[10px] mt-0.5 capitalize bg-white/5 border-white/10 text-white/80">
                Paid via {disputeData.gateway ?? "Gateway"}
              </Badge>
            </div>
          </div>

          <Separator className="border-white/5" />

          {/* Trip Booking context */}
          <div className="text-xs sm:text-sm space-y-2">
            <span className="text-white/40 block text-xs uppercase tracking-wide font-medium">Failed Booking Details</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-white/40 text-[11px] block">Route & Trip</span>
                <span className="font-medium text-white/90">{tripRoute}</span>
              </div>
              <div>
                <span className="text-white/40 text-[11px] block">Trip Date</span>
                <span className="font-medium text-white/90">{tripDate}</span>
              </div>
              <div>
                <span className="text-white/40 text-[11px] block">Booked Seats</span>
                <div>
                  <Badge variant="outline" className="text-xs rounded-md py-0 px-2 mt-0.5 bg-white/5 border-white/10 text-white/80">
                    Seats {seats}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-white/40 text-[11px] block">Gateway Txn ID</span>
                <span className="font-mono text-xs break-all text-white/90">{disputeData.transactionId || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2 border-white/5" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="refundStatus" className="text-sm font-semibold text-white/90">
              Refund Settlement Status
            </Label>
            <Select value={refundStatus} onValueChange={setRefundStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                <SelectValue placeholder="Select refund status" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-white/10 text-white">
                <SelectItem value="COMPLETED" className="focus:bg-white/10 focus:text-white">
                  COMPLETED (Refund successfully credited to customer)
                </SelectItem>
                <SelectItem value="PENDING" className="focus:bg-white/10 focus:text-white">
                  PENDING (Refund initiated / waiting bank cycle)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refund note / audit trail description */}
          <div className="space-y-1.5">
            <Label htmlFor="refundNote" className="text-sm font-semibold flex items-center justify-between text-white/90">
              <span>Manual Refund Reference Note *</span>
              <span className="text-xs text-white/40 font-normal">Visible to customer</span>
            </Label>
            <Textarea
              id="refundNote"
              placeholder="e.g., eSewa merchant refund completed. Reference transaction #TRX-89301. Amount returned to wallet."
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              rows={3}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
            />
          </div>

          {/* Upload Verification Screenshot */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center justify-between text-white/90">
              <span>Upload Refund Screenshot *</span>
              <span className="text-xs text-white/40 font-medium">Proof of Work Verification</span>
            </Label>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-[#D3D925]/50 bg-white/5 hover:bg-white/10 cursor-pointer rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-2 group text-center"
              >
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-sm font-medium text-white/90">Click to upload refund receipt</p>
                <p className="text-xs text-white/40">Supports PNG, JPG, WebP (Max 5MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-white/10 bg-white/5 rounded-lg p-3 overflow-hidden flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Refund Proof preview"
                  className="h-16 w-16 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{proofFile?.name}</p>
                  <p className="text-xs text-white/40">
                    {(proofFile!.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 rounded-full shrink-0"
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
              className="border-white/20 data-[state=checked]:bg-[#D3D925] data-[state=checked]:text-[#121212]"
            />
            <label htmlFor="notifyUser" className="text-xs text-white/60 cursor-pointer select-none">
              Auto-notify customer via App Notification + SMS refund receipts
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-6 flex items-center gap-1.5 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"
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
