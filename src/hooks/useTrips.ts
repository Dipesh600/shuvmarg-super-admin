import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    createTripForOwner, 
    getTripsByOwner, 
    getTripById, 
    updateTripByAdmin, 
    deleteTripByAdmin 
} from "@/api/tripApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";

export const useFetchTripsByOwner = (ownerId: string) => {
    return useQuery({
        queryKey: ["trips", "owner", ownerId],
        queryFn: () => getTripsByOwner(ownerId),
        enabled: !!ownerId,
    });
};

export const useFetchTripById = (id: string) => {
    return useQuery({
        queryKey: ["trips", "detail", id],
        queryFn: () => getTripById(id),
        enabled: !!id,
    });
};

export const useCreateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTripForOwner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success("Trip created successfully");
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to create trip"));
        },
    });
};

export const useUpdateTrip = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: Record<string, unknown>) => updateTripByAdmin(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success("Trip updated successfully");
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to update trip"));
        },
    });
};

export const useDeleteTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTripByAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success("Trip deleted successfully");
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to delete trip"));
        },
    });
};
