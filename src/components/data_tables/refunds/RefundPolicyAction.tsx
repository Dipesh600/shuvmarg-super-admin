import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-model-store";
import { Pencil } from "lucide-react";

export interface RefundPolicyActionData {
  id: string;
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}

export const RefundPolicyAction = ({ policy }: { policy: RefundPolicyActionData }) => {
  const { onOpen } = useModal();
  const editData = {
    id: policy.id,
    policyName: policy.policyName,
    refundPercentage: policy.refundPercentage,
    deductionPercentage: policy.deductionPercentage,
    description: policy.description,
    minHours: policy.minHours,
    maxHours: policy.maxHours,
    color: policy.color,
  };

  return (
    <Button
      onClick={() => onOpen("editRefundPolicy", editData)}
      className="cursor-pointer"
      variant="ghost"
      size="sm"
    >
      <Pencil className="h-3 w-3" />
      <span>Edit</span>
    </Button>
  );
};
