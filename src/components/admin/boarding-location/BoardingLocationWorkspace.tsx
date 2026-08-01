import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllStops } from "@/api/platformRegistryApi";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";
import { BoardingLocationCard } from "./BoardingLocationCard";
import { BoardingLocationEditorSheet } from "./BoardingLocationEditorSheet";
import { BoardingStopSelector } from "./BoardingStopSelector";
import { DeactivateBoardingLocationDialog } from "./DeactivateBoardingLocationDialog";
import { deactivateBoardingLocation, listBoardingLocations } from "./boardingLocationApi";
import { validCoordinates } from "./boardingLocationMapUtils";
import type { BoardingLocation } from "./boardingLocationTypes";

export function BoardingLocationWorkspace() {
  const queryClient = useQueryClient();
  const [selectedStop, setSelectedStop] = useState<AdminStop | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; location: BoardingLocation | null }>({ open: false, location: null });
  const [locationToDeactivate, setLocationToDeactivate] = useState<BoardingLocation | null>(null);
  const stopsQuery = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const stops = useMemo(() => {
    const allStops = (stopsQuery.data?.data || []) as AdminStop[];
    const query = search.trim().toLocaleLowerCase();
    return allStops.filter((stop) => stop.isRouteStop && stop.status === "ACTIVE")
      .filter((stop) => !query || [stop.name, stop.code, stop.district, stop.municipality, ...(stop.aliases || [])]
        .some((value) => value?.toLocaleLowerCase().includes(query)))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [stopsQuery.data, search]);
  const stopId = getStopId(selectedStop);
  const locationsQuery = useQuery({
    queryKey: ["boarding-locations", stopId],
    queryFn: () => listBoardingLocations(stopId),
    enabled: Boolean(stopId),
  });
  const locations = locationsQuery.data || [];
  const deactivate = useMutation({
    mutationFn: deactivateBoardingLocation,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["boarding-locations", stopId] });
      toast.success("Boarding location deactivated.");
      setLocationToDeactivate(null);
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to deactivate location.");
    },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 className="text-2xl font-bold text-white">Boarding Locations</h2><p className="mt-1 max-w-2xl text-sm text-white/50">Canonical physical pickup and drop places under operational route stops. Operators add their own instructions separately.</p></div>
        <Button disabled={!selectedStop} onClick={() => setEditor({ open: true, location: null })}><Plus className="size-4" />Add location</Button>
      </header>
      <div className="flex flex-col gap-5 lg:flex-row">
        <BoardingStopSelector stops={stops} selected={selectedStop} search={search} onSearch={setSearch} onSelect={setSelectedStop} />
        <section className="min-h-[570px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0a0a0a]">
          {!selectedStop ? <Empty message="Select an operational route stop to manage its exact boarding locations." /> : <>
            <div className="flex items-center justify-between border-b border-white/10 p-5"><div><h3 className="font-bold text-white">{selectedStop.name}</h3><p className="text-xs text-white/40">{selectedStop.code} · {locations.length} canonical location{locations.length === 1 ? "" : "s"}</p></div>{validCoordinates(selectedStop.coordinates) && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">Stop fallback eligible</span>}</div>
            <div className="space-y-3 p-5">{locationsQuery.isLoading ? <Loader /> : locations.length === 0 ? <Empty message={validCoordinates(selectedStop.coordinates) ? "No specific location is configured. The route stop itself remains the safe fallback." : "No location exists and this stop has no map coordinates for fallback."} /> : locations.map((location) => <BoardingLocationCard key={location.id} location={location} onEdit={() => setEditor({ open: true, location })} onDeactivate={() => setLocationToDeactivate(location)} deactivating={deactivate.isPending} />)}</div>
          </>}
        </section>
      </div>
      {selectedStop && editor.open && <BoardingLocationEditorSheet open stop={selectedStop} location={editor.location} onOpenChange={(open) => setEditor({ open, location: open ? editor.location : null })} onSaved={() => void queryClient.invalidateQueries({ queryKey: ["boarding-locations", stopId] })} />}
      <DeactivateBoardingLocationDialog location={locationToDeactivate} pending={deactivate.isPending} onClose={() => setLocationToDeactivate(null)} onConfirm={() => locationToDeactivate && deactivate.mutate(locationToDeactivate.id)} />
    </div>
  );
}

function Loader() { return <div className="flex h-40 items-center justify-center"><Loader2 className="size-5 animate-spin text-[#D3D925]" /></div>; }
function Empty({ message }: { message: string }) { return <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><MapPin className="mb-3 size-8 text-white/15" /><p className="max-w-sm text-sm text-white/45">{message}</p></div>; }
