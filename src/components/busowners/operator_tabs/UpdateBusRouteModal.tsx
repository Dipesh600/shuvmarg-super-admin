import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Route, MapPin, Navigation, Clock, Loader2 } from "lucide-react";
import { useFetchBusRouteById, useUpdateBusRoute } from "@/hooks/useBusRoutes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UpdateBusRouteModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateBusRouteModal: React.FC<UpdateBusRouteModalProps> = ({ 
  id, 
  isOpen, 
  onClose
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchBusRouteById(id || "");
  const updateMutation = useUpdateBusRoute(id || "");
  
  const [routeName, setRouteName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [status, setStatus] = useState(true);

  // Force refetch and reset local state when id changes or modal opens
  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  // Synchronize state with fetched data
  useEffect(() => {
    if (response?.data && isOpen) {
      const data = response.data;
      setRouteName(data.routeName || "");
      setFrom(data.from || "");
      setTo(data.to || "");
      setDistance(data.distance || "");
      setDuration(data.duration || "");
      setBasePrice(data.basePrice?.toString() || "");
      setIsRoundTrip(data.isRoundTrip || false);
      setStatus(data.status === "ACTIVE");
    }
  }, [response, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const payload = {
      routeName,
      from,
      to,
      distance,
      duration,
      basePrice: Number(basePrice),
      isRoundTrip,
      status: status ? "ACTIVE" : "INACTIVE",
      returnRouteId: null, // Based on payload requirements
    };

    try {
      await updateMutation.mutateAsync(payload);
      onClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                  <Route className="h-5 w-5 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Modify Bus Route</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: {id?.slice(-8)}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border shadow-inner">
              <span className={`text-[10px] font-black uppercase tracking-widest ${status ? "text-primary" : "text-muted-foreground"}`}>
                {status ? "Active" : "Inactive"}
              </span>
              <Switch 
                checked={status} 
                onCheckedChange={setStatus} 
              />
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
            <p className="font-extrabold uppercase tracking-widest text-[10px] text-muted-foreground">Synchronizing data...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-10">
            <p className="text-destructive font-bold mb-4 opacity-70 italic tracking-tighter text-lg">Load failed</p>
            <Button variant="outline" onClick={() => refetch()} className="font-black uppercase tracking-widest h-11 px-10 border-destructive text-destructive hover:bg-destructive/5 transition-all">Retry Synchronization</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pt-4">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                
                <div className="space-y-2">
                  <Label htmlFor="routeNameUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Route Name</Label>
                  <Input 
                    id="routeNameUp"
                    placeholder="e.g. Kathmandu to Pokhara" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Origin</Label>
                    <Input 
                      id="fromUp"
                      placeholder="e.g. Kathmandu" 
                      className="h-12 font-bold bg-muted/30 border-2" 
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Destination</Label>
                    <Input 
                      id="toUp"
                      placeholder="e.g. Pokhara" 
                      className="h-12 font-bold bg-muted/30 border-2" 
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distanceUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> Distance</Label>
                    <Input 
                      id="distanceUp"
                      placeholder="e.g. 145Km" 
                      className="h-12 font-bold bg-muted/30 border-2" 
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duration</Label>
                    <Input 
                      id="durationUp"
                      placeholder="e.g. 8hr" 
                      className="h-12 font-bold bg-muted/30 border-2" 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePriceUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Base Price (Rs)</Label>
                  <Input 
                    id="basePriceUp"
                    type="number"
                    placeholder="e.g. 900" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required 
                  />
                </div>

                <Separator className="opacity-50" />

                <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border-2 border-dashed border-muted">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-black tracking-tight flex items-center gap-2">Round Trip Config</Label>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Enable reverse booking</p>
                  </div>
                  <Switch 
                    checked={isRoundTrip}
                    onCheckedChange={setIsRoundTrip}
                  />
                </div>

              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/20 border-t gap-3 flex-shrink-0 mt-auto">
              <DialogClose asChild>
                 <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 hover:bg-destructive/5 hover:text-destructive transition-colors border-2 border-transparent hover:border-destructive/10">Discard Changes</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="font-black uppercase tracking-widest text-xs h-12 flex-[2] shadow-lg shadow-primary/20 transition-all hover:tracking-[0.2em]"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Applying Updates..." : "Save Route Config"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBusRouteModal;
