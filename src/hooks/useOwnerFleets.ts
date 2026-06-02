import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getFleetsByOwner, 
    getFleetDetailById, 
    createFleetForOwner, 
    updateFleetByAdmin, 
    deleteFleetByAdmin 
} from "@/api/busOwnerFleetApi";
import { toast } from "sonner";

export const useFetchOwnerFleets = (ownerId: string, brandId?: string) => {
    return useQuery({
        queryKey: ["ownerFleets", "owner", ownerId, brandId],
        queryFn: () => getFleetsByOwner(ownerId, brandId),
        enabled: !!ownerId,
    });
};

export const useFetchFleetDetail = (id: string) => {
    return useQuery({
        queryKey: ["ownerFleets", id],
        queryFn: () => getFleetDetailById(id),
        enabled: !!id,
    });
};

export const useCreateOwnerFleet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createFleetForOwner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
            toast.success("Fleet registered successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to register fleet");
        },
    });
};

export const useUpdateOwnerFleet = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FormData) => updateFleetByAdmin(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
            toast.success("Fleet updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update fleet");
        },
    });
};

export const useDeleteOwnerFleet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteFleetByAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ownerFleets"] });
            toast.success("Fleet deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete fleet");
        },
    });
};
