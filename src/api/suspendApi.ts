import type { AxiosError } from "axios";
import { api } from "./axios";

export interface SuspendPayload {
//   entityType: "user" | "agent" | "bus owner" | "bus";
  id: string;
  status: "banned" | "active";
//   reason?: string;
//   duration?: string;
}


export async function suspendEntity(payload: SuspendPayload) {
  try {
    const { data } = await api.patch("/updateStatus", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update status");
  }
}
export async function getUserBookings(id:string) {
  try {
    const { data } = await api.post("/getBookingsByUser",{userId:id});
    return data;
  } catch (error) {
    throw new Error("Failed to fetch bookings");
  }
}
