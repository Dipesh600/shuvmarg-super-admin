import { suspendEntity, type SuspendPayload } from "@/api/suspendApi";
import { useMutation } from "@tanstack/react-query";

export function useSuspendEntity() {
//   const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SuspendPayload) => suspendEntity(payload),

    // onSuccess: (data) => {
    // //   queryClient.invalidateQueries({ queryKey: ["user",data.data._id] });
    // //   queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    // },
  });
}
