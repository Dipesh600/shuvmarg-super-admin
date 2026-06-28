import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Building2, Users, Bus } from "lucide-react";
import { useGetAllKyc } from "@/hooks/useGetAllKyc";
import { DataTable } from "@/components/DataTable";
import {
  agentColumns,
  busOwnerColumns,
  fleetColumns,
} from "@/components/data_tables/kyc/KycColumns";
import { useMemo } from "react";
import KYCVerificationSkeleton from "@/components/Skeletion_Loading/KycVerificationSkeleton";
import { StatCard } from "@/components/dashboard/StatCard";

export default function KYCVerification() {
  const { data: allKyc, isLoading, isError, error } = useGetAllKyc();

  // const kycData = useMemo(() => allKyc?.data ?? [], [allKyc?.data]);
  const kycData  = allKyc?.data ?? [];

  const ownersKyc = useMemo(() => {
    return kycData
      .filter((k: any) => k.kyctype === "busowner")
      .map((k: any) => ({
        busownerId: k.busownerId,
        ownerId: k.data._id,
        companyname: k.companyname,
        owner: k.owner,
        submitdate: k.submitdate,
        documents: k.documents ?? 0,
        status: k.status,
      }));
  }, [kycData]);

  const agentsKyc = useMemo(() => {
    return kycData
      .filter((k: any) => k.kyctype === "agent")
      .map((k: any) => ({
        id: k.data._id,
        agentId: k.agentId,
        companyname: k.companyname,
        location: k.location || "—",
        owner: k.owner,
        submitdate: k.submitdate,
        documents: k.documents ?? 0,
        status: k.status,
      }));
  }, [kycData]);

  const fleetsKyc = useMemo(() => {
    return kycData
      .filter((k: any) => k.kyctype === "fleet")
      .map((k: any) => ({
        id: k.data._id,
        fleetId: k.fleetId,
        busName: k.data?.busName,
        busNumber: k.data?.busNumber,
        brandName: k.companyname,   // companyname maps to the brand name for fleet KYC
        owner: k.owner,
        submitdate: k.submitdate,
        documents: [
          k.data?.fleetDocuments?.fitnessCert?.url,
          k.data?.fleetDocuments?.insurance?.url,
          k.data?.fleetDocuments?.bluebook?.url,
          k.data?.fleetDocuments?.routePermit?.url,
        ].filter(Boolean).length + (k.data?.fleetImages?.length || 0),
        approvalStatus: k.data?.approvalStatus ?? k.status?.toUpperCase() ?? "PENDING",
      }));
  }, [kycData]);

  if (isLoading) {
    return <KYCVerificationSkeleton />;
  }
  if (isError) {
    return <div>{JSON.stringify(error)}</div>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">KYC Verification</h2>
        <p className="text-white/60 mt-1 font-medium text-sm">
          Manage and verify KYC documents for bus owners, agents, and fleet
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Bus Owner KYC"
          value={allKyc?.dashboard?.totalBusOwners?.toString() || "0"}
          icon={Building2}
          subtitle="Total verifications"
          changeType="neutral"
        />
        <StatCard
          title="Agent KYC"
          value={allKyc?.dashboard?.totalAgents?.toString() || "0"}
          icon={Users}
          subtitle="Total verifications"
          changeType="neutral"
        />
        <StatCard
          title="Fleet KYC"
          value={allKyc?.dashboard?.totalFleets?.toString() || "0"}
          icon={Bus}
          subtitle="Total verifications"
          changeType="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bus-owners" className="space-y-4">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/40 rounded-2xl border border-border/50 mb-6 gap-1 overflow-x-auto justify-start">
          <TabsTrigger value="bus-owners" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            <Building2 className="h-4 w-4" />
            Bus Owners
            {allKyc.dashboard.totalBusOwners > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allKyc.dashboard.totalBusOwners}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            <Users className="h-4 w-4" />
            Agents
            {allKyc.dashboard.totalAgents > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allKyc.dashboard.totalAgents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            <Bus className="h-4 w-4" />
            Fleet
            {allKyc.dashboard.totalFleets > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allKyc.dashboard.totalFleets}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Bus Owners Tab */}
        <TabsContent value="bus-owners">
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">Bus Owner Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isKyc
                searchPlaceholder={"Search by busownerId,name...."}
                columns={busOwnerColumns}
                data={ownersKyc}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">Agent Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isKyc
                searchPlaceholder={"Search by agentId,name...."}
                columns={agentColumns}
                data={agentsKyc}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet">
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">Fleet Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isKyc
                searchPlaceholder={"Search by fleetId,name...."}
                columns={fleetColumns}
                data={fleetsKyc}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
