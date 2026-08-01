import { useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoardingCoordinates } from "./boardingLocationTypes";

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export function BoardingMapSearch({
  onSelect,
}: {
  onSelect: (coordinates: BoardingCoordinates) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastRequestAt = useRef(0);

  async function search() {
    if (query.trim().length < 3 || loading) return;
    if (Date.now() - lastRequestAt.current < 1_000) {
      setError("Please wait a moment before searching again.");
      return;
    }
    lastRequestAt.current = Date.now();
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q: query.trim(), format: "jsonv2", limit: "5", countrycodes: "np",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { "Accept-Language": "en,ne;q=0.8" } },
      );
      if (!response.ok) throw new Error("Place search is unavailable.");
      setResults(await response.json() as SearchResult[]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute left-3 right-3 top-3 z-[500] space-y-1.5">
      <div className="flex gap-2 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-xl backdrop-blur">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void search()}
          placeholder="Search a place in Nepal"
          className="h-9 border-white/10 bg-white/5 text-sm"
        />
        <Button type="button" size="sm" className="h-9" onClick={() => void search()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          <span className="sr-only">Search map</span>
        </Button>
      </div>
      {(results.length > 0 || error) && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-xl">
          {error && <p className="p-3 text-xs text-red-300">{error}</p>}
          {results.map((result) => (
            <button
              type="button"
              key={result.place_id}
              className="block w-full border-b border-white/5 px-3 py-2 text-left text-xs text-white/80 last:border-0 hover:bg-white/5"
              onClick={() => {
                onSelect({ lat: Number(result.lat), lng: Number(result.lon) });
                setResults([]);
              }}
            >
              {result.display_name}
            </button>
          ))}
          <p className="px-3 py-2 text-[10px] text-white/35">Search data © OpenStreetMap contributors</p>
        </div>
      )}
    </div>
  );
}
