import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getOwnerCustomAmenities,
    getAmenityById, 
    createAmenity, 
    updateAmenity, 
    deleteAmenity 
} from "@/api/amenitiesApi";
import { toast } from "sonner";

export const useFetchAmenitiesByOwner = (ownerId: string) => {
    return useQuery({
        queryKey: ["amenities", "owner", ownerId],
        queryFn: () => getOwnerCustomAmenities(ownerId),
        enabled: !!ownerId,
    });
};

export const useFetchAmenityById = (id: string) => {
    return useQuery({
        queryKey: ["amenities", id],
        queryFn: () => getAmenityById(id),
        enabled: !!id,
    });
};

export const useCreateAmenity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["amenities"] });
            toast.success("Amenity configuration created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to create amenity configuration");
        },
    });
};

export const useUpdateAmenity = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => updateAmenity(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["amenities"] });
            toast.success("Amenity configuration updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update amenity configuration");
        },
    });
};

export const useDeleteAmenity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["amenities"] });
            toast.success("Amenity configuration deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete amenity configuration");
        },
    });
};
