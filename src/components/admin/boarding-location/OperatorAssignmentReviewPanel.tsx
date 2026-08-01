import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBoardingAssignmentReviews, reviewBoardingAssignment } from "./boardingLocationApi";

export function OperatorAssignmentReviewPanel() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});
  const query = useQuery({
    queryKey: ["operator-boarding-assignment-reviews", "PENDING_REVIEW"],
    queryFn: () => listBoardingAssignmentReviews(),
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "REJECTED" }) =>
      reviewBoardingAssignment(id, status, reason[id]),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["operator-boarding-assignment-reviews"] }),
  });
  const assignments = query.data || [];
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
      <div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-white">Operator requests</h3><p className="text-xs text-white/40">Approve operator usage only after its physical location is verified.</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-white/60">{assignments.length} pending</span></div>
      {query.isLoading ? <Loader2 className="mx-auto my-8 size-5 animate-spin text-[#D3D925]" /> : query.isError ? <p className="py-6 text-center text-sm text-red-300">Unable to load operator requests.</p> : assignments.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">No operator boarding requests need review.</p> : <div className="space-y-3">{assignments.map((assignment) => {
        const location = assignment.boardingLocation;
        const approvable = location?.verificationStatus === "VERIFIED" && location.status === "ACTIVE" && assignment.brand?.status === "ACTIVE";
        return <article key={assignment.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-white">{location?.name || "Missing location"}</h4><span className="text-[10px] font-bold text-white/40">{assignment.usage}</span></div><p className="mt-1 text-xs text-white/50">{assignment.brand?.name || "Unknown brand"} · {location?.stop?.name || "Unknown stop"}</p>{!approvable && <p className="mt-2 flex gap-1.5 text-xs text-amber-300"><AlertTriangle className="size-3.5" />Verify the location and activate the brand before approval.</p>}</div><input value={reason[assignment.id] || ""} onChange={(event) => setReason({ ...reason, [assignment.id]: event.target.value })} placeholder="Rejection reason" className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none lg:w-52" /><div className="flex gap-2"><Button size="sm" disabled={!approvable || review.isPending} onClick={() => review.mutate({ id: assignment.id, status: "ACTIVE" })}><Check className="size-4" />Approve</Button><Button size="sm" variant="outline" disabled={review.isPending || !reason[assignment.id]?.trim()} onClick={() => review.mutate({ id: assignment.id, status: "REJECTED" })}><X className="size-4" />Reject</Button></div></div></article>;
      })}</div>}
    </section>
  );
}
