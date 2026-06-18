"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp } from "lucide-react";
import { useModal } from "@/hooks/use-model-store";
import { columns } from "@/components/data_tables/owner/columns";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/DataTable";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { getAllBusOwners, getBusOwnerDashboardData } from "@/api/busOwnerApi";
import AgentsSkeleton from "@/components/Skeletion_Loading/AgentsSkeletion";

const busOwners = [
  {
    id: "OWN-001",
    company: "Nepal Express Travels",
    owner: "Deepak Adhikari",
    fleet: 24,
    revenue: "Rs. 8,45,000",
    status: "Verified",
    type: "Large",
  },
  {
    id: "OWN-002",
    company: "Himalayan Tours",
    owner: "Binod Thapa",
    fleet: 8,
    revenue: "Rs. 3,20,000",
    status: "Verified",
    type: "Medium",
  },
  {
    id: "OWN-003",
    company: "Kathmandu Bus Service",
    owner: "Anita Shrestha",
    fleet: 3,
    revenue: "Rs. 1,45,000",
    status: "Pending",
    type: "Small",
  },
  {
    id: "OWN-004",
    company: "Everest Transport",
    owner: "Rajesh Gurung",
    fleet: 18,
    revenue: "Rs. 6,75,000",
    status: "Verified",
    type: "Large",
  },
];

const BusOwners = () => {
  const { onOpen } = useModal();
   const { token } = useAuth();
  // useQuery to fetch users can be added here
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["busOwners"],
    queryFn: getAllBusOwners,
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["busOwnerDashboard"],
    queryFn: getBusOwnerDashboardData,
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const busOwnerDashboard = dashboardData?.data;

  const BusOwnerTableData = data?.data.map((busOwner: any) => {
    return {
      id: busOwner._id,
      busOwnerKycId: busOwner.busOwnerId,
      name: busOwner.name,
      phone: busOwner.phone,
      profileImg: busOwner.profilePicture,
      email: busOwner.email,
      verified:busOwner.isVerified,
      status: busOwner.status,
      // verified: agent.verified,

      // joined: agent.createdAt,

    };
  });
 
  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }
  if (isLoading || isDashboardLoading) {
    return <AgentsSkeleton/>;
  }
  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Bus Owner Management
          </h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Manage bus owners and fleet operations
          </p>
        </div>
        <Button
          onClick={() => onOpen("addBusOwner",{})}
          className="gap-2 bg-white hover:bg-white/90 text-black font-bold rounded-xl h-10 px-6 cursor-pointer w-full sm:w-auto"
        >
          <Building2 className="h-4 w-4" />
          Add Owner
        </Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Owners"
          value={(busOwnerDashboard?.totalBusOwners || 0).toString()}
          icon={Building2}
          subtitle="All onboarded accounts"
          changeType="neutral"
        />
        <StatCard
          title="Verified Owners"
          value={(busOwnerDashboard?.verifiedOwners?.split(" ")[0] || 0).toString()}
          icon={TrendingUp}
          subtitle={busOwnerDashboard?.verifiedOwners || "0% of total"}
          changeType="positive"
        />
        <StatCard
          title="Pending KYC"
          value={(busOwnerDashboard?.pendingKyc || 0).toString()}
          icon={Building2}
          subtitle="Awaiting verification"
          changeType="negative"
        />
        <StatCard
          title="Total Fleets"
          value={(busOwnerDashboard?.totalFleets || 0).toString()}
          icon={TrendingUp}
          subtitle="Managed buses"
          changeType="positive"
        />
      </div>

      {/* BUS OWNER DIRECTORY */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-white">Bus Owner Directory</CardTitle>
            <Badge variant="outline" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
              <TrendingUp className="h-3 w-3" /> Total Fleet: {busOwnerDashboard?.totalFleets || 0} Buses
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <DataTable columns={columns} data={BusOwnerTableData} />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {busOwners.map((owner) => (
              <div
                key={owner.id}
                className="border rounded-lg p-3 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{owner.id}</span>
                  <Badge variant={owner.status as BadgeProps["variant"]}>
                    {owner.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Company: {owner.company}</div>
                  <div>Owner: {owner.owner}</div>
                  <div>Fleet: {owner.fleet}</div>
                  <div>Type: {owner.type}</div>
                  <div>Revenue: {owner.revenue}</div>
                </div>
                <Button variant="ghost" size="sm" className="w-full">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default BusOwners;
