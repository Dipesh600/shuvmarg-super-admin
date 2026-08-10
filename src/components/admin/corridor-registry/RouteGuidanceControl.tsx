import { useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchVariantDraftGuidancePlaces, type RouteGuidancePlace,
} from "@/api/corridorWorkflowApi";

interface Props {
  draftId: string;
  busy: boolean;
  onFind: (placeIds: string[]) => void;
}

export function RouteGuidanceControl({ draftId, busy, onFind }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RouteGuidancePlace[]>([]);
  const [selected, setSelected] = useState<RouteGuidancePlace[]>([]);
  const [searching, setSearching] = useState(false);
  const searchPlaces = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const response = await searchVariantDraftGuidancePlaces(draftId, query.trim());
      setResults(response.data.filter((place) =>
        !selected.some((item) => item.placeId === place.placeId)
      ));
      if (response.data.length === 0) toast.info("Google found no matching mapped place in Nepal.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to search Google places.");
    } finally {
      setSearching(false);
    }
  };
  return <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-semibold text-white">Missing the road buses use?</p><p className="mt-1 text-xs text-white/40">Search Google and guide the path through up to three places. Guidance does not automatically add a route stop.</p></div>
      <Button type="button" size="sm" disabled={busy || selected.length === 0} onClick={() => onFind(selected.map((place) => place.placeId))} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"><MapPin className="mr-2 size-4" />Find guided path</Button>
    </div>
    <div className="mt-3 flex gap-2">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" /><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchPlaces(); }} disabled={selected.length >= 3} placeholder="Search Google, e.g. Bardibas or Hetauda" className="border-white/10 bg-black/25 pl-9 text-white placeholder:text-white/25" /></div>
      <Button type="button" variant="outline" disabled={searching || query.trim().length < 2 || selected.length >= 3} onClick={() => void searchPlaces()} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">{searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}</Button>
    </div>
    {results.length > 0 && <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-white/10 bg-[#111] p-1">{results.map((place) => <button key={place.placeId} type="button" onClick={() => { setSelected((items) => [...items, place]); setResults([]); setQuery(""); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/8"><span><span className="block text-sm font-medium text-white">{place.name}</span><span className="text-xs text-white/35">{place.address || "Mapped by Google"}</span></span><span className="text-xs font-semibold text-[#D3D925]">Use</span></button>)}</div>}
    {selected.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selected.map((place, index) => <span key={place.placeId} className="inline-flex items-center gap-2 rounded-full border border-[#D3D925]/20 bg-[#D3D925]/8 px-3 py-1.5 text-xs text-[#D3D925]">{index + 1}. {place.name}<button type="button" aria-label={`Remove ${place.name}`} onClick={() => setSelected((items) => items.filter((item) => item.placeId !== place.placeId))}><X className="size-3.5" /></button></span>)}</div>}
  </div>;
}
