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
  const summaryData = data?.data.summary;
  const revenueData = data?.data.revenueOverview.map((item: any) => ({
    month: item.label,
    revenue: item.revenue,
  }));
  return (
    <>
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground mt-1">
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
          changeType="neutral"
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
      <Card>
        <CardHeader>
          <CardTitle>Geographic Overview</CardTitle>
          <CardDescription>Regional performance across Nepal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold">Province 3 (Bagmati)</p>
                <p className="text-sm text-muted-foreground">
                  145 active buses
                </p>
                <Badge variant="secondary" className="mt-2">
                  Highest revenue
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold">Province 4 (Gandaki)</p>
                <p className="text-sm text-muted-foreground">67 active buses</p>
                <Badge variant="secondary" className="mt-2">
                  Growing market
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold">Province 1 (Koshi)</p>
                <p className="text-sm text-muted-foreground">33 active buses</p>
                <Badge variant="secondary" className="mt-2">
                  New expansion
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Verification Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Agent Verifications</span>
                <Badge>245</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Bus Owner Verifications</span>
                <Badge>45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Fleet Verifications</span>
                <Badge>33</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Open Disputes</span>
                <Badge variant="destructive">45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Refunds</span>
                <Badge variant="outline">23</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">System Alerts</span>
                <Badge variant="outline">2</Badge>
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
//       <span className="text-sm">{label}</span>
//       <Badge variant={badgeVariant}>{value}</Badge>
//     </div>
//   );
// }
