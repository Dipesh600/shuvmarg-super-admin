"use client";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, CheckCircle, Clock, XCircle } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

const agents = [
  {
    id: "SUMA-AGT-001",
    name: "Ram Bahadur Thapa",
    location: "Kathmandu",
    status: "Verified",
    commission: "Rs. 45,600",
    performance: "92%",
    applications: 67,
  },
  {
    id: "SUMA-AGT-002",
    name: "Sita Devi",
    location: "Pokhara",
    status: "Verified",
    commission: "Rs. 38,200",
    performance: "88%",
    applications: 54,
  },
  {
    id: "SUMA-AGT-003",
    name: "Hari Prasad Sharma",
    location: "Biratnagar",
    status: "Pending",
    commission: "Rs. 12,400",
    performance: "75%",
    applications: 23,
  },
  {
    id: "SUMA-AGT-004",
    name: "Maya Gurung",
    location: "Bharatpur",
    status: "Verified",
    commission: "Rs. 52,800",
    performance: "95%",
    applications: 89,
  },
  {
    id: "SUMA-AGT-005",
    name: "Krishna Magar",
    location: "Butwal",
    status: "Rejected",
    commission: "Rs. 0",
    performance: "N/A",
    applications: 0,
  },
];

const Agents = () => {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Agent Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage agents and verify applications
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto">
            <UserCog className="h-4 w-4" /> New Agent
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCog className="h-4 w-4 text-blue-600" /> Total Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,245</div>
              <p className="text-xs  dark:text-blue-500/40 text-blue-500 ">
                Registered agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-700" /> Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">890</div>
              <p className="text-xs dark:text-green-500/40 text-green-500">71% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-orange-400 dark:text-orange-400/40">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" /> Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">110</div>
              <p className="text-xs text-red-500 dark:text-red-500/40">Failed KYC</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Directory */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Directory</CardTitle>
            <CardDescription>View and manage all agents</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left p-2">Agent ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Commission</th>
                    <th className="text-left p-2">Performance</th>
                    <th className="text-left p-2">Applications</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b">
                      <td className="p-2 font-medium">{agent.id}</td>
                      <td className="p-2">{agent.name}</td>
                      <td className="p-2">{agent.location}</td>
                      <td className="p-2">
                        <Badge variant={agent.status as BadgeProps["variant"]}>
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="p-2">{agent.commission}</td>
                      <td className="p-2">{agent.performance}</td>
                      <td className="p-2">{agent.applications}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="border rounded-lg p-3 shadow-sm bg-background space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{agent.id}</span>
                    <Badge variant={agent.status as BadgeProps["variant"]}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Name: {agent.name}</div>
                    <div>Location: {agent.location}</div>
                    <div>Commission: {agent.commission}</div>
                    <div>Performance: {agent.performance}</div>
                    <div>Applications: {agent.applications}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </SidebarProvider>
  );
};

export default Agents;
