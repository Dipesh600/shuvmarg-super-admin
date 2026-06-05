import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Bus,
  ExternalLink,
  Ticket,
  CreditCard,
  Smartphone,
  Hash,
  Tag,
  Users,
  Navigation,
  Moon,
  Sun,
  ShieldCheck,
  Receipt,
  Percent,
  BadgeDollarSign,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getBookingById } from "@/api/bookingsApi";
import BookingDetailSkeleton from "@/components/Skeletion_Loading/BookingDetailSkeleton";

/* ─── Helpers ───────────────────────────── */
function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  switch (s?.toLowerCase()) {
    case "booked":    return "default";
    case "cancelled": return "destructive";
    case "no_show":   return "secondary";
    default:          return "outline";
  }
}

function statusIcon(s: string) {
  switch (s?.toLowerCase()) {
    case "booked":    return <CheckCircle className="h-3.5 w-3.5" />;
    case "cancelled": return <XCircle className="h-3.5 w-3.5" />;
    case "pending":   return <Clock className="h-3.5 w-3.5" />;
    case "no_show":   return <AlertCircle className="h-3.5 w-3.5" />;
    default:          return null;
  }
}

const PM: Record<string, string> = {
  ESEWA: "eSewa", KHALTI: "Khalti", IME_PAY: "IME Pay",
  CONNECT_IPS: "ConnectIPS", CARD: "Card", CASH: "Cash",
  AGENT: "Agent", SM_WALLET: "SM Money",
  SM_WALLET_SPLIT: "SM Money (Split)", OTHER: "Other",
};

/* ─── Reusable layout helpers ──────────── */
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
    <span className="text-sm font-semibold text-right max-w-[55%]">{value}</span>
  </div>
);

