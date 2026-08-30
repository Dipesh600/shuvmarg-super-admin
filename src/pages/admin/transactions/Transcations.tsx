import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  TrendingUp,
  XCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllTransactions } from "@/api/transactionApi";
import { getDisputes } from "@/api/disputeApi";

/* ─── Helpers ─── */
function statusStyles(s: string): string {
  switch (s) {
    case "SUCCESS":          return "text-white border-white/10 bg-white/5";
    case "FAILED":
    case "DISPUTED":         return "text-white border-white/10 bg-white/5";
    case "REFUNDED":         return "text-white border-white/10 bg-white/5";
    case "PENDING":
    case "PAYMENT_RECEIVED": return "text-white border-white/10 bg-white/5";
    default:                 return "text-white/70 border-white/20 bg-white/10";
  }
}

function statusIcon(s: string) {
  switch (s) {
    case "SUCCESS":          return <CheckCircle   className="h-3 w-3" />;
    case "FAILED":           return <XCircle       className="h-3 w-3" />;
    case "DISPUTED":         return <AlertTriangle  className="h-3 w-3" />;
    case "REFUNDED":         return <RefreshCw      className="h-3 w-3" />;
    case "PENDING":
    case "PAYMENT_RECEIVED": return <Clock          className="h-3 w-3" />;
    default:                 return null;
  }
}

