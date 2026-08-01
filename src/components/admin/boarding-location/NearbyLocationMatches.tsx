import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoardingLocation } from "./boardingLocationTypes";

export function NearbyLocationMatches({
  locations,
  onUse,
  reason,
  onReasonChange,
}: {
  locations: BoardingLocation[];
  onUse: (location: BoardingLocation) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
}) {
  if (locations.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-amber-100">Check nearby places first</p>
          <p className="mt-0.5 text-xs text-amber-100/60">Reuse an existing place unless this is a different gate, bay, or side of the road.</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {locations.map((location) => (
          <div key={location.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{location.name}</p>
              <p className="truncate text-xs text-white/45">{location.landmark || location.address || "Existing boarding place"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onUse(location)}>
              Use existing <ArrowRight className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <label className="mt-3 block text-xs font-medium text-amber-100/75">
        Why is this a separate place?
        <select value={reason} onChange={(event) => onReasonChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-amber-300/20 bg-[#17130b] px-3 text-sm text-white">
          <option value="">Choose a reason before creating</option>
          <option value="Opposite side of road">Opposite side of road</option>
          <option value="Different terminal gate">Different terminal gate</option>
          <option value="Separate bus bay">Separate bus bay</option>
          <option value="Different entrance">Different entrance</option>
          <option value="Operationally distinct place">Other operationally distinct place</option>
        </select>
      </label>
    </section>
  );
}
