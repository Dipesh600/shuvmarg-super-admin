import { useEffect, useState } from "react";
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
import { useModal } from "@/hooks/use-model-store";
import { toast } from "sonner";
import { useRefundPolicyUpdate } from "@/hooks/useRefundPolicyCreate";

interface RefundPolicy {
  id: string;
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}

export const EditRefundPolicyDialog = () => {
  const { isOpen, onClose, type, data } = useModal();
  const [formData, setFormData] = useState<RefundPolicy>(data);
  const { mutate, isPending } = useRefundPolicyUpdate();
  const isModelOpen = isOpen && type === "editRefundPolicy";
  const handleSubmit = () => {
    if (!formData?.policyName.trim()) {
      toast.error("Policy name is required");
      return;
    }
    mutate(
      { ...formData, id: data.id },
      {
        onSuccess: () => {
          toast.success(
            `${formData?.policyName} has been updated successfully`
          );
          onClose();
        },
        onError: () => {
          toast.error(`Something went wrong!`);
        },
      }
    );
  };
  useEffect(() => {
    setFormData(data);
  }, [data]);
  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Refund Policy</DialogTitle>
          <DialogDescription>
            Update the refund policy details and percentages
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="policyName">Policy Name</Label>
            <Input
              id="policyName"
              value={formData.policyName}
              onChange={(e) =>
                setFormData({ ...formData, policyName: e.target.value })
              }
              placeholder="e.g., 24h Before Departure"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe when this policy applies"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="refundPercentage">Refund Percentage (%)</Label>
              <Input
                id="refundPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.refundPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    refundPercentage: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deductionPercentage">
                Deduction Percentage (%)
              </Label>
              <Input
                id="deductionPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.deductionPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deductionPercentage: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minHours">Minimum Hours</Label>
              <Input
                id="minHours"
                type="number"
                min="0"
                value={formData.minHours}
                onChange={(e) =>
                  setFormData({ ...formData, minHours: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxHours">Maximum Hours (optional)</Label>
              <Input
                id="maxHours"
                type="number"
                min="0"
                value={formData.maxHours ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxHours: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="Leave empty for no limit"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Policy Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#008000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
