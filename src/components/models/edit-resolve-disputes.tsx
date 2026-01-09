import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-model-store";



export function ResolveDisputeDialog() {
  const {onClose,data,type,isOpen} = useModal();
  const [resolution, setResolution] = useState("");
  const [resolutionType, setResolutionType] = useState("");
  const [compensation, setCompensation] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
    const isModelOpen = isOpen && type === "editResolveDisputes"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution || !resolutionType) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Dispute Resolved",
      description: `Dispute ${data.id} has been marked as resolved.`,
    });
    onClose()
    setResolution("");
    setResolutionType("");
    setNotes("");
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
     
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
          <DialogDescription>Review and resolve dispute {data.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">data ID:</span>
              <p className="font-medium">{data.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">{data.user}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium">{data.type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">{data.created}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant={data.priority === "High" ? "destructive" : data.priority === "Medium" ? "secondary" : "outline"}>
                {data.priority}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned To:</span>
              <p className="font-medium">{data.assignedTo}</p>
            </div>
          </div>
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolutionType">Resolution Type *</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_refund">Full Refund</SelectItem>
                  <SelectItem value="partial_refund">Partial Refund</SelectItem>
                  <SelectItem value="credit">Account Credit</SelectItem>
                  <SelectItem value="rebooking">Free Rebooking</SelectItem>
                  <SelectItem value="apology">Apology (No Compensation)</SelectItem>
                  <SelectItem value="no_action">No Action Required</SelectItem>
                  <SelectItem value="escalated">Escalated to Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(resolutionType === "full_refund" || resolutionType === "partial_refund" || resolutionType === "credit") && (
              <div className="space-y-2">
                <Label htmlFor="compensation">Compensation Amount (Rs.)</Label>
                <input
                  id="compensation"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter amount"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Summary *</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how the dispute was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any internal notes (not visible to customer)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyUser"
                checked={notifyUser}
                onCheckedChange={(checked) => setNotifyUser(checked as boolean)}
              />
              <label htmlFor="notifyUser" className="text-sm cursor-pointer">
                Send resolution notification to customer
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="submit">Mark as Resolved</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
