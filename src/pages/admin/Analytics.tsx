"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TrendingUp, Users, DollarSign, Bus } from "lucide-react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

// ==================== DATA ====================
const userGrowthData = [
  { month: "Jan", users: 8500, newUsers: 450 },
  { month: "Feb", users: 9200, newUsers: 700 },
  { month: "Mar", users: 9800, newUsers: 600 },
  { month: "Apr", users: 10600, newUsers: 800 },
  { month: "May", users: 11400, newUsers: 800 },
  { month: "Jun", users: 12450, newUsers: 1050 },
];

const routePerformanceData = [
  { route: "KTM-PKR", bookings: 1450, revenue: 2175000 },
  { route: "KTM-CHT", bookings: 890, revenue: 1335000 },
  { route: "KTM-BTR", bookings: 720, revenue: 1584000 },
  { route: "PKR-BTW", bookings: 650, revenue: 1105000 },
  { route: "KTM-JNK", bookings: 540, revenue: 891000 },
];

const Analytics = () => {
  return (
    <SidebarProvider>
        {/* ==================== PAGE HEADER ==================== */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Analytics & Business Intelligence
            </h2>
            <p className="text-muted-foreground mt-1">
              Advanced analytics and performance insights
            </p>
          </div>
        </div>

        {/* ==================== ANALYTICS CARDS ==================== */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.3%</div>
              <p className="text-xs text-primary">Month over month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                Revenue Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18.5%</div>
              <p className="text-xs text-teal-500">Exceeding forecast</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bus className="h-4 w-4 text-purple-500" />
                Fleet Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">77%</div>
              <p className="text-xs text-purple-500">Average occupancy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-700" />
                Avg. Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. 1,450</div>
              <p className="text-xs text-indigo-700">+5% vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* ==================== CHARTS AREA ==================== */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* USER GROWTH CHART */}
          <Card>
            <CardHeader>
              <CardTitle>User Acquisition & Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Total Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ROUTE PERFORMANCE BAR CHART */}
          <Card>
            <CardHeader>
              <CardTitle>Top Routes Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="route" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="bookings"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ==================== BOTTOM METRIC CARDS ==================== */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Daily Active Users", "3,245"],
                ["Weekly Active Users", "8,967"],
                ["Monthly Active Users", "12,450"],
                ["Avg. Session Duration", "4.2 mins"],
              ].map(([label, value]) => (
                <div className="flex justify-between" key={label}>
                  <span className="text-sm">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Penetration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Penetration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Province 3 (Bagmati)", "52%"],
                ["Province 4 (Gandaki)", "23%"],
                ["Province 1 (Koshi)", "15%"],
                ["Other Provinces", "10%"],
              ].map(([label, value]) => (
                <div className="flex justify-between" key={label}>
                  <span className="text-sm">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Operational Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operational Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Booking Success Rate", "99.2%", "text-success"],
                ["Payment Success Rate", "98.7%", "text-success"],
                ["Customer Support Response", "2.3 hrs"],
                ["Dispute Resolution", "2.3 days"],
              ].map(([label, value, className]) => (
                <div className="flex justify-between" key={label}>
                  <span className="text-sm">{label}</span>
                  <span className={`font-semibold ${className ?? ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
    </SidebarProvider>
  );
};

export default Analytics;
