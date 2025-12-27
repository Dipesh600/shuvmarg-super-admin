import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SuspendDialogProps {
  entityType: "user" | "agent" | "bus owner" | "bus";
  entityName: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function SuspendDialog({ entityType, entityName, currentStatus, onStatusChange }: SuspendDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("indefinite");

  const isSuspended = currentStatus === "Suspended" || currentStatus === "Inactive";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = isSuspended ? "reactivated" : "suspended";
    toast({
      title: isSuspended ? `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Reactivated` : `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Suspended`,
      description: `${entityName} has been ${action} successfully.`,
      variant: isSuspended ? "default" : "destructive",
    });
    onStatusChange?.(isSuspended ? "Active" : "Suspended");
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isSuspended ? "default" : "destructive"} className="gap-2">
          {isSuspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {isSuspended ? "Reactivate" : "Suspend"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSuspended ? "Reactivate" : "Suspend"} {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
          <DialogDescription>
            {isSuspended 
              ? `Reactivating will restore ${entityName}'s access to the platform.`
              : `Suspending will prevent ${entityName} from accessing the platform.`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSuspended && (
            <>
              <div className="space-y-2">
                <Label htmlFor="duration">Suspension Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Suspension</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for suspension..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
          {isSuspended && (
            <div className="space-y-2">
              <Label htmlFor="reason">Notes (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Add any notes about reactivation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={isSuspended ? "default" : "destructive"}>
              {isSuspended ? "Reactivate" : "Suspend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
