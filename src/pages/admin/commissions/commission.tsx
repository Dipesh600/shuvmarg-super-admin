import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, TrendingUp, Wallet, Clock, Download, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCommissionSummary, getCommissionHistory } from "@/api/commissionApi";
import { Link } from "react-router-dom";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid:       "default",
  pending:    "outline",
  processing: "secondary",
  disputed:   "destructive",
};

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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Commission Management</h2>
          <p className="text-muted-foreground mt-1">Platform commission earnings and settlement payouts</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">Rs. {(summary?.totalCommission ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground">From {summary?.totalSettlements ?? 0} settlements</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">Rs. {(summary?.pendingPayouts ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground">{summary?.pendingCount ?? 0} bus owners awaiting</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.avgCommissionRate ?? 10}%</div>
                <p className="text-xs text-muted-foreground">Platform average</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <div className="text-2xl font-bold">Rs. {(summary?.paidThisMonth ?? 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground">{summary?.paidCount ?? 0} payouts processed</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>All commission records from settled trips</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center p-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">Failed to load commission history.</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                  <Percent className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No commission records yet. Commission is generated when settlements are raised.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Settlement ID</TableHead>
                      <TableHead>Bus Owner</TableHead>
                      <TableHead className="text-center">Trips</TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                      <TableHead className="text-right">Commission Earned</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((row) => (
                      <TableRow key={String(row.settlementId)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(row.settlementId).slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.busOwner?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{row.busOwner?.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{row.tripCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">Rs. {(row.grossAmount ?? 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{row.commissionRate}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600 font-semibold">
                          Rs. {(row.commissionEarned ?? 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-mono">Rs. {(row.netPayable ?? 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[row.status] ?? "outline"}>{row.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Pending Bus Owner Payouts</CardTitle>
              <CardDescription>Payouts are managed via the dedicated Settlements page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">{summary?.pendingCount ?? 0} settlements awaiting payout</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total pending: Rs. {(summary?.pendingPayouts ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <Button asChild>
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
