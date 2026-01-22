import { getOwnerDetail } from "@/api/kycApi"
import { useAuth } from "@/providers/AuthProvider"
import { useQuery } from "@tanstack/react-query"

export const useFetchOwnerDetail = (busOwnerId:string | undefined)=>{
    const {token}= useAuth();
    return useQuery({
        queryKey:["owner",busOwnerId],
        queryFn:()=>getOwnerDetail(busOwnerId ?? ""),
        staleTime:5*60*1000,
        refetchOnMount:false,
        enabled:!! token
    })
}