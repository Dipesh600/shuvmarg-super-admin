import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, CheckCircle2, Wrench, Clock, AlertTriangle } from "lucide-react";
import { columns } from "@/components/data_tables/fleet/columns";
import { DataTable } from "@/components/DataTable";
import { fetchAllFleets, fetchFleetDashboard } from "@/hooks/useFetchAllFleets";
import KYCVerificationSkeleton from "@/components/Skeletion_Loading/KycVerificationSkeleton";

const Fleet = () => {
  const { data, isLoading, error, isError } = fetchAllFleets();
  const { data: dashboardData, isLoading: isDashboardLoading } = fetchFleetDashboard();

  const fleets = data?.data ?? [];
  const d = dashboardData?.data;

  if (isLoading || isDashboardLoading) {
    return <KYCVerificationSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load fleet data</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">Live Dispatch Board</h2>
          <p className="text-muted-foreground mt-1">
            Showing only buses with an active schedule.{" "}
            <span className="text-primary font-semibold">
              Buses in setup are managed under each Brand.
            </span>
          </p>
        </div>
      </div>

      {/* Stats Cards — operationally meaningful */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live on Network
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">{d?.liveOnNetwork ?? 0}</div>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {d?.totalRegistered
                ? ((d.liveOnNetwork / d.totalRegistered) * 100).toFixed(0)
                : 0}
              % of total fleet
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bus className="h-4 w-4 text-sky-500" /> In Garage / Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">{d?.inGarage ?? 0}</div>
            <p className="text-xs text-sky-600 font-semibold mt-0.5">Approved, awaiting go-live</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500" /> Under Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">{d?.underMaintenance ?? 0}</div>
            <p className="text-xs text-yellow-600 font-semibold mt-0.5">Flagged for service</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" /> Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-2xl font-bold">{d?.pendingApproval ?? 0}</div>
            <p className="text-xs text-orange-600 font-semibold mt-0.5">Awaiting KYC sign-off</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Dispatch Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Dispatch Board</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {fleets.length} bus{fleets.length !== 1 ? "es" : ""} currently active on the network
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {fleets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bus className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold mb-1">No buses are currently live</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Complete the Fleet Setup Wizard under a Brand to bring a bus onto the dispatch board.
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={fleets} pageSize={20} searchPlaceholder="Search by number, name, or operator..." />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Fleet;
