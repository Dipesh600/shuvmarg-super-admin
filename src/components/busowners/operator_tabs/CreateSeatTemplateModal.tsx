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
import { LayoutGrid, Armchair, Plus } from "lucide-react";
import { useCreateSeatTemplate } from "@/hooks/useSeatTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [aCount, setACount] = useState("");
  const [bCount, setBCount] = useState("");
  const [cCount, setCCount] = useState("");

  const createMutation = useCreateSeatTemplate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        templateName,
        aCount,
        bCount,
        cCount,
        userId
      });
      onClose();
      // Reset form
      setTemplateName("");
      setACount("");
      setBCount("");
      setCCount("");
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
                <LayoutGrid className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Create Seat Template</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Define local seat arrangement</p>
             </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <ScrollArea className="max-h-[60vh] pr-4">
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="templateName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Template Name</Label>
                  <Input 
                    id="templateName"
                    placeholder="e.g. Standard Deluxe Layout" 
                    className="h-12 font-bold bg-muted/30 border-2" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="aCount" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat A</Label>
                      <Input 
                        id="aCount"
                        type="number"
                        placeholder="20" 
                        className="h-12 font-bold bg-background border-2" 
                        value={aCount}
                        onChange={(e) => setACount(e.target.value)}
                        required 
                      />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="bCount" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat B</Label>
                      <Input 
                        id="bCount"
                        type="number"
                        placeholder="20" 
                        className="h-12 font-bold bg-background border-2" 
                        value={bCount}
                        onChange={(e) => setBCount(e.target.value)}
                        required 
                      />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="cCount" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat C</Label>
                      <Input 
                        id="cCount"
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
                      <span className="text-muted-foreground">Total Expected Seats:</span>
                      <span className="text-primary font-black text-lg">
                        {(Number(aCount) || 0) + (Number(bCount) || 0) + (Number(cCount) || 0)}
                      </span>
                   </div>
                </div>
             </div>
          </ScrollArea>

          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="font-black uppercase tracking-widest text-xs h-12 flex-[2] transition-all hover:tracking-[0.1em]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Save Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSeatTemplateModal;
