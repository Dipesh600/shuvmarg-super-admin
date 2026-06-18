import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  User,
  MapPin,
  Bus,
  Ticket,
  Hash,
  ExternalLink,
  Calendar,
  ArrowRight,
  BadgeDollarSign,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTransactionById } from "@/api/transactionApi";

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
    case "SUCCESS":          return <CheckCircle  className="h-4 w-4" />;
    case "FAILED":           return <XCircle      className="h-4 w-4" />;
    case "DISPUTED":         return <AlertTriangle className="h-4 w-4" />;
    case "REFUNDED":         return <RefreshCw    className="h-4 w-4" />;
    case "PENDING":
    case "PAYMENT_RECEIVED": return <Clock        className="h-4 w-4" />;
    default:                 return null;
  }
}

const PM: Record<string, string> = {
  ESEWA: "eSewa", KHALTI: "Khalti", IME_PAY: "IME Pay",
  CONNECT_IPS: "ConnectIPS", CARD: "Card", CASH: "Cash",
  AGENT: "Agent", SM_WALLET: "SM Money", SM_WALLET_SPLIT: "SM Split", OTHER: "Other",
};

const DetailRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <span className="text-sm text-white/60 flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="text-sm font-semibold text-right max-w-[60%] text-white/90">{value}</span>
  </div>
);

