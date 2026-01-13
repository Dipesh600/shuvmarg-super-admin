import type { AxiosError } from "axios";
import { api } from "./axios";

export async function deleteEntity( entityId: string) {
  try {
    const { data } = await api.delete(`/deleteAccount`, 
        {
            data:{
                id:entityId
            }
        }
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to delete entity");
  }
}