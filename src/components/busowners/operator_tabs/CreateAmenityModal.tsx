import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAmenity } from "@/hooks/useAmenities";

interface Props { isOpen: boolean; onClose: () => void; ownerId: string; }

export default function CreateAmenityModal({ isOpen, onClose, ownerId }: Props) {
  const create = useCreateAmenity();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("sparkles");

  const close = () => { setName(""); setDescription(""); setIcon("sparkles"); onClose(); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await create.mutateAsync({ ownerId, name: name.trim(), description: description.trim(), icon: icon.trim() });
    close();
  };

  return <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
    <DialogContent className="sm:max-w-[520px] overflow-hidden border-2 p-0 shadow-2xl">
      <DialogHeader className="border-b bg-muted/10 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary"><Sparkles className="h-5 w-5" /></div>
          <div><DialogTitle className="text-2xl font-black tracking-tight">Add custom amenity</DialogTitle><p className="mt-1 text-xs text-muted-foreground">Available only to this operator&apos;s fleet.</p></div>
        </div>
      </DialogHeader>
      <form onSubmit={submit}>
        <div className="space-y-5 p-6">
          <div className="space-y-2"><Label htmlFor="amenity-name">Name</Label><Input id="amenity-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} placeholder="e.g. Reading light" required /></div>
          <div className="space-y-2"><Label htmlFor="amenity-description">Passenger-facing description</Label><Input id="amenity-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} placeholder="Individual adjustable reading light" /></div>
          <div className="space-y-2"><Label htmlFor="amenity-icon">Icon key</Label><Input id="amenity-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={50} placeholder="sparkles" required /><p className="text-[11px] text-muted-foreground">A short icon name used consistently by operator and passenger screens.</p></div>
        </div>
        <DialogFooter className="border-t bg-muted/10 p-6"><Button type="button" variant="ghost" onClick={close}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? "Adding…" : "Add amenity"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
