import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BoardingLocationFields } from "./BoardingLocationFields";
import { BoardingLocationMapPicker } from "./BoardingLocationMapPicker";
import { createBoardingLocation, findNearbyBoardingLocations, updateBoardingLocation } from "./boardingLocationApi";
import { distanceMeters, validCoordinates } from "./boardingLocationMapUtils";
import type { BoardingLocationEditorProps, BoardingLocationFormState } from "./boardingLocationTypes";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";

function initialState(props: BoardingLocationEditorProps): BoardingLocationFormState {
  const location = props.location;
  return {
    name: location?.name || "",
    aliases: location?.aliases.join(", ") || "",
    landmark: location?.landmark || "",
    address: location?.address || "",
    coordinates: location?.coordinates || null,
    verificationStatus: location?.verificationStatus || "VERIFIED",
    status: location?.status || "ACTIVE",
  };
}

export function BoardingLocationEditorSheet(props: BoardingLocationEditorProps) {
  const [form, setForm] = useState(() => initialState(props));
  const stopId = getStopId(props.stop);
  const stopCoordinates = validCoordinates(props.stop.coordinates) ? props.stop.coordinates : null;
  const nearby = useQuery({
    queryKey: [
      "boarding-location-nearby", stopId, form.coordinates, props.location?.id,
    ],
    queryFn: () => findNearbyBoardingLocations(
      stopId, form.coordinates!, props.location?.id,
    ),
    enabled: props.open && Boolean(form.coordinates),
    staleTime: 10_000,
  });
  const farFromStop = useMemo(() => form.coordinates && stopCoordinates
    ? distanceMeters(stopCoordinates, form.coordinates) > 5000 : false,
  [form.coordinates, stopCoordinates]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.coordinates) throw new Error("Select the exact map location.");
      const payload = {
        stopId,
        name: form.name.trim(),
        aliases: form.aliases.split(",").map((item) => item.trim()).filter(Boolean),
        landmark: form.landmark.trim() || null,
        address: form.address.trim() || null,
        coordinates: form.coordinates,
        verificationStatus: form.verificationStatus,
        status: form.status,
      };
      if (props.location) return updateBoardingLocation(props.location.id, payload);
      return (await createBoardingLocation(payload)).location;
    },
    onSuccess(location) {
      toast.success(props.location ? "Boarding location updated." : "Boarding location created.");
      props.onSaved(location);
      props.onOpenChange(false);
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to save location.");
    },
  });

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-[#0a0a0a] p-0 sm:max-w-5xl">
        <SheetHeader className="border-b border-white/10 p-6">
          <SheetTitle className="flex items-center gap-2 text-xl"><MapPin className="size-5 text-[#D3D925]" />{props.location ? "Edit" : "Add"} boarding location</SheetTitle>
          <SheetDescription>{props.stop.name} · Pick the exact physical place on the map.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
          <BoardingLocationFields value={form} onChange={setForm} />
          <div className="space-y-3">
            <BoardingLocationMapPicker value={form.coordinates} center={stopCoordinates} onChange={(coordinates) => setForm({ ...form, coordinates })} />
            {farFromStop && <p className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200"><AlertTriangle className="size-4 shrink-0" />This point is over 5 km from its parent stop. Verify the selected stop and marker.</p>}
            {(nearby.data?.length || 0) > 0 && <p className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70"><AlertTriangle className="size-4 shrink-0" />{nearby.data!.length} existing location{nearby.data!.length === 1 ? " is" : "s are"} within 100 m. Check for a duplicate before saving.</p>}
          </div>
        </div>
        <SheetFooter className="border-t border-white/10 p-6 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button disabled={mutation.isPending || !form.name.trim() || !form.coordinates} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}{props.location ? "Save changes" : "Create location"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
