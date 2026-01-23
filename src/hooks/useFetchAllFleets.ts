import { getAllFleets } from "@/api/fleetApi"
import { useQuery } from "@tanstack/react-query"

export const fetchAllFleets = ()=>{
    return useQuery({
        queryKey:["getAllFleets"],
        queryFn:getAllFleets,
        staleTime:5*60*1000,
        refetchOnMount:false,
        refetchOnWindowFocus:false
    });
}