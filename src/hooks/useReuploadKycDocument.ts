import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reuploadKycDocument } from "@/api/busOwnerApi";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";

export const useReuploadKycDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => reuploadKycDocument(formData),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Document re-uploaded successfully!");
      
      // Invalidate list views
      queryClient.invalidateQueries({ queryKey: ["getAllKyc"] });
      queryClient.invalidateQueries({ queryKey: ["busOwners"] });
      
      // Get IDs from formData to invalidate specific cache entries
      const id = variables.get("id");
      const userId = variables.get("userId");
      
      if (userId) {
        // Invalidate the profile page details (keyed by userId)
        queryClient.invalidateQueries({ queryKey: ["owner", userId.toString()] });
      }
      
      if (id) {
        // Invalidate specific KYC details (keyed by kycId)
        queryClient.invalidateQueries({ queryKey: ["ownerKyc", id.toString()] });
      }

      // If we don't have IDs, invalidate root keys as fallback
      if (!userId && !id) {
        queryClient.invalidateQueries({ queryKey: ["owner"] });
        queryClient.invalidateQueries({ queryKey: ["ownerKyc"] });
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to re-upload document."));
    },
  });
};
