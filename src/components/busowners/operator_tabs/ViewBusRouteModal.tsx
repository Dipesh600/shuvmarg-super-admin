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
import { Route, MapPin, Navigation, Clock, Loader2, Info, Activity, Calendar, Eye, HandCoins } from "lucide-react";
import { useFetchBusRouteById } from "@/hooks/useBusRoutes";
import { Separator } from "@/components/ui/separator";

interface ViewBusRouteModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewBusRouteModal: React.FC<ViewBusRouteModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchBusRouteById(id || "");
  const data = response?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Eye className="h-5 w-5" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Route Details</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Read-only overview</p>
               </div>
            </div>
            
            {data && (
                <Badge variant={data.status === "ACTIVE" ? "default" : "outline"} className="uppercase text-[10px] font-black tracking-widest py-1 px-3">
                  {data.status || "Unknown Status"}
                </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
             <Loader2 className="h-12 w-12 text-primary animate-spin" />
             <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Fetching route details...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 px-10 text-center">
             <Info className="h-12 w-12 text-destructive opacity-50" />
             <h3 className="font-black text-lg">Load Failed</h3>
             <p className="text-sm text-muted-foreground font-medium">We couldn&apos;t retrieve the route details.</p>
             <Button onClick={() => refetch()} variant="outline" className="mt-4 font-bold h-10 px-6">Retry Load</Button>
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col min-h-0 pt-6">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pt-0">
              <div className="space-y-6 pb-6">
                
                {/* ID & Date Info */}
                <div className="grid grid-cols-2 gap-8 ring-1 ring-muted p-4 rounded-2xl bg-muted/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Created On</p>
                    <p className="text-xs font-bold">{data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Route ID</p>
                    <p className="text-[10px] font-mono opacity-50 truncate">{data._id}</p>
                  </div>
                </div>

                {/* Main Identity */}
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Route Name</p>
                  <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-muted">
                    <div className="flex items-center gap-3">
                        <Route className="h-5 w-5 text-primary" />
                        <h4 className="font-black text-lg tracking-tight">{data.routeName}</h4>
                    </div>
                    {data.isRoundTrip && (
                      <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase">Round Trip</Badge>
                    )}
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Locations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border-2 border-muted/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase opacity-40 flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> Origin</p>
                        <p className="font-bold text-base tracking-tight">{data.from}</p>
                    </div>
                  </div>
                  <div className="bg-background rounded-xl p-4 border-2 border-muted/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/80" />
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase opacity-40 flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> Destination</p>
                        <p className="font-bold text-base tracking-tight">{data.to}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1 ml-1"><Navigation className="h-3 w-3" /> Distance</p>
                    <p className="font-black text-sm p-3 bg-muted/30 rounded-lg text-center">{data.distance}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1 ml-1"><Clock className="h-3 w-3" /> Duration</p>
                    <p className="font-black text-sm p-3 bg-muted/30 rounded-lg text-center">{data.duration}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1 ml-1 text-primary"><HandCoins className="h-3 w-3" /> Base Price</p>
                    <p className="font-black text-sm p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-center">Rs. {data.basePrice}</p>
                  </div>
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

export default ViewBusRouteModal;
