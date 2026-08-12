import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MiniSeatMapPreview } from "@/components/busowners/operator_tabs/MiniSeatMapPreview";
import { decideSeatLayoutRevision, getPendingSeatLayoutRevisions, type SeatLayoutRevisionRecord } from "@/api/busOwnerFleetApi";

export default function SeatLayoutRevisionReview({ fleetId }: { fleetId: string }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["seat-layout-revisions", "pending"], queryFn: getPendingSeatLayoutRevisions });
  const revision = useMemo(() => data.find((item) => String(typeof item.fleetId === "object" ? item.fleetId._id : item.fleetId) === fleetId), [data, fleetId]);
  const decision = useMutation({
    mutationFn: (payload: { revision: SeatLayoutRevisionRecord; action: "APPROVE" | "REJECT" }) => decideSeatLayoutRevision({ revisionId: payload.revision._id, decision: payload.action, ...(payload.action === "REJECT" ? { rejectionReason: reason.trim() } : {}) }),
    onSuccess: () => { toast.success("Seat layout decision saved."); setReason(""); queryClient.invalidateQueries({ queryKey: ["seat-layout-revisions"] }); },
    onError: (error: Error) => toast.error(error.message || "Could not review layout change."),
  });
  if (isLoading || !revision) return null;
  const config = revision.proposedSeatConfig as unknown as Parameters<typeof MiniSeatMapPreview>[0]["config"];
  return <Card className="border-amber-500/20 bg-amber-500/5 text-white">
    <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-amber-400" />Pending seat-layout revision</CardTitle></CardHeader>
    <CardContent className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <MiniSeatMapPreview config={config} size="sm" showLabels />
      <div>
        <div className="grid gap-3 sm:grid-cols-3"><Stat label="Added" value={revision.addedSeatLabels?.length || 0} /><Stat label="Withdrawn/changed" value={revision.removedSeatLabels?.length || 0} /><Stat label="Effective" value={revision.effectiveAt ? new Date(revision.effectiveAt).toLocaleDateString() : "After approval"} /></div>
        <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">{revision.reason || "No operator note provided."}</p>
        {(revision.removedSeatLabels?.length || 0) > 0 && <div className="mt-3 flex gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />Approval rechecks bookings and live holds, then blocks withdrawn seats until the effective date.</div>}
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rejection reason (required only when rejecting)" className="mt-4 border-white/10 bg-black/20" />
        <div className="mt-4 flex gap-3"><Button disabled={decision.isPending} onClick={() => decision.mutate({ revision, action: "APPROVE" })}><CheckCircle2 className="mr-2 h-4 w-4" />Approve & schedule</Button><Button variant="destructive" disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate({ revision, action: "REJECT" })}><XCircle className="mr-2 h-4 w-4" />Reject</Button></div>
      </div>
    </CardContent>
  </Card>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }
