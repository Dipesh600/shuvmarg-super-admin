import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adjustWalletBalance, type WalletUser } from "@/api/walletApi";

interface Props {
  open: boolean;
  onClose: () => void;
  user: WalletUser;
  currentBalance: number;
  currency: string;
  onSuccess: () => void;
}

type AdjustType = "credit" | "debit";
type AdjustPurpose = "admin_adjustment" | "bonus" | "promotional" | "reversal";

const WalletAdjustmentDialog = ({
  open,
  onClose,
  user,
  currentBalance,
  currency,
  onSuccess,
}: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<AdjustType>("credit");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState<AdjustPurpose>("admin_adjustment");
  const [remarks, setRemarks] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const projectedBalance =
    type === "credit"
      ? currentBalance + parsedAmount
      : currentBalance - parsedAmount;

  const isValid =
    parsedAmount > 0 &&
    remarks.trim().length >= 10 &&
    (type === "credit" || parsedAmount <= currentBalance);

  const isLargeAdjustment = parsedAmount > 5000;

  const mutation = useMutation({
    mutationFn: adjustWalletBalance,
    onSuccess: (data) => {
      toast({
        title: "Adjustment Applied",
        description: data.message,
      });
      onSuccess();
      handleClose();
    },
    onError: (err: Error) => {
      toast({
        title: "Adjustment Failed",
        description: err.message,
        variant: "destructive",
      });
      // Go back to step 1 so admin can fix the issue
      setStep(1);
    },
  });

  const handleClose = () => {
    setStep(1);
    setType("credit");
    setAmount("");
    setPurpose("admin_adjustment");
    setRemarks("");
    onClose();
  };

  const handleConfirm = () => {
    mutation.mutate({
      userId: user._id,
      type,
      amount: parsedAmount,
      purpose,
      remarks: remarks.trim(),
    });
  };

  const formatCurrency = (val: number) =>
    `Rs. ${val.toLocaleString("en-IN")}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[480px] bg-[#121212]/95 border-white/5 backdrop-blur-xl shadow-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {step === 1 ? "Adjust SM Money" : "Confirm Adjustment"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === 1
              ? "This action creates a permanent audit record tied to your admin account."
              : "Review carefully — this cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: INPUT FORM ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            {/* User context (read-only) */}
            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#D3D925]/10 flex items-center justify-center text-[#D3D925] font-bold shrink-0">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="font-medium text-sm text-white/90">{user.name}</div>
                <div className="text-xs text-white/60">{user.phone}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-white/60">Current Balance</div>
                <div className="font-semibold text-white">{formatCurrency(currentBalance)}</div>
              </div>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">Operation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("credit")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${
                    type === "credit"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Credit
                </button>
                <button
                  type="button"
                  onClick={() => setType("debit")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${
                    type === "debit"
                      ? "border-rose-500 bg-rose-500/10 text-rose-500"
                      : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Debit
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">Amount ({currency})</label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D3D925]"
              />
              {type === "debit" && parsedAmount > currentBalance && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cannot debit more than current balance ({formatCurrency(currentBalance)})
                </p>
              )}
              {isLargeAdjustment && (
                <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 rounded-md">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-600 font-medium">
                    Large adjustment — ensure this is authorized
                  </span>
                </div>
              )}
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">Purpose</label>
              <Select value={purpose} onValueChange={(v) => setPurpose(v as AdjustPurpose)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="admin_adjustment" className="focus:bg-white/10 focus:text-white">Admin Adjustment</SelectItem>
                  <SelectItem value="bonus" className="focus:bg-white/10 focus:text-white">Bonus</SelectItem>
                  <SelectItem value="promotional" className="focus:bg-white/10 focus:text-white">Promotional Credit</SelectItem>
                  <SelectItem value="reversal" className="focus:bg-white/10 focus:text-white">Transaction Reversal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/90">Remarks</label>
                <span
                  className={`text-[10px] ${
                    remarks.trim().length >= 10 ? "text-white/60" : "text-rose-500"
                  }`}
                >
                  {remarks.trim().length}/10 min
                </span>
              </div>
              <textarea
                placeholder="Describe why this adjustment is needed — this becomes a permanent audit record..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D3D925] resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold" disabled={!isValid} onClick={() => setStep(2)}>
                Review & Confirm
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: CONFIRMATION ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            {/* Summary */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-3">
              <div className="text-center">
                <p className="text-sm text-white/60">You are about to</p>
                <p className="text-lg font-bold mt-1">
                  <span className={type === "credit" ? "text-emerald-500" : "text-rose-500"}>
                    {type === "credit" ? "Credit" : "Debit"} {formatCurrency(parsedAmount)}
                  </span>
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {type === "credit" ? "to" : "from"}{" "}
                  <span className="font-medium text-white">{user.name}</span>'s SM Money Balance
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <div className="text-center">
                  <div className="text-xs text-white/60">Before</div>
                  <div className="font-semibold text-white">{formatCurrency(currentBalance)}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/40" />
                <div className="text-center">
                  <div className="text-xs text-white/60">After</div>
                  <div className={`font-semibold ${type === "credit" ? "text-emerald-500" : "text-rose-500"}`}>
                    {formatCurrency(projectedBalance)}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Purpose</span>
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">
                    {purpose.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Remarks</span>
                  <span className="text-right max-w-[240px] truncate text-white/90">{remarks}</span>
                </div>
              </div>
            </div>

            {isLargeAdjustment && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-600 font-medium">
                  This is a large adjustment ({formatCurrency(parsedAmount)}). Make sure this has been approved.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setStep(1)}>
                Go Back
              </Button>
              <Button
                className="flex-1 gap-2 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"
                disabled={mutation.isPending}
                onClick={handleConfirm}
              >
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> Confirm & Apply</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletAdjustmentDialog;
