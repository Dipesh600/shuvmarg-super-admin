import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Bus, 
  Wifi, 
  Snowflake, 
  Usb, 
  User, 
  Mail, 
  Home, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Zap,
  Coffee,
  Disc,
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/hooks/use-model-store";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useFleetById } from "@/hooks/useFetchAllFleets";
import FleetProfileSkeleton from "@/components/Skeletion_Loading/FleetProfileSkeleton";

const BusDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { onOpen } = useModal();

    const { data: fleetResponse, isLoading, isError, error } = useFleetById(id as string);

    const getAmenityIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("wifi")) return <Wifi className="h-4 w-4" />;
        if (lowerName.includes("charging") || lowerName.includes("usb")) return <Usb className="h-4 w-4" />;
        if (lowerName.includes("ac") || lowerName.includes("air")) return <Snowflake className="h-4 w-4" />;
        if (lowerName.includes("water")) return <Coffee className="h-4 w-4" />;
        if (lowerName.includes("tv") || lowerName.includes("entertainment")) return <Disc className="h-4 w-4" />;
        return <Zap className="h-4 w-4" />;
    };

    if (isLoading) return <FleetProfileSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold">Failed to fetch fleet details</h2>
                <p className="text-muted-foreground">{(error as any)?.message || "Something went wrong"}</p>
                <Button onClick={() => navigate("/admin/fleets")}>Back to Fleets</Button>
            </div>
        );
    }

    const fleet = fleetResponse?.data;
    const selectedAmenities: any[] = Array.isArray(fleet?.vehicle?.features)
        ? fleet.vehicle.features
        : Array.isArray(fleet?.features)
            ? fleet.features
        : Array.isArray(fleet?.amenityIds)
            ? fleet.amenityIds
            : Array.isArray(fleet?.amenitiesId?.amenities) ? fleet.amenitiesId.amenities : [];

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case "ACTIVE": return "default";
            case "INACTIVE": return "destructive";
            default: return "secondary";
        }
    };

    const getApprovalVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case "APPROVED": return "default";
            case "PENDING": return "secondary";
            case "REJECTED": return "destructive";
            default: return "outline";
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/fleets")} className="shrink-0 border bg-background/50">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-black tracking-tighter truncate">{fleet.busName}</h2>
                        <Badge variant={getApprovalVariant(fleet.approvalStatus)} className="uppercase px-3 py-0.5 rounded-full text-[10px] tracking-widest font-black">
                            {fleet.approvalStatus}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm tracking-tighter">
                        <Bus className="h-4 w-4" />
                        {fleet.busNumber} • {fleet.fleetId}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button onClick={() => onOpen("editBus", {})} variant="outline" className="gap-2 flex-1 md:flex-none h-11 px-6 shadow-sm border-primary/20">
                        <Edit className="h-4 w-4 text-primary" />
                        Edit Bus
                    </Button>
                    <SuspendDialog
                        entityType="bus"
                        entityName={fleet.busName}
                        currentStatus={fleet.status}
                        entityId={id ?? ""}
                    />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Vehicle & Owner Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Vehicle Overview Card */}
                    <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden group">
                        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Bus className="h-4 w-4" /> Vehicle Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-6 rounded-3xl bg-primary/5 group-hover:bg-primary/10 transition-colors border border-primary/5 shadow-inner">
                                    <Bus className="h-16 w-16 text-primary drop-shadow-sm" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter">{fleet.busNumber}</h3>
                                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1 opacity-70 italic">{fleet.busType} CATEGORY</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={getStatusVariant(fleet.status)} className="rounded-full px-4 py-1 uppercase text-[10px] font-black tracking-widest">
                                        {fleet.status}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full border-muted-foreground/30 px-3 py-1 text-[10px] uppercase tracking-tighter">
                                        YEAR {fleet.registrationYear}
                                    </Badge>
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 opacity-60">Total Seats</p>
                                    <p className="text-3xl font-black text-primary">{fleet.totalSeats}</p>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 opacity-60">Layout</p>
                                    <p className="text-3xl font-black text-primary uppercase">{fleet.seatLayout}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Owner Information Card */}
                    <Card className="shadow-lg border-l-4 border-l-primary/60">
                        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-white">
                                <User className="h-4 w-4" /> Owner Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-muted/60">
                                    <div className="p-3 rounded-full bg-background border shadow-sm">
                                        <User className="h-6 w-6 text-primary/70" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5 opacity-60">Owner Name</p>
                                        <p className="font-black text-lg leading-none tracking-tighter">{fleet.ownerId.name}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 px-2">
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center border group-hover:bg-primary/10 transition-colors">
                                            <Mail className="h-4 w-4 text-primary/60" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Email Address</p>
                                            <p className="font-bold text-sm truncate max-w-[200px]">{fleet.ownerId.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center border group-hover:bg-primary/10 transition-colors">
                                            <Home className="h-4 w-4 text-primary/60" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Office Address</p>
                                            <p className="font-bold text-sm">{fleet.ownerId.address}</p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="link" className="p-0 h-auto justify-start text-primary font-black text-xs uppercase transition-all hover:tracking-widest" onClick={() => navigate(`/admin/users/${fleet.ownerId._id}`)}>
                                    View Full History →
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visuals & Boarding Points */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Visual Highlights & Amenities */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image Showcase */}
                        <Card className="shadow-lg border-primary/10">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Zap className="h-4 w-4 text-warning" /> Fleet Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {fleet.fleetImages && fleet.fleetImages.length > 0 ? (
                                        fleet.fleetImages.map((img: string, idx: number) => (
                                            <div key={idx} className="relative group overflow-hidden rounded-2xl border aspect-[4/3] bg-muted/20 shadow-sm">
                                                <img src={img} alt={`Fleet ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Badge className="bg-white/20 backdrop-blur-md border-white/40">View</Badge>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/10 opacity-50">
                                            <Bus className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No images uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amenities */}
                        <Card className="shadow-lg border-primary/10 h-full">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <ShieldCheck className="h-4 w-4 text-success" /> Vehicle Amenities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="flex flex-wrap gap-3">
                                    {selectedAmenities.map((amenity: any, index: number) => (
                                        <div key={amenity.id || amenity._id || index} className="flex items-center gap-3 p-3 pr-5 bg-background border border-primary/5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group cursor-default">
                                            <div className="p-2.5 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                {getAmenityIcon(typeof amenity === "string" ? amenity : amenity.name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{typeof amenity === "string" ? amenity : amenity.name}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium opacity-50">Included</span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedAmenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities selected for this fleet.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Boarding Points Section */}
                    <Card className="shadow-lg border-l-4 border-l-primary/60 border-primary/10">
                        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-white">
                                <MapPin className="h-4 w-4 text-primary" /> Boarding Points Configuration
                            </CardTitle>
                            <CardDescription className="text-xs uppercase tracking-widest font-medium opacity-50 italic">
                                Primary boarding points in {fleet.boardingPointId?.city}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                {fleet.boardingPointId?.boardingPoints?.map((point: any) => (
                                    <div key={point._id} className="relative group p-6 rounded-3xl bg-muted/10 border border-muted/50 hover:bg-muted/20 hover:border-primary/20 transition-all overflow-hidden flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-background border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                            <MapPin className="h-6 w-6 text-primary/70" />
                                        </div>
                                        <div className="space-y-4 flex-1 min-w-0">
                                            <div>
                                                <p className="font-black text-xl tracking-tighter truncate">{point.pointName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                     <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary/30 text-primary uppercase font-black tracking-widest h-5">{point.time}</Badge>
                                                     <p className="text-xs font-bold text-muted-foreground truncate italic">via {point.landmark}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-muted/80">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Reporting Number</span>
                                                    <span className="font-bold text-xs">{point.contactNumber}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Coordinates</span>
                                                    <span className="text-[10px] text-primary/80">{point.coordinates.lat?.toFixed(3)}N, {point.coordinates.lng?.toFixed(3)}E</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100" />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <Info className="h-5 w-5 text-primary opacity-60 shrink-0" />
                                <p className="text-xs font-bold text-muted-foreground tracking-tight italic">
                                    {fleet.boardingPointId?.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Summary */}
                    <Card className="shadow-lg h-32 flex items-center justify-center opacity-40 grayscale pointer-events-none overflow-hidden relative group">
                         <div className="text-center space-y-1 relative z-10 transition-all group-hover:scale-105">
                             <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                             <p className="text-sm font-black uppercase tracking-[0.2em]">{fleet.recentTrips?.length > 0 ? "Recent Activity" : "No Recent Analytics"}</p>
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest italic uppercase">Operations log integrated soon</p>
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Card>
                </div>
            </div>
        </>
    );
};

export default BusDetail;
