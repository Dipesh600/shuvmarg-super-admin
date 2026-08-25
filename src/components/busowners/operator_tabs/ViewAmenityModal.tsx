import { Eye, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFetchAmenityById } from "@/hooks/useAmenities";

interface Props { id: string | null; isOpen: boolean; onClose: () => void; }

export default function ViewAmenityModal({ id, isOpen, onClose }: Props) {
  const query = useFetchAmenityById(id || "");
  const item = query.data?.data;
  return <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-[520px] overflow-hidden border-2 p-0 shadow-2xl">
      <DialogHeader className="border-b bg-muted/10 p-6"><div className="flex items-center gap-3"><div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary"><Eye className="h-5 w-5" /></div><div><DialogTitle className="text-2xl font-black tracking-tight">Amenity details</DialogTitle><p className="mt-1 text-xs text-muted-foreground">This is how the amenity is described across fleet records.</p></div></div></DialogHeader>
      {query.isLoading ? <div className="flex h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : item ? <div className="p-6">
        <div className="rounded-2xl border bg-muted/10 p-5"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Sparkles className="h-5 w-5" /></div><div><h3 className="text-lg font-black">{item.name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description || "No passenger-facing description."}</p></div></div><Badge variant={item.status ? "default" : "outline"}>{item.status ? "Active" : "Inactive"}</Badge></div><div className="mt-5 border-t pt-4 text-xs text-muted-foreground"><span className="font-bold text-foreground">Icon key:</span> {item.icon || "sparkles"}<span className="mx-2">·</span><span className="font-bold text-foreground">Scope:</span> Operator only</div></div>
      </div> : <p className="p-8 text-center text-sm text-muted-foreground">Amenity could not be loaded.</p>}
      <DialogFooter className="border-t bg-muted/10 p-6"><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