/* ─── Component ─── */
const TransactionDetail = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const { data: res, isLoading, isError, error } = useQuery({
    queryKey: ["transaction", id],
    queryFn:  () => getTransactionById(id as string),
    enabled:  !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground text-sm animate-pulse">Loading transaction…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <XCircle className="h-14 w-14 text-destructive" />
        <h2 className="text-2xl font-bold">Failed to load transaction</h2>
        <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
        <Button onClick={() => navigate("/admin/transactions")}>Back to Transactions</Button>
      </div>
    );
  }

  const txn = res?.data;

  if (!txn) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <CreditCard className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Transaction not found</h2>
        <Button onClick={() => navigate("/admin/transactions")}>Back to Transactions</Button>
      </div>
    );
  }

  /* Safe refs */
  const user    = txn.userId   ?? {};
  const booking = txn.bookingId ?? null;
  const trip    = booking?.tripId ?? {};
  const route   = trip?.routeId  ?? {};
  const bus     = trip?.busId    ?? {};

  const isDisputed = txn.status === "DISPUTED";
  const isFailed   = txn.status === "FAILED";

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/transactions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-white">Transaction Details</h2>
            <Badge variant="outline" className={`gap-1.5 text-xs ${statusStyles(txn.status)}`}>
              {statusIcon(txn.status)}
              {txn.status}
            </Badge>
          </div>
          <p className="text-white/60 mt-1 font-medium text-sm flex items-center gap-2 flex-wrap">
            <Hash className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-white/90 text-xs">
              {txn.transactionId}
            </span>
            <span className="text-white/40">·</span>
            <span>
              {txn.createdAt
                ? new Date(txn.createdAt).toLocaleString("en-NP", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : "—"}
            </span>
          </p>
        </div>

        {/* Jump to linked booking */}
        {booking?._id && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => navigate(`/admin/bookings/${booking._id}`)}
          >
            <Ticket className="h-4 w-4" /> View Booking
          </Button>
        )}
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon:  <BadgeDollarSign className="h-5 w-5 text-[#D3D925]" />,
            label: "Amount",
            value: `Rs. ${(txn.totalAmount ?? 0).toLocaleString()}`,
            sub:   txn.currency ?? "NPR",
          },
          {
            icon:  <CreditCard className="h-5 w-5 text-[#D3D925]" />,
            label: "Gateway",
            value: PM[txn.gateway] ?? txn.gateway ?? "—",
            sub:   txn.transactionType ?? "—",
          },
          {
            icon:  <User className="h-5 w-5 text-[#D3D925]" />,
            label: "Customer",
            value: (user as any).name ?? "—",
            sub:   (user as any).phone ?? "—",
          },
          {
            icon:  <Ticket className="h-5 w-5 text-[#D3D925]" />,
            label: "Ticket ID",
            value: txn.ticketId ?? "—",
            sub:   booking ? `${(booking.seats ?? []).length} seat(s)` : "No booking linked",
          },
        ].map((m) => (
          <Card key={m.label} className="border-y-white/5 border-r-white/5 border-l-4 border-l-[#D3D925] bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/60 mb-1">{m.label}</p>
                  <p className="font-bold text-base leading-tight truncate">{m.value}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">{m.sub}</p>
                </div>
                {m.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row A: Transaction Info | Customer ── */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">

        {/* Transaction details */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-4 w-4 text-[#D3D925]" /> Transaction Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              icon={<Hash className="h-3.5 w-3.5" />}
              label="Transaction ID"
              value={<span className="text-[11px] break-all">{txn.transactionId}</span>}
            />
            <DetailRow
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Gateway"
              value={<Badge variant="outline" className="bg-white/5 border-white/10 text-white/80">{PM[txn.gateway] ?? txn.gateway ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
              label="Type"
              value={<Badge variant="outline" className="bg-white/5 border-white/10 text-white/80">{txn.transactionType ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
              label="Total Amount"
              value={<span className="text-[#D3D925] font-bold">Rs. {(txn.totalAmount ?? 0).toLocaleString()}</span>}
            />
            {(txn.originalAmount ?? 0) > 0 && txn.originalAmount !== txn.totalAmount && (
              <DetailRow
                icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
                label="Original Amount"
                value={`Rs. ${txn.originalAmount.toLocaleString()}`}
              />
            )}
            <DetailRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Paid At"
              value={
                txn.paidAt
                  ? new Date(txn.paidAt).toLocaleString("en-NP", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"
              }
            />
            <DetailRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Created At"
              value={
                txn.createdAt
                  ? new Date(txn.createdAt).toLocaleString("en-NP", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"
              }
            />

            {/* Refund info */}
            {txn.refundStatus !== "NONE" && (
              <>
                <Separator className="my-3 border-white/5" />
                <DetailRow
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  label="Refund Status"
                  value={
                    <Badge variant="outline" className={txn.refundStatus === "COMPLETED" ? "bg-white/5 border-white/10 text-white" : "bg-white/5 border-white/10 text-white/80"}>
                      {txn.refundStatus}
                    </Badge>
                  }
                />
                {txn.refundNote && (
                  <div className="mt-2">
                    <p className="text-xs text-white/60 mb-1">Refund Note</p>
                    <p className="text-sm leading-relaxed">{txn.refundNote}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-[#D3D925]" /> Customer
              </CardTitle>
              {(user as any)._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-[#D3D925] hover:text-[#D3D925] hover:bg-white/10"
                  onClick={() => navigate(`/admin/users/${(user as any)._id}`)}
                >
                  View Profile <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Full Name"
              icon={<User className="h-3.5 w-3.5" />}
              value={(user as any).name ?? "—"}
            />
            <DetailRow
              label="Phone"
              icon={<User className="h-3.5 w-3.5" />}
              value={(user as any).phone ?? "—"}
            />
            <DetailRow
              label="Email"
              icon={<User className="h-3.5 w-3.5" />}
              value={<span className="text-xs">{(user as any).email ?? "—"}</span>}
            />

            {/* Linked booking summary */}
            {booking && (
              <>
                <Separator className="my-3 border-white/5" />
                <p className="text-xs text-white/40 uppercase tracking-wide font-semibold mb-2">
                  Linked Booking
                </p>
                <DetailRow
                  icon={<Ticket className="h-3.5 w-3.5" />}
                  label="Ticket ID"
                  value={<span className="text-xs">{booking.ticketId ?? "—"}</span>}
                />
                <DetailRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Seats"
                  value={
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(booking.seats ?? []).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">{s}</Badge>
                      ))}
                    </div>
                  }
                />
                <DetailRow
                  label="Booking Status"
                  value={
                    <Badge variant="outline" className={`capitalize ${booking.status === "booked" ? "bg-white/5 border-white/10 text-white" : "bg-white/5 border-white/10 text-white/80"}`}>
                      {booking.status}
                    </Badge>
                  }
                />
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                  >
                    <Ticket className="h-3.5 w-3.5" />
                    Open Full Booking Details
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row B: Route | Vehicle (only if trip is populated) ── */}
      {(route?.from || route?.to || bus?.busName) && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">

          {/* Route */}
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-[#D3D925]" /> Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 mb-4">
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">From</p>
                  <p className="font-black text-lg text-white/90">{route?.from ?? trip?.fromStopName ?? "—"}</p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                  {route?.duration && (
                    <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/80">{route.duration}</Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#D3D925]" />
                    <div className="w-6 h-[2px] bg-[#D3D925]/40" />
                    <ArrowRight className="h-3.5 w-3.5 text-[#D3D925]" />
                  </div>
                  {route?.distance && (
                    <p className="text-[10px] text-white/40">{route.distance}</p>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">To</p>
                  <p className="font-black text-lg text-white/90">{route?.to ?? trip?.toStopName ?? "—"}</p>
                </div>
              </div>
              <DetailRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Travel Date"
                value={
                  trip?.tripDate
                    ? new Date(trip.tripDate).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"
                }
              />
              <DetailRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Departure"
                value={trip?.departureTime ?? "—"}
              />
              <DetailRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Arrival"
                value={trip?.arrivalTime ?? "—"}
              />
            </CardContent>
          </Card>

          {/* Vehicle */}
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Bus className="h-4 w-4 text-[#D3D925]" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="group flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors mb-4"
                onClick={() => bus?._id && navigate(`/admin/fleets/${bus._id}/workstation`)}
              >
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Bus Name</p>
                  <p className="font-black text-base group-hover:text-[#D3D925] transition-colors">
                    {bus?.busName ?? "—"}
                  </p>
                </div>
                {bus?._id && <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover:text-[#D3D925] transition-colors shrink-0" />}
              </div>
              <DetailRow
                icon={<Bus className="h-3.5 w-3.5" />}
                label="Plate No."
                value={
                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold border border-white/10">
                    {bus?.busNumber ?? "—"}
                  </span>
                }
              />
              <DetailRow
                icon={<Bus className="h-3.5 w-3.5" />}
                label="Service Type"
                value={
                  <Badge variant="outline" className="text-[10px] border-[#D3D925]/40 text-[#D3D925] font-bold bg-[#D3D925]/10">
                    {bus?.busType ?? "—"}
                  </Badge>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Dispute / Failure info (conditional) ── */}
      {(isDisputed || isFailed) && (
        <Card className="border-white/10 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldAlert className="h-4 w-4" />
              {isDisputed ? "Dispute Details" : "Failure Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {txn.failureReason && (
              <DetailRow label="Failure Reason" value={txn.failureReason} />
            )}
            {txn.disputeReason && (
              <DetailRow label="Dispute Reason" value={txn.disputeReason} />
            )}
            {txn.resolvedAt && (
              <DetailRow
                label="Resolved At"
                value={new Date(txn.resolvedAt).toLocaleString("en-NP")}
              />
            )}
            {txn.resolvedBy && (
              <DetailRow label="Resolved By" value={(txn.resolvedBy as any)?.name ?? "—"} />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Metadata (if any) ── */}
      {txn.meta && Object.keys(txn.meta).length > 0 && (
        <Card className="mt-6 border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-4 w-4 text-[#D3D925]" /> Gateway Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg p-3 overflow-auto max-h-40 leading-relaxed">
              {JSON.stringify(txn.meta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TransactionDetail;
