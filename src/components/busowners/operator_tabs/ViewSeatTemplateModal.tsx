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

  // Helper to chunk arrays into pairs for 2x2 layout
  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const aRows = data?.seata ? chunkArray(data.seata, 2) : [];
  const bRows = data?.seatb ? chunkArray(data.seatb, 2) : [];
  const cSeats = data?.seatc || [];

  const maxRows = Math.max(aRows.length, bRows.length);

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
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Coach View</p>
                     <div className="flex gap-1.5 justify-end">
                        <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" title="Available Seat"></div>
                        <div className="w-3 h-3 rounded-sm bg-muted border" title="Aisle/Corridor"></div>
                     </div>
                  </div>
               </div>
            </div>

            <ScrollArea className="flex-1 px-6 bg-muted/5">
              <div className="py-12 flex justify-center">
                {/* Bus Interior Mockup */}
                <div className="relative bg-background border-[6px] border-muted rounded-[40px] p-8 px-10 shadow-xl min-w-[320px] max-w-full">
                  
                  {/* Driver Area Label */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-3">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] opacity-40">Front / Driver Side</p>
                  </div>

                  <div className="space-y-3">
                    {/* Seat Rows A & B */}
                    {Array.from({ length: maxRows }).map((_, rowIndex) => (
                      <div key={rowIndex} className="flex gap-10 items-center justify-center">
                        {/* Seata Column (2 seats) */}
                        <div className="flex gap-2">
                           {aRows[rowIndex]?.map((seat: any) => (
                             <div key={seat._id} className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                               <span className="text-[10px] font-black text-primary uppercase">{seat.seatNo}</span>
                             </div>
                           )) || <div className="w-[84px]"></div>}
                        </div>

                        {/* Corridor / Aisle */}
                        <div className="w-8 flex items-center justify-center h-10">
                           <div className="w-[1px] h-full bg-muted-foreground/10 border-dashed border-l"></div>
                        </div>

                        {/* Seatb Column (2 seats) */}
                        <div className="flex gap-2">
                           {bRows[rowIndex]?.map((seat: any) => (
                             <div key={seat._id} className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                               <span className="text-[10px] font-black text-primary uppercase">{seat.seatNo}</span>
                             </div>
                           )) || <div className="w-[84px]"></div>}
                        </div>
                      </div>
                    ))}

                    {/* Back Row (Seat C) */}
                    {cSeats.length > 0 && (
                      <div className="pt-6 border-t-2 border-dashed border-muted mt-4">
                        <div className="flex gap-2 justify-center">
                           {cSeats.map((seat: any) => (
                             <div key={seat._id} className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                               <span className="text-[10px] font-black text-primary uppercase">{seat.seatNo}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Rear Label */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-3">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] opacity-40">Rear / Exit</p>
                  </div>
                </div>
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
