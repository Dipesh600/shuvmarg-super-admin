import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-model-store";



export function ReviewRefundDialog() {
    const {type,data,isOpen,onClose} = useModal();
  const [decision, setDecision] = useState("");
  const [refundAmount, setRefundAmount] = useState(data.amount);
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("original");
const isModelOpen = isOpen && type ==="editRefundProccess";
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      toast({
        title: "Decision Required",
        description: "Please select approve or reject before submitting.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: decision === "approve" ? "Refund Approved" : "Refund Rejected",
      description: `Refund ${data.id} has been ${decision === "approve" ? "approved" : "rejected"}.`,
      variant: decision === "approve" ? "default" : "destructive",
    });
    onClose();
    setDecision("");
    setNotes("");
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      
      <DialogContent className="sm:max-w-[500px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Refund Request</DialogTitle>
          <DialogDescription>Review and process refund {data.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pr-3 max-h-[80vh] custom-scrollbar overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Refund ID:</span>
              <p className="font-medium">{data.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Booking ID:</span>
              <p className="font-medium">{data.booking}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">{data.user}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Request Date:</span>
              <p className="font-medium">{data.date}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p className="font-medium text-lg">{data.amount}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant={data.priority === "High" ? "destructive" : data.priority === "Medium" ? "secondary" : "outline"}>
                {data.priority}
              </Badge>
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Reason for Refund:</span>
            <p className="font-medium">{data.reason}</p>
          </div>
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={decision === "approve" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDecision("approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={decision === "reject" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setDecision("reject")}
                >
                  Reject
                </Button>
              </div>
            </div>
            {decision === "approve" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Amount</Label>
                  <input
                    id="refundAmount"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundMethod">Refund Method</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original Payment Method</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="wallet">E-Wallet</SelectItem>
                      <SelectItem value="credit">Account Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder={decision === "reject" ? "Reason for rejection (required)..." : "Add any notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="submit" variant={decision === "reject" ? "destructive" : "default"}>
                {decision === "approve" ? "Approve Refund" : decision === "reject" ? "Reject Refund" : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
