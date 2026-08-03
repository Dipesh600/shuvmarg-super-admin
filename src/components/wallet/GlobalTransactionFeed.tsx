import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Gift,
  Users,
  ShieldCheck,
  RotateCcw,
  Filter,
} from "lucide-react";
import {
  getGlobalFeed,
  type GlobalFeedFilter,
  type GlobalFeedResponse,
  type WalletTransaction,
} from "@/api/walletApi";

// ─── Filter Configuration ────────────────────────────────────────────────────

const FILTERS: { key: GlobalFeedFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Activity className="h-3.5 w-3.5" /> },
  { key: "cashback", label: "Cashback", icon: <Gift className="h-3.5 w-3.5" /> },
  { key: "referral", label: "Referral", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "spent", label: "Spent", icon: <Zap className="h-3.5 w-3.5" /> },
  { key: "admin", label: "Admin", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { key: "refunds", label: "Refunds", icon: <RotateCcw className="h-3.5 w-3.5" /> },
];

// ─── Purpose Label Mapping ───────────────────────────────────────────────────

const purposeLabel = (p: string): string => {
  const map: Record<string, string> = {
    CASHBACK: "Cashback",
    CASHBACK_CLAWBACK: "Clawback",
    REFERRAL_LOCKED: "Referral Lock",
    REFERRAL_UNLOCK: "Referral Unlock",
    REFUND: "Refund",
    DEBIT: "Spent",
    DEBIT_REVERSAL: "Reversal",
    EXPIRY: "Expired",
    ADMIN_CREDIT: "Admin Credit",
    ADMIN_DEBIT: "Admin Debit",
    // Legacy fallbacks
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

// ─── Date Formatter ──────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Relative time for recent entries
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return (
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};

const formatCurrency = (val: number) =>
  `Rs. ${val?.toLocaleString("en-IN") ?? "0"}`;

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

const FeedSkeleton = () => (
  <div className="space-y-3">
    {/* Stats skeleton */}
    <div className="flex gap-3">
      <Skeleton className="h-8 w-44 rounded-full" />
      <Skeleton className="h-8 w-44 rounded-full" />
    </div>
    {/* Filter pills skeleton */}
    <div className="flex gap-2 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full" />
      ))}
    </div>
    {/* Table skeleton */}
    <div className="mt-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

interface GlobalTransactionFeedProps {
  onUserClick: (query: string) => void;
}

const GlobalTransactionFeed = ({ onUserClick }: GlobalTransactionFeedProps) => {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<GlobalFeedFilter>("all");

  const { data, isLoading, isError } = useQuery<GlobalFeedResponse>({
    queryKey: ["globalFeed", page, activeFilter],
    queryFn: () => getGlobalFeed(page, 25, activeFilter),
    staleTime: 60 * 1000, // 60s — avoid excessive re-fetching
  });

  const handleFilterChange = (filter: GlobalFeedFilter) => {
    setActiveFilter(filter);
    setPage(1); // Reset to page 1 on filter change
  };

  if (isLoading) return <FeedSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-3 bg-[#121212]/30 rounded-lg border border-white/5">
        <Activity className="h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-white">Failed to load platform activity</p>
        <p className="text-xs text-white/60">
          Check your connection and try refreshing
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { entries, stats, pagination } = data;

  return (
    <div className="space-y-4">
      {/* ── Header: Title + Live Stats ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-[#D3D925]" />
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Platform Activity Feed
          </h3>
          <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] ml-1">
            {pagination.totalCount.toLocaleString()} total
          </Badge>
        </div>

        {/* Today's stats badges */}
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-2.5"
          >
            <ArrowUpRight className="h-3 w-3" />
            <span className="font-semibold">{stats.totalCreditsToday}</span>
            <span className="text-emerald-500/70">credits</span>
            <span className="font-semibold">
              ({formatCurrency(stats.totalCreditAmountToday)})
            </span>
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5 py-1 px-2.5"
          >
            <ArrowDownRight className="h-3 w-3" />
            <span className="font-semibold">{stats.totalDebitsToday}</span>
            <span className="text-red-500/70">debits</span>
            <span className="font-semibold">
              ({formatCurrency(stats.totalDebitAmountToday)})
            </span>
          </Badge>
        </div>
      </div>

      {/* ── Filter Pills ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-white/40 mr-1 shrink-0" />
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            className={`gap-1.5 rounded-full text-xs h-8 px-3 transition-all border ${
              activeFilter === f.key
                ? "bg-[#D3D925] text-[#121212] border-[#D3D925] hover:bg-[#D3D925]/90"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.icon}
            {f.label}
          </Button>
        ))}
      </div>

      {/* ── Transaction Table ──────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center gap-2 bg-[#121212]/30 rounded-lg border border-white/5">
          <Activity className="h-8 w-8 text-white/40" />
          <p className="text-sm font-medium text-white">No transactions found</p>
          <p className="text-xs text-white/60">
            {activeFilter !== "all"
              ? "Try changing the filter or check back later"
              : "No SM Money activity has been recorded yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[90px] text-white/60 font-semibold">Time</TableHead>
                  <TableHead className="text-white/60 font-semibold">User</TableHead>
                  <TableHead className="w-[80px] text-white/60 font-semibold">Type</TableHead>
                  <TableHead className="text-white/60 font-semibold">Purpose</TableHead>
                  <TableHead className="text-right w-[110px] text-white/60 font-semibold">Amount</TableHead>
                  <TableHead className="w-[130px] text-white/60 font-semibold">Reference</TableHead>
                  <TableHead className="text-white/60 font-semibold">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((txn: WalletTransaction) => {
                  const isCredit =
                    txn.direction === "CREDIT" || txn.type === "credit";
                  const userName =
                    typeof txn.userId === "object"
                      ? txn.userId.name
                      : "Unknown";
                  const userPhone =
                    typeof txn.userId === "object" ? txn.userId.phone : "";

                  return (
                    <TableRow key={txn._id} className="group border-b border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div className="text-xs whitespace-nowrap text-white/60">
                          {formatDate(txn.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-left hover:underline decoration-white/50 underline-offset-2 transition-all group-hover:text-[#D3D925] text-white/90"
                          onClick={() => {
                            if (userPhone) onUserClick(userPhone);
                          }}
                          title={`Look up ${userName}'s wallet`}
                        >
                          <div className="font-medium text-sm truncate max-w-[140px]">
                            {userName}
                          </div>
                          {userPhone && (
                            <div className="text-[11px] text-white/40">
                              {userPhone}
                            </div>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        {isCredit ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"
                          >
                            <TrendingUp className="h-3 w-3" />
                            CR
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"
                          >
                            <TrendingDown className="h-3 w-3" />
                            DR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-white/90">
                          {purposeLabel(txn.purpose || txn.type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            isCredit ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatCurrency(txn.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] text-white/40">
                          {txn.referenceType
                            ? `${txn.referenceType}: ${
                                txn.referenceId
                                  ?.toString()
                                  ?.substring(0, 8) ?? "—"
                              }…`
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-xs text-white/60 max-w-[200px] truncate"
                          title={txn.note || txn.remarks || ""}
                        >
                          {txn.note || txn.remarks || "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">
                Page {pagination.page} of {pagination.totalPages}
                <span className="mx-1.5 text-white/20">·</span>
                {pagination.totalCount.toLocaleString()} records
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-[#121212]/30 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="bg-[#121212]/30 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
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
  );
};

export default GlobalTransactionFeed;
