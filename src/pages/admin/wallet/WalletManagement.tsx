import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScratchThemeManager from "@/components/scratch-themes/ScratchThemeManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  DollarSign,
  Snowflake,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getWalletOverview,
  lookupUserWallet,
  freezeWallet as freezeWalletApi,
  type WalletOverview,
  type WalletLookupResponse,
  type WalletTransaction,
} from "@/api/walletApi";
import WalletAdjustmentDialog from "@/components/models/wallet-adjustment-model";
import GlobalTransactionFeed from "@/components/wallet/GlobalTransactionFeed";

const WalletManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [freezeRemarksOpen, setFreezeRemarksOpen] = useState(false);
  const [freezeRemarks, setFreezeRemarks] = useState("");

  // ── Platform Overview ────────────────────────────────────────────────────
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery<WalletOverview>({
    queryKey: ["walletOverview"],
    queryFn: getWalletOverview,
    staleTime: 2 * 60 * 1000,
  });

  // ── User Lookup ──────────────────────────────────────────────────────────
  const {
    data: lookupData,
    isLoading: lookupLoading,
    isError: lookupError,
    error: lookupErrorObj,
  } = useQuery<WalletLookupResponse>({
    queryKey: ["walletLookup", submittedQuery, ledgerPage],
    queryFn: () => lookupUserWallet(submittedQuery, ledgerPage, 15),
    enabled: submittedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // ── Freeze/Unfreeze Mutation ──────────────────────────────────────────────
  const freezeMutation = useMutation({
    mutationFn: freezeWalletApi,
    onSuccess: (data) => {
      toast({ title: "Wallet Updated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["walletLookup"] });
      queryClient.invalidateQueries({ queryKey: ["walletOverview"] });
      setFreezeRemarksOpen(false);
      setFreezeRemarks("");
    },
    onError: (err: Error) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setLedgerPage(1);
      setSubmittedQuery(searchQuery.trim());
    }
  };

  const handleRefresh = () => {
    refetchOverview();
    toast({ title: "Data Synced", description: "Platform wallet metrics refreshed." });
  };

  const handleFreezeToggle = () => {
    if (!lookupData?.user || !lookupData?.wallet) return;
    if (freezeRemarks.trim().length < 10) {
      toast({
        title: "Remarks Required",
        description: "Please provide at least 10 characters explaining this action.",
        variant: "destructive",
      });
      return;
    }
    freezeMutation.mutate({
      userId: lookupData.user._id,
      action: lookupData.wallet.status === "active" ? "freeze" : "unfreeze",
      remarks: freezeRemarks.trim(),
    });
  };

  const formatCurrency = (val: number) =>
    `Rs. ${val?.toLocaleString("en-IN") ?? "0"}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const purposeLabel = (p: string) => {
    const map: Record<string, string> = {
      refund: "Refund",
      ticket_purchase: "Ticket Purchase",
      bonus: "Bonus",
      cashback: "Cashback",
      promotional: "Promotional",
      admin_adjustment: "Admin Adjustment",
      reversal: "Reversal",
    };
    return map[p] || p;
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Shuvmarg Money Control
          </h2>
          <p className="text-muted-foreground mt-1">
            Platform-wide wallet observatory, user balance management, and audit controls
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          Sync Metrics
        </Button>
      </div>

      <Tabs defaultValue="wallet" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            Wallet & Ledger
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Scratch Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: PLATFORM OBSERVATORY KPI CARDS
          ══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Liability</CardTitle>
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "—" : formatCurrency(overview?.totalOutstandingBalance ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total SM Money liability across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Users className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "—" : (overview?.totalActiveWallets ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg balance: {overviewLoading ? "—" : formatCurrency(overview?.averageBalance ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frozen Wallets</CardTitle>
            <Snowflake className="h-4 w-4 text-sky-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "—" : overview?.totalFrozenWallets ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires admin attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciliation</CardTitle>
            {overview?.reconciliation?.healthy ? (
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading
                ? "—"
                : overview?.reconciliation?.healthy
                  ? "✓ Healthy"
                  : `⚠ Drift: ${formatCurrency(overview?.reconciliation?.drift ?? 0)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cached vs computed balance check
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: USER WALLET LOOKUP
          ══════════════════════════════════════════════════════════════ */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle>User Wallet Lookup</CardTitle>
              <CardDescription>
                Search by phone number, name, or user ID to view balance and transaction history
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Phone, name, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" size="sm" disabled={searchQuery.trim().length < 2}>
                Search
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading */}
          {lookupLoading && (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Searching user records...</p>
            </div>
          )}

          {/* Error */}
          {lookupError && (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-medium">
                {(lookupErrorObj as Error)?.message || "User not found"}
              </p>
            </div>
          )}

          {/* Global Feed (shown when no user is searched) */}
          {!submittedQuery && !lookupLoading && (
            <GlobalTransactionFeed
              onUserClick={(query) => {
                setSearchQuery(query);
                setSubmittedQuery(query);
                setLedgerPage(1);
              }}
            />
          )}

          {/* User Found — Profile + Wallet + Actions */}
          {lookupData && !lookupLoading && (
            <div className="space-y-6">
              {/* User card + wallet card + actions */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* User Profile */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {lookupData.user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold truncate">{lookupData.user.name}</div>
                        <div className="text-sm text-muted-foreground">{lookupData.user.phone}</div>
                        <div className="text-xs text-muted-foreground truncate">{lookupData.user.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant={lookupData.user.status === "active" ? "default" : "destructive"}>
                        {lookupData.user.status}
                      </Badge>
                      <Badge variant="outline">{lookupData.user.role}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Balance */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          SM Money Balance
                        </p>
                        <div className="text-3xl font-bold mt-1">
                          {formatCurrency(lookupData.wallet.balance)}
                        </div>
                      </div>
                      <Wallet className="h-8 w-8 text-primary/30" />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        variant={lookupData.wallet.status === "active" ? "default" : "destructive"}
                        className={
                          lookupData.wallet.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-sky-500/10 text-sky-500 border-sky-500/20"
                        }
                      >
                        {lookupData.wallet.status === "active" ? "Active" : "Frozen"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lookupData.wallet.currency}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Actions */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6 flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Admin Actions
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setAdjustDialogOpen(true)}
                    >
                      <DollarSign className="h-4 w-4" />
                      Adjust Balance
                    </Button>

                    {/* Freeze/Unfreeze */}
                    {!freezeRemarksOpen ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`w-full gap-2 ${
                          lookupData.wallet.status === "active"
                            ? "text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                            : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={() => setFreezeRemarksOpen(true)}
                      >
                        {lookupData.wallet.status === "active" ? (
                          <><Snowflake className="h-4 w-4" /> Freeze Wallet</>
                        ) : (
                          <><Shield className="h-4 w-4" /> Unfreeze Wallet</>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Explain why (min 10 chars)..."
                          value={freezeRemarks}
                          onChange={(e) => setFreezeRemarks(e.target.value)}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setFreezeRemarksOpen(false);
                              setFreezeRemarks("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={freezeRemarks.trim().length < 10 || freezeMutation.isPending}
                            onClick={handleFreezeToggle}
                          >
                            {freezeMutation.isPending ? "..." : "Confirm"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  SECTION 3: TRANSACTION LEDGER
                  ══════════════════════════════════════════════════════ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Transaction Ledger
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {lookupData.pagination.totalCount} total records
                  </span>
                </div>

                {lookupData.activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center gap-2 bg-muted/20 rounded-lg border border-border/50">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No activities found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lookupData.activities.map((txn: WalletTransaction) => (
                            <TableRow key={txn._id}>
                              <TableCell>
                                <div className="text-xs whitespace-nowrap">
                                  {formatDate(txn.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {txn.direction === "CREDIT" || txn.type === "credit" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"
                                  >
                                    <TrendingUp className="h-3 w-3" />
                                    Credit
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"
                                  >
                                    <TrendingDown className="h-3 w-3" />
                                    Debit
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-medium">
                                  {purposeLabel(txn.purpose || txn.type)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`font-semibold ${
                                    (txn.direction === "CREDIT" || txn.type === "credit") ? "text-emerald-500" : "text-red-500"
                                  }`}
                                >
                                  {(txn.direction === "CREDIT" || txn.type === "credit") ? "+" : "−"}
                                  {formatCurrency(txn.amount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {txn.referenceType
                                    ? `${txn.referenceType}: ${txn.referenceId?.toString()?.substring(0, 8) ?? "—"}...`
                                    : "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={txn.note || txn.remarks || ""}>
                                  {txn.note || txn.remarks || "—"}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {lookupData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          Page {lookupData.pagination.page} of {lookupData.pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={ledgerPage <= 1}
                            onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!lookupData.pagination.hasMore}
                            onClick={() => setLedgerPage((p) => p + 1)}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: RECENT ADMIN ADJUSTMENTS (PLATFORM-WIDE)
          ══════════════════════════════════════════════════════════════ */}
      {overview?.recentAdjustments && overview.recentAdjustments.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-primary" />
              Recent Admin Adjustments
            </CardTitle>
            <CardDescription>
              Last 10 manual balance adjustments across all users — audit trail
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentAdjustments.map((adj) => {
                    const userName =
                      typeof adj.userId === "object" ? adj.userId.name : "Unknown";
                    const userPhone =
                      typeof adj.userId === "object" ? adj.userId.phone : "";
                    return (
                      <TableRow key={adj._id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(adj.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{userName}</div>
                          <div className="text-xs text-muted-foreground">{userPhone}</div>
                        </TableCell>
                        <TableCell>
                          {adj.direction === "CREDIT" || adj.type === "ADMIN_CREDIT" || adj.type === "credit" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Credit
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                              Debit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(adj.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground max-w-[250px] truncate" title={adj.note || adj.remarks || ""}>
                            {adj.note || adj.remarks || "—"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Dialog */}
      {lookupData && (
        <WalletAdjustmentDialog
          open={adjustDialogOpen}
          onClose={() => setAdjustDialogOpen(false)}
          user={lookupData.user}
          currentBalance={lookupData.wallet.balance}
          currency={lookupData.wallet.currency}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["walletLookup"] });
            queryClient.invalidateQueries({ queryKey: ["walletOverview"] });
          }}
        />
      )}
        </TabsContent>

        <TabsContent value="themes" className="pt-2">
          <ScratchThemeManager />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default WalletManagement;
