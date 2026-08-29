import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-model-store";

export function EditCommissionRateDialog() {
  const { isOpen, type, data } = useModal();
  const instanceKey = isOpen && type === "editCommisionRate"
    ? `open-${data?.id || data?.type || "commission"}`
    : "closed";

  return <EditCommissionRateDialogInstance key={instanceKey} />;
}

function EditCommissionRateDialogInstance() {
  const { isOpen, onClose, type, data } = useModal();
  const isModelOpen = isOpen && type === "editCommisionRate";

  const [formData, setFormData] = useState(() => ({
    type: data?.type || "",
    rate: data?.rate || 0,
    minBookingValue: "",
    maxBookingValue: "",
    notes: "",
    isActive: true,
  }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Commission Rate Updated",
      description: `${formData.type} rate has been updated to ${formData.rate}%.`,
    });
    onClose();
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Commission Rate</DialogTitle>
          <DialogDescription>
            Modify the commission rate for {data?.type}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Commission Type</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Commission Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minBookingValue">Min Booking Value (Rs.)</Label>
              <Input
                id="minBookingValue"
                type="number"
                placeholder="0"
                value={formData.minBookingValue}
                onChange={(e) =>
                  setFormData({ ...formData, minBookingValue: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBookingValue">Max Booking Value (Rs.)</Label>
              <Input
                id="maxBookingValue"
                type="number"
                placeholder="Unlimited"
                value={formData.maxBookingValue}
                onChange={(e) =>
                  setFormData({ ...formData, maxBookingValue: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this rate..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this commission rate
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
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
