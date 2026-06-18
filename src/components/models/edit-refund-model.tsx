import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/hooks/use-model-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRefundStatus } from "@/api/refundApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, FileText } from "lucide-react";

export function ReviewRefundDialog() {
  const { type, data, isOpen, onClose } = useModal();
  const queryClient = useQueryClient();

  const [remarks, setRemarks] = useState("");
  const [gateway, setGateway] = useState("bank_transfer");
  const [gatewayId, setGatewayId] = useState("");

  const isModelOpen = isOpen && type === "editRefundProccess";

  // Reset fields on open
  useEffect(() => {
    if (isModelOpen) {
      setRemarks("");
      setGateway(data.refundGateway || "bank_transfer");
      setGatewayId("");
    }
  }, [isModelOpen, data]);

  const { mutate: mutateStatus, isPending } = useMutation({
    mutationFn: updateRefundStatus,
    onSuccess: () => {
      toast.success("Refund status successfully updated");
      queryClient.invalidateQueries({ queryKey: ["refund-queue"] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update refund");
    },
  });

  if (!isModelOpen || !data) return null;

  const handleAction = (status: "processing" | "completed" | "rejected") => {
    if (status === "rejected" && !remarks.trim()) {
      toast.error("Rejection remarks are required");
      return;
    }
    if (status === "completed" && !gatewayId.trim()) {
      toast.error("Refund reference / transaction ID is required");
      return;
    }

    mutateStatus({
      refundId: data._id,
      status,
      remarks: remarks || undefined,
      refundGateway: status === "completed" ? gateway as any : undefined,
      refundGatewayId: status === "completed" ? gatewayId : undefined,
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    processing: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    completed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh] bg-[#121212]/95 border-white/5 backdrop-blur-xl shadow-2xl text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">Review Refund Request</DialogTitle>
            <Badge variant="outline" className={`${statusColors[data.status]} capitalize px-2.5 py-0.5`}>
              {data.status}
            </Badge>
          </div>
          <DialogDescription className="font-mono text-xs text-white/60">
            Refund Ref: {data._id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Ticket & Customer Information */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-white/5 p-4 rounded-xl border border-white/5 text-sm">
            <div>
              <span className="text-xs text-white/60 block">Ticket ID</span>
              <span className="font-mono font-medium text-white">{data.booking?.ticketId || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-white/60 block">Customer Name</span>
              <span className="font-medium text-white">{data.user?.name || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-white/60 block">Phone Number</span>
              <span className="font-medium text-white">{data.user?.phone || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-white/60 block">Original Payment</span>
              <span className="font-medium capitalize text-white">
                {data.booking?.paymentMethod === "SM_WALLET" 
                  ? "Shuvmarg Money" 
                  : data.booking?.paymentMethod?.replace(/_/g, " ") || "—"}
              </span>
            </div>
            <div className="col-span-2">
              <Separator className="my-1.5 bg-white/10" />
            </div>
            <div>
              <span className="text-xs text-white/60 block">Route</span>
              <span className="font-medium text-white">{data.route || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-white/60 block">Trip Date & Time</span>
              <span className="font-medium text-white">
                {data.tripDate ? format(new Date(data.tripDate), "d MMM yyyy") : "—"}{" "}
                {data.departureTime ? `(${data.departureTime})` : ""}
              </span>
            </div>
          </div>

          {/* Refund Calculation breakdown */}
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Financial Breakdown
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Original Ticket Fare:</span>
                <span className="font-medium text-white">Rs. {data.originalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Cancellation Deduction Fee:</span>
                <span>- Rs. {data.cancellationCharge?.toLocaleString()}</span>
              </div>
              <Separator className="my-1.5 bg-emerald-500/20" />
              <div className="flex justify-between text-emerald-500 font-bold text-base">
                <span>Total Payout Refund:</span>
                <span>Rs. {data.refundAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* User cancellation reason */}
          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
              Cancellation Reason
            </span>
            <p className="italic text-white/80">"{data.reason || "No reason specified"}"</p>
          </div>

          {/* Action Log (when completed or rejected) */}
          {(data.status === "completed" || data.status === "rejected") && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 text-sm">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
                Audit Trail & Processing Log
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/60 block">Processed Date:</span>
                  <span className="font-medium text-white">
                    {data.processedAt ? format(new Date(data.processedAt), "d MMM yyyy, HH:mm") : "—"}
                  </span>
                </div>
                {data.status === "completed" && (
                  <div>
                    <span className="text-white/60 block">Completed Date:</span>
                    <span className="font-medium text-white">
                      {data.completedAt ? format(new Date(data.completedAt), "d MMM yyyy, HH:mm") : "—"}
                    </span>
                  </div>
                )}
                {data.status === "completed" && (
                  <>
                    <div>
                      <span className="text-white/60 block">Payout Gateway:</span>
                      <span className="font-medium capitalize text-white">{data.refundGateway === "yatra_balance" ? "Shuvmarg Money" : data.refundGateway || "—"}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Reference ID:</span>
                      <span className="font-mono font-medium text-white">{data.refundGatewayId || "—"}</span>
                    </div>
                  </>
                )}
              </div>
              {data.remarks && (
                <div className="mt-2 text-xs border-t border-white/10 pt-2">
                  <span className="text-white/60 block font-medium">Remarks:</span>
                  <p className="text-white/80 italic">"{data.remarks?.replace(/Yatra Balance/gi, "Shuvmarg Money")}"</p>
                </div>
              )}
            </div>
          )}

          {/* Form Action Controls (Active States) */}
          {data.status === "pending" && (
            <div className="space-y-3 pt-1 border-t border-white/5">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Step 1: Initial Processing Action
              </h4>
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-xs text-white/80">
                  Process Remarks / internal notes (Mandatory for rejection)
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter remarks or rejection reasons here..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-[#121212] font-bold gap-1.5"
                  disabled={isPending}
                  onClick={() => handleAction("processing")}
                >
                  <RefreshCw className="h-4 w-4 animate-spin-slow" />
                  Mark as Processing
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5"
                  disabled={isPending}
                  onClick={() => handleAction("rejected")}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Request
                </Button>
              </div>
            </div>
          )}

          {data.status === "processing" && (
            <div className="space-y-4 pt-1 border-t border-white/5">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Step 2: Payout Verification & Completion
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1.5">
                  <Label htmlFor="gateway" className="text-xs text-white/80">
                    Payout Destination Gateway
                  </Label>
                  <Select value={gateway} onValueChange={setGateway}>
                    <SelectTrigger id="gateway" className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                      <SelectItem value="esewa" className="focus:bg-white/10 focus:text-white">eSewa Reversal</SelectItem>
                      <SelectItem value="khalti" className="focus:bg-white/10 focus:text-white">Khalti Refund</SelectItem>
                      <SelectItem value="bank_transfer" className="focus:bg-white/10 focus:text-white">Direct Bank Transfer</SelectItem>
                      <SelectItem value="cash" className="focus:bg-white/10 focus:text-white">Cash Settlement</SelectItem>
                      <SelectItem value="yatra_balance" className="focus:bg-white/10 focus:text-white">Shuvmarg Money</SelectItem>
                      <SelectItem value="other" className="focus:bg-white/10 focus:text-white">Other System Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gatewayId" className="text-xs text-white/80">
                    Transaction ID / Reference ID
                  </Label>
                  <Input
                    id="gatewayId"
                    placeholder="Ref or Txn Number"
                    value={gatewayId}
                    onChange={(e) => setGatewayId(e.target.value)}
                    className="font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs text-white/80">
                  Completion Remarks / notes sent to customer
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter payout confirmation details or completion notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-[#121212] font-bold gap-1.5"
                  disabled={isPending}
                  onClick={() => handleAction("completed")}
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Payout & Refund
                </Button>
                <Button
                  variant="destructive"
                  className="gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                  disabled={isPending}
                  onClick={() => handleAction("rejected")}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-white/5 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="w-full sm:w-auto bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
