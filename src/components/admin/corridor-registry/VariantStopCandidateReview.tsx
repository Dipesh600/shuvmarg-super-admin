import { useState } from "react";
import { BusFront, CheckCheck, CheckCircle2, CircleSlash2, Loader2, MapPin, PencilLine, Plus, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type ProposedCanonicalStop,
  type ResolveVariantStopCandidateInput,
  type VariantStopCandidate,
  type VariantStopCandidateReviewStatus,
} from "@/api/corridorWorkflowApi";

interface VariantStopCandidateReviewProps {
  candidates: VariantStopCandidate[];
  pendingCandidateId: string | null;
  isUsingAllExisting: boolean;
  onResolve: (candidateId: string, payload: ResolveVariantStopCandidateInput) => Promise<void>;
  onUseAllExisting: () => Promise<void>;
}

const STOP_TYPES = ["CITY", "TOWN", "JUNCTION", "HIGHWAY_STOP", "BORDER"];

function buildProposedStop(candidate: VariantStopCandidate): ProposedCanonicalStop {
  const isBoardingEvidence = candidate.classification?.entityType === "BOARDING_LOCATION";
  const suggested = candidate.suggestedStop;
  return {
    ...suggested,
    name: isBoardingEvidence ? "" : suggested?.name || candidate.displayName || "",
    type: suggested?.type || "TOWN",
    coordinates: suggested?.coordinates || candidate.coords || candidate.coordinates || null,
    isSearchable: suggested?.isSearchable !== false,
    isRouteStop: true,
    coordinateSource: suggested?.coordinateSource || "DISCOVERY",
    coordinateProvider: suggested?.coordinateProvider || "GOOGLE",
    coordinatePlaceId: suggested?.coordinatePlaceId || null,
    coordinateSuggestedAddress: suggested?.coordinateSuggestedAddress || candidate.formattedAddress || null,
  };
}

function hydratedProposedStop(candidate: VariantStopCandidate): ProposedCanonicalStop {
  const generated = buildProposedStop(candidate);
  const saved = candidate.proposedStop;
  if (!saved) return generated;
  const savedCoordinates = saved.coordinates;
  const hasSavedCoordinates = savedCoordinates &&
    Number.isFinite(savedCoordinates.lat) && Number.isFinite(savedCoordinates.lng);
  return {
    ...generated,
    name: saved.name || generated.name,
    code: saved.code || generated.code || null,
    type: saved.type || generated.type,
    province: saved.province || generated.province || null,
    district: saved.district || generated.district || null,
    municipality: saved.municipality || generated.municipality || null,
    coordinates: hasSavedCoordinates ? savedCoordinates : generated.coordinates,
    isSearchable: saved.isSearchable ?? generated.isSearchable,
    isRouteStop: true,
    coordinateSource: saved.coordinateSource || generated.coordinateSource,
    coordinateProvider: saved.coordinateProvider || generated.coordinateProvider,
    coordinatePlaceId: saved.coordinatePlaceId || generated.coordinatePlaceId || null,
    coordinateSuggestedAddress: saved.coordinateSuggestedAddress ||
      generated.coordinateSuggestedAddress || null,
  };
}

function candidateId(candidate: VariantStopCandidate) {
  return candidate.id || candidate._id || candidate.candidateKey || `route-stop-${candidate.sequence}`;
}

function stopId(stop: { _id?: string; id?: string }) {
  return stop._id || stop.id || null;
}

function statusLabel(status: VariantStopCandidateReviewStatus) {
  switch (status) {
    case "USE_EXISTING":
      return "Using Shuvmarg stop";
    case "CREATE_NEW":
      return "New stop approved";
    case "EXCLUDE":
      return "Excluded";
    default:
      return "Needs review";
  }
}

function candidateSource(candidate: VariantStopCandidate) {
  if (candidate.isTerminal) return "Selected terminal";
  if (candidate.classification?.entityType === "SERVICE_AREA") {
    return "Possible passenger locality inferred from nearby transit evidence — admin confirmation required";
  }
  if (candidate.classification?.entityType === "BOARDING_LOCATION") {
    const parent = candidate.classification.suggestedParentStop;
    return parent
      ? `Physical boarding-place evidence near ${parent.name}; it is not another route stop`
      : "Physical transit-place evidence only; Google cannot prove this is a sellable route stop";
  }
  if (candidate.matchedStop) return "Canonical Shuvmarg stop with matching identity";
  if (candidate.discoveryMethod === "SEARCH_ALONG_ROUTE") {
    return "Google transit place on this road path — requires admin confirmation";
  }
  if (candidate.discoveryMethod === "REVERSE_GEOCODE") {
    return "Low-confidence locality gap-filler — not evidence that a bus serves it";
  }
  return "Unverified Google place observation";
}

