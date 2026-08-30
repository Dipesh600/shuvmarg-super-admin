import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { StatCard } from "@/components/dashboard/StatCard";

/* ─── Helpers ───────────────────────────── */
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
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <span className="text-sm text-white/60 flex items-center gap-2 font-medium">
      {icon}
      {label}
    </span>
    <span className="text-sm font-semibold text-right max-w-[55%] text-white">{value}</span>
  </div>
);

// Admin UI Card styling (matches Analytics.tsx)
const AdminCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`shadow-xl border border-white/5 bg-[#121212]/30 backdrop-blur-md rounded-2xl overflow-hidden ${className}`}>
    {children}
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
        <XCircle className="h-14 w-14 text-white" />
        <h2 className="text-2xl font-bold tracking-tight text-white">Failed to load booking</h2>
        <p className="text-white/60 text-sm font-medium">{(error as Error).message}</p>
        <Button 
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-6"
          onClick={() => navigate("/admin/bookings")}
        >
          Back to Bookings
        </Button>
      </div>
    );
  }

  const booking = res?.data;

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Ticket className="h-14 w-14 text-white/40" />
        <h2 className="text-2xl font-bold tracking-tight text-white">Booking not found</h2>
        <p className="text-white/60 text-sm font-medium">This ticket ID does not exist or was deleted.</p>
        <Button 
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-6"
          onClick={() => navigate("/admin/bookings")}
        >
          Back to Bookings
        </Button>
      </div>
    );
  }

  /* Safe refs — populate can return null */
  const trip     = booking.tripId;
  const route    = trip?.routeId;
  const bus      = trip?.busId;
  const customer = booking.userId;
  const coupon   = booking.couponUsed ?? null;

  const hasDiscount = (booking.discountAmount ?? 0) > 0;
  const hasSmMoney  = (booking.smMoneyUsed   ?? 0) > 0;
  const isActive    = booking.status?.toLowerCase() === "booked";
  const passengers = booking.passengerDetails ?? [];
  const boardingPt  = booking.boardingPoint;
  const droppingPt  = booking.droppingPoint;

  const tripDate = trip?.tripDate
    ? new Date(trip.tripDate).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="font-sans text-white max-w-7xl mx-auto space-y-6 pb-12">
      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5"
          onClick={() => navigate("/admin/bookings")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-white">Booking Details</h2>
            <Badge 
              variant="outline" 
              className="gap-1.5 capitalize text-xs px-2.5 py-0.5 font-bold"
              style={{
                backgroundColor: booking.status?.toLowerCase() === "booked" ? "rgba(211, 217, 37, 0.1)" : booking.status?.toLowerCase() === "cancelled" ? "rgba(244, 63, 94, 0.1)" : "rgba(255, 255, 255, 0.05)",
                color: booking.status?.toLowerCase() === "booked" ? "#D3D925" : booking.status?.toLowerCase() === "cancelled" ? "#f43f5e" : "#fff",
                borderColor: booking.status?.toLowerCase() === "booked" ? "rgba(211, 217, 37, 0.2)" : booking.status?.toLowerCase() === "cancelled" ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              {statusIcon(booking.status)}
              {booking.status?.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-white/50 mt-1 text-sm flex items-center gap-2 font-medium">
            <Ticket className="h-4 w-4 shrink-0 text-white/50" />
            <span className="font-bold tracking-wider text-white/80">#{booking.ticketId}</span>
            <span className="text-white/20">|</span>
            <span>Booked {new Date(booking.bookedAt).toLocaleString("en-NP", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            className="bg-[#121212] hover:bg-white/5 text-white rounded-xl font-medium border border-white/10 gap-2 h-10"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button 
            className="bg-white hover:bg-white/90 text-black rounded-xl font-bold gap-2 h-10"
            onClick={() => toast.success("Ticket resent")}
          >
            <RefreshCw className="h-4 w-4" /> Resend Ticket
          </Button>
          {isActive && (
            <Button 
              className="bg-white/5 hover:bg-white/5 text-white rounded-xl font-semibold gap-2 h-10 border-0"
              onClick={() => toast.success("Cancellation initiated")}
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          STAT STRIP — 4 quick-scan metrics
      ══════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Paid"
          value={`Rs. ${(booking.totalAmount ?? 0).toLocaleString()}`}
          icon={BadgeDollarSign}
          subtitle={hasDiscount ? `Saved Rs. ${(booking.discountAmount ?? 0).toLocaleString()}` : undefined}
          changeType="neutral"
        />
        <StatCard
          title="Passengers"
          value={(booking.seats ?? []).length.toString()}
          icon={Users}
          subtitle={(booking.seats ?? []).join(", ")}
          changeType="neutral"
        />
        <StatCard
          title="Travel Date"
          value={tripDate}
          icon={Calendar}
          subtitle={`${booking.bookedDepartureTime ?? trip?.departureTime ?? "—"} → ${booking.bookedArrivalTime ?? trip?.arrivalTime ?? "—"}`}
          changeType="neutral"
        />
        <StatCard
          title="Vehicle"
          value={bus?.busName ?? "—"}
          icon={Bus}
          subtitle={bus?.busNumber}
          changeType="neutral"
        />
      </div>

      {/* ══════════════════════════════════════
          ROW A — Customer  |  Route
      ══════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Customer ───────────────────────── */}
        <AdminCard className="flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <User className="h-4 w-4 text-white/50" /> Customer Info
            </h3>
            <Button
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full px-3"
              onClick={() => customer?._id && navigate(`/admin/users/${customer._id}`)}
            >
              View Profile <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-5 flex-1">
            <div className="flex gap-4 items-center mb-6">
              <Avatar className="h-16 w-16 border border-white/10 shrink-0">
                <AvatarImage src={customer?.profilePicture} />
                <AvatarFallback className="text-xl font-bold bg-white/5 text-white">
                  {customer?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg tracking-tight text-white">{customer?.name ?? "—"}</p>
                <p className="text-sm font-medium text-white/60 mt-0.5">{customer?.phone ?? "—"}</p>
                <p className="text-sm font-medium text-white/60">{customer?.email ?? "—"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Payment Method"
                value={<Badge className="bg-white/5 text-white hover:bg-white/10 border-white/10">{PM[booking.paymentMethod] ?? booking.paymentMethod ?? "—"}</Badge>}
              />
              <DetailRow
                icon={<Smartphone className="h-4 w-4" />}
                label="Booked Via"
                value={<Badge className="bg-white/5 text-white hover:bg-white/10 border-white/10">{booking.bookedVia ?? "—"}</Badge>}
              />
              <DetailRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Boarding Status"
                value={
                  <Badge className={`${booking.boardingConfirmed ? "bg-[#D3D925]/10 text-[#D3D925] border-[#D3D925]/20" : "bg-white/5 text-white/60 border-white/10"} border`}>
                    {booking.boardingConfirmed ? "Confirmed" : "Not Confirmed"}
                  </Badge>
                }
              />
              {booking.transactionId && (
                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Transaction ID"
                  value={<span className="text-xs bg-white/5 px-2 py-1 rounded-md text-white/80 border border-white/5">{booking.transactionId}</span>}
                />
              )}
            </div>
          </div>
        </AdminCard>

        {/* Route ──────────────────────────── */}
        <AdminCard className="flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-white/50" /> Route & Trip
            </h3>
            {trip?._id && (
              <Button
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full px-3"
                onClick={() => bus?._id && navigate(`/admin/fleets/${bus._id}/workstation`)}
              >
                View Trip <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            {/* From → To hero */}
            <div className="flex items-stretch gap-2 p-4 bg-white/[0.03] rounded-xl mb-6 border border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">From</p>
                <p className="font-bold text-xl tracking-tight text-white">
                  {booking.bookedFrom ?? route?.from ?? trip?.fromStopName ?? "—"}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 px-3 shrink-0">
                <p className="text-[10px] font-semibold text-white/60">
                  {route?.duration ?? "N/A"}
                </p>
                <div className="flex items-center gap-1 w-full justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <div className="flex-1 h-[1px] bg-white/20 min-w-[32px]" />
                  <ArrowRight className="h-3.5 w-3.5 text-white/40" />
                </div>
                <p className="text-[10px] font-medium text-white/40">{route?.distance ?? ""}</p>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">To</p>
                <p className="font-bold text-xl tracking-tight text-white">
                  {booking.bookedTo ?? route?.to ?? trip?.toStopName ?? "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Date</p>
                <p className="font-bold text-sm text-white">{tripDate}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Departs</p>
                <p className="font-bold text-sm text-white">{booking.bookedDepartureTime ?? trip?.departureTime ?? "—"}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Arrives</p>
                <p className="font-bold text-sm text-white">{booking.bookedArrivalTime ?? trip?.arrivalTime ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-white/60 text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white/40" /> Seats Booked
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {(booking.seats ?? []).map((s: string) => (
                  <Badge key={s} className="bg-white/10 hover:bg-white/10 text-white font-bold px-2 py-0.5 border border-white/10">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* ══════════════════════════════════════
          ROW B — Vehicle | Payment | Breakdown
      ══════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* Vehicle ────────────────────────── */}
        <AdminCard>
          <div className="p-5 border-b border-white/5">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Bus className="h-4 w-4 text-white/50" /> Vehicle
            </h3>
          </div>
          <div className="p-5">
            <div
              className="group flex items-center justify-between p-4 bg-white/[0.03] rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors mb-5 border border-white/5"
              onClick={() => bus?._id && navigate(`/admin/fleets/${bus._id}/workstation`)}
            >
              <div>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Bus Name</p>
                <p className="font-bold text-base text-white group-hover:text-white/80 transition-colors">
                  {bus?.busName ?? "—"}
                </p>
              </div>
              {bus?._id && (
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <ArrowRight className="h-4 w-4 text-white/60" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <DetailRow
                icon={<Tag className="h-4 w-4" />}
                label="Plate No."
                value={
                  <span className="bg-white/10 border border-white/5 px-2 py-1 rounded-md text-xs font-bold text-white">
                    {bus?.busNumber ?? "—"}
                  </span>
                }
              />
              <DetailRow
                icon={<Bus className="h-4 w-4" />}
                label="Service"
                value={
                  <Badge variant="outline" className="text-[10px] border-white/10 text-white/80 font-bold bg-white/[0.02]">
                    {bus?.busType ?? "—"}
                  </Badge>
                }
              />
              <DetailRow
                icon={trip?.shift === "night" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                label="Shift"
                value={
                  <Badge className="bg-white/5 text-white/80 hover:bg-white/10 border border-white/5 capitalize font-bold">
                    {trip?.shift ?? "—"}
                  </Badge>
                }
              />
            </div>
          </div>
        </AdminCard>

        {/* Payment Info ───────────────────── */}
        <AdminCard>
          <div className="p-5 border-b border-white/5">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <CreditCard className="h-4 w-4 text-white/50" /> Payment
            </h3>
          </div>
          <div className="p-5">
            <div className="text-center mb-5 bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Amount Paid</p>
              <p className="text-3xl font-bold tracking-tight text-white">
                Rs. {(booking.totalAmount ?? 0).toLocaleString()}
              </p>
              {hasDiscount && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold">
                  <span className="text-white/40 line-through">Rs. {(booking.originalAmount ?? 0).toLocaleString()}</span>
                  <span className="text-[#D3D925]">Saved Rs. {(booking.discountAmount ?? 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Method"
                value={<Badge className="bg-white/5 text-white/80 hover:bg-white/10 border border-white/10">{PM[booking.paymentMethod] ?? booking.paymentMethod ?? "—"}</Badge>}
              />
              <DetailRow
                icon={<Smartphone className="h-4 w-4" />}
                label="Channel"
                value={<Badge className="bg-white/5 text-white/80 hover:bg-white/10 border border-white/10">{booking.bookedVia ?? "—"}</Badge>}
              />
              {booking.transactionId && (
                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Txn ID"
                  value={<span className="text-[11px] bg-white/5 px-2 py-1 rounded-md text-white/80 border border-white/5">{booking.transactionId}</span>}
                />
              )}
            </div>
          </div>
        </AdminCard>

        {/* Price Breakdown ────────────────── */}
        <AdminCard>
          <div className="p-5 border-b border-white/5">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Receipt className="h-4 w-4 text-white/50" /> Fare Breakdown
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-1">
              <DetailRow
                icon={<BadgeDollarSign className="h-4 w-4" />}
                label="Base Fare"
                value={`Rs. ${(booking.originalAmount ?? 0).toLocaleString()}`}
              />
              {hasDiscount && (
                <DetailRow
                  icon={<Percent className="h-4 w-4" />}
                  label={`Coupon${booking.couponCode ? ` (${booking.couponCode})` : ""}`}
                  value={
                    <span className="text-white font-bold">
                      −Rs. {(booking.discountAmount ?? 0).toLocaleString()}
                    </span>
                  }
                />
              )}
              {hasSmMoney && (
                <DetailRow
                  icon={<Wallet className="h-4 w-4" />}
                  label="SM Money"
                  value={
                    <span className="text-[#D3D925] font-bold">
                      −Rs. {(booking.smMoneyUsed ?? 0).toLocaleString()}
                    </span>
                  }
                />
              )}
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Gateway Paid"
                value={`Rs. ${((booking.gatewayAmount ?? booking.totalAmount) ?? 0).toLocaleString()}`}
              />
            </div>

            <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="font-bold text-sm text-white/80 uppercase tracking-wider">Total Paid</span>
              <span className="font-bold text-xl tracking-tight text-white">
                Rs. {(booking.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Coupon detail card */}
            {coupon && hasDiscount && (
              <div
                className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/admin/offers/${coupon._id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Coupon Used</p>
                  <ArrowRight className="h-3 w-3 text-white/40" />
                </div>
                <p className="font-bold text-base text-white">{coupon.couponCode}</p>
                {coupon.title && (
                  <p className="text-xs font-medium text-white/50 mt-1">{coupon.title}</p>
                )}
                <p className="text-xs text-[#D3D925] font-bold mt-2 inline-flex bg-[#D3D925]/10 px-2 py-1 rounded-md border border-[#D3D925]/20">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% off`
                    : `Rs. ${coupon.discountValue} off`}
                  {coupon.maxDiscountAmount
                    ? ` (max Rs. ${coupon.maxDiscountAmount})`
                    : ""}
                </p>
              </div>
            )}
          </div>
        </AdminCard>
      </div>

      {/* ══════════════════════════════════════
          ROW C — Boarding & Dropping (conditional)
      ══════════════════════════════════════ */}
      {(boardingPt?.name || droppingPt?.name) && (
        <div className="grid gap-6 md:grid-cols-2">
          {boardingPt?.name && (
            <AdminCard className="p-5">
              <h3 className="text-xs font-semibold flex items-center gap-2 text-white/50 uppercase tracking-wider mb-3">
                <Navigation className="h-4 w-4" /> Boarding Point
              </h3>
              <p className="font-bold text-lg text-white">{boardingPt.name}</p>
              {boardingPt.time && <p className="text-sm font-medium text-white/60 mt-1">{boardingPt.time}</p>}
            </AdminCard>
          )}
          {droppingPt?.name && (
            <AdminCard className="p-5">
              <h3 className="text-xs font-semibold flex items-center gap-2 text-white/50 uppercase tracking-wider mb-3">
                <MapPin className="h-4 w-4" /> Dropping Point
              </h3>
              <p className="font-bold text-lg text-white">{droppingPt.name}</p>
              {droppingPt.time && <p className="text-sm font-medium text-white/60 mt-1">{droppingPt.time}</p>}
            </AdminCard>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          ROW D — Passenger Manifest (conditional)
      ══════════════════════════════════════ */}
      {passengers.length > 0 && (
        <AdminCard>
          <div className="p-5 border-b border-white/5 flex items-center gap-3">
            <Users className="h-4 w-4 text-white/50" />
            <h3 className="text-base font-bold text-white">Passenger Manifest</h3>
            <Badge className="bg-white/10 text-white/80 border-0 font-bold px-2">{passengers.length}</Badge>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {passengers.map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-4 items-center p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4 col-span-1">
                    <div className="h-10 w-10 shrink-0 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-sm text-white/80">
                      {p.seatNo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Name</p>
                      <p className="font-bold text-sm text-white truncate">{p.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Age</p>
                    <p className="font-semibold text-sm text-white/80">{(p.age ?? 0) > 0 ? p.age : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Gender</p>
                    <p className="font-semibold text-sm text-white/80 capitalize">{p.gender ?? "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">ID Proof</p>
                    <p className="text-sm font-medium text-white/60 truncate">
                      {p.idType
                        ? `${p.idType.replace(/_/g, " ")}${p.idNumber ? ` · ${p.idNumber}` : ""}`
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      )}

      {/* ══════════════════════════════════════
          ROW E — Cancellation (conditional)
      ══════════════════════════════════════ */}
      {booking.status === "cancelled" && (booking.cancellationReason || booking.cancelledBy) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-white" />
            <h3 className="text-base font-bold text-white">Cancellation Details</h3>
          </div>
          <div className="p-5 space-y-4">
            <DetailRow
              label="Cancelled By"
              icon={<User className="h-4 w-4" />}
              value={<Badge className="bg-white/5 text-white border border-white/10 capitalize font-bold">{booking.cancelledBy ?? "—"}</Badge>}
            />
            {booking.cancellationReason && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">Reason</p>
                <p className="text-sm font-medium text-white/60 leading-relaxed">{booking.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
