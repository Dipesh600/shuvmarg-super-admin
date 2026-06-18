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
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Shuvmarg Money Control
          </h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Platform-wide wallet observatory, user balance management, and audit controls
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          Sync Metrics
        </Button>
      </div>

      <Tabs defaultValue="wallet" className="mt-6">
        <TabsList className="mb-4 bg-[#121212]/30 border border-white/5">
          <TabsTrigger value="wallet" className="gap-2 data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] text-white/60">
            <Wallet className="h-4 w-4" />
            Wallet & Ledger
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2 data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] text-white/60">
            <DollarSign className="h-4 w-4" />
            Scratch Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: PLATFORM OBSERVATORY KPI CARDS
          ══════════════════════════════════════════════════════════════ */}
          <div className="grid gap-4 md:grid-cols-4 mt-6">
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-semibold text-white/80">Outstanding Liability</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <DollarSign className="h-4 w-4 text-[#D3D925] shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-4">
                <div className="text-2xl font-bold text-white">
                  {overviewLoading ? "—" : formatCurrency(overview?.totalOutstandingBalance ?? 0)}
                </div>
                <p className="text-xs text-white/40 mt-1 font-medium">
                  Total SM Money liability across all users
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-semibold text-white/80">Active Wallets</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <Users className="h-4 w-4 text-[#D3D925] shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-4">
                <div className="text-2xl font-bold text-white">
                  {overviewLoading ? "—" : (overview?.totalActiveWallets ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-white/40 mt-1 font-medium">
                  Avg balance: {overviewLoading ? "—" : formatCurrency(overview?.averageBalance ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-semibold text-white/80">Frozen Wallets</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <Snowflake className="h-4 w-4 text-white shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-4">
                <div className="text-2xl font-bold text-white">
                  {overviewLoading ? "—" : overview?.totalFrozenWallets ?? 0}
                </div>
                <p className="text-xs text-white/40 mt-1 font-medium">
                  Requires admin attention
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-semibold text-white/80">Reconciliation</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  {overview?.reconciliation?.healthy ? (
                    <CheckCircle className="h-4 w-4 text-white shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-white shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-4">
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  {!overview?.reconciliation?.healthy && <AlertTriangle className="h-5 w-5 text-white" />}
                  {overviewLoading
                    ? "—"
                    : overview?.reconciliation?.healthy
                      ? "✓ Healthy"
                      : `Drift: ${formatCurrency(overview?.reconciliation?.drift ?? 0)}`}
                </div>
                <p className="text-xs text-white/40 mt-1 font-medium">
                  Cached vs computed balance check
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: USER WALLET LOOKUP
          ══════════════════════════════════════════════════════════════ */}
          <Card className="mt-6 bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 bg-white/5 pb-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-lg font-bold text-white">User Wallet Lookup</CardTitle>
                  <CardDescription className="text-white/60">
                    Search by phone number, name, or user ID to view balance and transaction history
                  </CardDescription>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Phone, name, or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D3D925]"
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={searchQuery.trim().length < 2} className="bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90">
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
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#D3D925]/10 flex items-center justify-center text-[#D3D925] font-bold text-lg shrink-0">
                            {lookupData.user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-white truncate">{lookupData.user.name}</div>
                            <div className="text-sm text-white/60">{lookupData.user.phone}</div>
                            <div className="text-xs text-white/40 truncate">{lookupData.user.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline" className={lookupData.user.status === "active" ? "bg-white/5 text-white border-white/10" : "bg-white/5 text-white border-white/10"}>
                            {lookupData.user.status}
                          </Badge>
                          <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80">{lookupData.user.role}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Wallet Balance */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                              SM Money Balance
                            </p>
                            <div className="text-3xl font-bold mt-1 text-white">
                              {formatCurrency(lookupData.wallet.balance)}
                            </div>
                          </div>
                          <Wallet className="h-8 w-8 text-[#D3D925]/30" />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className={
                              lookupData.wallet.status === "active"
                                ? "bg-white/5 text-white border-white/10"
                                : "bg-white/5 text-white border-white/10"
                            }
                          >
                            {lookupData.wallet.status === "active" ? "Active" : "Frozen"}
                          </Badge>
                          <span className="text-xs text-white/60">
                            {lookupData.wallet.currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Admin Actions */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                      <CardContent className="pt-6 flex flex-col gap-3">
                        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                          Admin Actions
                        </p>
                        <Button
                          size="sm"
                          className="w-full gap-2 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90"
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
                            className={`w-full gap-2 bg-[#121212]/30 border-white/5 hover:bg-white/10 ${lookupData.wallet.status === "active"
                              ? "text-white hover:text-white"
                              : "text-white hover:text-white"
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
                              className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D3D925] resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => {
                                  setFreezeRemarksOpen(false);
                                  setFreezeRemarks("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-white/5 text-white hover:bg-white/5"
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
                    <div className="flex items-center justify-between mb-3 mt-4">
                      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2 text-white">
                        <Activity className="h-5 w-5 text-[#D3D925]" />
                        Transaction Ledger
                      </h3>
                      <span className="text-xs text-white/60">
                        {lookupData.pagination.totalCount} total records
                      </span>
                    </div>

                    {lookupData.activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 text-center gap-2 bg-white/5 rounded-lg border border-white/5">
                        <Activity className="h-8 w-8 text-white/40" />
                        <p className="text-sm text-white/60">No activities found</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#121212]/30">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-white/60">Date</TableHead>
                                <TableHead className="text-white/60">Type</TableHead>
                                <TableHead className="text-white/60">Purpose</TableHead>
                                <TableHead className="text-right text-white/60">Amount</TableHead>
                                <TableHead className="text-white/60">Reference</TableHead>
                                <TableHead className="text-white/60">Remarks</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lookupData.activities.map((txn: WalletTransaction) => (
                                <TableRow key={txn._id} className="border-white/5 hover:bg-white/5">
                                  <TableCell>
                                    <div className="text-xs whitespace-nowrap text-white/80">
                                      {formatDate(txn.createdAt)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {txn.direction === "CREDIT" || txn.type === "credit" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-white/5 text-white border-white/10 gap-1"
                                      >
                                        <TrendingUp className="h-3 w-3" />
                                        Credit
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-white/5 text-white border-white/10 gap-1"
                                      >
                                        <TrendingDown className="h-3 w-3" />
                                        Debit
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs font-medium text-white/80">
                                      {purposeLabel(txn.purpose || txn.type)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span
                                      className={`font-semibold ${(txn.direction === "CREDIT" || txn.type === "credit") ? "text-white" : "text-white"
                                        }`}
                                    >
                                      {(txn.direction === "CREDIT" || txn.type === "credit") ? "+" : "−"}
                                      {formatCurrency(txn.amount)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-[10px] text-white/40">
                                      {txn.referenceType
                                        ? `${txn.referenceType}: ${txn.referenceId?.toString()?.substring(0, 8) ?? "—"}...`
                                        : "—"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-xs text-white/40 max-w-[200px] truncate" title={txn.note || txn.remarks || ""}>
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
            <Card className="mt-6 bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
              <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldOff className="h-5 w-5 text-[#D3D925]" />
                  Recent Admin Adjustments
                </CardTitle>
                <CardDescription className="text-white/60">
                  Last 10 manual balance adjustments across all users — audit trail
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/60">Date</TableHead>
                        <TableHead className="text-white/60">User</TableHead>
                        <TableHead className="text-white/60">Type</TableHead>
                        <TableHead className="text-right text-white/60">Amount</TableHead>
                        <TableHead className="text-white/60">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.recentAdjustments.map((adj) => {
                        const userName =
                          typeof adj.userId === "object" ? adj.userId.name : "Unknown";
                        const userPhone =
                          typeof adj.userId === "object" ? adj.userId.phone : "";
                        return (
                          <TableRow key={adj._id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="text-xs whitespace-nowrap text-white/80">
                              {formatDate(adj.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm text-white/90">{userName}</div>
                              <div className="text-xs text-white/40">{userPhone}</div>
                            </TableCell>
                            <TableCell>
                              {adj.direction === "CREDIT" || adj.type === "ADMIN_CREDIT" || adj.type === "credit" ? (
                                <Badge variant="outline" className="bg-white/5 text-white border-white/10">
                                  Credit
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-white/5 text-white border-white/10">
                                  Debit
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-white">
                              {formatCurrency(adj.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-white/40 max-w-[250px] truncate" title={adj.note || adj.remarks || ""}>
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
