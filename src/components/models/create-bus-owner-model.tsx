import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-model-store";
export const AddBusOwnerDialog = () => {
const {isOpen,type,onClose} = useModal();
 const isModelOpen = isOpen && type === "addBusOwner"
    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  return (
    <Dialog open={isModelOpen} onOpenChange={()=>onClose()}>
        
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Bus Owner</DialogTitle>
          <DialogDescription>
            Register a new bus owner/company. Complete all required fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] custom-scrollbar overflow-y-auto px-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company/Business Name *</Label>
              <Input id="companyName" placeholder="Transport company name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input id="ownerName" placeholder="Full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerType">Business Type</Label>
                <Select defaultValue="private">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private Limited</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole">Sole Proprietorship</SelectItem>
                    <SelectItem value="cooperative">Cooperative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2  gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email Address *</Label>
                <Input id="ownerEmail" type="email" placeholder="owner@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Phone Number *</Label>
                <Input id="ownerPhone" type="tel" placeholder="+977-98XXXXXXXX" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Company Registration Number</Label>
              <Input id="registrationNumber" placeholder="Enter registration number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panVat">PAN/VAT Number</Label>
                <Input id="panVat" placeholder="PAN or VAT number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fleetSize">Initial Fleet Size</Label>
                <Input id="fleetSize" type="number" placeholder="Number of buses" min="1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input id="businessAddress" placeholder="Full address" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account Details</Label>
              <Input id="bankAccount" placeholder="Bank name - Account number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerNotes">Notes</Label>
              <Textarea id="ownerNotes" placeholder="Additional information..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">Add Owner</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
