import type { AxiosError } from "axios";
import { api } from "./axios";
export interface RefundPolicy {
  _id: string;
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number | null;
  color: string;
  isActive?: boolean;
}
export type RefundPolicyPayload = Omit<RefundPolicy, "_id">;
export type RefundQueueItem = {
  _id: string;
  booking?: { ticketId?: string };
  user?: { name?: string; phone?: string };
  route?: string;
  originalAmount?: number;
  refundAmount?: number;
  reason?: string;
  requestedAt?: string;
  status: string;
};
type RefundQueueSummary = Record<string, { count?: number; totalAmount?: number }>;
type RefundQueueResponse = { data: RefundQueueItem[]; summary: RefundQueueSummary };
export const createPolicy = async (policyData: RefundPolicyPayload) => {
  try {
    const { data } = await api.post(`/refund-policy/create`, policyData);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to create policy");
  }
};
export const updatePolicy = async (policyData: RefundPolicyPayload) => {
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
    const { data } = await api.get<{ data: RefundPolicy[] }>(`/refund-policy/getAll`);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch policies");
  }
};

// ─── Live refund request endpoints ───────────────────────────────────────────

export const getRefundQueue = async (status?: string, search?: string) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const { data } = await api.get<RefundQueueResponse>(`/refund/queue${queryString}`);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch refund queue");
  }
};

// Legacy alias
export const getRefundRequests = getRefundQueue;

export const updateRefundStatus = async (payload: {
  refundId: string;
  status: "processing" | "completed" | "rejected";
  remarks?: string;
  refundGateway?: string;
  refundGatewayId?: string;
}) => {
  try {
    const { data } = await api.patch("/refund/update-status", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update refund status");
  }
};
