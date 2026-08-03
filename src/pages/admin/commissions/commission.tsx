import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, TrendingUp, Wallet, Clock, Download, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCommissionSummary, getCommissionHistory } from "@/api/commissionApi";
import type { CommissionHistoryItem } from "@/api/commissionApi";
import { Link } from "react-router-dom";

const Commissions = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["commissionSummary"],
    queryFn: getCommissionSummary,
    staleTime: 3 * 60 * 1000,
  });

  const { data: historyData, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ["commissionHistory"],
    queryFn: () => getCommissionHistory({ page: 1, limit: 50 }),
    staleTime: 3 * 60 * 1000,
  });

  const history = historyData?.history ?? [];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Commission Management</h2>
          <p className="text-white/60 mt-1">Platform commission earnings and settlement payouts</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
          <Download className="h-4 w-4 text-[#D3D925]" /> Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Total Commission Earned</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Percent className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-white/50" /> : (
              <>
                <div className="text-2xl font-bold text-white">Rs. {(summary?.totalCommission ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-white/80 mt-1">From {summary?.totalSettlements ?? 0} settlements</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Pending Payouts</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Clock className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-white/50" /> : (
              <>
                <div className="text-2xl font-bold text-white">Rs. {(summary?.pendingPayouts ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-white/80 mt-1">{summary?.pendingCount ?? 0} bus owners awaiting</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Avg Commission Rate</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <TrendingUp className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-white/50" /> : (
              <>
                <div className="text-2xl font-bold text-white">{summary?.avgCommissionRate ?? 10}%</div>
                <p className="text-xs text-white/80 mt-1">Platform average</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Paid This Month</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Wallet className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-white/50" /> : (
              <>
                <div className="text-2xl font-bold text-white">Rs. {(summary?.paidThisMonth ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-white/80 mt-1">{summary?.paidCount ?? 0} payouts processed</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Commission History</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Commission History</CardTitle>
              <CardDescription className="text-white/50">All commission records from settled trips</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center p-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-white/50" />
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                  <AlertCircle className="h-8 w-8 text-white" />
                  <p className="text-sm text-white/60">Failed to load commission history.</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                  <Percent className="h-8 w-8 text-white/30" />
                  <p className="text-sm text-white/60">No commission records yet. Commission is generated when settlements are raised.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-white/5 border-b border-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="text-white/80 font-semibold">Settlement ID</TableHead>
                      <TableHead className="text-white/80 font-semibold">Bus Owner</TableHead>
                      <TableHead className="text-center text-white/80 font-semibold">Trips</TableHead>
                      <TableHead className="text-right text-white/80 font-semibold">Gross Revenue</TableHead>
                      <TableHead className="text-center text-white/80 font-semibold">Rate</TableHead>
                      <TableHead className="text-right text-white/80 font-semibold">Commission Earned</TableHead>
                      <TableHead className="text-right text-white/80 font-semibold">Net Payable</TableHead>
                      <TableHead className="text-white/80 font-semibold">Status</TableHead>
                      <TableHead className="text-white/80 font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((row: CommissionHistoryItem) => (
                      <TableRow key={String(row.settlementId)} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-xs text-white/40">
                          {String(row.settlementId).slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">{row.busOwner?.name ?? "—"}</div>
                          <div className="text-xs text-white/50">{row.busOwner?.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-white/10 text-white bg-white/5">{row.tripCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-white">Rs. {(row.grossAmount ?? 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-white/10 text-[#D3D925] bg-[#D3D925]/10">{row.commissionRate}%</Badge>
                        </TableCell>
                        <TableCell className="text-right text-white font-semibold">
                          Rs. {(row.commissionEarned ?? 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-white">Rs. {(row.netPayable ?? 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.status === "paid" ? "border-white/10 text-white bg-white/5" :
                              row.status === "pending" ? "border-white/10 text-white bg-white/5" :
                              row.status === "processing" ? "border-white/10 text-white bg-white/5" :
                              "border-white/10 text-white bg-white/5"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-white/60">
                          {new Date(row.raisedAt).toLocaleDateString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Pending Bus Owner Payouts</CardTitle>
              <CardDescription className="text-white/50">Payouts are managed via the dedicated Settlements page</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <Wallet className="h-12 w-12 text-white/30" />
                <div>
                  <p className="font-medium text-white">{summary?.pendingCount ?? 0} settlements awaiting payout</p>
                  <p className="text-sm text-white/60 mt-1">
                    Total pending: Rs. {(summary?.pendingPayouts ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <Button asChild className="bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold border-0">
                  <Link to="/admin/settlements" className="gap-2 flex items-center">
                    Go to Settlements <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Commissions;
