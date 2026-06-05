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
function statusVariant(s: string): "default" | "destructive" | "secondary" | "outline" {
  switch (s) {
    case "SUCCESS":          return "default";
    case "FAILED":
    case "DISPUTED":         return "destructive";
    case "REFUNDED":         return "secondary";
    default:                 return "outline";
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
  <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
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
            <h2 className="text-3xl font-bold tracking-tight">Transaction Details</h2>
            <Badge variant={statusVariant(txn.status)} className="gap-1.5 text-xs">
              {statusIcon(txn.status)}
              {txn.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2 flex-wrap">
            <Hash className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono font-semibold text-foreground text-xs">
              {txn.transactionId}
            </span>
            <span className="text-muted-foreground/50">·</span>
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
            icon:  <BadgeDollarSign className="h-5 w-5 text-primary" />,
            label: "Amount",
            value: `Rs. ${(txn.totalAmount ?? 0).toLocaleString()}`,
            sub:   txn.currency ?? "NPR",
          },
          {
            icon:  <CreditCard className="h-5 w-5 text-primary" />,
            label: "Gateway",
            value: PM[txn.gateway] ?? txn.gateway ?? "—",
            sub:   txn.transactionType ?? "—",
          },
          {
            icon:  <User className="h-5 w-5 text-primary" />,
            label: "Customer",
            value: (user as any).name ?? "—",
            sub:   (user as any).phone ?? "—",
          },
          {
            icon:  <Ticket className="h-5 w-5 text-primary" />,
            label: "Ticket ID",
            value: txn.ticketId ?? "—",
            sub:   booking ? `${(booking.seats ?? []).length} seat(s)` : "No booking linked",
          },
        ].map((m) => (
          <Card key={m.label} className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="font-bold text-base leading-tight truncate">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{m.sub}</p>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Transaction Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              icon={<Hash className="h-3.5 w-3.5" />}
              label="Transaction ID"
              value={<span className="font-mono text-[11px] break-all">{txn.transactionId}</span>}
            />
            <DetailRow
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Gateway"
              value={<Badge variant="outline">{PM[txn.gateway] ?? txn.gateway ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
              label="Type"
              value={<Badge variant="secondary">{txn.transactionType ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
              label="Total Amount"
              value={`Rs. ${(txn.totalAmount ?? 0).toLocaleString()}`}
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
                <Separator className="my-3" />
                <DetailRow
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  label="Refund Status"
                  value={
                    <Badge variant={txn.refundStatus === "COMPLETED" ? "default" : "secondary"}>
                      {txn.refundStatus}
                    </Badge>
                  }
                />
                {txn.refundNote && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Refund Note</p>
                    <p className="text-sm leading-relaxed">{txn.refundNote}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Customer
              </CardTitle>
              {(user as any)._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-primary"
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
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                  Linked Booking
                </p>
                <DetailRow
                  icon={<Ticket className="h-3.5 w-3.5" />}
                  label="Ticket ID"
                  value={<span className="font-mono text-xs">{booking.ticketId ?? "—"}</span>}
                />
                <DetailRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Seats"
                  value={
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(booking.seats ?? []).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                      ))}
                    </div>
                  }
                />
                <DetailRow
                  label="Booking Status"
                  value={
                    <Badge variant={booking.status === "booked" ? "default" : "secondary"} className="capitalize">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl mb-4">
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">From</p>
                  <p className="font-black text-lg">{route?.from ?? trip?.fromStopName ?? "—"}</p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                  {route?.duration && (
                    <Badge variant="outline" className="text-[10px]">{route.duration}</Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-6 h-[2px] bg-primary/40" />
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {route?.distance && (
                    <p className="text-[10px] text-muted-foreground">{route.distance}</p>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">To</p>
                  <p className="font-black text-lg">{route?.to ?? trip?.toStopName ?? "—"}</p>
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bus className="h-4 w-4 text-primary" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="group flex items-center justify-between p-3 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors mb-4"
                onClick={() => bus?._id && navigate(`/admin/fleets/${bus._id}/workstation`)}
              >
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Bus Name</p>
                  <p className="font-black text-base group-hover:text-primary transition-colors">
                    {bus?.busName ?? "—"}
                  </p>
                </div>
                {bus?._id && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />}
              </div>
              <DetailRow
                icon={<Bus className="h-3.5 w-3.5" />}
                label="Plate No."
                value={
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-bold">
                    {bus?.busNumber ?? "—"}
                  </span>
                }
              />
              <DetailRow
                icon={<Bus className="h-3.5 w-3.5" />}
                label="Service Type"
                value={
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-bold">
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
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
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
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Gateway Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 overflow-auto max-h-40 leading-relaxed">
              {JSON.stringify(txn.meta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TransactionDetail;
