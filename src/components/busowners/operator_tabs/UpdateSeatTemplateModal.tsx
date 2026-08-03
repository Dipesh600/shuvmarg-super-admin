import { useState, useEffect } from "react";
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
import { Edit, Loader2, LayoutGrid } from "lucide-react";
import { useFetchSeatTemplateById, useUpdateSeatTemplate } from "@/hooks/useSeatTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import SeatMapBuilder from "./SeatMapBuilder";
import type { SeatConfig } from "./SeatMapBuilder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpdateSeatTemplateModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateSeatTemplateModal: React.FC<UpdateSeatTemplateModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchSeatTemplateById(id || "");
  const updateMutation = useUpdateSeatTemplate(id || "");

  const [templateName, setTemplateName] = useState("");
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);
  const [totalSeats, setTotalSeats] = useState(0);

  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  useEffect(() => {
    if (response?.data && isOpen) {
        const data = response.data;
        setTemplateName(data.templateName || "");
        if (data.seatConfig) {
            setSeatConfig(data.seatConfig);
            setTotalSeats(data.totalSeats || 0);
        } else {
            // Fallback for legacy data that hasn't been migrated
            setSeatConfig(null);
            setTotalSeats(data.totalSeats || 0);
        }
    }
  }, [response, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!seatConfig || totalSeats === 0) {
        toast.error("Please configure the seat map layout.");
        return;
    }

    try {
      await updateMutation.mutateAsync({
        templateName,
        seatConfig
      });
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
          "flex flex-col p-0 overflow-hidden border-2 shadow-2xl transition-all duration-300",
          "max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
      )}>
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <Edit className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Modify Seat Template</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Update layout definitions</p>
             </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">Synchronizing with server...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <p className="text-destructive font-bold mb-4 italic tracking-tighter text-lg">Load failed</p>
             <Button variant="outline" onClick={() => refetch()} className="font-black uppercase tracking-widest h-10 px-6">Retry Load</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-muted/5">
            <ScrollArea className="flex-1 px-6 pt-2 pb-6">
               <div className="space-y-6">
                  <div className="p-4 bg-background border rounded-xl shadow-sm space-y-3">
                    <Label htmlFor="templateNameUp" className="text-[10px] font-black uppercase tracking-widest text-primary">Template Name</Label>
                    <Input 
                      id="templateNameUp"
                      placeholder="e.g. Standard Deluxe" 
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
                      {!seatConfig && (
                          <div className="mt-2 p-2 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                              Note: This is a legacy template. Please select a layout from the builder below to upgrade it.
                          </div>
                      )}
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
                <Button type="button" variant="outline" className="font-bold uppercase tracking-widest text-xs h-11 px-8">Discard Changes</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="font-black uppercase tracking-widest text-xs h-11 px-8 shadow-lg shadow-primary/20 hover:tracking-[0.1em] transition-all"
                disabled={updateMutation.isPending || !seatConfig}
              >
                {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</> : "Save Updates"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSeatTemplateModal;