function statusLabel(s: string) {
  if (s === "PAYMENT_RECEIVED") return "Verifying";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const PM: Record<string, string> = {
  ESEWA: "eSewa", KHALTI: "Khalti", IME_PAY: "IME Pay",
  CONNECT_IPS: "ConnectIPS", CARD: "Card", CASH: "Cash",
  AGENT: "Agent", SM_WALLET: "SM Money", SM_WALLET_SPLIT: "SM Split", OTHER: "Other",
};

// Only statuses that live in the Transaction ledger (not the Disputes workflow)
const STATUS_OPTIONS = [
  { value: "ALL",             label: "All Statuses"  },
  { value: "SUCCESS",         label: "Success"       },
  { value: "FAILED",          label: "Failed"        },
  { value: "REFUNDED",        label: "Refunded"      },
  { value: "PENDING",         label: "Pending"       },
  { value: "PAYMENT_RECEIVED",label: "Verifying"     },
  { value: "DISPUTED",        label: "Disputed"      },
];

const TYPE_OPTIONS = [
  { value: "ALL",     label: "All Types" },
  { value: "BOOKING", label: "Booking"  },
  { value: "REFUND",  label: "Refund"   },
  { value: "OTHER",   label: "Other"    },
];

/* ─── Component ─── */
const Transactions = () => {
  const navigate = useNavigate();
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState("");
  const [status,         setStatus]         = useState("ALL");
  const [txnType,        setTxnType]        = useState("ALL");
  const [debouncedSearch,setDebouncedSearch] = useState("");

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  // Main ledger query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions", page, debouncedSearch, status, txnType],
    queryFn:  () =>
      getAllTransactions({
        page,
        limit: 20,
        search:          debouncedSearch || undefined,
        status:          status  !== "ALL" ? status  : undefined,
        transactionType: txnType !== "ALL" ? txnType : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Alert banner — just need the count of open disputes
  const { data: disputeRes } = useQuery({
    queryKey: ["disputes", "open-count"],
    queryFn:  () => getDisputes(),           // defaults to DISPUTED + PAYMENT_RECEIVED
    staleTime: 60_000,
  });

  const openDisputeCount = disputeRes?.data?.length ?? 0;

  const transactions = data?.data       ?? [];
  const pagination   = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const stats        = data?.stats      ?? {};

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Financial Ledger</h2>
        <p className="text-white/60 mt-1 font-medium text-sm">
          Gateway-level audit trail for every payment on the platform
        </p>
      </div>

      {/* ── Disputes alert banner (only shown when there are open disputes) ── */}
      {openDisputeCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <AlertTriangle className="h-5 w-5 text-white shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">
              {openDisputeCount} payment{openDisputeCount > 1 ? "s" : ""} need manual resolution
            </p>
            <p className="text-sm text-white/60 mt-0.5">
              Money was received by the gateway but booking creation failed. These users have been
              charged with no ticket — action required.
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="shrink-0 gap-2 bg-white/5 hover:bg-white/5 text-white border-none"
            onClick={() => navigate("/admin/disputes")}
          >
            Resolve Disputes <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon:  <TrendingUp  className="h-5 w-5 text-[#D3D925]" />,
            label: "Total Volume",
            value: `Rs. ${(stats.totalVolume ?? 0).toLocaleString()}`,
            sub:   `${stats.totalCount ?? 0} total transactions`,
            border: "border-l-[#D3D925]",
            valueColor: "text-[#D3D925]",
          },
          {
            icon:  <CheckCircle className="h-5 w-5 text-white" />,
            label: "Success Rate",
            value: stats.successRate ?? "—",
            sub:   `${stats.successCount ?? 0} successful`,
            border: "border-l-emerald-500",
            valueColor: "text-white",
          },
          {
            icon:  <XCircle     className="h-5 w-5 text-white" />,
            label: "Failed",
            value: stats.failedCount ?? 0,
            sub:   `${stats.disputedCount ?? 0} DISPUTED → go to Disputes`,
            border: "border-l-rose-500",
            valueColor: "text-white",
            onClick: (stats.disputedCount ?? 0) > 0 ? () => navigate("/admin/disputes") : undefined,
          },
          {
            icon:  <RefreshCw   className="h-5 w-5 text-white/60" />,
            label: "Refunded",
            value: stats.refundedCount ?? 0,
            sub:   `${stats.pendingCount ?? 0} pending / verifying`,
            border: "border-l-white/20",
            valueColor: "text-white",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className={`border-y-white/5 border-r-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl border-l-4 ${m.border} ${m.onClick ? "cursor-pointer hover:bg-white/5 transition-colors" : ""}`}
            onClick={m.onClick}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/60 mb-1">{m.label}</p>
                  <p className={`font-bold text-lg leading-tight ${m.valueColor}`}>{m.value}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">{m.sub}</p>
                </div>
                {m.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── What this page is / is not ── */}
      <div className="flex items-start gap-2 mb-5 p-3 bg-white/5 rounded-lg border border-white/10">
        <CreditCard className="h-4 w-4 text-white/60 shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          <span className="font-semibold text-white">Financial ledger only.</span>{" "}
          This view shows the raw gateway record for every payment — what the gateway received,
          confirmed, or failed. To manage DISPUTED payments (money taken, no ticket issued) or
          resolve manual refunds, use the{" "}
          <button
            className="underline font-semibold text-[#D3D925]"
            onClick={() => navigate("/admin/disputes")}
          >
            Disputes page
          </button>
          .
        </p>
      </div>

      {/* ── Ledger table ── */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-4 w-4 text-[#D3D925]" /> Transaction History
              {pagination.total > 0 && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80">{pagination.total.toLocaleString()}</Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search txn ID or ticket ID…"
                className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-white/10 text-white">
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="focus:bg-white/10 focus:text-white">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={txnType} onValueChange={(v) => { setTxnType(v); setPage(1); }}>
              <SelectTrigger className="w-[130px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-white/10 text-white">
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="focus:bg-white/10 focus:text-white">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40 text-sm">
              Loading ledger…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <XCircle className="h-10 w-10 text-white" />
              <p className="text-sm text-white/60">Failed to load transactions</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-white hover:bg-white/10">Retry</Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <CreditCard className="h-10 w-10 text-white/20" />
              <p className="text-sm text-white/60">No transactions match the current filters</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs text-white/60 uppercase tracking-wide">
                      <th className="pb-3 pr-4 font-semibold">Gateway Ref</th>
                      <th className="pb-3 pr-4 font-semibold">Ticket</th>
                      <th className="pb-3 pr-4 font-semibold">Customer</th>
                      <th className="pb-3 pr-4 font-semibold">Amount</th>
                      <th className="pb-3 pr-4 font-semibold">Gateway</th>
                      <th className="pb-3 pr-4 font-semibold">Type</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 text-right font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((txn) => {
                      const isProblematic = txn.status === "DISPUTED" || txn.status === "PAYMENT_RECEIVED";
                      return (
                        <tr
                          key={txn._id}
                          className={`transition-colors border-white/5 ${
                            isProblematic
                              ? "bg-white/5 hover:bg-white/5"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <td className="py-3 pr-4 text-xs text-white/60">
                            {txn.transactionId?.slice(-14) ?? "—"}
                          </td>
                          <td className="py-3 pr-4 text-xs text-white/80">
                            {txn.ticketId ?? (
                              <span className="text-white/40 italic">
                                {txn.status === "DISPUTED" ? "No ticket" : "—"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium leading-tight text-white/90">{txn.userId?.name ?? "—"}</p>
                            <p className="text-xs text-white/60">{txn.userId?.phone ?? ""}</p>
                          </td>
                          <td className="py-3 pr-4 font-bold tabular-nums text-[#D3D925]">
                            Rs.&nbsp;{(txn.totalAmount ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">
                              {(txn.gateway ? PM[txn.gateway] : undefined) ?? txn.gateway ?? "—"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">
                              {txn.transactionType ?? "—"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={`gap-1 text-[10px] ${statusStyles(txn.status)}`}>
                                {statusIcon(txn.status)}
                                {statusLabel(txn.status)}
                              </Badge>
                              {/* Disputed rows get a "Resolve" shortcut */}
                              {txn.status === "DISPUTED" && (
                                <button
                                  onClick={() => navigate("/admin/disputes")}
                                  className="text-[10px] text-white underline font-semibold hover:opacity-80"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-xs text-white/60 whitespace-nowrap">
                            {txn.createdAt
                              ? new Date(txn.createdAt).toLocaleString("en-NP", {
                                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-3 text-right">
                            <Link to={`/admin/transactions/${txn._id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {transactions.map((txn) => {
                  const isProblematic = txn.status === "DISPUTED" || txn.status === "PAYMENT_RECEIVED";
                  return (
                    <div
                      key={txn._id}
                      className={`rounded-lg border p-3 space-y-2 ${
                        isProblematic ? "border-white/10 bg-white/5" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">
                          {txn.transactionId?.slice(-12) ?? "—"}
                        </span>
                        <Badge variant="outline" className={`gap-1 text-[10px] ${statusStyles(txn.status)}`}>
                          {statusIcon(txn.status)} {statusLabel(txn.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">{txn.userId?.name ?? "—"}</span>
                        <span className="font-bold tabular-nums text-[#D3D925]">
                          Rs.&nbsp;{(txn.totalAmount ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">
                          {(txn.gateway ? PM[txn.gateway] : undefined) ?? txn.gateway ?? "—"}
                        </Badge>
                        {txn.status === "DISPUTED" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs gap-1 bg-white/5 hover:bg-white/5 text-white"
                            onClick={() => navigate("/admin/disputes")}
                          >
                            Resolve <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Link to={`/admin/transactions/${txn._id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10">
                              Details
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-white/60">
                    Page {pagination.page} of {pagination.totalPages}
                    &nbsp;·&nbsp;{pagination.total.toLocaleString()} records
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Transactions;
