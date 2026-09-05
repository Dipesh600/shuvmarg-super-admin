import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, MapPin, Bus, Route, CreditCard, Activity, Calendar, Pencil, Loader2, Users, UserRoundCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getBrandById, updateBrand, getBrandFinancials, type BrandUpdatePayload, type OperatorBrandDetail } from "@/api/operatorBrandApi";
import { getErrorMessage } from "@/lib/error-message";
import FleetTab from "@/components/busowners/operator_tabs/FleetTab";
import BrandServicesTab from "@/components/busowners/operator_tabs/BrandServicesTab";
import BrandSchedulesTab from "@/components/busowners/operator_tabs/BrandSchedulesTab";
import DriversTab from "@/components/busowners/operator_tabs/DriversTab";
import StaffTab from "@/components/busowners/operator_tabs/StaffTab";
import { StatCard } from "@/components/dashboard/StatCard";

// ─── FinancialTab ─────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    n >= 1_000_000
        ? `NPR ${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
        ? `NPR ${(n / 1_000).toFixed(1)}K`
        : `NPR ${Math.round(n).toLocaleString()}`;

// Removed KpiCard since we are using StatCard now

// Inline bar chart — no external dependency
const BarChart = ({ data }: { data: { label: string; revenue: number; bookings: number }[] }) => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="flex items-end gap-[3px] h-28 w-full pt-2">
            {data.map((d, i) => {
                const pct = Math.round((d.revenue / max) * 100);
                const isCurrentMonth = i === data.length - 1;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                                <div>{d.label}</div>
                                <div className="text-white">{fmt(d.revenue)}</div>
                                <div className="text-slate-400">{d.bookings} bookings</div>
                            </div>
                            <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                        </div>
                        <div
                            className={`w-full rounded-t-sm transition-all duration-300 ${
                                isCurrentMonth
                                    ? "bg-primary"
                                    : pct > 0
                                    ? "bg-primary/30 group-hover:bg-primary/50"
                                    : "bg-muted/30"
                            }`}
                            style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                        {i % 3 === 0 && (
                            <span className="text-[8px] text-muted-foreground font-bold">
                                {d.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const FinancialTab = ({ brand }: { brand: OperatorBrandDetail }) => {
    const { data: fin, isLoading } = useQuery({
        queryKey: ["brand-financials", brand._id],
        queryFn:  () => getBrandFinancials(brand._id),
        enabled:  !!brand._id,
    });

    const f = fin?.data;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
                <Skeleton className="h-52 rounded-xl" />
            </div>
        );
    }

    const hasRevenue = f && f.kpis.totalGross > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={f ? fmt(f.kpis.totalGross) : "NPR 0"}
                    icon={Activity}
                    subtitle={f ? `${f.kpis.totalBookings.toLocaleString()} bookings · ${f.kpis.totalTickets.toLocaleString()} tickets` : "No bookings yet"}
                    changeType="neutral"
                />
                <StatCard
                    title="This Month"
                    value={f ? fmt(f.thisMonth.revenue) : "NPR 0"}
                    icon={Activity}
                    subtitle={f ? `${f.thisMonth.bookings} bookings this month` : undefined}
                    changeType="positive"
                />
                <StatCard
                    title="Pending Settlement"
                    value={f ? fmt(f.settlements.pending) : "NPR 0"}
                    icon={CreditCard}
                    subtitle={f && f.settlements.pendingCount > 0 ? `${f.settlements.pendingCount} settlement${f.settlements.pendingCount !== 1 ? "s" : ""} awaiting payment` : "All settled"}
                    changeType={f && f.settlements.pending > 0 ? "negative" : "neutral"}
                />
                <StatCard
                    title="Platform Cut"
                    value={`${brand.commissionRate ?? 8}%`}
                    icon={Briefcase}
                    subtitle={f && f.kpis.totalGross > 0
                        ? `≈ ${fmt(Math.round(f.kpis.totalGross * (brand.commissionRate ?? 8) / 100))} collected`
                        : brand.bankDetails?.bankName || "Bank not configured"}
                    changeType="neutral"
                />
            </div>

            {/* Monthly Revenue Chart */}
            <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                    <CardTitle className="flex items-center gap-2 text-white">Monthly Revenue</CardTitle>
                    <CardDescription className="text-[11px] text-white/60">
                        Last 12 months — hover bars for details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {hasRevenue ? (
                        <BarChart data={f!.monthlyChart} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
                            <CreditCard className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-xs font-bold">No revenue data yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Trip Counts */}
                <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
                    <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">Trip Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {f ? (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Completed",  value: f.trips.completed,  color: "text-white bg-white/5 border-white/10" },
                                    { label: "Scheduled",  value: f.trips.scheduled,  color: "text-white bg-white/5 border-white/10" },
                                    { label: "In Transit", value: f.trips.inTransit,  color: "text-white bg-white/5 border-white/10" },
                                    { label: "Cancelled",  value: f.trips.cancelled,  color: "text-white bg-white/5 border-white/10" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className={`rounded-xl border p-4 ${color}`}>
                                        <p className="text-2xl font-black leading-none">{value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-70">{label}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No trips yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Fleet Revenue Breakdown */}
                <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
                    <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">Fleet Revenue</CardTitle>
                        <CardDescription className="text-[11px] text-white/60">Top performing buses in this brand</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {f && f.fleetBreakdown.length > 0 ? (
                            <div className="divide-y divide-border">
                                {f.fleetBreakdown.slice(0, 5).map((fb, idx) => (
                                    <div key={fb.busId || idx} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-sm font-black">{fb.bus?.busName || "Unknown Bus"}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{fb.bus?.busNumber || "—"} · {fb.tickets} tickets</p>
                                        </div>
                                        <p className="text-sm font-black text-primary">{fmt(fb.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <p className="text-xs font-bold">No fleet revenue data</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const ActivityTab = () => {
    return (
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white animate-in fade-in duration-300">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-muted/40 rounded-xl mt-6">
                <Activity className="w-10 h-10 mb-4 opacity-20" />
                <p className="text-sm font-bold">No activity</p>
                <p className="text-xs mt-1 opacity-60">Brand-specific administrative logs will appear here.</p>
            </CardContent>
        </Card>
    );
}

const OperatorDetails = () => {
    const { id } = useParams(); // This is the brandId
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ brandName: "", baseCity: "", contactEmail: "", contactPhone: "", commissionRate: "" });

    const { data, isLoading } = useQuery({
        queryKey: ["brand", id],
        queryFn: () => getBrandById(id!),
        enabled: !!id,
    });

    const brand = data?.data;

    const editMutation = useMutation({
        mutationFn: (payload: BrandUpdatePayload) => updateBrand(id!, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand", id] });
            toast.success("Brand updated successfully");
            setEditOpen(false);
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, "Failed to update brand")),
    });

    const handleEditClick = () => {
        if (!brand) return;
        setEditForm({
            brandName: brand.brandName || "",
            baseCity: brand.baseCity || "",
            contactEmail: brand.contactEmail || "",
            contactPhone: brand.contactPhone || "",
            commissionRate: brand.commissionRate ? brand.commissionRate.toString() : "8"
        });
        setEditOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 container mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full max-w-lg" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!brand) return <div className="p-8 text-center text-muted-foreground">Brand not found.</div>;

    return (
        <div className="container mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-11 w-11 rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-primary/20 shadow-sm bg-primary/5">
                            <AvatarImage src={brand.logo} alt={brand.brandName} className="object-cover" />
                            <AvatarFallback className="bg-transparent text-primary text-xl font-black rounded-2xl">
                                {brand.brandName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black tracking-tighter truncate">{brand.brandName}</h2>
                                <Badge variant="outline" className={`text-[10px] font-black border-none px-2.5 py-0.5 uppercase tracking-widest ${brand.status === "ACTIVE" ? "bg-white/5 text-white" : "bg-white/5 text-white"}`}>
                                    {brand.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground mt-1.5 text-xs font-semibold">
                                <p className="uppercase bg-muted/50 px-2 py-0.5 rounded-md text-primary">{brand.brandCode}</p>
                                <p className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Owned by {brand.ownerId?.name || "Bus Owner"}</p>
                                {brand.baseCity && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {brand.baseCity}</p>}
                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Est. {brand.createdAt ? new Date(brand.createdAt).getFullYear() : "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="font-bold rounded-xl h-10" onClick={handleEditClick}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit Brand
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="fleet" className="w-full">
                <TabsList className="inline-flex h-auto p-1.5 bg-muted/40 rounded-2xl border border-border/50 mb-6 gap-1 w-full overflow-x-auto justify-start">
                    <TabsTrigger value="fleet" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <Bus className="w-4 h-4" /> Fleet ({brand.fleetCount || 0})
                    </TabsTrigger>
                    <TabsTrigger value="services" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <Route className="w-4 h-4" /> Route Services
                    </TabsTrigger>
                    <TabsTrigger value="schedules" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <Calendar className="w-4 h-4" /> Schedules
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <Users className="w-4 h-4" /> Drivers
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <UserRoundCheck className="w-4 h-4" /> Staff
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <CreditCard className="w-4 h-4" /> Financials
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
                        <Activity className="w-4 h-4" /> Activity Log
                    </TabsTrigger>
                </TabsList>

                <div className="mt-2">
                    <TabsContent value="fleet">
                        <div className="bg-[#121212]/30 border-white/5 border rounded-2xl p-1 shadow-sm backdrop-blur-md">
                            {/* We will update FleetTab to accept brandId later */}
                            <FleetTab ownerId={brand.ownerId?._id ?? ""} brandId={brand._id} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="services">
                        <div className="bg-[#121212]/30 border-white/5 border rounded-2xl p-4 shadow-sm backdrop-blur-md">
                            <BrandServicesTab brandId={brand._id} />
                        </div>
                    </TabsContent>

                    <TabsContent value="schedules">
                        <div className="bg-[#121212]/30 border-white/5 border rounded-2xl p-4 shadow-sm backdrop-blur-md">
                            <BrandSchedulesTab brandId={brand._id} ownerId={brand.ownerId?._id ?? ""} />
                        </div>
                    </TabsContent>

                    <TabsContent value="drivers">
                        <div className="bg-[#121212]/30 border-white/5 border rounded-2xl p-4 shadow-sm backdrop-blur-md">
                            <DriversTab brandId={brand._id} brandName={brand.brandName} />
                        </div>
                    </TabsContent>

                    <TabsContent value="staff">
                        <div className="bg-[#121212]/30 border-white/5 border rounded-2xl p-4 shadow-sm backdrop-blur-md">
                            <StaffTab brandId={brand._id} brandName={brand.brandName} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="financial">
                        <FinancialTab brand={brand} />
                    </TabsContent>
                    
                    <TabsContent value="activity">
                        <ActivityTab />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Edit Brand Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
                                <Pencil className="w-4 h-4" /> Edit Brand Details
                            </DialogTitle>
                        </DialogHeader>
                        <p className="text-slate-400 text-xs mt-1">Update the public brand profile.</p>
                    </div>
                    <div className="p-6 space-y-4 bg-background">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand Name</Label>
                            <Input className="h-10 rounded-xl font-bold" value={editForm.brandName} onChange={e => setEditForm({ ...editForm, brandName: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Email</Label>
                                <Input placeholder="email@brand.com" className="h-10 rounded-xl"
                                    value={editForm.contactEmail} onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                                <Input placeholder="+977..." className="h-10 rounded-xl"
                                    value={editForm.contactPhone} onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base City</Label>
                                <Input className="h-10 rounded-xl" placeholder="e.g. Kathmandu" value={editForm.baseCity} onChange={e => setEditForm({ ...editForm, baseCity: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Cut (%)</Label>
                                <Input type="number" placeholder="8" className="h-10 rounded-xl font-bold"
                                    value={editForm.commissionRate} onChange={e => setEditForm({ ...editForm, commissionRate: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 bg-background gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(false)} className="font-bold rounded-xl h-10">Cancel</Button>
                        <Button className="h-10 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-6" disabled={editMutation.isPending || !editForm.brandName.trim()} onClick={() => editMutation.mutate({ ...editForm, commissionRate: Number(editForm.commissionRate) })}>
                            {editMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperatorDetails;
