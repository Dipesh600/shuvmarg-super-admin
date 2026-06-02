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
        location: k.location ?? "Biratnagar",
        owner: k.owner,
        submitdate: k.submitdate,
        documents: 0,
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
        <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
        <p className="text-muted-foreground">
          Manage and verify KYC documents for bus owners, agents, and fleet
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bus Owner KYC</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allKyc?.dashboard?.totalBusOwners}
            </div>
            <p className="text-xs text-muted-foreground">Total verifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agent KYC</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allKyc?.dashboard?.totalAgents}
            </div>
            <p className="text-xs text-muted-foreground">Total verifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fleet KYC</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allKyc?.dashboard?.totalFleets}
            </div>
            <p className="text-xs text-muted-foreground">Total verifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bus-owners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bus-owners" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bus Owners
            {allKyc.dashboard.totalBusOwners > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allKyc.dashboard.totalBusOwners}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Users className="h-4 w-4" />
            Agents
            {allKyc.dashboard.totalAgents > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allKyc.dashboard.totalAgents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
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
          <Card>
            <CardHeader>
              <CardTitle>Bus Owner Verifications</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Agent Verifications</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Fleet Verifications</CardTitle>
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
