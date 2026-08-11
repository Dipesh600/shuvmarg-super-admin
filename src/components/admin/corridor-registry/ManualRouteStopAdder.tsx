import { useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CorridorStop, VariantStopCandidate } from "@/api/corridorWorkflowApi";

export function ManualRouteStopAdder({ stops, candidates, busy, onAdd }: {
  stops: CorridorStop[];
  candidates: VariantStopCandidate[];
  busy: boolean;
  onAdd: (stopId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CorridorStop | null>(null);
  const used = useMemo(() => new Set(candidates.flatMap((item) => [item.matchedStop?._id, item.resolvedStop?._id]).filter(Boolean)), [candidates]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle.length < 2) return [];
    return stops.filter((stop) => stop.isRouteStop !== false && stop.status !== "INACTIVE" && !used.has(stop._id) &&
      [stop.name, stop.code, stop.municipality, stop.district].some((value) => value?.toLocaleLowerCase().includes(needle))).slice(0, 8);
  }, [query, stops, used]);
  return <section className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.025] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="text-sm font-bold text-white">Add a known Stop manually</h4><p className="mt-1 text-xs text-white/40">Search the canonical registry. Its map position determines sequence, road distance and estimated time automatically.</p></div>{selected && <Button disabled={busy} onClick={async () => { await onAdd(selected._id); setSelected(null); setQuery(""); }} className="bg-sky-400 font-bold text-black hover:bg-sky-300">{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}Add {selected.name}</Button>}</div>
    <div className="relative mt-4"><Search className="absolute left-3 top-2.5 size-4 text-white/30" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} placeholder="Search Koteshwor, Gwarko, code or district…" className="border-white/10 bg-black/25 pl-9 text-white" /></div>
    {results.length > 0 && <div className="mt-2 grid gap-1 rounded-xl border border-white/10 bg-black/20 p-1">{results.map((stop) => <button key={stop._id} type="button" onClick={() => setSelected(stop)} className={`rounded-lg px-3 py-2 text-left ${selected?._id === stop._id ? "bg-sky-400/15" : "hover:bg-white/[0.06]"}`}><p className="text-xs font-semibold text-white">{stop.name} <span className="text-white/30">{stop.code}</span></p><p className="mt-0.5 text-[11px] text-white/35">{[stop.municipality, stop.district, stop.province].filter(Boolean).join(", ")}</p></button>)}</div>}
  </section>;
}
