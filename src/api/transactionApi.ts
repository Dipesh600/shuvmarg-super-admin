import { api } from "./axios";

export interface TransactionFilters {
  page?:            number;
  limit?:           number;
  status?:          string;
  transactionType?: string;
  gateway?:         string;
  search?:          string;
}

export interface TransactionsResponse {
  success?: boolean;
  data?: any[];
  pagination?: { page: number; totalPages: number; total: number; limit?: number };
  stats?: any;
}

export const getAllTransactions = async (filters: TransactionFilters = {}): Promise<TransactionsResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters.page)            params.set("page",            String(filters.page));
    if (filters.limit)           params.set("limit",           String(filters.limit));
    if (filters.status)          params.set("status",          filters.status);
    if (filters.transactionType) params.set("transactionType", filters.transactionType);
    if (filters.gateway)         params.set("gateway",         filters.gateway);
    if (filters.search)          params.set("search",          filters.search);

    const { data } = await api.get(`/transactions?${params.toString()}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTransactionById = async (id: string) => {
  try {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};
