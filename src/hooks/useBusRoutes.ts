import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getBusRoutesByOwner, 
    getBusRouteById, 
    createBusRoute, 
    updateBusRoute, 
    deleteBusRoute 
} from "@/api/busRouteApi";
import { toast } from "sonner";

export const useFetchBusRoutesByOwner = (ownerId: string) => {
    return useQuery({
        queryKey: ["busRoutes", "owner", ownerId],
        queryFn: () => getBusRoutesByOwner(ownerId),
        enabled: !!ownerId,
    });
};

export const useFetchBusRouteById = (id: string) => {
    return useQuery({
        queryKey: ["busRoutes", id],
        queryFn: () => getBusRouteById(id),
        enabled: !!id,
    });
};

export const useCreateBusRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBusRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
            toast.success("Bus route created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to create bus route");
        },
    });
};

export const useUpdateBusRoute = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => updateBusRoute(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
            toast.success("Bus route updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update bus route");
        },
    });
};

export const useDeleteBusRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBusRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
            toast.success("Bus route deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete bus route");
        },
    });
};
