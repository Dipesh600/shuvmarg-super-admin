import type { AxiosError } from "axios";
import { api } from "./axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletOverview {
  totalActiveWallets: number;
  totalFrozenWallets: number;
  totalOutstandingBalance: number;
  totalCreditsIssued: number;
  totalDebitsProcessed: number;
  totalCreditCount: number;
  totalDebitCount: number;
  averageBalance: number;
  reconciliation: {
    storedBalance: number;
    computedBalance: number;
    drift: number;
    healthy: boolean;
  };
  recentAdjustments: WalletTransaction[];
}

export interface WalletTransaction {
  _id: string;
  walletId?: string;
  userId:
    | string
    | { _id: string; name: string; phone: string };
  amount: number;
  type: string;
  direction?: "CREDIT" | "DEBIT"; // from sm_ledger
  purpose?: string;
  balanceBefore?: number; // legacy
  balanceAfter?: number; // legacy
  referenceType?: string | null;
  referenceId?: string | null;
  status: string;
  remarks?: string | null; // legacy
  note?: string | null; // from sm_ledger
  createdAt: string;
}

export interface WalletUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  profilePicture: string;
  role: string;
  joinedAt: string;
}

export interface WalletDetails {
  _id: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLookupResponse {
  user: WalletUser;
  wallet: WalletDetails;
  activities: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AdjustPayload {
  userId: string;
  type: "credit" | "debit";
  amount: number;
  purpose: "admin_adjustment" | "bonus" | "promotional" | "reversal";
  remarks: string;
}

export interface FreezePayload {
  userId: string;
  action: "freeze" | "unfreeze";
  remarks: string;
}

export interface UserBalance {
  balance: number;
  currency: string;
  walletStatus: string;
  exists: boolean;
}

// ─── Global Feed Types ──────────────────────────────────────────────────────

export type GlobalFeedFilter = "all" | "cashback" | "referral" | "spent" | "admin" | "refunds";

export interface GlobalFeedStats {
  totalCreditsToday: number;
  totalDebitsToday: number;
  totalCreditAmountToday: number;
  totalDebitAmountToday: number;
}

export interface GlobalFeedResponse {
  entries: WalletTransaction[];
  stats: GlobalFeedStats;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const getWalletOverview = async (): Promise<WalletOverview> => {
  try {
    const { data } = await api.get("/wallet/overview");
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch wallet overview");
  }
};

export const lookupUserWallet = async (
  query: string,
  page = 1,
  limit = 20
): Promise<WalletLookupResponse> => {
  try {
    const { data } = await api.get(`/wallet/lookup`, {
      params: { query, page, limit },
    });
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to lookup user wallet");
  }
};

export const adjustWalletBalance = async (payload: AdjustPayload) => {
  try {
    const { data } = await api.post("/wallet/adjust", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to adjust wallet balance");
  }
};

export const freezeWallet = async (payload: FreezePayload) => {
  try {
    const { data } = await api.patch("/wallet/freeze", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update wallet status");
  }
};

export const getUserBalance = async (userId: string): Promise<UserBalance> => {
  try {
    const { data } = await api.get(`/wallet/user-balance/${userId}`);
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch user balance");
  }
};

export const getGlobalFeed = async (
  page = 1,
  limit = 25,
  type: GlobalFeedFilter = "all"
): Promise<GlobalFeedResponse> => {
  try {
    const { data } = await api.get("/wallet/global-feed", {
      params: { page, limit, type },
    });
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch global transaction feed");
  }
};
