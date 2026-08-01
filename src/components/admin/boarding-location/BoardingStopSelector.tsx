import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";

export function BoardingStopSelector({
  stops,
  selected,
  search,
  onSearch,
  onSelect,
}: {
  stops: AdminStop[];
  selected: AdminStop | null;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (stop: AdminStop) => void;
}) {
  return (
    <aside className="flex min-h-[570px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:w-72 lg:shrink-0">
      <div className="border-b border-white/10 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Operational route stops</p>
        <div className="relative"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search stop, code or area" className="h-9 pl-9 text-xs" /></div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {stops.map((stop) => {
          const active = getStopId(stop) === getStopId(selected);
          return <button type="button" key={getStopId(stop)} onClick={() => onSelect(stop)} className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-[#D3D925]/30 bg-[#D3D925]/10" : "border-transparent hover:bg-white/5"}`}>
            <p className="truncate text-sm font-bold text-white">{stop.name}</p>
            <p className="mt-0.5 truncate text-[10px] uppercase text-white/40">{stop.code}{stop.district ? ` · ${stop.district}` : ""}</p>
          </button>;
        })}
        {stops.length === 0 && <p className="p-4 text-center text-xs text-white/40">No operational route stops match.</p>}
      </div>
    </aside>
  );
}
