import { useMemo, useState } from "react";
import { ArrowLeftRight, CircleDotDashed, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RouteCorridor } from "@/api/corridorWorkflowApi";

interface CorridorExplorerProps {
  corridors: RouteCorridor[];
  selectedCorridorId: string | null;
  onSelect: (corridorId: string) => void;
}

const statusClassName: Record<string, string> = {
  ACTIVE: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  PENDING: "bg-amber-300/10 text-amber-200 border-amber-300/20",
  INACTIVE: "bg-white/5 text-white/45 border-white/10",
};

export function CorridorExplorer({ corridors, selectedCorridorId, onSelect }: CorridorExplorerProps) {
  const [search, setSearch] = useState("");
  const filteredCorridors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return corridors;
    return corridors.filter((corridor) => [
      corridor.code,
      corridor.originId?.name,
      corridor.destinationId?.name,
      corridor.originId?.code,
      corridor.destinationId?.code,
    ].some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [corridors, search]);

  return (
    <aside className="flex min-h-[540px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 lg:min-h-[620px]">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Corridor explorer</p>
            <p className="mt-0.5 text-xs text-white/40">{corridors.length} registered connection{corridors.length === 1 ? "" : "s"}</p>
          </div>
          <CircleDotDashed className="size-4 text-[#D3D925]" aria-hidden="true" />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a corridor"
            className="h-10 border-white/10 bg-white/[0.04] pl-9 text-sm text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredCorridors.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-white/60">No corridor found</p>
            <p className="mt-1 text-xs text-white/35">Try another name, code, or endpoint.</p>
          </div>
        ) : filteredCorridors.map((corridor) => {
          const selected = corridor._id === selectedCorridorId;
          return (
            <button
              key={corridor._id}
              type="button"
              onClick={() => onSelect(corridor._id)}
              className={`w-full rounded-xl border p-3 text-left transition ${selected
                ? "border-[#D3D925]/35 bg-[#D3D925]/10 shadow-lg shadow-[#D3D925]/5"
                : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{corridor.code}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClassName[corridor.status] || statusClassName.INACTIVE}`}>
                  {corridor.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <span className="truncate">{corridor.originId?.name || "Unknown origin"}</span>
                <ArrowLeftRight className="size-3 shrink-0 text-white/35" aria-hidden="true" />
                <span className="truncate">{corridor.destinationId?.name || "Unknown destination"}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-white/35">
                {corridor.notes?.trim() || "No operating note yet"}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
