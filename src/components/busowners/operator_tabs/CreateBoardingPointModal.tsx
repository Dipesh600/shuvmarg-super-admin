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
import { Plus, Trash2, MapPin, MapPinned, Clock, Phone } from "lucide-react";
import { useCreateBoardingPoint } from "@/hooks/useBoardingPoints";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface CreateBoardingPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

const CreateBoardingPointModal: React.FC<CreateBoardingPointModalProps> = ({ 
  isOpen, 
  onClose, 
  ownerId 
}) => {
  const createMutation = useCreateBoardingPoint();
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [boardingPoints, setBoardingPoints] = useState([
    { pointName: "", landmark: "", time: "", contactNumber: "" }
  ]);

  const addPoint = () => {
    setBoardingPoints([...boardingPoints, { pointName: "", landmark: "", time: "", contactNumber: "" }]);
  };

  const removePoint = (index: number) => {
    if (boardingPoints.length > 1) {
      const newPoints = boardingPoints.filter((_, i) => i !== index);
      setBoardingPoints(newPoints);
    }
  };

  const updatePoint = (index: number, field: string, value: string) => {
    const newPoints = boardingPoints.map((point, i) => {
      if (i === index) {
        return { ...point, [field]: value };
      }
      return point;
    });
    setBoardingPoints(newPoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      city,
      description,
      ownerId,
      boardingPoints
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
      // Reset form
      setCity("");
      setDescription("");
      setBoardingPoints([{ pointName: "", landmark: "", time: "", contactNumber: "" }]);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <MapPinned className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter">New Boarding Configuration</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Operator ID: {ownerId.slice(-6)}</p>
             </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col pt-6">
          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            <div className="space-y-6 pb-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest ml-1">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      id="city" 
                      placeholder="e.g. Pokhara" 
                      className="pl-10 h-12 font-bold bg-muted/30 border-2 focus-visible:ring-primary/20"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="e.g. Morning Shift" 
                    className="h-12 font-bold bg-muted/30 border-2 focus-visible:ring-primary/20"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Dynamic Points List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-background sticky top-0 z-10 py-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Boarding Locations</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPoint}
                    className="h-8 gap-1.5 font-black uppercase text-[9px] tracking-widest border-2 hover:bg-primary/5 border-primary/20 text-primary"
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
                               className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10" 
                               value={point.pointName}
                               onChange={(e) => updatePoint(index, "pointName", e.target.value)}
                               required 
                             />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 truncate">Landmark</Label>
                             <Input 
                               placeholder="Near Temple" 
                               className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10" 
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
                               className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10" 
                               value={point.time}
                               onChange={(e) => updatePoint(index, "time", e.target.value)}
                               required 
                             />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Contact</Label>
                             <Input 
                               placeholder="98xxxxxxxx" 
                               className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10" 
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
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t gap-3 mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="font-black uppercase tracking-widest text-xs h-12 flex-1 shadow-lg shadow-primary/20"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating Config..." : "Register Configuration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoardingPointModal;
