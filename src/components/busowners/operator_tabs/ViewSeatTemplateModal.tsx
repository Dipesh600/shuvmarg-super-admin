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
import { Eye, Armchair, LayoutGrid, Loader2 } from "lucide-react";
import { useFetchSeatTemplateById } from "@/hooks/useSeatTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MiniSeatMapPreview } from "./MiniSeatMapPreview";

interface ViewSeatTemplateModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewSeatTemplateModal: React.FC<ViewSeatTemplateModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchSeatTemplateById(id || "");
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
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Visual Seat Layout</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Configuration Preview</p>
               </div>
            </div>
            {data && (
               <Badge variant={data.isActive ? "default" : "secondary"} className="uppercase text-[10px] font-black tracking-widest py-1 px-3">
                 {data.isActive ? "Active" : "Inactive"}
               </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 italic">Rendering Bus Model...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
             <LayoutGrid className="h-12 w-12 text-destructive/30 mb-4" />
             <p className="text-destructive font-black text-lg tracking-tighter">Visualization Failed</p>
             <p className="text-sm text-muted-foreground font-medium mb-6">Could not retrieve template data from the backend.</p>
             <Button onClick={() => refetch()} variant="outline" className="font-bold">Retry Rendering</Button>
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 pb-4 border-b bg-muted/10">
               <div className="flex justify-between items-end">
                  <div>
                     <h3 className="font-black text-xl tracking-tight leading-none mb-1">{data.templateName}</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                        <Armchair className="h-3 w-3" /> Total Capacity: <span className="text-primary font-black">{data.totalSeats} Seats</span>
                     </p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Top-Down Bus View</p>
                  </div>
               </div>
            </div>

            <ScrollArea className="flex-1 px-6 bg-muted/5 custom-bus-scroll">
              <div className="py-12 flex justify-center">
                {data.seatConfig ? (
                  <MiniSeatMapPreview 
                    config={data.seatConfig} 
                    size="lg" 
                    showLabels={true} 
                  />
                ) : (
                  <div className="p-8 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl text-center max-w-sm">
                      <p className="font-bold text-amber-800 text-sm mb-2">Legacy Layout Detected</p>
                      <p className="text-xs text-amber-700/80">This template was created using the old system and cannot be visualized here. Please click 'Edit' to upgrade this template to the new visual standard.</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/20 border-t flex-shrink-0">
               <DialogClose asChild>
                  <Button variant="outline" className="font-black uppercase tracking-widest text-xs h-12 w-full border-none shadow-md hover:bg-primary hover:text-primary-foreground transition-all">Close Projection</Button>
               </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ViewSeatTemplateModal;
