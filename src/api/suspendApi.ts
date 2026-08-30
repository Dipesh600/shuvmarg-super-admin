import type { AxiosError } from "axios";
import { api } from "./axios";

export interface SuspendPayload {
  id: string;
  status: "banned" | "active" | "inactive";
  reason?: string;
}
export interface UserBookingRecord {
  _id: string; transactionId?: string; status?: string; bookedAt?: string; createdAt?: string;
  totalAmount?: number; paymentMethod?: string; bookedFrom?: string; bookedTo?: string;
  boardingPoint?: { name?: string }; droppingPoint?: { name?: string };
  tripId?: { fromStopName?: string; toStopName?: string; routeId?: { from?: string; to?: string } };
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
    const { data } = await api.post<{ success: boolean; results: number; data: UserBookingRecord[]; totalBookings?: number; totalBookingAmount?: number }>("/booking/getBookingsByUser", { userId: id });
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    if (err.response?.status === 404) {
      return { success: true, results: 0, data: [] };
    }
    throw new Error("Failed to fetch bookings");
  }
}
