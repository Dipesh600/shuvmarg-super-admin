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
    throw new Error(err.response?.data?.message || "Failed to delete entity");
  }
};
export const updatePolicy = async (policyData: RefundPolicy) => {
  try {
    const { data } = await api.patch(`/refund-policy/update`, policyData);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to delete entity");
  }
};

export const getAllRefundPolicy = async () => {
  try {
    const { data } = await api.get(`/refund-policy/getAll`);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to delete entity");
  }
};
