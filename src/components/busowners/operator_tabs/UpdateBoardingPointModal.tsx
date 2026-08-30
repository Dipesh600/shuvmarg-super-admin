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
import { Plus, Trash2, MapPin, MapPinned, Clock, Phone, Loader2, Activity } from "lucide-react";
import { useFetchBoardingPointById, useUpdateBoardingPoint } from "@/hooks/useBoardingPoints";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardingPointLocationInput } from "@/api/boardingPointsApi";

interface UpdateBoardingPointModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateBoardingPointModal: React.FC<UpdateBoardingPointModalProps> = (props) => (
  <UpdateBoardingPointModalInstance key={props.isOpen ? `open-${props.id || "new"}` : "closed"} {...props} />
);

const UpdateBoardingPointModalInstance: React.FC<UpdateBoardingPointModalProps> = ({
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchBoardingPointById(id || "");
  const updateMutation = useUpdateBoardingPoint(id || "");
  
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [boardingPoints, setBoardingPoints] = useState<BoardingPointLocationInput[]>([]);
  const [syncedData, setSyncedData] = useState<unknown>(null);

  // Force refetch and reset local state when id changes or modal opens
  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  if (response?.data && isOpen && syncedData !== response.data) {
      setSyncedData(response.data);
      const { city, description, status, boardingPoints } = response.data;
      setCity(city || "");
      setDescription(description || "");
      setStatus(status !== undefined ? status : true);
      setBoardingPoints(boardingPoints || []);
  }

  const addPoint = () => {
    setBoardingPoints([...boardingPoints, { pointName: "", landmark: "", time: "", contactNumber: "" }]);
  };

  const removePoint = (index: number) => {
    if (boardingPoints.length > 1) {
      setBoardingPoints(boardingPoints.filter((_, i) => i !== index));
    }
  };

  const updatePoint = (index: number, field: keyof BoardingPointLocationInput, value: string) => {
    setBoardingPoints(boardingPoints.map((point, i) => 
      i === index ? { ...point, [field]: value } : point
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const payload = {
      city,
      description,
      status,
      boardingPoints: boardingPoints.map(({ pointName, landmark, time, contactNumber }) => ({
        pointName,
        landmark,
        time,
        contactNumber,
      }))
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
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <MapPinned className="h-5 w-5" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Update Configuration</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: {id?.slice(-8)}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
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
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
             <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
             <p className="font-extrabold uppercase tracking-widest text-[10px] text-muted-foreground">Fetching configuration...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-10">
             <p className="text-destructive font-bold mb-4">Failed to load configuration data.</p>
             <Button variant="outline" onClick={() => refetch()} className="font-black uppercase tracking-widest h-10 px-8">Retry Load</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6 font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city-up" className="text-[10px] font-black uppercase tracking-widest ml-1">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                      <Input 
                        id="city-up" 
                        placeholder="e.g. Pokhara" 
                        className="pl-10 h-12 font-bold bg-muted/30 border-2"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc-up" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Description</Label>
                    <Input 
                      id="desc-up" 
                      placeholder="e.g. Morning Shift" 
                      className="h-12 font-bold bg-muted/30 border-2"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-background sticky top-0 z-10 py-2">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <Label className="text-[10px] font-black uppercase tracking-widest">Pickup Locations</Label>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addPoint}
                      className="h-8 gap-1.5 font-black uppercase text-[9px] tracking-widest border-2 border-primary/20 text-primary"
                    >
                      <Plus className="h-3 w-3" /> Add Point
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {boardingPoints.map((point, index) => (
                      <Card key={index} className="border-2 border-muted bg-muted/10 relative overflow-hidden group shadow-none transition-all hover:border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Point Name</Label>
                               <Input 
                                 placeholder="Lakeside" 
                                 className="h-10 font-bold bg-background border-2" 
                                 value={point.pointName}
                                 onChange={(e) => updatePoint(index, "pointName", e.target.value)}
                                 required 
                               />
                            </div>
                            <div className="space-y-1.5">
                               <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 truncate">Landmark</Label>
                               <Input 
                                 placeholder="Near Temple" 
                                 className="h-10 font-bold bg-background border-2" 
                                 value={point.landmark}
                                 onChange={(e) => updatePoint(index, "landmark", e.target.value)}
                                 required 
                               />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Time</Label>
                               <Input 
                                 placeholder="7:00 AM" 
                                 className="h-10 font-bold bg-background border-2" 
                                 value={point.time}
                                 onChange={(e) => updatePoint(index, "time", e.target.value)}
                                 required 
                               />
                            </div>
                            <div className="space-y-1.5">
                               <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Contact</Label>
                               <Input 
                                 placeholder="98xxxxxxxx" 
                                 className="h-10 font-bold bg-background border-2" 
                                 value={point.contactNumber}
                                 onChange={(e) => updatePoint(index, "contactNumber", e.target.value)}
                                 required 
                               />
                            </div>
                          </div>
                          
                          {boardingPoints.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePoint(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/20 border-t gap-3 mt-auto">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="font-black uppercase tracking-widest text-xs h-12 flex-1 shadow-lg shadow-primary/20"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Configuration"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBoardingPointModal;
