import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-model-store";
export const AddAgentDialog = () => {
    const {isOpen,type,onClose} = useModal();
    const isModelOpen = isOpen && type === "addAgent"
    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };
  return (
    <Dialog open={isModelOpen} onOpenChange={()=>onClose()}> 
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>
            Register a new agent. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-2 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name *</Label>
                <Input id="agentName" placeholder="Full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input id="agencyName" placeholder="Agency/Company name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentEmail">Email Address *</Label>
                <Input id="agentEmail" type="email" placeholder="agent@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentPhone">Phone Number *</Label>
                <Input id="agentPhone" type="tel" placeholder="+977-98XXXXXXXX" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="City, District" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input id="commissionRate" type="number" placeholder="5.0" min="0" max="100" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentStatus">Status</Label>
                <Select defaultValue="pending">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN/Tax Number</Label>
              <Input id="panNumber" placeholder="Enter PAN number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank Account Details</Label>
              <Input id="bankDetails" placeholder="Bank name - Account number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes about the agent..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">Add Agent</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
