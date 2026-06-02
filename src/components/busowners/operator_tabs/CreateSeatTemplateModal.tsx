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
import { LayoutGrid, Loader2 } from "lucide-react";
import { useCreateSeatTemplate } from "@/hooks/useSeatTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import SeatMapBuilder, { SeatConfig } from "./SeatMapBuilder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateSeatTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const CreateSeatTemplateModal: React.FC<CreateSeatTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  userId 
}) => {
  const [templateName, setTemplateName] = useState("");
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);
  const [totalSeats, setTotalSeats] = useState(0);

  const createMutation = useCreateSeatTemplate();

  const resetForm = () => {
    setTemplateName("");
    setSeatConfig(null);
    setTotalSeats(0);
  };

  const handleClose = () => {
      resetForm();
      onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatConfig || totalSeats === 0) {
        toast.error("Please configure the seat map layout.");
        return;
    }
    
    try {
      await createMutation.mutateAsync({
        templateName,
        seatConfig,
        userId
      });
      handleClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
          "flex flex-col p-0 overflow-hidden border-2 shadow-2xl transition-all duration-300",
          "max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
      )}>
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <LayoutGrid className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Create Seat Template</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Design a reusable layout for your fleet</p>
             </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-muted/5">
          <ScrollArea className="flex-1 px-6 pt-2 pb-6">
             <div className="space-y-6">
                <div className="p-4 bg-background border rounded-xl shadow-sm space-y-3">
                  <Label htmlFor="templateName" className="text-[10px] font-black uppercase tracking-widest text-primary">Template Name</Label>
                  <Input 
                    id="templateName"
                    placeholder="e.g. Standard 2x2 Deluxe (37 Seats)" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                      <LayoutGrid className="w-4 h-4" /> Layout Builder
                    </h4>
                    <p className="text-xs text-muted-foreground">Choose a base shape and configure the seating arrangement. This layout can be applied to any bus in your fleet.</p>
                  </div>
                  
                  <SeatMapBuilder 
                    value={seatConfig}
                    onChange={(cfg, total) => {
                        setSeatConfig(cfg);
                        setTotalSeats(total);
                    }}
                  />
                </div>
             </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-muted/20 border-t flex justify-between flex-shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="font-bold uppercase tracking-widest text-xs h-11 px-8">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="font-black uppercase tracking-widest text-xs h-11 px-8 shadow-lg shadow-primary/20 hover:tracking-[0.1em] transition-all"
              disabled={createMutation.isPending || !seatConfig}
            >
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSeatTemplateModal;
