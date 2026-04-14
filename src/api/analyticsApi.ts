import { api } from "./axios";
import type { AxiosError } from "axios";

export interface AnalyticsKpis {
  totalUsers: number;
  usersThisMonth: number;
  userGrowthRate: number;
  totalBookings: number;
  bookingSuccessRate: number;
  avgTransactionAmount: number;
  fleetUtilization: number;
  totalRevenue: number;
}

export interface MonthlyChartPoint {
  month: string;
  newUsers?: number;
  total?: number;
  bookings?: number;
  revenue?: number;
}

export interface TopRoute {
  route: string;
  bookings: number;
  revenue: number;
}

export interface AnalyticsOverview {
  kpis: AnalyticsKpis;
  userGrowthChart: MonthlyChartPoint[];
  bookingTrendChart: MonthlyChartPoint[];
  topRoutes: TopRoute[];
}

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  try {
    const { data } = await api.get("/analytics/overview");
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch analytics");
  }
};
