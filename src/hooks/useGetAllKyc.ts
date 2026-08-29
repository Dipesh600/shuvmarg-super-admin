import { getAllKyc } from "@/api/kycApi";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";

export const useGetAllKyc = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["getAllKyc"],
    queryFn: getAllKyc,
    refetchOnMount: "always",
    refetchInterval: 60 * 1000,
    enabled: !!token,
    staleTime: 30 * 1000,
  });
};
