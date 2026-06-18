import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PlusCircle,
  Tag,
  Flame,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllCoupons, deleteCoupon, toggleCouponStatus, getCouponStats } from "@/api/couponApi";
import type { Coupon } from "@/components/offers/CouponCard";
import { CouponCard } from "@/components/offers/CouponCard";
import { isPast, isFuture, differenceInDays } from "date-fns";

const getCouponStatus = (coupon: Coupon) => {
  if (!coupon.isActive) return "inactive";
  if (isFuture(new Date(coupon.validFrom))) return "upcoming";
  if (isPast(new Date(coupon.validTo))) return "expired";
  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) return "exhausted";
  return "active";
};

export default function OffersHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);

  // Queries
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => getAllCoupons({ limit: 100 }),
    refetchInterval: 30_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["couponStats"],
    queryFn: getCouponStats,
  });

  const coupons: Coupon[] = couponsData?.data ?? [];
  const stats = statsData?.data ?? [];

  // Aggregate KPIs
  const totalDiscountBurned = stats.reduce(
    (sum: number, s: { totalDiscountGiven?: number }) => sum + (s.totalDiscountGiven ?? 0),
    0
  );

  const activeCoupons = coupons.filter((c) => getCouponStatus(c) === "active");
  const expiringSoon = activeCoupons.filter((c) => {
    const days = differenceInDays(new Date(c.validTo), new Date());
    return days >= 0 && days <= 7;
  });

  // Mutations
  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not delete";
      toast.error(msg);
    },
  });

  const { mutate: doToggle } = useMutation({
    mutationFn: toggleCouponStatus,
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  // Filter coupons
  const filtered = coupons.filter((c) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && getCouponStatus(c) === "active") ||
      (activeTab === "upcoming" && getCouponStatus(c) === "upcoming") ||
      (activeTab === "expired" && getCouponStatus(c) === "expired") ||
      (activeTab === "exhausted" && getCouponStatus(c) === "exhausted") ||
      (activeTab === "inactive" && getCouponStatus(c) === "inactive");

    const matchesSearch =
      !search ||
      c.couponCode.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    all: coupons.length,
    active: coupons.filter((c) => getCouponStatus(c) === "active").length,
    upcoming: coupons.filter((c) => getCouponStatus(c) === "upcoming").length,
    expired: coupons.filter((c) => getCouponStatus(c) === "expired").length,
    exhausted: coupons.filter((c) => getCouponStatus(c) === "exhausted").length,
    inactive: coupons.filter((c) => getCouponStatus(c) === "inactive").length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Offers & Coupons</h1>
            <p className="text-white/60 mt-1 font-medium text-sm">
              Create, manage, and analyze all promotional offers
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/offers/create")}
            className="gap-2 shrink-0 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"
          >
            <PlusCircle className="h-4 w-4" />
            Create Offer
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-sm font-semibold text-white/80">Active Offers</CardTitle>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <Tag className="h-4 w-4 text-[#D3D925] shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <div className="text-2xl font-bold text-white">{tabCounts.active}</div>
              <p className="text-xs text-white/80 mt-1">
                {tabCounts.upcoming} upcoming
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-sm font-semibold text-white/80">Total Burn</CardTitle>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <Flame className="h-4 w-4 text-[#D3D925] shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <div className="text-2xl font-bold text-white">
                Rs. {totalDiscountBurned.toLocaleString()}
              </div>
              <p className="text-xs text-white/80 mt-1">
                Total discount given
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-sm font-semibold text-white/80">Total Redemptions</CardTitle>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <TrendingUp className="h-4 w-4 text-[#D3D925] shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <div className="text-2xl font-bold text-white">
                {coupons.reduce((s, c) => s + c.usedCount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/80 mt-1">
                Across all coupons
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-[#121212]/30 backdrop-blur-md shadow-xl ${expiringSoon.length > 0 ? "border-white/10" : "border-white/5"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-sm font-semibold text-white/80">Expiring Soon</CardTitle>
              <div className={`p-2 rounded-lg border border-white/5 bg-white/5`}>
                <AlertTriangle className={`h-4 w-4 text-[#D3D925] shrink-0`} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <div className="text-2xl font-bold text-white">
                {expiringSoon.length}
              </div>
              <p className="text-xs text-white/80 mt-1">
                Expiring within 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Search + Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <TabsList className="h-auto flex-wrap bg-[#121212]/50 border border-white/5 p-1">
              {Object.entries(tabCounts).map(([key, count]) => (
                <TabsTrigger key={key} value={key} className="capitalize gap-1.5 data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] text-white/60">
                  {key}
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 bg-white/10 text-current hover:bg-white/20"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search coupon code or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-72 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
              />
            </div>
          </div>

          {["all", "active", "upcoming", "expired", "exhausted", "inactive"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center border border-white/5 bg-[#121212]/30 rounded-xl backdrop-blur-md">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-white/40" />
                  </div>
                  <div>
                    <p className="font-medium text-white">No coupons found</p>
                    <p className="text-sm text-white/60 mt-1">
                      {search ? "Try a different search term" : "Create your first offer to get started"}
                    </p>
                  </div>
                  {!search && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/admin/offers/create")}
                      className="gap-2 mt-2 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Offer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filtered.map((coupon) => (
                    <CouponCard
                      key={coupon._id}
                      coupon={coupon}
                      onToggleStatus={(id) => doToggle(id)}
                      onDelete={(id) => setDeleteTarget(id)}
                      onEdit={(c) => {
                        setEditTarget(c);
                        navigate(`/admin/offers/create?edit=${c._id}`);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-[#121212]/95 border-white/5 backdrop-blur-xl shadow-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Coupon</DialogTitle>
            <DialogDescription className="text-white/60">
              This coupon will be permanently deleted. This action cannot be undone.
              {" "}Note: Coupons that have been redeemed cannot be deleted — deactivate them instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-white/5 pt-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => deleteTarget && doDelete(deleteTarget)}
              className="bg-white/5 hover:bg-white/5 text-white font-bold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
