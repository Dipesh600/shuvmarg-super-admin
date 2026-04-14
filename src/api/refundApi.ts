import type { AxiosError } from "axios";
import { api } from "./axios";
interface RefundPolicy {
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}
export const createPolicy = async (policyData: RefundPolicy) => {
  try {
    const { data } = await api.post(`/refund-policy/create`, policyData);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to create policy");
  }
};
export const updatePolicy = async (policyData: RefundPolicy) => {
  try {
    const { data } = await api.patch(`/refund-policy/update`, policyData);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update policy");
  }
};

export const getAllRefundPolicy = async () => {
  try {
    const { data } = await api.get(`/refund-policy/getAll`);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch policies");
  }
};

// ─── Live refund request endpoints ───────────────────────────────────────────

export const getRefundRequests = async () => {
  try {
    const { data } = await api.get("/refund/getAllCancelledBookings");
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch refund requests");
  }
};

export const updateRefundStatus = async (payload: {
  bookingId: string;
  refundStatus: "approved" | "rejected" | "processing";
  adminNote?: string;
}) => {
  try {
    const { data } = await api.patch("/refund/update-status", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update refund status");
  }
};
