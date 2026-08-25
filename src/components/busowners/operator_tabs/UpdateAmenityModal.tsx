import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFetchAmenityById, useUpdateAmenity } from "@/hooks/useAmenities";

interface Props { id: string | null; isOpen: boolean; onClose: () => void; }

export default function UpdateAmenityModal({ id, isOpen, onClose }: Props) {
  const query = useFetchAmenityById(id || "");
  const update = useUpdateAmenity(id || "");
  const [form, setForm] = useState({ name: "", description: "", icon: "sparkles", status: true });

  useEffect(() => {
    const item = query.data?.data;
    // The form is initialized when the requested server record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen && item) setForm({ name: item.name || "", description: item.description || "", icon: item.icon || "sparkles", status: item.status !== false });
  }, [isOpen, query.data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    await update.mutateAsync({ ...form, name: form.name.trim(), description: form.description.trim(), icon: form.icon.trim() });
    onClose();
  };

  return <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-[520px] overflow-hidden border-2 p-0 shadow-2xl">
      <DialogHeader className="border-b bg-muted/10 p-6"><div className="flex items-center gap-3"><div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary"><Settings2 className="h-5 w-5" /></div><div><DialogTitle className="text-2xl font-black tracking-tight">Edit custom amenity</DialogTitle><p className="mt-1 text-xs text-muted-foreground">Disabling hides it from new fleet selections without removing history.</p></div></div></DialogHeader>
      {query.isLoading ? <div className="flex h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> :
      <form onSubmit={submit}>
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between rounded-xl border bg-muted/10 p-4"><div><p className="text-sm font-bold">Available for new selections</p><p className="text-xs text-muted-foreground">Existing fleets keep their recorded amenity.</p></div><Switch checked={form.status} onCheckedChange={(status) => setForm({ ...form, status })} /></div>
          <div className="space-y-2"><Label htmlFor="edit-amenity-name">Name</Label><Input id="edit-amenity-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={60} required /></div>
          <div className="space-y-2"><Label htmlFor="edit-amenity-description">Passenger-facing description</Label><Input id="edit-amenity-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={240} /></div>
          <div className="space-y-2"><Label htmlFor="edit-amenity-icon">Icon key</Label><Input id="edit-amenity-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={50} required /></div>
        </div>
        <DialogFooter className="border-t bg-muted/10 p-6"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </form>}
    </DialogContent>
  </Dialog>;
}
