import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-model-store";

const allAmenities = ["AC", "WiFi", "USB Charging", "Reclining Seats", "Blankets", "TV", "Toilet"];

export function EditBusDialog() {
  const { isOpen, type, data } = useModal();
  const bus = data?.bus;
  const instanceKey = isOpen && type === "editBus"
    ? `open-${bus?.id || bus?._id || "bus"}`
    : "closed";

  return <EditBusDialogInstance key={instanceKey} />;
}

function EditBusDialogInstance() {
  const { isOpen, type, onClose, data } = useModal();
  const isModelOpen = isOpen && type === "editBus";
  const bus = data?.bus;

  const [formData, setFormData] = useState(() => ({
    id: bus?.id || "",
    type: bus?.type || "Standard",
    route: bus?.route || "",
    capacity: bus?.capacity || 0,
    manufacturingYear: bus?.manufacturingYear || new Date().getFullYear(),
    chassisNumber: bus?.chassisNumber || "",
    engineNumber: bus?.engineNumber || "",
    gpsDeviceId: bus?.gpsDeviceId || "",
    amenities: (bus?.amenities || []) as string[],
    status: bus?.status || "Active",
  }));
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    } else {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Bus Updated",
      description: "Bus information has been updated successfully.",
    });
    onClose();
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Bus</DialogTitle>
          <DialogDescription>Update bus details and configuration</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 custom-scrollbar max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4 custom-scrollbar">
            <div className="space-y-2">
              <Label htmlFor="busNumber">Bus Number</Label>
              <Input
                id="busNumber"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Bus Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="Super Deluxe">Super Deluxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
              <Input
                id="manufacturingYear"
                type="number"
                value={formData.manufacturingYear}
                onChange={(e) => setFormData({ ...formData, manufacturingYear: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chassisNumber">Chassis Number</Label>
              <Input
                id="chassisNumber"
                value={formData.chassisNumber}
                onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineNumber">Engine Number</Label>
              <Input
                id="engineNumber"
                value={formData.engineNumber}
                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gpsDeviceId">GPS Device ID</Label>
            <Input
              id="gpsDeviceId"
              value={formData.gpsDeviceId}
              onChange={(e) => setFormData({ ...formData, gpsDeviceId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {allAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
