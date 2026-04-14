import { api } from "./axios";
import type { AxiosError } from "axios";

export interface Settlement {
  _id: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  tripIds: string[];
  totalGross: number;
  platformCommission: number;
  commissionRate: number;
  netPayable: number;
  totalSeats: number;
  status: "pending" | "processing" | "paid" | "disputed";
  raisedAt: string;
  paidAt?: string;
  paymentRef?: string;
  notes?: string;
}

export const getSettlements = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const { data } = await api.get("/settlements/all", { params });
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch settlements");
  }
};

export const paySettlement = async (settlementId: string, paymentRef?: string) => {
  try {
    const { data } = await api.patch("/settlements/pay", {
      settlementId,
      paymentRef,
    });
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to process settlement payment");
  }
};
