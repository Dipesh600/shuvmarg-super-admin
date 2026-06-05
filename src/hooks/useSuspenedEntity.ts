import { suspendEntity, type SuspendPayload } from "@/api/suspendApi";
import { useMutation } from "@tanstack/react-query";

export function useSuspendEntity() {
  return useMutation({
    mutationFn: (payload: SuspendPayload) => suspendEntity(payload),
  });
}
