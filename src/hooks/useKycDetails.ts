import { getOwnerKycDetail } from "@/api/kycApi"
import { useAuth } from "@/providers/AuthProvider"
import { useQuery } from "@tanstack/react-query"

export const useOwerKycDetails = (busOwnerId:string | undefined)=>{
    const {token}= useAuth();
    return useQuery({
        queryKey:["ownerKyc",busOwnerId],
        queryFn:()=>getOwnerKycDetail(busOwnerId ?? ""),
        staleTime:5*60*1000,
        refetchOnMount:false,
        enabled:!! token
    })
}