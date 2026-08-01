import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2, MapPinned, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllStops } from "@/api/platformRegistryApi";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";
import { BoardingLocationCard } from "./BoardingLocationCard";
import { BoardingLocationEditorSheet } from "./BoardingLocationEditorSheet";
import { BoardingLocationOperatorAccessDialog } from "./BoardingLocationOperatorAccessDialog";
import { BoardingStopSelector } from "./BoardingStopSelector";
import { DeactivateBoardingLocationDialog } from "./DeactivateBoardingLocationDialog";
import { OperatorAssignmentReviewPanel } from "./OperatorAssignmentReviewPanel";
import { StopFallbackCard } from "./StopFallbackCard";
import { deactivateBoardingLocation, listBoardingLocations } from "./boardingLocationApi";
import type { BoardingLocation } from "./boardingLocationTypes";

export function BoardingLocationWorkspace() {
  const savedStopKey = "shuvmarg.boarding-location.selected-stop";
  const queryClient = useQueryClient();
  const [view, setView] = useState<"places" | "requests">("places");
  const [selectedStopId, setSelectedStopId] = useState(() => window.localStorage.getItem(savedStopKey) || "");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; location: BoardingLocation | null }>({ open: false, location: null });
  const [locationToDeactivate, setLocationToDeactivate] = useState<BoardingLocation | null>(null);
  const [accessLocation, setAccessLocation] = useState<BoardingLocation | null>(null);
  const stopsQuery = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const allRouteStops = useMemo(() => {
    const allStops = (stopsQuery.data?.data || []) as AdminStop[];
    return allStops.filter((stop) => stop.isRouteStop && stop.status === "ACTIVE")
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [stopsQuery.data]);
  const stops = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return allRouteStops.filter((stop) => !query || [stop.name, stop.code, stop.district, stop.municipality, ...(stop.aliases || [])]
      .some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [allRouteStops, search]);
  const selectedStop = allRouteStops.find((stop) => getStopId(stop) === selectedStopId) || null;
  const selectStop = (stop: AdminStop) => {
    setSelectedStopId(getStopId(stop));
    window.localStorage.setItem(savedStopKey, getStopId(stop));
  };
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
      toast.success("Boarding place deactivated.");
      setLocationToDeactivate(null);
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to deactivate boarding place.");
    },
  });
  const openCreate = () => setEditor({ open: true, location: null });

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 className="text-2xl font-bold text-white">Boarding Places</h2><p className="mt-1 max-w-2xl text-sm text-white/50">Manage the exact physical places passengers recognise. A route stop remains the fallback when no precise place exists.</p></div>
        {view === "places" && selectedStop && <Button onClick={openCreate}><Plus className="size-4" />Add precise boarding place</Button>}
      </header>
      <div className="inline-flex rounded-xl border border-white/10 bg-black/25 p-1">
        <ViewButton active={view === "places"} onClick={() => setView("places")} icon={<MapPinned className="size-4" />} label="Boarding places" />
        <ViewButton active={view === "requests"} onClick={() => setView("requests")} icon={<Inbox className="size-4" />} label="Operator requests" />
      </div>
      {view === "requests" ? <OperatorAssignmentReviewPanel /> : (
        <div className="flex flex-col gap-5 lg:flex-row">
          {stopsQuery.isError ? <QueryError message="Unable to load operational route stops." onRetry={() => void stopsQuery.refetch()} /> : <BoardingStopSelector stops={stops} selected={selectedStop} search={search} selectedLocationCount={locations.length} onSearch={setSearch} onSelect={selectStop} />}
          <section className="min-h-[610px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
            {!selectedStop ? <Empty title="Choose a route stop" message="Select a stop to see its fallback and precise boarding places." /> : <>
              <div className="border-b border-white/10 p-5"><h3 className="text-lg font-bold text-white">{selectedStop.name}</h3><p className="mt-1 text-xs text-white/40">{selectedStop.code} · {selectedStop.district || "District not provided"}</p></div>
              <div className="space-y-5 p-5">
                <StopFallbackCard stop={selectedStop} onAdd={openCreate} />
                <div><div className="mb-3 flex items-end justify-between"><div><h4 className="font-semibold text-white">Precise boarding places</h4><p className="mt-0.5 text-xs text-white/40">These replace the fallback when enabled for an operator.</p></div><span className="text-xs font-semibold text-white/45">{locations.length} total</span></div>
                  {locationsQuery.isLoading ? <Loader /> : locationsQuery.isError ? <QueryError message="Unable to load boarding places." onRetry={() => void locationsQuery.refetch()} /> : locations.length === 0 ? <Empty title="No precise place yet" message="The stop fallback above remains available. Add a precise place only when passengers need clearer directions." compact /> : <div className="space-y-3">{locations.map((location) => <BoardingLocationCard key={location.id} location={location} onEdit={() => setEditor({ open: true, location })} onManageAccess={() => setAccessLocation(location)} onDeactivate={() => setLocationToDeactivate(location)} deactivating={deactivate.isPending} />)}</div>}
                </div>
              </div>
            </>}
          </section>
        </div>
      )}
      {selectedStop && editor.open && <BoardingLocationEditorSheet open stop={selectedStop} location={editor.location} existingLocations={locations} onOpenChange={(open) => setEditor({ open, location: open ? editor.location : null })} onSaved={(saved) => {
        queryClient.setQueryData<BoardingLocation[]>(["boarding-locations", stopId], (current = []) => {
          const exists = current.some((location) => location.id === saved.id);
          return exists ? current.map((location) => location.id === saved.id ? saved : location) : [...current, saved];
        });
        if (saved.verificationStatus === "VERIFIED") setAccessLocation(saved);
        void queryClient.invalidateQueries({ queryKey: ["boarding-locations", stopId] });
      }} />}
      <DeactivateBoardingLocationDialog location={locationToDeactivate} pending={deactivate.isPending} onClose={() => setLocationToDeactivate(null)} onConfirm={() => locationToDeactivate && deactivate.mutate(locationToDeactivate.id)} />
      <BoardingLocationOperatorAccessDialog location={accessLocation} onClose={() => setAccessLocation(null)} />
    </div>
  );
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"}`}>{icon}{label}</button>; }
function Loader() { return <div className="flex h-32 items-center justify-center"><Loader2 className="size-5 animate-spin text-[#EA4B2A]" /></div>; }
function Empty({ title, message, compact = false }: { title: string; message: string; compact?: boolean }) { return <div className={`flex flex-col items-center justify-center p-8 text-center ${compact ? "min-h-40 rounded-2xl border border-dashed border-white/10" : "min-h-[420px]"}`}><MapPin className="mb-3 size-8 text-white/15" /><p className="font-semibold text-white/70">{title}</p><p className="mt-1 max-w-sm text-sm text-white/40">{message}</p></div>; }
function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-sm text-red-300">{message}</p><Button type="button" variant="outline" size="sm" onClick={onRetry}>Retry</Button></div>; }
