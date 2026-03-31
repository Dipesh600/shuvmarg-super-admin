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
import { Edit, Armchair, LayoutGrid, Loader2 } from "lucide-react";
import { useFetchSeatTemplateById, useUpdateSeatTemplate } from "@/hooks/useSeatTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [aCount, setACount] = useState("");
  const [bCount, setBCount] = useState("");
  const [cCount, setCCount] = useState("");

  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  useEffect(() => {
    if (response?.data && isOpen) {
        const data = response.data;
        setTemplateName(data.templateName || "");
        setACount(data.seata?.length?.toString() || "0");
        setBCount(data.seatb?.length?.toString() || "0");
        setCCount(data.seatc?.length?.toString() || "0");
    }
  }, [response, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        templateName,
        aCount,
        bCount,
        cCount
      });
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
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
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <ScrollArea className="max-h-[60vh] pr-4">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="templateNameUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Template Name</Label>
                    <Input 
                      id="templateNameUp"
                      placeholder="e.g. Standard Deluxe" 
                      className="h-12 font-bold bg-muted/30 border-2" 
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="aCountUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat A</Label>
                        <Input 
                          id="aCountUp"
                          type="number"
                          placeholder="20" 
                          className="h-12 font-bold bg-background border-2" 
                          value={aCount}
                          onChange={(e) => setACount(e.target.value)}
                          required 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="bCountUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat B</Label>
                        <Input 
                          id="bCountUp"
                          type="number"
                          placeholder="20" 
                          className="h-12 font-bold bg-background border-2" 
                          value={bCount}
                          onChange={(e) => setBCount(e.target.value)}
                          required 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="cCountUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat C</Label>
                        <Input 
                          id="cCountUp"
                          type="number"
                          placeholder="5" 
                          className="h-12 font-bold bg-background border-2" 
                          value={cCount}
                          onChange={(e) => setCCount(e.target.value)}
                          required 
                        />
                     </div>
                  </div>
                  
                  <div className="bg-muted/10 p-4 rounded-xl border border-dashed border-primary/20">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 opacity-70">Configuration Summary</p>
                     <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-muted-foreground">Updated Total Expected Seats:</span>
                        <span className="text-primary font-black text-lg">
                          {(Number(aCount) || 0) + (Number(bCount) || 0) + (Number(cCount) || 0)}
                        </span>
                     </div>
                  </div>
               </div>
            </ScrollArea>

            <DialogFooter className="gap-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1">Discard Changes</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="font-black uppercase tracking-widest text-xs h-12 flex-[2] transition-all hover:tracking-[0.1em]"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Applying Updates..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSeatTemplateModal;
