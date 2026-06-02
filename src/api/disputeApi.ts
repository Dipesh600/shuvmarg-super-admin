import type { AxiosError } from "axios";
import { api } from "./axios";

export interface Dispute {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  tripId?: {
    tripId: string;
    tripDate: string;
    departureTime: string;
    arrivalTime: string;
    fromStopName: string;
    toStopName: string;
    directionLabel: string;
  };
  bookingId?: {
    ticketId: string;
    seats: string[];
    status: string;
  };
  transactionId: string;
  gateway: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  waitingMinutes?: number;
  refundNote?: string;
  refundStatus?: string;
  proofAttachmentUrl?: string;
}

export const getDisputes = async (status?: string): Promise<{ success: boolean; data: Dispute[] }> => {
  try {
    const { data } = await api.get("/disputes", {
      params: status ? { status } : undefined,
    });
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch disputes");
  }
};

export const resolveDispute = async (
  transactionId: string,
  formData: FormData
): Promise<{ success: boolean; data: Dispute }> => {
  try {
    const { data } = await api.patch(`/disputes/${transactionId}/resolve`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to resolve dispute");
  }
};
