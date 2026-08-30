import { api } from "./axios";

type DashboardResponse = {
  data: {
    summary: {
      revenue: { totalRevenue: number; revenueChangeText: string; revenueTargetAchievedPercent: number };
      users: { activeUsers: number; activeUsersGrowthRate: number; newActiveUsersToday: number };
      fleet: { activeFleets: number; totalFleets: number };
      transactions: { averageTransactionAmount: number; transactionSuccessRate: number; transactionVolume: number };
    };
    revenueOverview: Array<{ label: string; revenue: number }>;
  };
};

const getDashBoardData = async (): Promise<DashboardResponse> => {
  const data = await api.get<DashboardResponse>("/dashboard");
  return data.data;
};
export { getDashBoardData };
