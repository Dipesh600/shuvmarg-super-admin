import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bus, Star, XCircle, Activity, CalendarClock, IndianRupee, Users, FileText, MessageSquare, BarChart2 } from "lucide-react";
import { useFleetWorkstation } from "@/hooks/useFleetWorkstation";
import OperationsTab from "./workstation/OperationsTab";
import ScheduleTab from "./workstation/ScheduleTab";
import FinancialTab from "./workstation/FinancialTab";
import TimelineTab from "./workstation/TimelineTab";
import ComingSoonTab from "./workstation/ComingSoonTab";
import { getErrorMessage } from "@/lib/error-message";

const FleetWorkstation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: response, isLoading, isError, error } = useFleetWorkstation(id as string);

    if (isLoading) return <WorkstationSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold">Failed to load fleet workstation</h2>
                <p className="text-muted-foreground">{getErrorMessage(error, "Something went wrong")}</p>
                <Button onClick={() => navigate("/admin/fleets")}>Back to Fleets</Button>
            </div>
        );
    }

    const { fleet, today, schedules, recentTrips, upcomingTrips, financials } = response?.data || {};
    if (!fleet) return null;

    const corridor = fleet.corridorId;
    const originName = corridor?.originId?.name || "—";
    const destName = corridor?.destinationId?.name || "—";
    const brand = fleet.brandId;

    const statusColor: Record<string, string> = {
        ACTIVE: "bg-white/5 text-white border-white/10",
        INACTIVE: "bg-white/5 text-white border-white/10",
        MAINTENANCE: "bg-white/5 text-white border-white/10",
    };

    return (
        <div className="space-y-6">
            {/* ── STICKY HEADER ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 border bg-background/50">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-black tracking-tighter truncate">{fleet.busName}</h2>
                        <Badge className={`uppercase px-3 py-0.5 rounded-full text-[10px] tracking-widest font-black border ${statusColor[fleet.status] || "bg-muted"}`}>
                            {fleet.status === "ACTIVE" ? "● LIVE" : fleet.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm tracking-tight flex-wrap">
                        <Bus className="h-4 w-4 shrink-0" />
                        <span className="font-bold">{fleet.busNumber}</span>
                        <span className="opacity-40">•</span>
                        <span>{fleet.busType} {fleet.vehicleType}</span>
                        <span className="opacity-40">•</span>
                        <span>{fleet.totalSeats} seats</span>
                        <span className="opacity-40">•</span>
                        <span>{originName} → {destName}</span>
                    </p>
                    <p className="text-muted-foreground text-xs mt-1 flex items-center gap-2 flex-wrap">
                        {brand && (
                            <span className="flex items-center gap-1">
                                <span className="font-bold">{brand.brandName}</span>
                                <span className="opacity-40">•</span>
                                <span>{brand.commissionRate}% commission</span>
                            </span>
                        )}
                        {fleet.averageRating > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="opacity-40">•</span>
                                <Star className="h-3 w-3 text-white fill-amber-500" />
                                <span className="font-bold">{fleet.averageRating.toFixed(1)}</span>
                                <span className="opacity-50">({fleet.totalReviews})</span>
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* ── TAB NAVIGATION ───────────────────────────────────── */}
            <Tabs defaultValue="operations" className="w-full">
                <TabsList className="w-full justify-start h-11 bg-muted/50 rounded-xl p-1 gap-1 flex-wrap">
                    <TabsTrigger value="operations" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4">
                        <Activity className="h-3.5 w-3.5" /> Operations
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4">
                        <CalendarClock className="h-3.5 w-3.5" /> Schedule
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4">
                        <BarChart2 className="h-3.5 w-3.5" /> Timeline
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4">
                        <IndianRupee className="h-3.5 w-3.5" /> Financial
                    </TabsTrigger>
                    <TabsTrigger value="crew" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4 opacity-50">
                        <Users className="h-3.5 w-3.5" /> Crew
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4 opacity-50">
                        <FileText className="h-3.5 w-3.5" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider px-4 opacity-50">
                        <MessageSquare className="h-3.5 w-3.5" /> Intelligence
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="operations" className="mt-6">
                    <OperationsTab today={today} recentTrips={recentTrips} fleet={fleet} fleetId={id as string} schedules={schedules} />
                </TabsContent>
                <TabsContent value="schedule" className="mt-6">
                    <ScheduleTab schedules={schedules || []} />
                </TabsContent>
                <TabsContent value="timeline" className="mt-6">
                    <TimelineTab schedules={schedules || []} recentTrips={recentTrips || []} upcomingTrips={upcomingTrips || []} />
                </TabsContent>
                <TabsContent value="financial" className="mt-6">
                    <FinancialTab financials={financials} recentTrips={recentTrips || []} />
                </TabsContent>
                <TabsContent value="crew" className="mt-6">
                    <ComingSoonTab icon={Users} title="Crew Accountability" description="Driver assignment tracking, license monitoring, and trip-level accountability ledger." />
                </TabsContent>
                <TabsContent value="documents" className="mt-6">
                    <ComingSoonTab icon={FileText} title="Documents & Compliance" description="Fleet document management, expiry tracking, and automated compliance enforcement." />
                </TabsContent>
                <TabsContent value="intelligence" className="mt-6">
                    <ComingSoonTab icon={MessageSquare} title="Passenger Intelligence" description="Rating trends, review moderation, and complaint resolution workflows." />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const WorkstationSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
);

export default FleetWorkstation;
