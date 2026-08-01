import { CheckCircle2, MapPinOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";
import { validCoordinates } from "./boardingLocationMapUtils";

export function BoardingStopSelector({
  stops,
  selected,
  search,
  selectedLocationCount,
  onSearch,
  onSelect,
}: {
  stops: AdminStop[];
  selected: AdminStop | null;
  search: string;
  selectedLocationCount: number;
  onSearch: (value: string) => void;
  onSelect: (stop: AdminStop) => void;
}) {
  return (
    <aside className="flex min-h-[610px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:w-80 lg:shrink-0">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm font-semibold text-white">Choose a route stop</p>
        <p className="mt-1 text-xs text-white/40">Precise boarding places always belong to a stop.</p>
        <div className="relative mt-3"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search stop, code or area" className="h-9 pl-9 text-xs" /></div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {stops.map((stop) => {
          const active = getStopId(stop) === getStopId(selected);
          const fallbackReady = validCoordinates(stop.coordinates);
          const status = active && selectedLocationCount > 0
            ? `${selectedLocationCount} precise place${selectedLocationCount === 1 ? "" : "s"}`
            : fallbackReady ? "Stop fallback ready" : "Missing map position";
          return (
            <button type="button" key={getStopId(stop)} onClick={() => onSelect(stop)} className={`w-full rounded-xl border px-3 py-3 text-left transition ${active ? "border-[#EA4B2A]/35 bg-[#EA4B2A]/10" : "border-transparent hover:bg-white/5"}`}>
              <div className="flex items-start gap-2.5">
                {fallbackReady ? <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${active ? "text-[#EA4B2A]" : "text-emerald-400/70"}`} /> : <MapPinOff className="mt-0.5 size-4 shrink-0 text-amber-300/70" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{stop.name}</p>
                  <p className="mt-0.5 truncate text-[10px] uppercase text-white/40">{stop.code}{stop.district ? ` · ${stop.district}` : ""}</p>
                  <p className={`mt-1 text-[11px] ${fallbackReady ? "text-white/45" : "text-amber-200/65"}`}>{status}</p>
                </div>
              </div>
            </button>
          );
        })}
        {stops.length === 0 && <p className="p-5 text-center text-xs text-white/40">No operational route stops match.</p>}
      </div>
    </aside>
  );
}
