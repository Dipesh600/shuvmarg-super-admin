import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, LayoutGrid, Route, MapPin, Zap, Bookmark, Bus } from "lucide-react";
import { useFetchOwnerDetail } from "@/hooks/useFetchBusOwner";
import BoardingPointsTab from "@/components/busowners/operator_tabs/BoardingPointsTab";
import AmenitiesTab from "@/components/busowners/operator_tabs/AmenitiesTab";
import BusRouteTab from "@/components/busowners/operator_tabs/BusRouteTab";
import SeatTemplateTab from "@/components/busowners/operator_tabs/SeatTemplateTab";
import BusTripTab from "@/components/busowners/operator_tabs/BusTripTab";
import FleetTab from "@/components/busowners/operator_tabs/FleetTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const OperatorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: ownerResponse, isLoading } = useFetchOwnerDetail(id);
    const owner = ownerResponse?.data;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full max-w-2xl" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bus-owners")} className="shrink-0 border bg-background/50">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                            <AvatarImage src={owner?.profileImg || owner?.profilePicture} alt={owner?.name} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {owner?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black tracking-tighter truncate">{owner?.name || "Operator Management"}</h2>
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                    Operator
                                </div>
                            </div>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2 font-mono text-xs tracking-tighter">
                                <User className="h-3 w-3" />
                                {id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="fleet" className="w-full">
                <TabsList className="bg-muted/40 p-1 border h-auto flex flex-wrap justify-start gap-1 mb-8 rounded-xl max-w-fit">

                    <TabsTrigger value="boarding-point" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <MapPin className="h-3.5 w-3.5" /> Boarding Point
                    </TabsTrigger>
                    <TabsTrigger value="amenities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <Zap className="h-3.5 w-3.5" /> Amenities
                    </TabsTrigger>
                    <TabsTrigger value="bus-route" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <Route className="h-3.5 w-3.5" /> Bus Route
                    </TabsTrigger>
                    <TabsTrigger value="seat-template" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <LayoutGrid className="h-3.5 w-3.5" /> Seat Template
                    </TabsTrigger>
                    <TabsTrigger value="fleet" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <Bus className="h-3.5 w-3.5" /> Fleet
                    </TabsTrigger>
                    <TabsTrigger value="bus-trip" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-tight transition-all">
                        <Bookmark className="h-3.5 w-3.5" /> Bus Trip
                    </TabsTrigger>

                </TabsList>

                <div className="bg-background/50 backdrop-blur-sm border rounded-3xl p-6 md:p-8 shadow-sm">
                    <TabsContent value="fleet">
                        <FleetTab ownerId={id as string} />
                    </TabsContent>
                    <TabsContent value="boarding-point">
                        <BoardingPointsTab ownerId={id as string} />
                    </TabsContent>
                    <TabsContent value="amenities">
                        <AmenitiesTab ownerId={id as string} />
                    </TabsContent>
                    <TabsContent value="bus-route">
                        <BusRouteTab ownerId={id as string} />
                    </TabsContent>
                    <TabsContent value="seat-template">
                        <SeatTemplateTab ownerId={id as string} />
                    </TabsContent>
                    <TabsContent value="bus-trip">
                        <BusTripTab ownerId={id as string} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default OperatorDetails;
