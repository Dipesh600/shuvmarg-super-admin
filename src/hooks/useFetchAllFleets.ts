import { getAllFleets, getFleetDashboardData, getFleetById } from "@/api/fleetApi"
import { useQuery } from "@tanstack/react-query"

export const fetchAllFleets = () => {
    return useQuery({
        queryKey: ["getAllFleets"],
        queryFn: getAllFleets,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });
}

export const fetchFleetById = (id: string) => {
    return useQuery({
        queryKey: ["getFleetById", id],
        queryFn: () => getFleetById(id),
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });
}

export const fetchFleetDashboard = () => {
    return useQuery({
        queryKey: ["getFleetDashboard"],
        queryFn: getFleetDashboardData,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });
}