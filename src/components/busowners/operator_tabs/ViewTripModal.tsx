import React, { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Bus, MapPin, LayoutGrid, Info, Repeat, Eye, Loader2, Navigation, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useFetchTripById } from "@/hooks/useTrips";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDriverToTrip, getDriversByBrand } from "@/api/tripApi";
import { toast } from "sonner";


interface ViewTripModalProps {
   id: string | null;
   isOpen: boolean;
   onClose: () => void;
}

const ViewTripModal: React.FC<ViewTripModalProps> = ({
   id,
   isOpen,
   onClose
}) => {
   const qc = useQueryClient();
   const [selectedDriverId, setSelectedDriverId] = useState("");
   const { data: tripResponse, isLoading } = useFetchTripById(id || "");
   const trip = tripResponse?.data;

   // Only fetch drivers when modal is open and trip has a brand
   const { data: driversData } = useQuery({
      queryKey: ["brand-drivers", trip?.brandId?._id || trip?.brandId],
      queryFn:  () => getDriversByBrand(trip?.brandId?._id || trip?.brandId),
      enabled:  isOpen && !!trip?.brandId,
   });
   const drivers = driversData?.data || [];

   const assignMut = useMutation({
      mutationFn: () => assignDriverToTrip(id!, selectedDriverId),
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: ["trip", id] });
         toast.success("Driver assigned successfully.");
         setSelectedDriverId("");
      },
      onError: (e: any) => toast.error(e.response?.data?.message || "Failed to assign driver"),
   });

   const canAssignDriver = trip && !["completed", "cancelled"].includes(trip.status);

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
            <DialogHeader className="p-6 pb-0 flex-shrink-0">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                        <Eye className="h-5 w-5" />
                     </div>
                     <div>
                        <DialogTitle className="text-2xl font-black tracking-tighter text-primary uppercase">Trip Manifest</DialogTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Operational Details & Routing</p>
                     </div>
                  </div>
                  {trip && (
                     <Badge className="uppercase text-[10px] font-black tracking-widest py-1 px-4 shadow-lg shadow-primary/20">
                        {trip.status}
                     </Badge>
                  )}
               </div>
            </DialogHeader>

            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center py-20 pb-24">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 italic">Aggregating trip data...</p>
               </div>
            ) : trip ? (
               <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
                  <ScrollArea className="flex-1 px-6">
                     <div className="space-y-8 py-6">

                        {/* Trip Identity Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-background p-6 rounded-2xl border shadow-sm">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                 <ShieldCheck className="h-4 w-4 text-primary" />
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Official Trip ID</span>
                              </div>
                              <h2 className="text-3xl font-black tracking-tighter text-primary leading-none uppercase">{trip.tripId}</h2>
                              <div className="flex items-center gap-6">
                                 <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-bold">{new Date(trip.tripDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                 </div>
                                 <Separator orientation="vertical" className="h-4" />
                                 <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest h-6 border-primary/20 text-primary bg-primary/5">
                                    {trip.shift} SHIFT
                                 </Badge>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Standard Fare</span>
                              <div className="text-4xl font-black tracking-tighter text-success flex items-baseline gap-1">
                                 <span className="text-sm">Rs.</span>{trip.tripFare}
                              </div>
                           </div>
                        </div>

                        {/* Logistics Grid */}
                        <div className="grid sm:grid-cols-2 gap-6">
                           {/* Vehicle Context */}
                           <Card className="p-6 border-2 border-muted shadow-none bg-background relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <Bus className="h-16 w-16" />
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                 <Bus className="h-4 w-4 text-primary" />
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vehicle Allocation</h4>
                              </div>
                              <div className="space-y-4">
                                 <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Bus Model</p>
                                    <p className="font-black text-xl tracking-tight uppercase leading-none">{trip.busId?.busName || "N/A"}</p>
                                 </div>
                                 <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Plate Number</p>
                                       <p className="font-bold text-sm tracking-widest text-primary">{trip.busId?.busNumber || "N/A"}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Type</p>
                                       <p className="font-bold text-sm uppercase">{trip.busId?.busType || "N/A"}</p>
                                    </div>
                                 </div>
                              </div>
                           </Card>

                           {/* Route Strategy */}
                           <Card className="p-6 border-2 border-muted shadow-none bg-background relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <Navigation className="h-16 w-16" />
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                 <MapPin className="h-4 w-4 text-primary" />
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Route Specification</h4>
                              </div>
                              <div className="space-y-4">
                                 <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Route Path</p>
                                    <p className="font-black text-xl tracking-tight uppercase leading-none">{trip.routeId?.routeName || "N/A"}</p>
                                 </div>
                                 <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Est. Distance</p>
                                       <p className="font-bold text-sm">{trip.routeId?.distance || "Variable"}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Est. Duration</p>
                                       <p className="font-bold text-sm">{trip.routeId?.duration || "N/A"}</p>
                                    </div>
                                 </div>
                              </div>
                           </Card>
                        </div>

                        {/* Operations Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           <div className="bg-background border-2 p-4 rounded-2xl text-center space-y-1">
                              <Clock className="h-4 w-4 mx-auto text-primary opacity-40" />
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Departs At</p>
                              <p className="font-black text-lg text-primary">{trip.departureTime}</p>
                           </div>
                           <div className="bg-background border-2 p-4 rounded-2xl text-center space-y-1">
                              <Clock className="h-4 w-4 mx-auto text-primary opacity-40" />
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Arrives At</p>
                              <p className="font-black text-lg text-primary">{trip.arrivalTime}</p>
                           </div>
                           <div className="bg-background border-2 p-4 rounded-2xl text-center space-y-1">
                              <LayoutGrid className="h-4 w-4 mx-auto text-primary opacity-40" />
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Seating Model</p>
                              <p className="font-black text-lg text-primary uppercase">{trip.busId?.seatLayout || "N/A"}</p>
                           </div>
                           <div className="bg-background border-2 p-4 rounded-2xl text-center space-y-1">
                              <Repeat className="h-4 w-4 mx-auto text-primary opacity-40" />
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Recurrence</p>
                              <p className="font-black text-lg text-primary uppercase">{trip.recurrence}</p>
                           </div>
                        </div>

                        {/* ── Driver Assignment Card ─────────────────────────── */}
                        <Card className={`p-5 border-2 shadow-none ${trip.driverId ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}`}>
                           <div className="flex items-center gap-2 mb-4">
                              {trip.driverId ? (
                                 <UserCheck className="h-4 w-4 text-emerald-600" />
                              ) : (
                                 <UserX className="h-4 w-4 text-amber-600" />
                              )}
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Driver Assignment</h4>
                           </div>

                           {trip.driverId ? (
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="font-black text-lg tracking-tight">{(trip.driverId as any).fullName || "Driver Assigned"}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{(trip.driverId as any).licenseNumber || ""}</p>
                                 </div>
                                 <Badge className="bg-emerald-100 text-emerald-700 uppercase text-[9px] font-black tracking-widest border-emerald-200">Assigned</Badge>
                              </div>
                           ) : (
                              <div className="space-y-3">
                                 <p className="text-xs font-bold text-amber-700">
                                    ⚠ No driver assigned. Trip cannot move to BOARDING without a driver.
                                 </p>
                                 {canAssignDriver && (
                                    <div className="flex gap-2">
                                       <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                                          <SelectTrigger className="h-9 rounded-xl flex-1">
                                             <SelectValue placeholder="Select a driver..." />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-xl">
                                             {drivers.length === 0 ? (
                                                <SelectItem value="none" disabled>No drivers available</SelectItem>
                                             ) : (
                                                drivers.map((d: any) => (
                                                   <SelectItem key={d._id} value={d._id}>
                                                      {d.fullName} ({d.licenseType})
                                                   </SelectItem>
                                                ))
                                             )}
                                          </SelectContent>
                                       </Select>
                                       <Button
                                          size="sm"
                                          className="h-9 px-4 rounded-xl font-black"
                                          disabled={!selectedDriverId || assignMut.isPending}
                                          onClick={() => assignMut.mutate()}
                                       >
                                          {assignMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Assign"}
                                       </Button>
                                    </div>
                                 )}
                              </div>
                           )}
                        </Card>

                        {/* Automation Details if any */}
                        {trip.recurrence !== "none" && (
                           <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Repeat className="h-5 w-5 text-primary" />
                                 </div>
                                 <div>
                                    <p className="font-black text-sm tracking-tight text-primary">Automated Generation Sync</p>
                                    <p className="text-xs font-bold text-muted-foreground">Trips will auto-generate until this limit</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Generation Limit</p>
                                 <p className="font-black text-lg text-primary">{new Date(trip.autoGenerateUntil).toLocaleDateString()}</p>
                              </div>
                           </div>
                        )}

                     </div>
                  </ScrollArea>
                  <DialogFooter className="p-6 bg-background border-t">
                     <DialogClose asChild>
                        <Button variant="outline" className="w-full font-black uppercase tracking-[0.2em] text-xs h-12 shadow-sm">Review Complete</Button>
                     </DialogClose>
                  </DialogFooter>
               </div>
            ) : (
               <div className="py-20 text-center opacity-50">
                  <Info className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">No active trip configuration found</p>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};

export default ViewTripModal;
