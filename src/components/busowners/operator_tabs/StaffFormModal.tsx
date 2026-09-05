import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createConductor, updateConductor, type ConductorProfile } from "@/api/conductorApi";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";

interface Props {
  brandId: string;
  brandName: string;
  staff?: ConductorProfile | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffFormModal({ brandId, brandName, staff, open, onClose, onSuccess }: Props) {
  const editing = Boolean(staff);
  const [name, setName] = useState(staff?.fullName || "");
  const [phone, setPhone] = useState(staff?.phone || "");
  const [notes, setNotes] = useState(staff?.notes || "");
  const mutation = useMutation({
    mutationFn: () => editing
      ? updateConductor(staff!._id, { fullName: name.trim(), notes: notes.trim() || null })
      : createConductor({ brandId, name: name.trim(), phone: phone.trim() }),
    onSuccess: (result) => {
      toast.success(result.message || (editing ? "Staff details updated." : "Staff account created."));
      onSuccess();
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, editing ? "Update failed" : "Failed to add staff")),
  });
  const validPhone = /^((\+?977)|0)?9[78]\d{8}$/.test(phone.replace(/[\s()-]/g, ""));
  const valid = name.trim().length >= 3 && (editing || validPhone);

  return <Dialog open={open} onOpenChange={value => !value && !mutation.isPending && onClose()}>
    <DialogContent className="sm:max-w-[500px] overflow-hidden border-2 p-0 shadow-2xl">
      <DialogHeader className="border-b p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2"><UserRoundCheck className="h-5 w-5 text-primary" /></div>
          <div><DialogTitle className="text-lg font-black uppercase tracking-tight text-primary">{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{editing ? staff!.fullName : brandName}</p></div>
        </div>
      </DialogHeader>
      <div className="space-y-4 p-6">
        {!editing && <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
          This creates or connects a Partner-app conductor account and queues an activation SMS.
        </div>}
        <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full name *</Label>
          <Input value={name} maxLength={100} onChange={event => setName(event.target.value)} placeholder="e.g. Sita Gurung" className="h-9 rounded-xl" /></div>
        <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile number *</Label>
          <Input value={phone} disabled={editing} onChange={event => setPhone(event.target.value)} placeholder="98XXXXXXXX" className="h-9 rounded-xl" />
          {editing && <p className="text-[9px] text-muted-foreground">Linked phone changes require the verified account-change process.</p>}</div>
        <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal notes</Label>
          <Textarea value={notes} maxLength={2000} onChange={event => setNotes(event.target.value)} placeholder="Optional administrative notes" className="min-h-24 rounded-xl" /></div>
      </div>
      <DialogFooter className="border-t bg-muted/20 p-4"><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
        <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()} className="min-w-28 font-black">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save Changes" : "Add Staff"}
        </Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
