import { useState } from "react";
import type { ConductorProfile, ConductorStatus } from "@/api/conductorApi";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert } from "lucide-react";

interface Props {
  staff: ConductorProfile;
  mode: "suspend" | "restore";
  pending: boolean;
  onClose: () => void;
  onConfirm: (status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED", reason?: string) => void;
}

export default function StaffStatusModal({ staff, mode, pending, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Extract<ConductorStatus, "AVAILABLE" | "OFF_DUTY">>("AVAILABLE");
  const suspend = mode === "suspend";
  return <Dialog open onOpenChange={value => !value && !pending && onClose()}>
    <DialogContent className="sm:max-w-[440px] overflow-hidden border-2 p-0 shadow-2xl">
      <DialogHeader className="border-b p-6 pb-4"><div className="flex items-center gap-3">
        <div className={`rounded-xl p-2 ${suspend ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}><ShieldAlert className="h-5 w-5" /></div>
        <div><DialogTitle className="text-lg font-black">{suspend ? "Suspend staff access" : "Return staff to service"}</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">{staff.fullName}</p></div>
      </div></DialogHeader>
      <div className="space-y-4 p-6">
        {suspend ? <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason *</Label>
          <Textarea value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} placeholder="Record the safety or policy reason" className="min-h-28 rounded-xl" /></div>
          : <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Return status</Label>
            <Select value={status} onValueChange={value => setStatus(value as typeof status)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AVAILABLE">Available</SelectItem><SelectItem value="OFF_DUTY">Off duty</SelectItem></SelectContent></Select></div>}
      </div>
      <DialogFooter className="border-t bg-muted/20 p-4"><Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
        <Button variant={suspend ? "destructive" : "default"} disabled={pending || (suspend && !reason.trim())}
          onClick={() => onConfirm(suspend ? "SUSPENDED" : status, suspend ? reason.trim() : undefined)}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{suspend ? "Suspend" : "Return to Service"}
        </Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
