import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getAllSeatsTemplate, 
    createTemplateForOwner, 
    getTemplatesByUser, 
    getSeatTemplateById, 
    updateSeatTemplate, 
    deleteSeatTemplateStatus, 
    toggleSeatTemplateStatus 
} from "@/api/seatTemplate";
import { toast } from "sonner";

export const useFetchAllSeatTemplates = () => {
    return useQuery({
        queryKey: ["seatTemplates", "all"],
        queryFn: getAllSeatsTemplate,
    });
};

export const useFetchSeatTemplatesByUser = (userId: string) => {
    return useQuery({
        queryKey: ["seatTemplates", "user", userId],
        queryFn: () => getTemplatesByUser(userId),
        enabled: !!userId,
    });
};

export const useFetchSeatTemplateById = (id: string) => {
    return useQuery({
        queryKey: ["seatTemplates", "detail", id],
        queryFn: () => getSeatTemplateById(id),
        enabled: !!id,
    });
};

export const useCreateSeatTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTemplateForOwner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seatTemplates"] });
            toast.success("Seat template created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to create seat template");
        },
    });
};

export const useUpdateSeatTemplate = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => updateSeatTemplate(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seatTemplates"] });
            toast.success("Seat template updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update seat template");
        },
    });
};

export const useDeleteSeatTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSeatTemplateStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seatTemplates"] });
            toast.success("Seat template deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete seat template");
        },
    });
};

export const useToggleSeatTemplateStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: toggleSeatTemplateStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seatTemplates"] });
            toast.success("Seat template status toggled successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to toggle status");
        },
    });
};
