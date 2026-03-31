import React from "react";
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
import { Bus, MapPin, Users, Settings, Activity, Calendar, Eye, ShieldCheck, Map, Wifi } from "lucide-react";
import { useFetchFleetDetail } from "@/hooks/useOwnerFleets";
import { Separator } from "@/components/ui/separator";

interface ViewOwnerFleetModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewOwnerFleetModal: React.FC<ViewOwnerFleetModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchFleetDetail(id || "");
  const data = response?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Eye className="h-5 w-5" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Fleet Overview</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Read-only details</p>
               </div>
            </div>
            
            {data && (
               <div className="flex items-center gap-2">
                  <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"} className="uppercase text-[10px] font-black tracking-widest py-1 px-3">
                    {data.status || "Unknown Status"}
                  </Badge>
                  {data.approvalStatus === "APPROVED" && (
                    <div className="flex items-center gap-1 text-success text-[10px] font-black uppercase tracking-widest bg-success/10 px-2 py-1 rounded-full border border-success/20">
                      <ShieldCheck className="h-3 w-3" /> Approved
                    </div>
                  )}
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
             <div className="animate-spin p-3 bg-primary/10 rounded-full">
                <Bus className="h-8 w-8 text-primary" />
             </div>
             <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Gathering Fleet Intelligence...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 px-10 text-center">
             <Activity className="h-12 w-12 text-destructive opacity-50" />
             <h3 className="font-black text-lg">Load Failed</h3>
             <p className="text-sm text-muted-foreground font-medium">We couldn&apos;t retrieve the fleet profile details.</p>
             <Button onClick={() => refetch()} variant="outline" className="mt-4 font-bold h-10 px-6">Retry Fetch</Button>
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col min-h-0 pt-6">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pt-0 space-y-8">
              
              {/* Photo Gallery */}
              {data.fleetImages && data.fleetImages.length > 0 ? (
                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Fleet Images</p>
                   <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                      {data.fleetImages.map((img: string, i: number) => (
                        <div key={i} className="min-w-[200px] h-32 rounded-xl border-2 border-muted overflow-hidden snap-center relative group">
                           <img src={img} alt={`${data.busName} view ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Bus className="h-4 w-4 opacity-50" /> No Images Assigned
                    </p>
                </div>
              )}

              {/* Core Identity */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-muted bg-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70 mb-1 flex items-center gap-1.5 mt-0.5"><Bus className="h-3 w-3" /> Bus Name</p>
                      <h4 className="font-black text-lg tracking-tight leading-none">{data.busName}</h4>
                  </div>
                  <div className="p-4 rounded-xl border border-muted bg-muted/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-1">Registration #</p>
                      <h4 className="font-mono font-bold text-lg tracking-wider text-primary leading-none uppercase">{data.busNumber}</h4>
                  </div>
              </div>

              {/* Specification Grid */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Specifications</p>
                <div className="grid grid-cols-3 gap-3">
                   <div className="p-3 bg-muted/20 rounded-lg border text-center">
                      <Settings className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Class</p>
                      <p className="text-sm font-bold">{data.busType}</p>
                   </div>
                   <div className="p-3 bg-muted/20 rounded-lg border text-center">
                      <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Capacity</p>
                      <p className="text-sm font-bold">{data.totalSeats} Seats</p>
                   </div>
                   <div className="p-3 bg-muted/20 rounded-lg border text-center">
                      <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Reg. Year</p>
                      <p className="text-sm font-bold">{data.registrationYear}</p>
                   </div>
                   <div className="p-3 bg-muted/20 rounded-lg border text-center">
                      <MapPin className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Layout</p>
                      <p className="text-sm font-bold">{data.seatLayout}</p>
                   </div>
                   <div className="p-3 bg-muted/20 rounded-lg border text-center col-span-2">
                      <Activity className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">System Identifiers</p>
                      <p className="text-xs font-mono font-bold opacity-80 mt-1">{data.fleetId}</p>
                   </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Populated Boarding & Amenities Data */}
              <div className="grid sm:grid-cols-2 gap-6">
                 
                 {/* Amenities Block */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1.5 ml-1">
                      <Wifi className="h-3 w-3" /> Amenities Bundle
                    </p>
                    {data.amenitiesId ? (
                        <div className="bg-muted/10 border p-3 rounded-xl">
                            <ul className="space-y-2">
                               {data.amenitiesId.amenities?.map((am: any, idx: number) => (
                                   <li key={idx} className="flex gap-2 items-start text-xs border-b border-muted/50 pb-2 last:border-0 last:pb-0">
                                       <span className="h-4 w-4 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5"><Wifi className="h-2 w-2 text-primary" /></span>
                                       <div>
                                          <p className="font-bold">{am.name}</p>
                                          <p className="text-[9px] text-muted-foreground opacity-80">{am.description}</p>
                                       </div>
                                   </li>
                               ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-muted/10 border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground">Not Assigned</p>
                        </div>
                    )}
                 </div>

                 {/* Boarding Block */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1.5 ml-1">
                      <Map className="h-3 w-3" /> Boarding Route
                    </p>
                    {data.boardingPointId ? (
                        <div className="bg-muted/10 border p-3 rounded-xl">
                            <div className="mb-2 pb-2 border-b">
                               <p className="text-[10px] font-black tracking-widest uppercase opacity-40 mb-1">City Hub</p>
                               <p className="text-sm font-bold text-primary">{data.boardingPointId.city}</p>
                            </div>
                            <ul className="space-y-3 pt-1">
                               {data.boardingPointId.boardingPoints?.map((bp: any, idx: number) => (
                                   <li key={idx} className="flex gap-2 items-start text-xs">
                                       <span className="h-4 w-4 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-primary mt-0.5">{idx + 1}</span>
                                       <div>
                                          <p className="font-bold flex justify-between">
                                            {bp.pointName} <span className="font-mono bg-muted px-1 rounded">{bp.time}</span>
                                          </p>
                                          <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">📞 {bp.contactNumber}</p>
                                       </div>
                                   </li>
                               ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-muted/10 border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground">Not Assigned</p>
                        </div>
                    )}
                 </div>

              </div>
              
            </div>

            <DialogFooter className="p-6 bg-muted/20 border-t flex-shrink-0 mt-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="font-black uppercase tracking-widest text-xs h-12 w-full hover:bg-primary hover:text-primary-foreground transition-all border-none shadow-md">Close Overview</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ViewOwnerFleetModal;
