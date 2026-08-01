import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enableBoardingLocationOperatorAccess, listBoardingLocationOperatorAccess } from "./boardingLocationApi";
import type { BoardingLocation, BoardingOperatorAccess } from "./boardingLocationTypes";

function OperatorRow({ location, access }: { location: BoardingLocation; access: BoardingOperatorAccess }) {
  const queryClient = useQueryClient();
  const [usage, setUsage] = useState(access.usage);
  const mutation = useMutation({
    mutationFn: () => enableBoardingLocationOperatorAccess(location.id, access.brandId, usage),
    onSuccess() {
      toast.success(`${access.brandName} passenger options updated.`);
      void queryClient.invalidateQueries({ queryKey: ["boarding-location-operator-access", location.id] });
      void queryClient.invalidateQueries({ queryKey: ["boarding-locations"] });
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to update operator access.");
    },
  });
  const active = access.status === "ACTIVE";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{access.brandName}</p><p className="text-xs text-white/40">{access.brandCode} · {active ? "Shown to passengers" : "Not yet assigned"}</p></div>
      <select value={usage} onChange={(event) => setUsage(event.target.value as BoardingOperatorAccess["usage"])} className="h-9 rounded-md border border-white/10 bg-[#111] px-3 text-xs text-white">
        <option value="BOTH">Pickup & drop</option><option value="PICKUP">Pickup only</option><option value="DROP">Drop only</option>
      </select>
      <Button size="sm" variant={active ? "outline" : "default"} disabled={mutation.isPending || (active && usage === access.usage)} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : active ? <Check className="size-4" /> : <Users className="size-4" />}
        {active ? "Update" : "Make available"}
      </Button>
    </div>
  );
}

export function BoardingLocationOperatorAccessDialog({ location, onClose }: { location: BoardingLocation | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["boarding-location-operator-access", location?.id],
    queryFn: () => listBoardingLocationOperatorAccess(location!.id),
    enabled: Boolean(location),
  });
  return (
    <Dialog open={Boolean(location)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#0b0b0b] sm:max-w-xl">
        <DialogHeader><DialogTitle>Passenger availability</DialogTitle><DialogDescription>Choose which operators use {location?.name}. Only active assignments appear as pickup or drop options.</DialogDescription></DialogHeader>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {query.isLoading && <div className="flex h-28 items-center justify-center"><Loader2 className="size-5 animate-spin text-[#F97316]" /></div>}
          {query.isError && <p className="rounded-xl bg-red-950/30 p-4 text-sm text-red-200">Operator access could not be loaded.</p>}
          {query.data?.map((access) => location && <OperatorRow key={access.brandId} location={location} access={access} />)}
          {query.isSuccess && query.data.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">No active operator currently serves this route stop.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
