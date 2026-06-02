import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, IndianRupee, Percent, ArrowDownRight, Users, Receipt, Minus } from "lucide-react";

interface FinancialTabProps {
    financials: any;
    recentTrips: any[];
    fleet: any;
}

const formatCurrency = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDirection = (variant: any) => {
    if (!variant?.corridorId) return "—";
    const o = variant.corridorId.originId?.name || "?";
    const d = variant.corridorId.destinationId?.name || "?";
    return variant.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

const FinancialTab = ({ financials, recentTrips, fleet }: FinancialTabProps) => {
    if (!financials) return null;

    const periods = [
        { key: "thisMonth", label: "This Month", data: financials.thisMonth },
        { key: "lastMonth", label: "Last Month", data: financials.lastMonth },
        { key: "allTime", label: "All Time", data: financials.allTime },
    ];

    // Trend: compare this month vs last month
    const thisGross = financials.thisMonth?.gross || 0;
    const lastGross = financials.lastMonth?.gross || 0;
    const trendPct = lastGross > 0 ? Math.round(((thisGross - lastGross) / lastGross) * 100) : 0;
    const trendUp = trendPct >= 0;

    return (
        <div className="space-y-6">
            {/* Commission rate badge */}
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-bold px-3 py-1 gap-1.5">
                    <Percent className="h-3 w-3" /> Platform Commission: {financials.commissionRate}%
                </Badge>
                {lastGross > 0 && (
                    <Badge className={`text-xs font-bold px-3 py-1 gap-1 border-0 ${trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                        {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trendPct > 0 ? "+" : ""}{trendPct}% vs last month
                    </Badge>
                )}
            </div>

            {/* 3-window summary cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {periods.map(({ key, label, data }) => (
                    <Card key={key} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 bg-muted/20">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {/* Gross */}
                            <div>
                                <p className="text-2xl font-black tracking-tighter">{formatCurrency(data.gross)}</p>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold">Gross Revenue</p>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Deductions */}
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Minus className="h-3 w-3 text-red-400" /> Commission
                                    </span>
                                    <span className="font-bold text-red-500">-{formatCurrency(data.commission)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <ArrowDownRight className="h-3 w-3 text-red-400" /> Refunds
                                    </span>
                                    <span className="font-bold text-red-500">-{formatCurrency(data.refunds)}</span>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Net */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">Net Revenue</span>
                                <span className="text-lg font-black text-emerald-600">{formatCurrency(data.net)}</span>
                            </div>

                            {/* Counts */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Receipt className="h-3 w-3" /> <span className="font-bold text-foreground">{data.bookingCount}</span> bookings
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" /> <span className="font-bold text-foreground">{data.passengerCount}</span> passengers
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Per-trip revenue table */}
            {recentTrips && recentTrips.length > 0 && (
                <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" /> Per-Trip Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Direction</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Passengers</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Gross</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Occ%</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTrips.slice(0, 20).map((trip: any) => {
                                        const s = trip.stats || {};
                                        return (
                                            <TableRow key={trip._id} className="hover:bg-muted/10">
                                                <TableCell className="font-bold text-sm">{formatDate(trip.tripDate)}</TableCell>
                                                <TableCell className="text-sm">{getDirection(trip.variantId)}</TableCell>
                                                <TableCell className="font-mono text-sm">{s.booked || 0}</TableCell>
                                                <TableCell className="font-bold text-sm">{formatCurrency(s.revenue)}</TableCell>
                                                <TableCell>
                                                    <span className={`font-bold text-sm ${(s.occupancyPct || 0) >= 80 ? "text-emerald-600" : (s.occupancyPct || 0) >= 50 ? "text-amber-600" : "text-muted-foreground"}`}>
                                                        {s.occupancyPct || 0}%
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-2 py-0">{trip.status}</Badge>
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
        </div>
    );
};

export default FinancialTab;
