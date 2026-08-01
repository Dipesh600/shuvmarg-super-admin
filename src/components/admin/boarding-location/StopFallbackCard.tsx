import { CheckCircle2, MapPinOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import { validCoordinates } from "./boardingLocationMapUtils";

export function StopFallbackCard({
  stop,
  onAdd,
}: {
  stop: AdminStop;
  onAdd: () => void;
}) {
  const ready = validCoordinates(stop.coordinates);
  const geography = [stop.municipality, stop.district, stop.province]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");

  return (
    <div className={`rounded-2xl border p-5 ${ready ? "border-emerald-400/20 bg-emerald-400/[0.06]" : "border-amber-400/20 bg-amber-400/[0.06]"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${ready ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
          {ready ? <CheckCircle2 className="size-5" /> : <MapPinOff className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{ready ? "Stop fallback is active" : "Stop fallback is unavailable"}</p>
          <p className="mt-1 text-sm text-white/55">{ready ? `Passengers can use ${stop.name}${geography ? ` · ${geography}` : ""} until a more precise place is added.` : `Set ${stop.name}'s map position in the Stop Registry before it can be used for pickup or drop.`}</p>
        </div>
        {ready && <Button type="button" onClick={onAdd}><Plus className="size-4" />Add precise place</Button>}
      </div>
    </div>
  );
}
