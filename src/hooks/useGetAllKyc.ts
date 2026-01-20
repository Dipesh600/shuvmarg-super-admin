import { getAllKyc } from "@/api/kycApi";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";

export const useGetAllKyc = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["getAllKyc"],
    queryFn: getAllKyc,
    refetchOnMount: false,
    enabled: !!token,
    staleTime:5 * 60 * 1000
  });
};
