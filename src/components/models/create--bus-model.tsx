import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-model-store";

const AddBusDialog = () => {
  const { isOpen, type, onClose } = useModal();
  const isModelOpen = isOpen && type === "addBus";

  return (
    <Dialog open={isModelOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Bus</DialogTitle>
          <DialogDescription>
            Register a new bus to the fleet. All fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={() => {}}>
          <div className="grid gap-4 py-4 max-h-[60vh] custom-scrollbar overflow-y-auto px-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="busNumber">Bus Number *</Label>
                <Input id="busNumber" placeholder="NP-BA-XXXX" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="busType">Bus Type *</Label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="superDeluxe">Super Deluxe</SelectItem>
                    <SelectItem value="ac">AC Bus</SelectItem>
                    <SelectItem value="sleeper">Sleeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">Bus Operator/Owner *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nepal-express">Nepal Express</SelectItem>
                  <SelectItem value="himalayan">Himalayan Tours</SelectItem>
                  <SelectItem value="everest">Everest Transport</SelectItem>
                  <SelectItem value="kathmandu">Kathmandu Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Seating Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="36"
                  min="10"
                  max="60"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="busStatus">Status</Label>
                <Select defaultValue="pending">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">
                      Pending Verification
                    </SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route">Primary Route</Label>
              <Input id="route" placeholder="e.g., Kathmandu - Pokhara" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
                <Input
                  id="manufacturingYear"
                  type="number"
                  placeholder="2022"
                  min="2000"
                  max="2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chassisNumber">Chassis Number</Label>
                <Input id="chassisNumber" placeholder="Enter chassis number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engineNumber">Engine Number</Label>
                <Input id="engineNumber" placeholder="Enter engine number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpsDevice">GPS Device ID</Label>
                <Input id="gpsDevice" placeholder="GPS tracker ID" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
              <Input id="insuranceExpiry" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <Textarea
                id="amenities"
                placeholder="AC, WiFi, USB charging, Reclining seats..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">Add Bus</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBusDialog;
