import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";
import { BoardingLocationFields } from "./BoardingLocationFields";
import { BoardingLocationMapPicker } from "./BoardingLocationMapPicker";
import { NearbyLocationMatches } from "./NearbyLocationMatches";
import { createBoardingLocation, findNearbyBoardingLocations, updateBoardingLocation } from "./boardingLocationApi";
import { distanceMeters, validCoordinates } from "./boardingLocationMapUtils";
import type { BoardingLocationEditorProps, BoardingLocationFormState } from "./boardingLocationTypes";

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
    queryKey: ["boarding-location-nearby", stopId, form.coordinates, props.location?.id],
    queryFn: () => findNearbyBoardingLocations(stopId, form.coordinates!, props.location?.id),
    enabled: props.open && Boolean(form.coordinates),
    staleTime: 10_000,
  });
  const farFromStop = useMemo(() => form.coordinates && stopCoordinates
    ? distanceMeters(stopCoordinates, form.coordinates) > 5000 : false,
  [form.coordinates, stopCoordinates]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.coordinates) throw new Error("Mark the exact boarding place on the map.");
      const payload = {
        stopId,
        name: form.name.trim(),
        aliases: form.aliases.split(",").map((item) => item.trim()).filter(Boolean),
        landmark: form.landmark.trim() || null,
        address: form.address.trim() || null,
        coordinates: form.coordinates,
        verificationStatus: props.location?.verificationStatus || "VERIFIED",
        status: props.location?.status || "ACTIVE",
      };
      if (props.location) return updateBoardingLocation(props.location.id, payload);
      return (await createBoardingLocation(payload)).location;
    },
    onSuccess(location) {
      toast.success(props.location ? "Boarding place updated." : "Boarding place created.");
      props.onSaved(location);
      props.onOpenChange(false);
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to save boarding place.");
    },
  });

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-[#090909] p-0 sm:max-w-6xl">
        <SheetHeader className="border-b border-white/10 px-6 py-5">
          <SheetTitle className="flex items-center gap-2 text-xl"><MapPin className="size-5 text-[#EA4B2A]" />{props.location ? "Edit boarding place" : `Add boarding place to ${props.stop.name}`}</SheetTitle>
          <SheetDescription>Mark the exact physical place, then add only what helps passengers recognise it.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <BoardingLocationMapPicker value={form.coordinates} center={stopCoordinates} onChange={(coordinates) => setForm({ ...form, coordinates })} />
            {farFromStop && <p className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200"><AlertTriangle className="size-4 shrink-0" />This point is over 5 km from {props.stop.name}. Check the selected stop and marker.</p>}
            <NearbyLocationMatches locations={nearby.data || []} onUse={(location) => { props.onSaved(location); props.onOpenChange(false); }} />
          </div>
          <BoardingLocationFields value={form} onChange={setForm} />
        </div>
        <SheetFooter className="border-t border-white/10 bg-black/20 p-5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button disabled={mutation.isPending || !form.name.trim() || !form.coordinates} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}{props.location ? "Save changes" : "Save boarding place"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
