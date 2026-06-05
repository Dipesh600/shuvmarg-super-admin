import type { AxiosError } from "axios";
import { api } from "./axios";

export interface SuspendPayload {
  id: string;
  status: "banned" | "active" | "inactive";
  reason?: string;
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

export async function getUserBookings(id: string) {
  try {
    const { data } = await api.post("/booking/getBookingsByUser", { userId: id });
    return data;
  } catch (error) {
    throw new Error("Failed to fetch bookings");
  }
}
