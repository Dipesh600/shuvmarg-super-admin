import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getBoardingPointsByOwner, 
  deleteBoardingPoint, 
  getBoardingPointById,
  createBoardingPoint,
  updateBoardingPoint
} from "@/api/boardingPointsApi";
import { toast } from "sonner";

export const useFetchBoardingPointsByOwner = (ownerId: string) => {
  return useQuery({
    queryKey: ["boardingPoints", "owner", ownerId],
    queryFn: () => getBoardingPointsByOwner(ownerId),
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFetchBoardingPointById = (id: string) => {
  return useQuery({
    queryKey: ["boardingPoints", id],
    queryFn: () => getBoardingPointById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBoardingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createBoardingPoint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardingPoints"] });
      toast.success("Boarding point created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create boarding point");
    }
  });
};

export const useUpdateBoardingPoint = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => updateBoardingPoint(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardingPoints"] });
      toast.success("Boarding point updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update boarding point");
    }
  });
};

export const useDeleteBoardingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBoardingPoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardingPoints"] });
      toast.success("Boarding point deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete boarding point");
    }
  });
};
