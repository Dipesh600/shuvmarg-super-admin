import { api } from "./axios";
import type { AxiosError } from "axios";

export interface FinancialOverview {
  revenue: {
    total: number;
    totalBookings: number;
    totalDiscount: number;
  };
  commission: {
    totalCollected: number;
    paidCount: number;
  };
  pendingSettlements: {
    amount: number;
    count: number;
  };
  transactionSuccessRate: number;
  paymentBreakdown: Array<{
    gateway: string;
    count: number;
    total: number;
  }>;
  monthlyChart: Array<{
    month: string;
    revenue: number;
    bookings: number;
    commission: number;
  }>;
}

export const getFinancialOverview = async (): Promise<FinancialOverview> => {
  try {
    const { data } = await api.get("/financial/overview");
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch financial overview");
  }
};
