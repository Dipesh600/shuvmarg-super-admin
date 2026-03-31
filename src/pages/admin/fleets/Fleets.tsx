import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Wrench, AlertTriangle } from "lucide-react";
import { columns } from "@/components/data_tables/fleet/columns";
import { DataTable } from "@/components/DataTable";
import { fetchAllFleets, fetchFleetDashboard } from "@/hooks/useFetchAllFleets";
import KYCVerificationSkeleton from "@/components/Skeletion_Loading/KycVerificationSkeleton";

const Fleet = () => {
  const { data, isLoading, error, isError } = fetchAllFleets();
  const { data: dashboardData, isLoading: isDashboardLoading } = fetchFleetDashboard();

  const fleets = data?.data ?? [];
  const fleetDashboard = dashboardData?.data;

  if (isLoading || isDashboardLoading) {
    return <KYCVerificationSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load fleets</h2>
        <p className="text-muted-foreground">{(error as any)?.message || "Something went wrong"}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Fleet Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage bus fleet operations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" /> Total Buses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">
              {fleetDashboard?.totalBuses || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered fleet</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">
              {fleetDashboard?.activeBuses || 0}
            </div>
            <p className="text-xs text-green-500">
              {fleetDashboard?.totalBuses
                ? ((fleetDashboard.activeBuses / fleetDashboard.totalBuses) * 100).toFixed(0)
                : 0}
              % operational
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500" /> Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">
              {fleetDashboard?.maintenanceBuses || 0}
            </div>
            <p className="text-xs text-yellow-500">Under service</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">
              {fleetDashboard?.pendingBuses || 0}
            </div>
            <p className="text-xs text-orange-500">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Directory */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Fleet Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={fleets} pageSize={20} searchPlaceholder="Search by ID, name, or operator..." />
        </CardContent>
      </Card>
    </>
  );
};

export default Fleet;
