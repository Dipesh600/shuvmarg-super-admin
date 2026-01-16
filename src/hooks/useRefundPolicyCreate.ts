import { createPolicy, updatePolicy } from "@/api/refundApi";
import { useMutation } from "@tanstack/react-query";
interface RefundPolicy {
  id?:string;
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}
export function useRefundPolicyCreate() {
  return useMutation({
    mutationFn: (policyData: RefundPolicy) => createPolicy(policyData),
  });
}
export function useRefundPolicyUpdate() {
  return useMutation({
    mutationFn: (policyData: RefundPolicy) => updatePolicy(policyData),
  });
}
