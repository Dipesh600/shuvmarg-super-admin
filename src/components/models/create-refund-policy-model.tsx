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
import { useModal } from "@/hooks/use-model-store";
import { toast } from "sonner";
import { useRefundPolicyCreate } from "@/hooks/useRefundPolicyCreate";

interface NewRefundPolicy {
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}

const defaultPolicy: NewRefundPolicy = {
  policyName: "",
  refundPercentage: 100,
  deductionPercentage: 0,
  description: "",
  minHours: 24,
  maxHours: 0,
  color: "#008000",
};

export const AddRefundPolicyDialog = () => {
  const { isOpen, type, onClose } = useModal();

  const { mutate, isPending } = useRefundPolicyCreate();
  const [formData, setFormData] = useState<NewRefundPolicy>(defaultPolicy);
  const isModelOpen = isOpen && type === "addRefundPolicy";
  const handleSubmit = () => {
    if (!formData.policyName.trim()) {
      toast.error("Policy name is required");
      return;
    }
    if (formData.refundPercentage < 0 || formData.refundPercentage > 100) {
      toast.error("Refund percentage must be between 0 and 100");
      return;
    }
    mutate(formData, {
      onSuccess: () => {
        toast.success(`${formData.policyName} has been created successfully`);
        onClose();
      },
      onError: () => {
        toast.error("Something went wrong!");
      },
    });
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#121212]/95 border-white/5 backdrop-blur-xl shadow-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Refund Policy</DialogTitle>
          <DialogDescription className="text-white/60">
            Define a new refund policy with timing and percentage rules
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="policyName" className="text-white/80">Policy Name *</Label>
            <Input
              id="policyName"
              value={formData.policyName}
              onChange={(e) =>
                setFormData({ ...formData, policyName: e.target.value })
              }
              placeholder="e.g., 24h Before Departure"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-white/80">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Full refund if cancelled 24 hours before departure"
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="refundPercentage" className="text-white/80">Refund Percentage (%) *</Label>
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
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deductionPercentage" className="text-white/80">
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
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minHours" className="text-white/80">Minimum Hours *</Label>
              <Input
                id="minHours"
                type="number"
                min="0"
                value={formData.minHours}
                onChange={(e) =>
                  setFormData({ ...formData, minHours: Number(e.target.value) })
                }
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxHours" className="text-white/80">Maximum Hours (optional)</Label>
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
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color" className="text-white/80">Policy Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-16 h-10 p-1 cursor-pointer bg-transparent border-white/10"
              />
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#008000"
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-white/5 pt-3 mt-4">
          <Button
            className="cursor-pointer bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white"
            disabled={isPending}
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Creating Policy....." : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
