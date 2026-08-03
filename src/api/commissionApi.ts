import { api } from "./axios";
import type { AxiosError } from "axios";

export interface CommissionSummary {
  totalCommission: number;
  pendingPayouts: number;
  pendingCount: number;
  avgCommissionRate: number;
  totalSettlements: number;
  paidThisMonth: number;
  paidCount: number;
}

export interface CommissionHistoryItem {
  settlementId: string;
  busOwner: { id: string; name: string; email: string };
  tripCount: number;
  grossAmount: number;
  commissionRate: number;
  commissionEarned: number;
  netPayable: number;
  ticketsSold: number;
  status: string;
  raisedAt: string;
  paidAt?: string;
}

export const getCommissionSummary = async (): Promise<CommissionSummary> => {
  try {
    const { data } = await api.get("/commissions/summary");
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch commission summary");
  }
};

export const getCommissionHistory = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ history: CommissionHistoryItem[]; total: number }> => {
  try {
    const { data } = await api.get("/commissions/history", { params });
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch commission history");
  }
};
