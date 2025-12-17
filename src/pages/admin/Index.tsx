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

const Index = () => {
  return (
    <>
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with the Sumarg Platform today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="Rs. 15,45,600"
          change="+18.5% from last month"
          changeType="positive"
          icon={DollarSign}
          subtitle="Target: 89% achieved"
        />
        <StatCard
          title="Active Users"
          value="12,450"
          change="+12.3% growth rate"
          changeType="positive"
          icon={Users}
          subtitle="45 new today"
        />
        <StatCard
          title="Fleet Statistics"
          value="245 Buses"
          change="189 active (77%)"
          changeType="neutral"
          icon={Bus}
          subtitle="23 under maintenance"
        />
        <StatCard
          title="Transaction Volume"
          value="Rs. 45,67,890"
          change="98.7% success rate"
          changeType="positive"
          icon={TrendingUp}
          subtitle="Avg: Rs. 1,450"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <RevenueChart />
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
                <p className="text-sm text-muted-foreground">145 active buses</p>
                <Badge variant="secondary" className="mt-2">Highest revenue</Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold">Province 4 (Gandaki)</p>
                <p className="text-sm text-muted-foreground">67 active buses</p>
                <Badge variant="secondary" className="mt-2">Growing market</Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold">Province 1 (Koshi)</p>
                <p className="text-sm text-muted-foreground">33 active buses</p>
                <Badge variant="secondary" className="mt-2">New expansion</Badge>
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
