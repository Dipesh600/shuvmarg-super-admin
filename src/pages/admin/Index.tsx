import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

import {
  DollarSign,
  Users,
  Bus,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getDashBoardData } from "@/api/dashboardApi";
import DashboardSkeleton from "@/components/Skeletion_Loading/DashboardSkeletion";

const Index = () => {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: getDashBoardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  if (isLoading) {
    return <DashboardSkeleton/>;
  }
  if (isError) {
    return <div>Error loading dashboard data: {(error as Error).message}</div>;
  }
  const summaryData = data?.data?.summary;
  const revenueData = (data?.data?.revenueOverview ?? []).map((item) => ({
    month: item.label,
    revenue: item.revenue,
    netRevenue: Math.round(item.revenue * 0.85), // Estimated net revenue
  }));

  // Guard: don't render KPI cards until data is fully loaded
  if (!summaryData) return <DashboardSkeleton />;

  return (
    <>
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Dashboard Overview
        </h2>
        <p className="text-white/60 mt-1 font-medium text-sm">
          Welcome back! Here's what's happening with the Sumarg Platform today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${summaryData.revenue.totalRevenue.toLocaleString()}`}
          change={`${summaryData.revenue.revenueChangeText}`}
          changeType="positive"
          icon={DollarSign}
          subtitle={`Target: ${summaryData.revenue.revenueTargetAchievedPercent}% achieved`}
        />
        <StatCard
          title="Active Users"
          value={summaryData.users.activeUsers.toString()}
          change={`+${summaryData.users.activeUsersGrowthRate}% growth rate`}
          changeType="positive"
          icon={Users}
          subtitle={`${summaryData.users.newActiveUsersToday} new today`}
        />
        <StatCard
          title="Fleet Statistics"
          value={`${summaryData.fleet.totalFleets} Fleets`}
          change={`${summaryData.fleet.activeFleets} active (${(
            (summaryData.fleet.activeFleets / summaryData.fleet.totalFleets) *
            100
          ).toFixed(0)}%)`}
          changeType="positive"
          icon={Bus}
          subtitle={`${
            summaryData.fleet.totalFleets - summaryData.fleet.activeFleets
          } inactive/maintenance`}
        />
        <StatCard
          title="Transaction Volume"
          value={`Rs. ${summaryData.transactions.transactionVolume.toLocaleString()}`}
          change={`${summaryData.transactions.transactionSuccessRate.toFixed(
            2
          )}% success rate`}
          changeType="positive"
          icon={TrendingUp}
          subtitle={`Avg: Rs. ${summaryData.transactions.averageTransactionAmount.toFixed(
            2
          )} per transaction`}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <RevenueChart  revenueData={revenueData}/>
        <ActivityFeed />
      </div>

      {/* Geographic Overview */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">Geographic Overview</CardTitle>
          <CardDescription className="text-white/50">Regional performance across Nepal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
              <MapPin className="h-5 w-5 text-[#D3D925] mt-1" />
              <div>
                <p className="font-bold text-white text-sm">Province 3 (Bagmati)</p>
                <p className="text-xs text-white/50 font-medium">
                  145 active buses
                </p>
                <Badge className="mt-2 bg-white/10 text-white/80 hover:bg-white/20 border-white/5">
                  Highest revenue
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
              <MapPin className="h-5 w-5 text-[#D3D925] mt-1" />
              <div>
                <p className="font-bold text-white text-sm">Province 4 (Gandaki)</p>
                <p className="text-xs text-white/50 font-medium">67 active buses</p>
                <Badge className="mt-2 bg-white/10 text-white/80 hover:bg-white/20 border-white/5">
                  Growing market
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
              <MapPin className="h-5 w-5 text-[#D3D925] mt-1" />
              <div>
                <p className="font-bold text-white text-sm">Province 1 (Koshi)</p>
                <p className="text-xs text-white/50 font-medium">33 active buses</p>
                <Badge className="mt-2 bg-white/10 text-white/80 hover:bg-white/20 border-white/5">
                  New expansion
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5 text-[#D3D925]" />
              Verification Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">Pending Agent Verifications</span>
                <Badge className="bg-white/10 text-white hover:bg-white/20">245</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">Pending Bus Owner Verifications</span>
                <Badge className="bg-white/10 text-white hover:bg-white/20">45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">Pending Fleet Verifications</span>
                <Badge className="bg-white/10 text-white hover:bg-white/20">33</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-white" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">Open Disputes</span>
                <Badge className="bg-white/5 text-white border border-white/10 hover:bg-white/5">45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">Pending Refunds</span>
                <Badge className="bg-white/5 text-white/80 border border-white/10">23</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/60">System Alerts</span>
                <Badge className="bg-white/5 text-white/80 border border-white/10">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Index;

/* ---------------------------------- */
/* 🔹 Reusable Compact Stat Row       */
/* ---------------------------------- */
// function QuickStatItem({
//   label,
//   value,
//   badgeVariant = "default",
// }: {
//   label: string;
//   value: number;
//   badgeVariant?: "default" | "outline" | "secondary" | "destructive";
// }) {
//   return (
//     <div className="flex justify-between items-center">
//       <span className="text-sm font-semibold text-white/60">{label}</span>
//       <Badge variant={badgeVariant}>{value}</Badge>
//     </div>
//   );
// }
