import { CheckCircle2, MapPin } from "lucide-react";
import type { AdminStop, StopCoordinates, StopMapSelection } from "./stopRegistryTypes";
import { StopMapPicker } from "./StopMapPicker";
import { stopDistanceMeters, validStopCoordinates } from "./stopMapSelection";

export function StopLocationField({
  value, parentStop, allStops, editingStopId, onSelect,
}: {
  value: StopMapSelection | null;
  parentStop: AdminStop | null;
  allStops: AdminStop[];
  editingStopId?: string | null;
  onSelect: (selection: StopMapSelection) => void;
}) {
  const focus = value?.coordinates || (validStopCoordinates(parentStop?.coordinates)
    ? parentStop.coordinates : null);
  const nearbyStops = focus ? allStops
    .reduce<Array<AdminStop & { coordinates: StopCoordinates }>>((located, stop) => {
      const id = stop.id || stop._id;
      const coordinates = stop.coordinates;
      if (id !== editingStopId && stop.status === "ACTIVE" &&
        validStopCoordinates(coordinates) &&
        stopDistanceMeters(focus, coordinates) <= 15_000) {
        located.push({ ...stop, coordinates });
      }
      return located;
    }, [])
    .sort((a, b) => stopDistanceMeters(focus, a.coordinates) -
      stopDistanceMeters(focus, b.coordinates))
    .slice(0, 40) : [];

  return <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-widest text-white/50">Map position</span>
        <p className="mt-1 text-xs text-white/55">Search or place the marker. Coordinates are captured automatically.</p>
      </div>
      {value ? <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"><CheckCircle2 className="size-3.5" />Position selected</span>
        : <span className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-300"><MapPin className="size-3.5" />Required</span>}
    </div>
    <StopMapPicker value={value} parentStop={parentStop} nearbyStops={nearbyStops} onSelect={onSelect} />
    {value && <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs sm:grid-cols-2">
      <div><span className="text-white/45">Captured position</span><p className="mt-1 font-mono text-white/85">{value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}</p></div>
      <div><span className="text-white/45">Map result</span><p className="mt-1 text-white/85">{value.coordinateSuggestedAddress || "Pinned position confirmed"}</p></div>
    </div>}
    {value && nearbyStops.length > 0 && <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">Nearby registered stops</p>
      <p className="mt-1 text-[11px] text-white/50">Check these before saving to avoid creating a duplicate.</p>
      <div className="mt-2 space-y-1.5">
        {nearbyStops.slice(0, 3).map((stop) => <div key={stop.id || stop._id} className="flex items-center justify-between gap-3 text-xs">
          <span className="min-w-0 truncate text-white/80">{stop.name}{stop.district ? ` · ${stop.district}` : ""}</span>
          <span className="shrink-0 font-mono text-white/45">{Math.round(stopDistanceMeters(value.coordinates, stop.coordinates))} m</span>
        </div>)}
      </div>
    </div>}
  </section>;
}
