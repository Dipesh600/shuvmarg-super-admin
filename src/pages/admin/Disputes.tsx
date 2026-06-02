import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Search,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  Activity,
  Layers
} from "lucide-react";
import { useModal } from "@/hooks/use-model-store";
import { getDisputes, type Dispute } from "@/api/disputeApi";
import { toast } from "@/hooks/use-toast";

const Disputes = () => {
  const { onOpen } = useModal();
  const [filterStatus, setFilterStatus] = useState<string>("active"); // active, resolved, all
  const [searchQuery, setSearchQuery] = useState("");

  // Query live disputes from the backend
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["disputes", filterStatus],
    queryFn: async () => {
      // Map frontend filters to API query param status
      let statusQuery = "DISPUTED,PAYMENT_RECEIVED";
      if (filterStatus === "resolved") {
        statusQuery = "REFUNDED";
      } else if (filterStatus === "all") {
        statusQuery = "DISPUTED,PAYMENT_RECEIVED,REFUNDED";
      }
      return await getDisputes(statusQuery);
    },
    staleTime: 60 * 1000, // 1 minute stale time
  });

  const rawDisputes: Dispute[] = data?.data ?? [];

  // Filter list locally by search query (checks user name, phone, ticket ID, or mongo ID)
  const filteredDisputes = rawDisputes.filter((dispute) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;

    const userName = dispute.userId?.name?.toLowerCase() || "";
    const userPhone = dispute.userId?.phone?.toLowerCase() || "";
    const transactionId = dispute.transactionId?.toLowerCase() || "";
    const id = dispute._id?.toLowerCase() || "";

    return (
      userName.includes(term) ||
      userPhone.includes(term) ||
      transactionId.includes(term) ||
      id.includes(term)
    );
  });

  // Calculate stats from raw list
  const totalOpenCount = rawDisputes.filter(d => d.status === "DISPUTED").length;
  const totalStaleVerify = rawDisputes.filter(d => d.status === "PAYMENT_RECEIVED").length;
  const highPriorityCount = rawDisputes.filter(
    d => d.status === "DISPUTED" && (d.waitingMinutes ?? 0) > 120
  ).length;

  // Format waiting time beautifully
  const formatWaitingTime = (mins?: number) => {
    if (mins === undefined || mins === null) return "—";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs < 24) return `${hrs}h ${remMins}m ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data Refreshed",
      description: "Successfully re-synced with platform gateway logs.",
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Dispute Resolution Center
          </h2>
          <p className="text-muted-foreground mt-1">
            Verify manual gateway refunds and resolve tickets with complete proof-of-work tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            Sync Logs
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Disputes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpenCount}</div>
            <p className="text-xs text-destructive mt-1">
              Failed booking verifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stale Transactions
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaleVerify}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payment verified, booking pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audit Success
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Exceptional gateway reconciliation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between w-full">
              <span>Urgent Attention</span>
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 shrink-0">High priority</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting over 2 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table for Live Active Disputes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle>Dispute Audit Logs</CardTitle>
              <CardDescription>
                Search and reconcile all active and resolved manual gateway disputes
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-stretch sm:items-center">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search passenger, Txn ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Tab Filters */}
              <div className="flex bg-muted p-1 rounded-md shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                    filterStatus === "active"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active ({totalOpenCount + totalStaleVerify})
                </button>
                <button
                  onClick={() => setFilterStatus("resolved")}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                    filterStatus === "resolved"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                    filterStatus === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Fetching live dispute logs from booking database...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed to pull dispute records</p>
                <p className="text-xs text-muted-foreground mt-1">{(error as Error).message || "Unknown database error."}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                Retry Connection
              </Button>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <ShieldCheck className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">All quiet here!</p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                No outstanding payment disputes found matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute Details</TableHead>
                    <TableHead>User Context</TableHead>
                    <TableHead>Trip Route</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Verification Issue</TableHead>
                    <TableHead>Wait Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute) => {
                    const disputeId = dispute._id;
                    const userName = dispute.userId?.name || "Unknown Passenger";
                    const userPhone = dispute.userId?.phone || "No phone";
                    const seatsCount = dispute.bookingId?.seats?.length || 0;
                    
                    // Priority Assessment:
                    const isUrgent = (dispute.waitingMinutes ?? 0) > 120 && dispute.status !== "REFUNDED";

                    return (
                      <TableRow key={disputeId}>
                        <TableCell>
                          <div className="font-semibold tracking-tight">
                            #{disputeId.substring(0, 8)}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wide">
                            {dispute.gateway || "eSewa"} Txn: {dispute.transactionId?.substring(0, 10)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{userName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{userPhone}</div>
                        </TableCell>
                        <TableCell>
                          {dispute.tripId ? (
                            <>
                              <div className="text-xs font-semibold flex items-center gap-1">
                                {dispute.tripId.fromStopName}
                                <ArrowRight className="h-3 w-3 text-muted-foreground inline-block shrink-0" />
                                {dispute.tripId.toStopName}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                Date: {new Date(dispute.tripId.tripDate).toLocaleDateString("en-IN")} • {seatsCount} seat(s)
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Trip Context Unavailable</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">
                            Rs. {dispute.totalAmount?.toLocaleString("en-IN")}
                          </span>
                        </TableCell>
                        <TableCell>
                          {dispute.status === "REFUNDED" ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                              Resolved & Refunded
                            </Badge>
                          ) : dispute.status === "PAYMENT_RECEIVED" ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border border-blue-500/20 rounded-md">
                              Verification Lag
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                              Booking Mismatch
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {dispute.status === "REFUNDED" ? (
                            <span className="text-xs text-muted-foreground">Resolved</span>
                          ) : (
                            <Badge
                              variant={isUrgent ? "destructive" : "outline"}
                              className="text-[10px] font-medium rounded-md px-1.5 py-0.5"
                            >
                              {formatWaitingTime(dispute.waitingMinutes)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {dispute.status === "REFUNDED" ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 shrink-0" />
                                Refund Checked
                              </span>
                              {dispute.proofAttachmentUrl && (
                                <a
                                  href={dispute.proofAttachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline font-medium"
                                >
                                  View Receipt Proof ➔
                                </a>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => onOpen("editResolveDisputes", dispute)}
                              size="sm"
                              variant="outline"
                              className="font-medium text-xs h-8"
                            >
                              Verify & Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capabilities Roadmap */}
      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary shrink-0" />
            Dispute Engine Capabilities Roadmap
          </h3>
          <p className="text-muted-foreground text-sm">
            Identify other real-world payment discrepancies in transit networks. These live audit tools are coming soon to Shuvmarg.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="double_debit" className="w-full">
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 h-auto">
                <TabsTrigger value="double_debit" className="py-2">
                  Duplicate Debit Audit
                </TabsTrigger>
                <TabsTrigger value="cancel_glitch" className="py-2">
                  Cancellation Wallet Lag
                </TabsTrigger>
                <TabsTrigger value="mass_refund" className="py-2">
                  Trip Operator Breakdown
                </TabsTrigger>
                <TabsTrigger value="stop_mismatch" className="py-2">
                  Stop Registry Disputes
                </TabsTrigger>
              </TabsList>

              {/* Double Charge Tab */}
              <TabsContent value="double_debit" className="space-y-4 pt-4 outline-none">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs">UNDER DEVELOPMENT</Badge>
                      <span className="text-xs text-muted-foreground">Scheduled for Q3 release</span>
                    </div>
                    <h4 className="text-lg font-bold">Duplicate Gateway Charge Audit Flow</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Triggered automatically when the eSewa/Khalti network logs multiple successful transaction debits for the exact same seat booking window. 
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
                      <p className="font-semibold flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-primary" /> Resolution Workflow logic:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Automated double-charge ledger verification through public API callbacks.</li>
                        <li>One-click administrative release to authorize a secondary transaction rollback.</li>
                        <li>Sends digital SMS/Push verification code with instant balance refund status updates.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="w-full md:w-72 bg-muted/30 border border-border p-5 rounded-lg shrink-0 flex flex-col justify-center items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Double Charge Mismatch</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending automatic bank verification log clearance.</p>
                    </div>
                    <Button disabled variant="outline" size="sm" className="w-full text-xs">
                      Reconciliation Soon Live
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Cancellation Wallet Lag Tab */}
              <TabsContent value="cancel_glitch" className="space-y-4 pt-4 outline-none">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs">SPECIFICATION PHASE</Badge>
                      <span className="text-xs text-muted-foreground">Scheduled for Q3 release</span>
                    </div>
                    <h4 className="text-lg font-bold">Cancellation Auto-Credit Fallback</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Occurs when passenger cancels their seat booking under active refund policy conditions, but network API timeouts block the automatic payment refund loop.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
                      <p className="font-semibold flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5 text-primary" /> Resolution Workflow logic:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Escalates to "Wallet Credit Failed" category immediately when gateway API returns status 503.</li>
                        <li>Auditor is prompted with verified bank reference fields and deductions policies calculations.</li>
                        <li>Re-initiates payment callback or triggers administrative e-wallet refund validation.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="w-full md:w-72 bg-muted/30 border border-border p-5 rounded-lg shrink-0 flex flex-col justify-center items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center text-orange-400">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Timeout Wallet Release</p>
                      <p className="text-xs text-muted-foreground mt-1">Verify automated policy percentage deduction.</p>
                    </div>
                    <Button disabled variant="outline" size="sm" className="w-full text-xs">
                      Credit Fallback Soon Live
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Mass Refund Tab */}
              <TabsContent value="mass_refund" className="space-y-4 pt-4 outline-none">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs">COMING SOON</Badge>
                      <span className="text-xs text-muted-foreground">Scheduled for Q4 release</span>
                    </div>
                    <h4 className="text-lg font-bold">Trip Cancellation & Fleet Breakdown Mass Processing</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Triggered when an operator cancels a trip due to force majeure (landslides, vehicle breakdowns, road blockages). Requires mass refund dispatching.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-primary" /> Resolution Workflow logic:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Aggregates all active bookings for the specified trip automatically.</li>
                        <li>Allows bulk, one-click refund dispatching, resolving up to 40 transactions simultaneously.</li>
                        <li>Schedules high-priority push alerts to passengers suggesting free rebookings on next fleet.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="w-full md:w-72 bg-muted/30 border border-border p-5 rounded-lg shrink-0 flex flex-col justify-center items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center text-destructive">
                      <RefreshCw className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Bulk Passenger refund</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending bulk payout approval keys verification.</p>
                    </div>
                    <Button disabled variant="outline" size="sm" className="w-full text-xs">
                      Mass Refund Soon Live
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Stop Mismatch Tab */}
              <TabsContent value="stop_mismatch" className="space-y-4 pt-4 outline-none">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs">SPECIFICATION PHASE</Badge>
                      <span className="text-xs text-muted-foreground">Scheduled for Q4 release</span>
                    </div>
                    <h4 className="text-lg font-bold">Stop Registry Mismatch Handling</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Triggered when a booking is recorded against a registry stop code that has been modified or suspended by the network administrator.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
                      <p className="font-semibold flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5 text-primary" /> Resolution Workflow logic:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Auditor re-allocates passenger stops registry logs directly from dashboard.</li>
                        <li>Saves passenger historical stop coordinates and re-maps destination stops atomically.</li>
                        <li>Updates digital manifest documents for on-board driver inspections.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="w-full md:w-72 bg-muted/30 border border-border p-5 rounded-lg shrink-0 flex flex-col justify-center items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center text-sky-500">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Stop Re-routing Audit</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending manual route re-assignment.</p>
                    </div>
                    <Button disabled variant="outline" size="sm" className="w-full text-xs">
                      Stop Disputes Soon Live
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Disputes;
