import { getOwnerKycDetail } from "@/api/kycApi"
import { useAuth } from "@/providers/auth-context"
import { useQuery } from "@tanstack/react-query"

export const useOwerKycDetails = (busOwnerId: string | undefined) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["ownerKyc", busOwnerId],
        queryFn: () => getOwnerKycDetail(busOwnerId ?? ""),
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false, // Prevent re-fetch when switching back from document viewer tab
        enabled: !!token && !!busOwnerId,
    });
}
