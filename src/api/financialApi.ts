import { api } from "./axios";
import type { AxiosError } from "axios";

export interface GatewayEntry {
  gateway:     string;
  count:       number;
  total:       number;
  original:    number;
  avgTicket:   number;
  volumeShare: number;
  thisMonth:   number;
}

export interface MonthlyPoint {
  month:      string;
  gbv:        number;
  commission: number;
  refunds:    number;
  bookings:   number;
  discount:   number;
}

export interface SettlementQueueItem {
  _id:           string;
  brandName:     string;
  ownerName:     string;
  netPayable:    number;
  commission:    number;
  commissionRate:number;
  grossAmount:   number;
  ticketsSold:   number;
  status:        "pending" | "processing";
  raisedAt:      string;
  daysAgo:       number;
}

export interface OperatorLeaderboardItem {
  brandId:   string;
  brandName: string;
  gbv:       number;
  count:     number;
  seats:     number;
  discount:  number;
  thisMonth: number;
  share:     number;
  avgTicket: number;
}

export interface FinancialOverview {
  gbv: {
    allTime:          number;
    thisMonth:        number;
    lastMonth:        number;
    momDelta:         number | null;
    totalBookings:    number;
    totalDiscount:    number;
    totalSeats:       number;
    avgTicket:        number;
    thisMonthCount:   number;
    thisMonthSeats:   number;
    thisMonthDiscount:number;
  };
  netRevenue: {
    allTime:      number;
    thisMonth:    number;
    lastMonth:    number;
    momDelta:     number | null;
    paidCount:    number;
    grossSettled: number;
  };
  takeRate: {
    allTime:     number;
    thisMonth:   number;
    isEstimated: boolean;
    avgRate:     number;
  };
  pendingSettlements: {
    amount:     number;
    count:      number;
    pending:    number;
    processing: number;
  };
  refundLiability: {
    amount: number;
    count:  number;
  };
  refundHealth: {
    totalPaid:          number;
    totalPaidCount:     number;
    cancellationIncome: number;
    refundRate:         number;
  };
  transactionSuccessRate: number;
  bookingStatusDist: Record<string, { count: number; value: number }>;
  couponImpact: {
    bookingsWithCoupon: number;
    discountGiven:      number;
    revenueFromCoupon:  number;
    couponUsageRate:    number;
  };
  operatorLeaderboard: OperatorLeaderboardItem[];
  paymentBreakdown:    GatewayEntry[];
  monthlyChart:        MonthlyPoint[];
  settlementQueue:     SettlementQueueItem[];
}

export type ChartPeriod = 3 | 6 | 12;

export const getFinancialOverview = async (months: ChartPeriod = 12): Promise<FinancialOverview> => {
  try {
    const { data } = await api.get("/financial/overview", { params: { months } });
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch financial overview");
  }
};
