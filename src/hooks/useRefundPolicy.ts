import { getAllRefundPolicy } from "@/api/refundApi";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";

export function useRefundPolicies() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["refund-policies"],
     enabled: !!token,
     refetchOnWindowFocus:false,
    queryFn: getAllRefundPolicy,
  });
}
