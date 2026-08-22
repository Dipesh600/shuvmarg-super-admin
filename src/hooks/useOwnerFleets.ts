import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getFleetsByOwner, 
    getFleetDetailById, 
    createFleetForOwner, 
    updateFleetByAdmin, 
    deleteFleetByAdmin 
} from "@/api/busOwnerFleetApi";
import { toast } from "sonner";

const requestErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object" || !("response" in error)) return fallback;
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    return typeof response?.data?.message === "string" ? response.data.message : fallback;
};

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
            toast.info("Fleet draft created. Finishing documents and seat layout…");
        },
        onError: (error: unknown) => {
            toast.error(requestErrorMessage(error, "Failed to register fleet"));
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
        onError: (error: unknown) => {
            toast.error(requestErrorMessage(error, "Failed to update fleet"));
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
        onError: (error: unknown) => {
            toast.error(requestErrorMessage(error, "Failed to delete fleet"));
        },
    });
};
