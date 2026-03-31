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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Route, MapPin, Navigation, Clock, Ban } from "lucide-react";
import { useCreateBusRoute } from "@/hooks/useBusRoutes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CreateBusRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

const CreateBusRouteModal: React.FC<CreateBusRouteModalProps> = ({ 
  isOpen, 
  onClose, 
  ownerId 
}) => {
  const createMutation = useCreateBusRoute();
  
  const [routeName, setRouteName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      routeName,
      from,
      to,
      distance,
      duration,
      basePrice: Number(basePrice),
      isRoundTrip,
      returnRouteId: null, // As specified in the target payload
      ownerId
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
      // Reset form
      setRouteName("");
      setFrom("");
      setTo("");
      setDistance("");
      setDuration("");
      setBasePrice("");
      setIsRoundTrip(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <Route className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Add Bus Route</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Define a new travel path</p>
             </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pt-4">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6">
              
              <div className="space-y-2">
                <Label htmlFor="routeName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Route Name</Label>
                <Input 
                  id="routeName"
                  placeholder="e.g. Kathmandu to Pokhara" 
                  className="h-12 font-bold bg-muted/30 border-2" 
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Origin</Label>
                  <Input 
                    id="from"
                    placeholder="e.g. Kathmandu" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Destination</Label>
                  <Input 
                    id="to"
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
                  <Label htmlFor="distance" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> Distance</Label>
                  <Input 
                    id="distance"
                    placeholder="e.g. 145Km" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duration</Label>
                  <Input 
                    id="duration"
                    placeholder="e.g. 8hr" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Base Price (Rs)</Label>
                <Input 
                  id="basePrice"
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

          <DialogFooter className="p-6 bg-muted/20 border-t gap-3 flex-shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 hover:bg-destructive/5 hover:text-destructive transition-colors">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="font-black uppercase tracking-widest text-xs h-12 flex-[2] shadow-lg shadow-primary/20 transition-all hover:tracking-[0.2em]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Save Route Config"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusRouteModal;
