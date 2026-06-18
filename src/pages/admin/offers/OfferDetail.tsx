import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Flame,
  BarChart2,
  Loader2,
  Power,
  PowerOff,
  Calendar,
  Tag,
  Target,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCouponAnalytics, toggleCouponStatus } from "@/api/couponApi";

const fmt = (n: number) => `Rs. ${Math.round(n).toLocaleString()}`;

export default function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["couponAnalytics", id],
    queryFn: () => getCouponAnalytics(id!),
    enabled: !!id,
  });

  const { mutate: doToggle, isPending: isToggling } = useMutation({
    mutationFn: () => toggleCouponStatus(id!),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["couponAnalytics", id] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-white/60">Failed to load coupon analytics</p>
        <Button variant="outline" onClick={() => navigate("/admin/offers")} className="bg-[#121212]/30 border-white/5 text-white hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offers
        </Button>
      </div>
    );
  }

  const { coupon, summary, dailyUsage, topUsers, usageLog } = data.data;

  const isActive = coupon.isActive;
  const isCurrentlyValid = coupon.isCurrentlyValid;
  const usagePercent = coupon.totalUsageLimit
    ? Math.round((coupon.usedCount / coupon.totalUsageLimit) * 100)
    : null;

  const discountLabel =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}%`
      : `Rs. ${coupon.discountValue.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/offers")} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-wide text-white">
                {coupon.couponCode}
              </h1>
              <Badge
                className={
                  isCurrentlyValid
                    ? "bg-white/5 text-white border-white/10"
                    : !isActive
                    ? "bg-white/5 text-white border-white/10"
                    : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                }
                variant="outline"
              >
                {isCurrentlyValid ? "Active" : !isActive ? "Inactive" : "Expired"}
              </Badge>
              <Badge variant="secondary" className="font-semibold bg-white/10 text-white hover:bg-white/20">
                {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `Rs. ${coupon.discountValue.toLocaleString()} OFF`}
              </Badge>
            </div>
            <p className="text-white/60 text-sm mt-0.5">{coupon.title}</p>
          </div>
        </div>

        <Button
          variant={isActive ? "outline" : "default"}
          className={`gap-2 shrink-0 ${isActive ? "bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white" : "bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"}`}
          onClick={() => doToggle()}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Redemptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{summary.totalRedemptions}</div>
            {coupon.totalUsageLimit && (
              <p className="text-xs text-white/60 mt-1">
                of {coupon.totalUsageLimit} limit ({usagePercent}%)
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Discount Burned</CardTitle>
            <Flame className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{fmt(summary.totalDiscountBurned)}</div>
            <p className="text-xs text-white/60 mt-1">
              Avg {fmt(summary.avgDiscountPerUsage)} / use
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{summary.uniqueUsersCount}</div>
            <p className="text-xs text-white/60 mt-1">
              {summary.refundedCount > 0 ? `${summary.refundedCount} refunded` : "No refunds"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">GMV Attached</CardTitle>
            <BarChart2 className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{fmt(summary.totalOriginalGMV)}</div>
            <p className="text-xs text-white/60 mt-1">
              Total bookings revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redemptions over time */}
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Redemptions Over Time</CardTitle>
            <CardDescription className="text-white/60">Daily coupon usage since launch</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyUsage.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                No usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
                    tickFormatter={(d) => format(new Date(d), "d MMM")}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                    labelFormatter={(d) => format(new Date(d), "dd MMM yyyy")}
                    formatter={(val: number) => [val, "Redemptions"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="redemptions"
                    stroke="#D3D925"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#D3D925" }}
                    activeDot={{ r: 5, fill: "#D3D925" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Financial impact */}
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Financial Impact</CardTitle>
            <CardDescription className="text-white/60">Original amount vs discount vs final paid — per day</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyUsage.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                No usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyUsage} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
                    tickFormatter={(d) => format(new Date(d), "d MMM")}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                    labelFormatter={(d) => format(new Date(d), "dd MMM yyyy")}
                    formatter={(val: number, name: string) => [fmt(val), name]}
                  />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)" }} />
                  <Bar dataKey="totalOriginal" name="Original" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalDiscount" name="Discount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalFinal" name="Final Paid" fill="#D3D925" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coupon Config Summary */}
      <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">Coupon Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Tag className="h-3 w-3" /> Discount
              </span>
              <span className="font-semibold text-white">{discountLabel} {coupon.discountType === "percentage" ? "OFF" : "flat"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Target className="h-3 w-3" /> Min Order
              </span>
              <span className="font-semibold text-white">{coupon.minOrderAmount > 0 ? fmt(coupon.minOrderAmount) : "None"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Flame className="h-3 w-3" /> Max Cap
              </span>
              <span className="font-semibold text-white">{coupon.maxDiscountAmount ? fmt(coupon.maxDiscountAmount) : "Unlimited"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Users className="h-3 w-3" /> Per User
              </span>
              <span className="font-semibold text-white">{coupon.perUserLimit}x</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Valid From
              </span>
              <span className="font-semibold text-white">{format(new Date(coupon.validFrom), "d MMM yyyy")}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> Valid To
              </span>
              <span className="font-semibold text-white">{format(new Date(coupon.validTo), "d MMM yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      {topUsers.length > 0 && (
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Top Users</CardTitle>
            <CardDescription className="text-white/60">Users who redeemed this coupon the most</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-[#121212]/50 border-b border-white/5">
                <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableHead className="text-white/60 font-medium">User</TableHead>
                  <TableHead className="text-right text-white/60 font-medium">Times Used</TableHead>
                  <TableHead className="text-right text-white/60 font-medium">Total Discount</TableHead>
                  <TableHead className="text-white/60 font-medium">Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u: { _id: string; name: string; phone: string; timesUsed: number; totalDiscount: number; lastUsed: string }) => (
                  <TableRow key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        {u.phone && <p className="text-xs text-white/60">{u.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white">{u.timesUsed}</TableCell>
                    <TableCell className="text-right text-white">{fmt(u.totalDiscount)}</TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {format(new Date(u.lastUsed), "d MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Usage Log */}
      <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">Usage Log</CardTitle>
          <CardDescription className="text-white/60">All redemption events (latest 50)</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLog.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              No redemptions yet — this coupon hasn't been used
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#121212]/50 border-b border-white/5">
                <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableHead className="text-white/60 font-medium">User</TableHead>
                  <TableHead className="text-white/60 font-medium">Booking Ref</TableHead>
                  <TableHead className="text-right text-white/60 font-medium">Original</TableHead>
                  <TableHead className="text-right text-white/60 font-medium">Discount</TableHead>
                  <TableHead className="text-right text-white/60 font-medium">Final Paid</TableHead>
                  <TableHead className="text-white/60 font-medium">Status</TableHead>
                  <TableHead className="text-white/60 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLog.map(
                  (u: {
                    _id: string;
                    userName: string;
                    userPhone: string;
                    bookingRef: string;
                    originalAmount: number;
                    discountAmount: number;
                    finalAmount: number;
                    status: string;
                    usageDate: string;
                  }) => (
                    <TableRow key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-white">{u.userName}</p>
                          {u.userPhone && (
                            <p className="text-xs text-white/60">{u.userPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-white/60">
                        {u.bookingRef}
                      </TableCell>
                      <TableCell className="text-right text-sm text-white">{fmt(u.originalAmount)}</TableCell>
                      <TableCell className="text-right text-sm text-white font-medium">
                        -{fmt(u.discountAmount)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-white">
                        {fmt(u.finalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.status === "applied"
                              ? "default"
                              : u.status === "refunded"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs capitalize bg-white/10 text-white hover:bg-white/20 border-white/10"
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-white/60">
                        {format(new Date(u.usageDate), "d MMM yyyy, HH:mm")}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