/* ─── Main Component ─────────────────── */
const BookingDetail = () => {
  const navigate  = useNavigate();
  const { id }    = useParams();

  const { data: res, isLoading, isError, error } = useQuery({
    queryKey: ["booking", id],
    queryFn:  () => getBookingById(id as string),
    enabled:  !!id,
  });

  if (isLoading) return <BookingDetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <XCircle className="h-14 w-14 text-destructive" />
        <h2 className="text-2xl font-bold">Failed to load booking</h2>
        <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
        <Button onClick={() => navigate("/admin/bookings")}>Back to Bookings</Button>
      </div>
    );
  }

  const booking = res?.data;

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Ticket className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Booking not found</h2>
        <p className="text-muted-foreground text-sm">This ticket ID does not exist or was deleted.</p>
        <Button onClick={() => navigate("/admin/bookings")}>Back to Bookings</Button>
      </div>
    );
  }

  /* Safe refs — populate can return null */
  const trip     = booking.tripId  ?? {};
  const route    = (trip as any).routeId ?? {};
  const bus      = (trip as any).busId   ?? {};
  const customer = booking.userId  ?? {};
  const coupon   = booking.couponUsed ?? null;   // populated Coupon doc

  const hasDiscount = (booking.discountAmount ?? 0) > 0;
  const hasSmMoney  = (booking.smMoneyUsed   ?? 0) > 0;
  const isActive    = booking.status?.toLowerCase() === "booked";
  const passengers: any[] = booking.passengerDetails ?? [];
  const boardingPt  = booking.boardingPoint;
  const droppingPt  = booking.droppingPoint;

  const tripDate = (trip as any).tripDate
    ? new Date((trip as any).tripDate).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <>
      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bookings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-bold tracking-tight">Booking Details</h2>
            <Badge variant={statusVariant(booking.status)} className="gap-1.5 capitalize text-xs">
              {statusIcon(booking.status)}
              {booking.status?.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono font-semibold text-foreground">{booking.ticketId}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>Booked {new Date(booking.bookedAt).toLocaleString("en-NP", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => toast.success("Ticket resent")}>
            <RefreshCw className="h-4 w-4" /> Resend Ticket
          </Button>
          {isActive && (
            <Button variant="destructive" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => toast.success("Cancellation initiated")}>
              <XCircle className="h-4 w-4" /> Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          STAT STRIP — 4 quick-scan metrics
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: <BadgeDollarSign className="h-5 w-5 text-primary" />,
            label: "Total Paid",
            value: `Rs. ${(booking.totalAmount ?? 0).toLocaleString()}`,
            sub: hasDiscount ? `Saved Rs. ${(booking.discountAmount ?? 0).toLocaleString()}` : undefined,
          },
          {
            icon: <Users className="h-5 w-5 text-primary" />,
            label: "Passengers",
            value: (booking.seats ?? []).length,
            sub: (booking.seats ?? []).join(", "),
          },
          {
            icon: <Calendar className="h-5 w-5 text-primary" />,
            label: "Travel Date",
            value: tripDate,
            sub: `${booking.bookedDepartureTime ?? (trip as any).departureTime ?? "—"} → ${booking.bookedArrivalTime ?? (trip as any).arrivalTime ?? "—"}`,
          },
          {
            icon: <Bus className="h-5 w-5 text-primary" />,
            label: "Vehicle",
            value: (bus as any).busName ?? "—",
            sub: (bus as any).busNumber ?? undefined,
          },
        ].map((m) => (
          <Card key={m.label} className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="font-bold text-base leading-tight truncate">{m.value}</p>
                  {m.sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{m.sub}</p>}
                </div>
                {m.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ══════════════════════════════════════
          ROW A — Customer  |  Route
      ══════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">

        {/* Customer ───────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Customer
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-primary"
                onClick={() => (customer as any)._id && navigate(`/admin/users/${(customer as any)._id}`)}
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center mb-4">
              <Avatar className="h-14 w-14 border-2 border-muted shrink-0">
                <AvatarImage src={(customer as any).profilePicture} />
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {(customer as any).name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg leading-tight">{(customer as any).name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{(customer as any).phone ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{(customer as any).email ?? "—"}</p>
              </div>
            </div>

            <Separator className="mb-3" />

            <DetailRow
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Payment Method"
              value={<Badge variant="outline">{PM[booking.paymentMethod] ?? booking.paymentMethod ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<Smartphone className="h-3.5 w-3.5" />}
              label="Booked Via"
              value={<Badge variant="outline">{booking.bookedVia ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Boarding Status"
              value={
                <Badge variant={booking.boardingConfirmed ? "default" : "secondary"}>
                  {booking.boardingConfirmed ? "Confirmed" : "Not Confirmed"}
                </Badge>
              }
            />
            {booking.transactionId && (
              <DetailRow
                icon={<Hash className="h-3.5 w-3.5" />}
                label="Transaction ID"
                value={<span className="font-mono text-xs">{booking.transactionId}</span>}
              />
            )}
          </CardContent>
        </Card>

        {/* Route ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Route & Trip
              </CardTitle>
              {(trip as any)._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-primary"
                  onClick={() => navigate(`/admin/fleets/${(bus as any)._id}/workstation`)}
                >
                  View Trip <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* From → To hero */}
            <div className="flex items-stretch gap-2 p-4 bg-muted/40 rounded-xl mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">From</p>
                <p className="font-black text-xl leading-tight">
                  {booking.bookedFrom ?? (route as any).from ?? (trip as any).fromStopName ?? "—"}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-1 px-2 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground">
                  {(route as any).duration ?? ""}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-[2px] bg-primary/40" />
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground">{(route as any).distance ?? ""}</p>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">To</p>
                <p className="font-black text-xl leading-tight">
                  {booking.bookedTo ?? (route as any).to ?? (trip as any).toStopName ?? "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                <p className="font-bold text-sm">{tripDate}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Departs</p>
                <p className="font-bold text-sm">{booking.bookedDepartureTime ?? (trip as any).departureTime ?? "—"}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Arrives</p>
                <p className="font-bold text-sm">{booking.bookedArrivalTime ?? (trip as any).arrivalTime ?? "—"}</p>
              </div>
            </div>

            <Separator className="mb-3" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Seats Booked
              </span>
              <div className="flex gap-1 flex-wrap justify-end">
                {(booking.seats ?? []).map((s: string) => (
                  <Badge key={s} variant="secondary" className="font-mono font-bold text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>

            {(trip as any).directionLabel && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" />
                {(trip as any).directionLabel}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════
          ROW B — Vehicle | Payment | Breakdown
      ══════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">

        {/* Vehicle ────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" /> Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bus name — tap to go to workstation */}
            <div
              className="group flex items-center justify-between p-3 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors mb-4"
              onClick={() => (bus as any)._id && navigate(`/admin/fleets/${(bus as any)._id}/workstation`)}
            >
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Bus Name</p>
                <p className="font-black text-base group-hover:text-primary transition-colors">
                  {(bus as any).busName ?? "—"}
                </p>
              </div>
              {(bus as any)._id && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              )}
            </div>

            <DetailRow
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Plate No."
              value={
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-bold">
                  {(bus as any).busNumber ?? "—"}
                </span>
              }
            />
            <DetailRow
              icon={<Bus className="h-3.5 w-3.5" />}
              label="Service"
              value={
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-bold">
                  {(bus as any).busType ?? "—"}
                </Badge>
              }
            />
            <DetailRow
              icon={(trip as any).shift === "night" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              label="Shift"
              value={
                <Badge variant={(trip as any).shift === "night" ? "secondary" : "outline"} className="capitalize font-bold">
                  {(trip as any).shift ?? "—"}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* Payment Info ───────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-black text-primary">
                Rs.&nbsp;{(booking.totalAmount ?? 0).toLocaleString()}
              </p>
              {hasDiscount && (
                <p className="text-xs text-destructive line-through mt-0.5">
                  Rs.&nbsp;{(booking.originalAmount ?? 0).toLocaleString()}
                </p>
              )}
              {hasDiscount && (
                <p className="text-xs text-success font-semibold mt-1">
                  You saved Rs.&nbsp;{(booking.discountAmount ?? 0).toLocaleString()}
                </p>
              )}
            </div>

            <Separator className="mb-3" />

            <DetailRow
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Method"
              value={<Badge variant="outline">{PM[booking.paymentMethod] ?? booking.paymentMethod ?? "—"}</Badge>}
            />
            <DetailRow
              icon={<Smartphone className="h-3.5 w-3.5" />}
              label="Channel"
              value={<Badge variant="outline">{booking.bookedVia ?? "—"}</Badge>}
            />
            {booking.transactionId && (
              <DetailRow
                icon={<Hash className="h-3.5 w-3.5" />}
                label="Txn ID"
                value={<span className="font-mono text-[11px] truncate">{booking.transactionId}</span>}
              />
            )}
            <DetailRow
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Boarding"
              value={
                <Badge variant={booking.boardingConfirmed ? "default" : "secondary"} className="text-[10px]">
                  {booking.boardingConfirmed ? "Confirmed" : "Pending"}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* Price Breakdown ────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Fare Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <DetailRow
                icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
                label="Base Fare"
                value={`Rs. ${(booking.originalAmount ?? 0).toLocaleString()}`}
              />
              {hasDiscount && (
                <DetailRow
                  icon={<Percent className="h-3.5 w-3.5" />}
                  label={`Coupon${booking.couponCode ? ` (${booking.couponCode})` : ""}`}
                  value={
                    <span className="text-destructive">
                      −Rs.&nbsp;{(booking.discountAmount ?? 0).toLocaleString()}
                    </span>
                  }
                />
              )}
              {hasSmMoney && (
                <DetailRow
                  icon={<Wallet className="h-3.5 w-3.5" />}
                  label="SM Money"
                  value={
                    <span className="text-primary">
                      −Rs.&nbsp;{(booking.smMoneyUsed ?? 0).toLocaleString()}
                    </span>
                  }
                />
              )}
              <DetailRow
                icon={<CreditCard className="h-3.5 w-3.5" />}
                label="Gateway Paid"
                value={`Rs. ${((booking.gatewayAmount ?? booking.totalAmount) ?? 0).toLocaleString()}`}
              />
            </div>

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <span className="font-black text-base text-primary">Total Paid</span>
              <span className="font-black text-xl text-primary">
                Rs.&nbsp;{(booking.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Coupon detail card — only if coupon doc was populated */}
            {coupon && hasDiscount && (
              <>
                <Separator className="my-3" />
                <div
                  className="p-3 rounded-lg bg-muted/40 border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => navigate(`/admin/offers/${(coupon as any)._id}`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coupon Used</p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-sm">{(coupon as any).couponCode}</p>
                  {(coupon as any).title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{(coupon as any).title}</p>
                  )}
                  <p className="text-xs text-success font-semibold mt-1">
                    {(coupon as any).discountType === "percentage"
                      ? `${(coupon as any).discountValue}% off`
                      : `Rs. ${(coupon as any).discountValue} off`}
                    {(coupon as any).maxDiscountAmount
                      ? ` (max Rs. ${(coupon as any).maxDiscountAmount})`
                      : ""}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════
          ROW C — Boarding & Dropping (conditional)
      ══════════════════════════════════════ */}
      {(boardingPt?.name || droppingPt?.name) && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {boardingPt?.name && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-success" /> Boarding Point
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{boardingPt.name}</p>
                {boardingPt.time && <p className="text-sm text-muted-foreground mt-0.5">{boardingPt.time}</p>}
              </CardContent>
            </Card>
          )}
          {droppingPt?.name && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-destructive" /> Dropping Point
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{droppingPt.name}</p>
                {droppingPt.time && <p className="text-sm text-muted-foreground mt-0.5">{droppingPt.time}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          ROW D — Passenger Manifest (conditional)
      ══════════════════════════════════════ */}
      {passengers.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Passenger Manifest
              <Badge variant="secondary">{passengers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {passengers.map((p: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-4 items-center p-3 bg-muted/30 rounded-lg border border-border/40"
                >
                  <div className="flex items-center gap-2.5 col-span-1">
                    <Badge variant="outline" className="font-mono font-bold text-[10px] shrink-0">{p.seatNo}</Badge>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase">Name</p>
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Age</p>
                    <p className="font-semibold text-sm">{p.age > 0 ? p.age : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Gender</p>
                    <p className="font-semibold text-sm capitalize">{p.gender ?? "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">ID Proof</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.idType
                        ? `${p.idType.replace(/_/g, " ")}${p.idNumber ? ` · ${p.idNumber}` : ""}`
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════
          ROW E — Cancellation (conditional)
      ══════════════════════════════════════ */}
      {booking.status === "cancelled" && (booking.cancellationReason || booking.cancelledBy) && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" /> Cancellation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Cancelled By"
              value={<Badge variant="destructive" className="capitalize">{booking.cancelledBy ?? "—"}</Badge>}
            />
            {booking.cancellationReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                <p className="text-sm text-foreground leading-relaxed">{booking.cancellationReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default BookingDetail;