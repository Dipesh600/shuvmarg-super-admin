import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Loader2 } from "lucide-react";

const QUICK_REASONS = [
  "License document not valid or unreadable",
  "Medical certificate missing or expired",
  "License type does not match vehicle class",
  "Background verification failed",
  "Insufficient experience for heavy vehicle operation",
  "Submitted information could not be verified",
];

interface RejectDriverModalProps {
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

const RejectDriverModal: React.FC<RejectDriverModalProps> = ({
  driverName, isOpen, onClose, onConfirm, isPending,
}) => {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-2 border-red-200 shadow-2xl">

        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 border border-red-200">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-black tracking-tight text-red-700">
                Reject Driver
              </DialogTitle>
              <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mt-0.5">
                {driverName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Quick reasons */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Quick Reasons
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    reason === r
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-muted text-muted-foreground border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Rejection Reason *
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this driver's application is being rejected..."
              className="rounded-xl min-h-[90px] text-xs resize-none"
            />
            <p className="text-[9px] text-muted-foreground">
              This reason will be recorded and visible to the operator for transparency.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl font-black text-xs uppercase"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 h-10 rounded-xl font-black text-xs uppercase"
            disabled={!reason.trim() || isPending}
            onClick={() => onConfirm(reason.trim())}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectDriverModal;
