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
  data?: AdminTransaction[];
  pagination?: { page: number; totalPages: number; total: number; limit?: number };
  stats?: TransactionStats;
}

export interface AdminTransaction {
  _id: string;
  transactionId?: string;
  ticketId?: string;
  userId?: { _id?: string; name?: string; phone?: string; email?: string } | null;
  totalAmount?: number;
  gateway?: string;
  transactionType?: string;
  status: string;
  createdAt?: string;
}

export interface AdminTransactionDetail extends AdminTransaction {
  currency?: string;
  originalAmount?: number;
  paidAt?: string;
  refundStatus?: string;
  refundNote?: string;
  failureReason?: string;
  disputeReason?: string;
  resolvedAt?: string;
  resolvedBy?: { name?: string } | null;
  meta?: Record<string, unknown>;
  bookingId?: {
    _id: string; ticketId?: string; seats?: string[]; status?: string;
    tripId?: {
      tripDate?: string; departureTime?: string; arrivalTime?: string; fromStopName?: string; toStopName?: string;
      routeId?: { from?: string; to?: string; distance?: string; duration?: string } | null;
      busId?: { _id?: string; busName?: string; busNumber?: string; busType?: string } | null;
    } | null;
  } | null;
}

export interface TransactionStats {
  totalCount?: number;
  totalVolume?: number;
  successRate?: string | number;
  successCount?: number;
  failedCount?: number;
  disputedCount?: number;
  refundedCount?: number;
  pendingCount?: number;
}

export const getAllTransactions = async (filters: TransactionFilters = {}): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();
  if (filters.page)            params.set("page",            String(filters.page));
  if (filters.limit)           params.set("limit",           String(filters.limit));
  if (filters.status)          params.set("status",          filters.status);
  if (filters.transactionType) params.set("transactionType", filters.transactionType);
  if (filters.gateway)         params.set("gateway",         filters.gateway);
  if (filters.search)          params.set("search",          filters.search);

  const { data } = await api.get(`/transactions?${params.toString()}`);
  return data;
};

export const getTransactionById = async (id: string) => {
  const { data } = await api.get<{ data: AdminTransactionDetail }>(`/transactions/${id}`);
  return data;
};
