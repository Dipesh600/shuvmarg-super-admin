import { deleteEntity } from "@/api/deleteApi";
import { useMutation } from "@tanstack/react-query";

export function useDeleteEntity() {

  return useMutation({
    mutationFn: ({entityId }: {  entityId: string }) =>
      deleteEntity( entityId),
  });
}
