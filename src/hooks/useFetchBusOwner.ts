import { getOwnerDetail } from "@/api/kycApi"
import { useAuth } from "@/providers/auth-context"
import { useQuery } from "@tanstack/react-query"

export const useFetchOwnerDetail = (busOwnerId: string | undefined) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["owner", busOwnerId],
        queryFn: () => getOwnerDetail(busOwnerId ?? ""),
        staleTime: 0,          // Always fetch fresh — KYC status must reflect latest decision
        refetchOnMount: true,  // Re-fetch every time the profile page is opened
        refetchOnWindowFocus: false,
        enabled: !!token && !!busOwnerId,
    });
}