function coverageLabel(candidate: VariantStopCandidate) {
  const zone = candidate.classification?.coverageZone;
  if (zone === "ORIGIN_40KM") return "Dense origin coverage · first 40 km";
  if (zone === "DESTINATION_40KM") return "Dense destination coverage · last 40 km";
  return "On-path route coverage";
}

function EntityTypeBadge({ candidate }: { candidate: VariantStopCandidate }) {
  if (candidate.classification?.entityType === "SERVICE_AREA") {
    return <span className="inline-flex rounded-full bg-sky-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-300">Possible missing route stop</span>;
  }
  if (candidate.isTerminal || candidate.classification?.entityType === "ROUTE_STOP") {
    return <span className="inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Route stop</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-300"><BusFront className="size-3" />Boarding-place evidence</span>;
}

function CandidateStatus({ candidate }: { candidate: VariantStopCandidate }) {
  if (candidate.isTerminal) {
    return <span className="inline-flex rounded-full bg-[#D3D925]/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#D3D925]">Locked terminal</span>;
  }

  const classes: Record<VariantStopCandidateReviewStatus, string> = {
    UNREVIEWED: "bg-amber-400/10 text-amber-300",
    USE_EXISTING: "bg-emerald-400/10 text-emerald-300",
    CREATE_NEW: "bg-sky-400/10 text-sky-300",
    EXCLUDE: "bg-white/10 text-white/50",
  };

  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${classes[candidate.reviewStatus]}`}>{statusLabel(candidate.reviewStatus)}</span>;
}

function ProposedStopFields({
  value,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: ProposedCanonicalStop;
  disabled: boolean;
  onChange: (next: ProposedCanonicalStop) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const hasCoordinates = Boolean(value.coordinates && Number.isFinite(value.coordinates.lat) && Number.isFinite(value.coordinates.lng));
  const stopName = typeof value.name === "string" ? value.name : "";
  const set = <K extends keyof ProposedCanonicalStop>(key: K, next: ProposedCanonicalStop[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">Create canonical route stop for this service area</p><p className="mt-1 text-xs leading-5 text-white/45">Use the passenger-recognized locality or travel-market name—not a gate, bay, counter, or Google boarding-place label. Reuse an existing Stop whenever one exists.</p></div><PencilLine className="size-4 shrink-0 text-sky-300" /></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Canonical name</Label><Input value={stopName} onChange={(event) => set("name", event.target.value)} placeholder="Route-stop name" className="border-white/10 bg-black/20 text-white" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Stop type</Label><Select value={value.type} onValueChange={(next) => set("type", next)}><SelectTrigger className="border-white/10 bg-black/20 text-white"><SelectValue /></SelectTrigger><SelectContent>{STOP_TYPES.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">District</Label><Input value={value.district || ""} onChange={(event) => set("district", event.target.value || null)} placeholder="District" className="border-white/10 bg-black/20 text-white" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Province</Label><Input value={value.province || ""} onChange={(event) => set("province", event.target.value || null)} placeholder="Province" className="border-white/10 bg-black/20 text-white" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Municipality <span className="normal-case tracking-normal text-white/25">(optional)</span></Label><Input value={value.municipality || ""} onChange={(event) => set("municipality", event.target.value || null)} placeholder="Municipality" className="border-white/10 bg-black/20 text-white" /></div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs text-white/50"><MapPin className="size-3.5 shrink-0 text-sky-300" />{hasCoordinates ? `${value.coordinates?.lat.toFixed(5)}, ${value.coordinates?.lng.toFixed(5)} from the reviewed map suggestion` : "This suggestion has no usable map position and cannot create a route stop."}</div>
      {value.coordinateSuggestedAddress && <div className="mt-2 rounded-lg bg-black/15 px-3 py-2 text-xs text-white/45"><span className="font-medium text-white/60">Google address:</span> {value.coordinateSuggestedAddress}</div>}
      <div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onCancel} className="text-white/60 hover:bg-white/10 hover:text-white">Cancel</Button><Button type="button" size="sm" disabled={disabled || !stopName.trim() || !hasCoordinates} onClick={onSubmit} className="bg-sky-400 font-semibold text-black hover:bg-sky-300">{disabled ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Plus className="mr-2 size-3.5" />}Create missing Stop</Button></div>
    </div>
  );
}

export function VariantStopCandidateReview({
  candidates, pendingCandidateId, isUsingAllExisting, onResolve, onUseAllExisting,
}: VariantStopCandidateReviewProps) {
  const [creatingCandidateId, setCreatingCandidateId] = useState<string | null>(null);
  const [proposedStops, setProposedStops] = useState<Record<string, ProposedCanonicalStop>>({});
  const boardingEvidence = [...candidates]
    .filter((candidate) => candidate.classification?.entityType === "BOARDING_LOCATION")
    .sort((left, right) => left.sequence - right.sequence);
  const orderedCandidates = [...candidates]
    .filter((candidate) => candidate.classification?.entityType !== "BOARDING_LOCATION")
    .sort((left, right) => left.sequence - right.sequence);
  const reusableExistingCount = orderedCandidates.filter((candidate) =>
    !candidate.isTerminal && candidate.reviewStatus === "UNREVIEWED" &&
    candidate.classification?.entityType === "ROUTE_STOP" &&
    candidate.classification?.confidence === "HIGH" && Boolean(candidate.matchedStop)
  ).length;

  const resolve = async (candidateId: string, payload: ResolveVariantStopCandidateInput) => {
    await onResolve(candidateId, payload);
    if (payload.reviewStatus !== "CREATE_NEW") setCreatingCandidateId(null);
  };

  const updateProposedStop = (candidate: VariantStopCandidate, value: ProposedCanonicalStop) => {
    setProposedStops((current) => ({ ...current, [candidateId(candidate)]: value }));
  };

  if (!orderedCandidates.length && !boardingEvidence.length) {
    return <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center"><Route className="mb-3 size-7 text-white/25" /><p className="font-semibold text-white/65">No stop candidates are ready yet</p><p className="mt-1 max-w-md text-sm text-white/40">The selected road path needs a candidate scan before it can become a canonical route sequence.</p></div>;
  }

  return <div className="space-y-3">
    {reusableExistingCount > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.045] px-4 py-3">
      <div><p className="text-sm font-semibold text-emerald-100">{reusableExistingCount} verified Shuvmarg Stop {reusableExistingCount === 1 ? "match" : "matches"} found</p><p className="mt-0.5 text-xs text-emerald-100/55">Reuse all safe canonical matches now. Missing or uncertain places still need individual review.</p></div>
      <Button type="button" size="sm" disabled={isUsingAllExisting || Boolean(pendingCandidateId)} onClick={() => void onUseAllExisting()} className="bg-emerald-400 font-semibold text-black hover:bg-emerald-300">
        {isUsingAllExisting ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <CheckCheck className="mr-2 size-3.5" />}Use all existing matches
      </Button>
    </div>}
    {orderedCandidates.map((candidate, routeIndex) => {
    const currentCandidateId = candidateId(candidate);
    const isPending = pendingCandidateId === currentCandidateId;
    const currentProposedStop = proposedStops[currentCandidateId] || hydratedProposedStop(candidate);
    const selectedExistingStop = candidate.resolvedStop || candidate.matchedStop;
    const showCreationForm = creatingCandidateId === currentCandidateId || candidate.reviewStatus === "CREATE_NEW";

    const selectedExistingStopId = selectedExistingStop ? stopId(selectedExistingStop) : null;

    const isBoardingEvidence = candidate.classification?.entityType === "BOARDING_LOCATION";
    const suggestedParent = candidate.classification?.suggestedParentStop;

    return <article key={currentCandidateId} className={`rounded-2xl border p-4 transition ${candidate.isTerminal ? "border-[#D3D925]/25 bg-[#D3D925]/[0.045]" : isBoardingEvidence ? "border-orange-400/15 bg-orange-400/[0.025]" : candidate.reviewStatus === "UNREVIEWED" ? "border-amber-400/20 bg-amber-400/[0.035]" : "border-white/10 bg-white/[0.025]"}`}>
      <div className="flex gap-3"><div className="flex w-8 shrink-0 flex-col items-center"><span className="flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/75">{routeIndex + 1}</span><span className="mt-1 h-full min-h-8 w-px bg-white/10 last:hidden" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{candidate.displayName}</p><p className="mt-1 text-xs text-white/40">{candidate.formattedAddress || candidateSource(candidate)}</p></div></div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><EntityTypeBadge candidate={candidate} />{!candidate.isTerminal && <CandidateStatus candidate={candidate} />}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/40"><span>{candidateSource(candidate)}</span>{candidate.classification?.entityType === "ROUTE_STOP" && !candidate.isTerminal && <span className="text-[#D3D925]/70">{coverageLabel(candidate)}</span>}{candidate.classification?.distanceToRouteMeters != null && candidate.classification.distanceToRouteMeters > 500 && <span>{(candidate.classification.distanceToRouteMeters / 1000).toFixed(1)} km from selected road</span>}{candidate.distanceKm != null && <span>{candidate.distanceKm.toFixed(1)} km from terminal</span>}{candidate.durationMinutes != null && <span>{candidate.durationMinutes} min estimated</span>}</div>
        {candidate.isTerminal ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#D3D925]/15 bg-black/15 px-3 py-2 text-xs text-white/60"><CheckCircle2 className="size-3.5 shrink-0 text-[#D3D925]" />This terminal is locked into the final route sequence.</div> : isBoardingEvidence && suggestedParent ? <div className="mt-4 rounded-lg border border-orange-400/15 bg-black/15 px-3 py-3 text-xs leading-5 text-white/55"><strong className="text-orange-200">Treat this as a boarding-location candidate under {suggestedParent.name}.</strong> It is excluded from the route sequence automatically. This route review does not publish a Boarding Location record.</div> : <>
          {selectedExistingStop && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.045] px-3 py-2"><div><p className="text-xs font-semibold text-emerald-200">Existing Shuvmarg stop: {selectedExistingStop.name}</p><p className="mt-0.5 text-[11px] text-emerald-100/55">{selectedExistingStop.code}{selectedExistingStop.district ? ` · ${selectedExistingStop.district}` : ""} · reuse this to avoid duplicates</p></div>{candidate.reviewStatus !== "USE_EXISTING" && <Button type="button" size="sm" disabled={isPending || !selectedExistingStopId} onClick={() => selectedExistingStopId && void resolve(currentCandidateId, { reviewStatus: "USE_EXISTING", stopId: selectedExistingStopId })} className="bg-emerald-400 text-black hover:bg-emerald-300">{isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Use existing Stop"}</Button>}</div>}
          <div className="mt-4 flex flex-wrap gap-2">{!selectedExistingStop && <span className="inline-flex items-center rounded-lg border border-orange-400/20 bg-orange-400/[0.04] px-3 py-2 text-xs text-orange-100/70">{isBoardingEvidence ? "No canonical route stop serves this nearby area yet" : "No Shuvmarg stop match found near this suggestion"}</span>}<Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setCreatingCandidateId(currentCandidateId)} className="border-sky-400/25 bg-transparent text-sky-200 hover:bg-sky-400/10 hover:text-sky-100"><PencilLine className="mr-2 size-3.5" />{isBoardingEvidence ? "Create route stop for this service area" : "Create missing Stop"}</Button><Button type="button" variant="outline" size="sm" disabled={isPending || candidate.reviewStatus === "EXCLUDE"} onClick={() => void resolve(currentCandidateId, { reviewStatus: "EXCLUDE" })} className="border-white/15 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"><CircleSlash2 className="mr-2 size-3.5" />Skip this place</Button></div>
          {showCreationForm && <ProposedStopFields value={currentProposedStop} disabled={isPending} onChange={(value) => updateProposedStop(candidate, value)} onCancel={() => setCreatingCandidateId(null)} onSubmit={() => void resolve(currentCandidateId, { reviewStatus: "CREATE_NEW", proposedStop: currentProposedStop })} />}
        </>}
      </div></div>
    </article>;
  })}
    {boardingEvidence.length > 0 && <details className="rounded-2xl border border-orange-400/15 bg-orange-400/[0.025]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-orange-100">{boardingEvidence.length} Google boarding-place observations <span className="ml-2 text-xs font-normal text-white/35">Not part of the route-stop sequence</span></summary>
      <div className="border-t border-orange-400/10 px-4 py-2">{boardingEvidence.map((candidate) => <div key={candidateId(candidate)} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-2.5 last:border-0"><div><p className="text-xs font-medium text-white/70">{candidate.displayName}</p><p className="mt-0.5 text-[11px] text-white/35">{candidate.classification?.suggestedParentStop ? `Possible boarding location under ${candidate.classification.suggestedParentStop.name}` : "Unassigned boarding-location evidence"}</p></div><span className="text-[10px] text-white/30">{candidate.distanceKm?.toFixed(1)} km</span></div>)}</div>
    </details>}
  </div>;
}
