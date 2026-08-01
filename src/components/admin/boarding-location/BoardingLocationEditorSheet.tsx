import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getStopId } from "@/components/admin/stop-registry/stopRegistryTypes";
import { BoardingLocationFields } from "./BoardingLocationFields";
import { BoardingLocationMapPicker } from "./BoardingLocationMapPicker";
import { NearbyLocationMatches } from "./NearbyLocationMatches";
import { createBoardingLocation, findNearbyBoardingLocations, updateBoardingLocation } from "./boardingLocationApi";
import { distanceMeters, validCoordinates } from "./boardingLocationMapUtils";
import type { BoardingLocationEditorProps, BoardingLocationFormState, BoardingMapSelection } from "./boardingLocationTypes";
import { normalizeGooglePlaceAddress } from "@/lib/googlePlaceFormatting";

function initialState(props: BoardingLocationEditorProps): BoardingLocationFormState {
  const location = props.location;
  return {
    name: location?.name || "", aliases: location?.aliases.join(", ") || "",
    landmark: location?.landmark || "",
    address: normalizeGooglePlaceAddress(location?.address) || "",
    locationType: location?.locationType || "ROADSIDE",
    gateOrBay: location?.gateOrBay || "", directionHint: location?.directionHint || "",
    coordinates: location?.coordinates || null,
    coordinateSource: location?.coordinateSource || "MAP_PIN",
    coordinateAccuracyMeters: location?.coordinateAccuracyMeters || null,
    capturedAt: location?.capturedAt || null,
    providerMetadata: location?.providerMetadata || null,
    verificationStatus: location?.verificationStatus || "PENDING",
    status: location?.status || "ACTIVE",
  };
}

export function BoardingLocationEditorSheet(props: BoardingLocationEditorProps) {
  const [form, setForm] = useState(() => initialState(props));
  const [nearbyReason, setNearbyReason] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const stopId = getStopId(props.stop);
  const stopCoordinates = validCoordinates(props.stop.coordinates) ? props.stop.coordinates : null;
  const nearby = useQuery({
    queryKey: ["boarding-location-nearby", stopId, form.coordinates, props.location?.id],
    queryFn: () => findNearbyBoardingLocations(stopId, form.coordinates!, props.location?.id),
    enabled: props.open && Boolean(form.coordinates), staleTime: 10_000,
  });
  const nearbyLocations = nearby.data || [];
  const farFromStop = useMemo(() => form.coordinates && stopCoordinates
    ? distanceMeters(stopCoordinates, form.coordinates) > 5000 : false,
  [form.coordinates, stopCoordinates]);

  const mutation = useMutation({
    mutationFn: async (verificationStatus: "PENDING" | "VERIFIED") => {
      if (!form.coordinates) throw new Error("Mark the exact boarding place on the map.");
      if (!props.location && nearbyLocations.length > 0 && !nearbyReason) {
        throw new Error("Review the nearby places and choose why this is separate.");
      }
      const payload = {
        stopId, name: form.name.trim(),
        aliases: form.aliases.split(",").map((item) => item.trim()).filter(Boolean),
        landmark: form.landmark.trim() || null, address: form.address.trim() || null,
        locationType: form.locationType, gateOrBay: form.gateOrBay.trim() || null,
        directionHint: form.directionHint.trim() || null, coordinates: form.coordinates,
        coordinateSource: form.coordinateSource,
        coordinateAccuracyMeters: form.coordinateAccuracyMeters,
        capturedAt: form.capturedAt, providerMetadata: form.providerMetadata,
        verificationStatus, verificationMethod: verificationStatus === "VERIFIED" ? "DESK_MAP" : null,
        nearbyReview: nearbyLocations.length > 0
          ? { acknowledged: true, reason: nearbyReason } : undefined,
        status: form.status,
      };
      if (props.location) return updateBoardingLocation(props.location.id, payload);
      return (await createBoardingLocation(payload)).location;
    },
    onSuccess(location) {
      toast.success(location.verificationStatus === "VERIFIED"
        ? "Boarding place verified and activated." : "Boarding place saved for review.");
      props.onSaved(location); props.onOpenChange(false);
    },
    onError(error: { response?: { data?: { message?: string } }; message?: string }) {
      toast.error(error.response?.data?.message || error.message || "Unable to save boarding place.");
    },
  });

  const applyMapSelection = (selection: BoardingMapSelection) => setForm((current) => ({
    ...current, coordinates: selection.coordinates,
    coordinateSource: selection.coordinateSource,
    coordinateAccuracyMeters: selection.coordinateAccuracyMeters,
    capturedAt: selection.capturedAt,
    providerMetadata: selection.providerMetadata || null,
    name: current.name || selection.suggestedName || "",
    address: current.address || selection.providerMetadata?.suggestedAddress || "",
    locationType: current.locationType === "ROADSIDE" && selection.suggestedLocationType
      ? selection.suggestedLocationType : current.locationType,
  }));
  const canSubmit = Boolean(form.name.trim() && form.coordinates) &&
    (props.location !== null || nearbyLocations.length === 0 || Boolean(nearbyReason));
  const existingForMap = props.existingLocations.filter((item) => item.id !== props.location?.id);

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-[#090909] p-0 sm:max-w-6xl">
        <SheetHeader className="border-b border-white/10 px-6 py-5">
          <SheetTitle className="flex items-center gap-2 text-xl"><MapPin className="size-5 text-[#F97316]" />{props.location ? "Edit boarding place" : `Add boarding place to ${props.stop.name}`}</SheetTitle>
          <SheetDescription>Position the exact passenger meeting place, resolve nearby matches, then choose its verification level.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <BoardingLocationMapPicker value={form.coordinates} center={stopCoordinates} routeStopName={props.stop.name} existingLocations={existingForMap} onChange={applyMapSelection} />
            {!stopCoordinates && <p className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200"><AlertTriangle className="size-4 shrink-0" />{props.stop.name} has no registered map position yet, so it cannot be shown as the reference marker. Add its coordinates in Stop Registry first.</p>}
            {farFromStop && <p className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200"><AlertTriangle className="size-4 shrink-0" />This point is over 5 km from {props.stop.name}. Check the route stop and marker.</p>}
            <NearbyLocationMatches locations={nearbyLocations} onUse={(location) => { props.onSaved(location); props.onOpenChange(false); }} reason={nearbyReason} onReasonChange={setNearbyReason} />
          </div>
          <BoardingLocationFields value={form} onChange={setForm} />
        </div>
        <SheetFooter className="border-t border-white/10 bg-black/20 p-5 sm:flex-row sm:justify-end">
          <label className="mr-auto flex max-w-md items-start gap-2 text-left text-xs leading-relaxed text-white/55">
            <input type="checkbox" checked={verificationConfirmed} onChange={(event) => setVerificationConfirmed(event.target.checked)} className="mt-0.5 accent-[#F97316]" />
            I checked bus access, the correct road side or entrance, passenger recognition details, and all nearby matches.
          </label>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          {(!props.location || props.location.verificationStatus !== "VERIFIED") && <Button variant="outline" disabled={mutation.isPending || !canSubmit} onClick={() => mutation.mutate("PENDING")}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Save pending</Button>}
          <Button disabled={mutation.isPending || !canSubmit || !verificationConfirmed} onClick={() => mutation.mutate("VERIFIED")}><ShieldCheck className="size-4" />{props.location?.verificationStatus === "VERIFIED" ? "Save verified changes" : "Verify & activate"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
