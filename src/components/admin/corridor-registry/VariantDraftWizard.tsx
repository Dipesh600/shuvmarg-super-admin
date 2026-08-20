import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Compass, Loader2, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  commitVariantDraft,
  addExistingVariantDraftStop,
  createVariantDraft,
  discoverVariantDraftStopCandidates,
  getVariantDraft,
  previewCorridorRoutePaths,
  refreshVariantDraftRoutes,
  resolveVariantDraftStopCandidate,
  selectVariantDraftRoute,
  updateVariantDraftDetails,
  applyAllMatchedVariantDraftStopCandidates,
  type CorridorStop,
  type CorridorRoutePreview,
  type RouteCorridor,
  type RouteOption,
  type VariantDirection,
  type VariantDraft,
  type VariantType,
} from "@/api/corridorWorkflowApi";
import { GoogleRouteAlternativesMap } from "./GoogleRouteAlternativesMap";
import { RouteStopReviewMap } from "./RouteStopReviewMap";
import { SelectedRoutePathway } from "./SelectedRoutePathway";
import { RouteGuidanceControl } from "./RouteGuidanceControl";
import { VariantStopCandidateReview } from "./VariantStopCandidateReview";
import { ManualRouteStopAdder } from "./ManualRouteStopAdder";

type WizardStep = "route" | "stops" | "details";

interface VariantDraftWizardProps {
  corridor: RouteCorridor | null;
  stops: CorridorStop[];
  open: boolean;
  initialDirection: VariantDirection;
  initialDraftId?: string | null;
  onOpenChange: (open: boolean) => void;
  onDraftCreated: () => void;
}

function RouteOptionCard({ option, selected, disabled, onSelect }: { option: RouteOption; selected: boolean; disabled: boolean; onSelect: () => void }) {
  return <button type="button" disabled={disabled} onClick={onSelect} className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-wait disabled:opacity-60 ${selected ? "border-[#D3D925]/45 bg-[#D3D925]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-white">{option.label || "Google road suggestion"}</p><p className="mt-1 text-xs text-white/40">{option.distanceKm.toLocaleString()} km · {option.durationMinutes} min estimated</p><p className="mt-1 text-[11px] text-white/30">Review only. Shuvmarg will store the approved route stops, not blindly publish this map output.</p></div>{selected ? <CheckCircle2 className="size-5 shrink-0 text-[#D3D925]" /> : <ChevronRight className="size-5 shrink-0 text-white/25" />}</div>{option.isRecommended && <span className="mt-3 inline-flex rounded-full bg-[#D3D925]/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#D3D925]">Google recommended</span>}</button>;
}

function transportNamePlaceholder(from: CorridorStop | undefined, to: CorridorStop | undefined, selectedOption: RouteOption | null) {
  const routeLabel = selectedOption?.label?.replace(/^via\s+/i, "").trim();
  if (!from || !to || !routeLabel) return "For example: Kathmandu–Malangwa via Bardibas / Lalbandi";
  return `${from.name}–${to.name} via ${routeLabel}`;
}

function stepCopy(step: WizardStep) {
  switch (step) {
    case "route": return "Select road path";
    case "stops": return "Review stops on map";
    case "details": return "Name the route path";
  }
}

function terminalId(terminal?: { stopId?: string; id?: string; _id?: string } | null) {
  return terminal?.stopId || terminal?.id || terminal?._id || "";
}

function stepForDraft(draft: VariantDraft): WizardStep {
  if (draft.nextAction === "REVIEW_STOPS") return draft.workflowStatus === "ROUTE_SELECTED" ? "stops" : "stops";
  if (draft.nextAction === "NAME_PATH" || draft.nextAction === "READY_TO_SAVE") return "details";
  return "route";
}

function getChildTerminals(endpoint: CorridorStop | undefined, allStops: CorridorStop[]) {
  if (!endpoint) return [];
  const endpointId = String(endpoint._id || endpoint.id || "");
  if (!endpointId) return [];
  const seen = new Set<string>([endpointId]);
  return allStops.filter((s) => {
    const sId = String(s._id || s.id || "");
    if (!sId || seen.has(sId)) return false;
    const pId = typeof s.parentStopId === "object" ? s.parentStopId?._id || s.parentStopId?.id : s.parentStopId;
    if (pId && String(pId) === endpointId) { seen.add(sId); return true; }
    return false;
  });
}

function routeNameSuggestions(
  source: CorridorStop | undefined,
  destination: CorridorStop | undefined,
  option: RouteOption | null,
  candidates: VariantDraft["candidates"] = [],
) {
  const endpointNames = new Set([source?.name, destination?.name].filter(Boolean).map((name) => name!.toLocaleLowerCase()));
  const hubs = (candidates || []).filter((candidate) =>
    candidate.reviewStatus !== "EXCLUDE" && !candidate.isTerminal
  ).map((candidate) => candidate.resolvedStop?.name || candidate.matchedStop?.name || candidate.displayName)
    .filter((name) => name && !endpointNames.has(name.toLocaleLowerCase()));
  const uniqueHubs = [...new Set(hubs)].slice(0, 3);
  const roads = (option?.roadLabels || []).slice(0, 2);
  return [...new Set([
    uniqueHubs.length ? `Via ${uniqueHubs.join(" / ")}` : "",
    roads.length ? `Via ${roads.join(" / ")}` : "",
  ].filter(Boolean))];
}

export function VariantDraftWizard({ corridor, stops, open, initialDirection, initialDraftId = null, onOpenChange, onDraftCreated }: VariantDraftWizardProps) {
  const [step, setStep] = useState<WizardStep>("route");
  const [direction, setDirection] = useState<VariantDirection>("FORWARD");

  // Preview state — Google road paths fetched WITHOUT creating any draft.
  // A draft is only created once the operator selects a path and proceeds.
  const [preview, setPreview] = useState<CorridorRoutePreview | null>(null);
  const [selectedPreviewOptionId, setSelectedPreviewOptionId] = useState<string | null>(null);
  const [isFindingPaths, setIsFindingPaths] = useState(false);

  // Draft state — only populated after the operator proceeds to stop review.
  const [draft, setDraft] = useState<VariantDraft | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<VariantType>("STANDARD");
  const [selectedOriginTerminalId, setSelectedOriginTerminalId] = useState<string>("");
  const [selectedDestinationTerminalId, setSelectedDestinationTerminalId] = useState<string>("");
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const [isUsingAllExisting, setIsUsingAllExisting] = useState(false);
  const [isPreparingCandidates, setIsPreparingCandidates] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isLoadingRouteOverview, setIsLoadingRouteOverview] = useState(false);
  const [isAddingManualStop, setIsAddingManualStop] = useState(false);

  const sourceEndpoint = direction === "FORWARD" ? corridor?.originId : corridor?.destinationId;
  const targetEndpoint = direction === "FORWARD" ? corridor?.destinationId : corridor?.originId;

  const originChildTerminals = useMemo(() => getChildTerminals(sourceEndpoint, stops), [sourceEndpoint, stops]);
  const destinationChildTerminals = useMemo(() => getChildTerminals(targetEndpoint, stops), [targetEndpoint, stops]);

  const originHasChildren = originChildTerminals.length > 0;
  const destinationHasChildren = destinationChildTerminals.length > 0;
  const hasAnyParentTerminal = originHasChildren || destinationHasChildren;

  const originTerminalOptions = useMemo(() => {
    if (!sourceEndpoint) return [];
    const list = [sourceEndpoint, ...originChildTerminals];
    const seen = new Set<string>();
    return list.filter((s) => { const sId = String(s._id || s.id || ""); if (!sId || seen.has(sId)) return false; seen.add(sId); return true; });
  }, [sourceEndpoint, originChildTerminals]);

  const destinationTerminalOptions = useMemo(() => {
    if (!targetEndpoint) return [];
    const list = [targetEndpoint, ...destinationChildTerminals];
    const seen = new Set<string>();
    return list.filter((s) => { const sId = String(s._id || s.id || ""); if (!sId || seen.has(sId)) return false; seen.add(sId); return true; });
  }, [targetEndpoint, destinationChildTerminals]);

  // Reset all state when the wizard opens for a new variant.
  useEffect(() => {
    if (!open || !corridor) return;
    setStep("route");
    setDirection(initialDirection);
    setPreview(null);
    setSelectedPreviewOptionId(null);
    setIsFindingPaths(false);
    setDraft(null);
    setDraftName("");
    setDraftType("STANDARD");
    setSelectedOriginTerminalId(originChildTerminals[0]?._id || sourceEndpoint?._id || "");
    setSelectedDestinationTerminalId(destinationChildTerminals[0]?._id || targetEndpoint?._id || "");
    setPendingCandidateId(null);
    setIsUsingAllExisting(false);
    setIsPreparingCandidates(false);
    setIsCommitting(false);
    setIsLoadingDraft(false);
    setIsLoadingRoutes(false);
    setIsLoadingRouteOverview(false);
  }, [corridor, initialDirection, open, originChildTerminals, destinationChildTerminals, sourceEndpoint, targetEndpoint]);

  // Resume an existing draft (e.g. opened from the drafts list).
  useEffect(() => {
    if (!open || !initialDraftId) return;
    let discarded = false;
    setIsLoadingDraft(true);
    void getVariantDraft(initialDraftId).then((response) => {
      if (discarded) return;
      const existingDraft = response.data;
      setDraft(existingDraft);
      setDirection(existingDraft.direction);
      setDraftName(existingDraft.name || "");
      setDraftType(existingDraft.type || "STANDARD");
      if (existingDraft.originTerminal) setSelectedOriginTerminalId(terminalId(existingDraft.originTerminal));
      if (existingDraft.destinationTerminal) setSelectedDestinationTerminalId(terminalId(existingDraft.destinationTerminal));
      setStep(stepForDraft(existingDraft));
    }).catch((error: unknown) => {
      if (!discarded) toast.error(error instanceof Error ? error.message : "Unable to resume this variant draft.");
    }).finally(() => {
      if (!discarded) setIsLoadingDraft(false);
    });
    return () => { discarded = true; };
  }, [initialDraftId, open]);

  // ─── STEP 1: Find road paths (stateless — no draft created) ──────────────
  const findRoadPaths = async () => {
    if (!corridor) return;
    setIsFindingPaths(true);
    setPreview(null);
    setSelectedPreviewOptionId(null);
    try {
      const originTerminalParam = (originHasChildren && selectedOriginTerminalId && selectedOriginTerminalId !== sourceEndpoint?._id)
        ? selectedOriginTerminalId : undefined;
      const destTerminalParam = (destinationHasChildren && selectedDestinationTerminalId && selectedDestinationTerminalId !== targetEndpoint?._id)
        ? selectedDestinationTerminalId : undefined;

      const response = await previewCorridorRoutePaths(corridor._id, {
        direction,
        originTerminalStopId: originTerminalParam,
        destinationTerminalStopId: destTerminalParam,
      });
      setPreview(response.data);
      if (response.data.routeOptions.length > 0) {
        setSelectedPreviewOptionId(response.data.routeOptions[0].id);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Road paths could not be loaded. Check endpoint map positions and try again.");
    } finally {
      setIsFindingPaths(false);
    }
  };

  // ─── Refresh paths when a draft already exists (resumed draft) ───────────
  const refreshRoutes = async (viaPlaceIds: string[] = []) => {
    if (!draft) return;
    setIsLoadingRoutes(true);
    try {
      const response = await refreshVariantDraftRoutes(draft._id, { viaPlaceIds });
      setDraft(response.data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh route options.");
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // ─── STEP 1 → STEP 2: Create draft + select path + discover stops ────────
  // This is the ONLY place a draft record is created.
  const proceedToStopReview = async () => {
    if (!corridor || !selectedPreviewOptionId || !preview) return;
    const selectedPreviewOption = preview.routeOptions.find((o) => o.id === selectedPreviewOptionId);
    if (!selectedPreviewOption) return;

    setIsPreparingCandidates(true);
    try {
      // If draft already has a route selected and candidates ready, reuse it
      if (draft?._id && draft.selectedRouteOptionId) {
        const candidatesResponse = await discoverVariantDraftStopCandidates(draft._id);
        setDraft(candidatesResponse.data);
        setStep("stops");
        return;
      }

      const originTerminalParam = (originHasChildren && selectedOriginTerminalId && selectedOriginTerminalId !== sourceEndpoint?._id)
        ? selectedOriginTerminalId : undefined;
      const destTerminalParam = (destinationHasChildren && selectedDestinationTerminalId && selectedDestinationTerminalId !== targetEndpoint?._id)
        ? selectedDestinationTerminalId : undefined;

      // Create draft + store route options + select route + discover stops in 1 atomic backend call
      const draftResponse = await createVariantDraft(corridor._id, {
        direction,
        originTerminalStopId: originTerminalParam,
        destinationTerminalStopId: destTerminalParam,
        createCompanion: true,
        routeOptions: preview.routeOptions,
        selectedProviderRouteIndex: selectedPreviewOption.providerRouteIndex ?? 0,
      });

      const newDraft = draftResponse.data;
      setDraft(newDraft);
      onDraftCreated();
      if (newDraft.companionVariantId) {
        toast.success("Forward and return setup drafts were created as one route family.");
      }
      setStep("stops");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to start stop review. Please try again.");
    } finally {
      setIsPreparingCandidates(false);
    }
  };

  // ─── STEP 2: Route selection (resumed drafts only) ───────────────────────
  const chooseRoute = async (routeOptionId: string) => {
    if (!draft || isLoadingRouteOverview) return;
    setIsLoadingRouteOverview(true);
    try {
      const response = await selectVariantDraftRoute(draft._id, routeOptionId);
      setDraft(response.data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to select this route.");
    } finally {
      setIsLoadingRouteOverview(false);
    }
  };

  // ─── STEP 2 → STEP 3 (for resumed drafts that already have route options) ─
  const prepareStopReview = async () => {
    if (!draft || !draftSelectedOption) return;
    setIsPreparingCandidates(true);
    try {
      const candidatesResponse = await discoverVariantDraftStopCandidates(draft._id);
      setDraft(candidatesResponse.data);
      setStep("stops");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare route-stop review.");
    } finally {
      setIsPreparingCandidates(false);
    }
  };

  const resolveCandidate = async (candidateId: string, payload: Parameters<typeof resolveVariantDraftStopCandidate>[2]) => {
    if (!draft) return;
    setPendingCandidateId(candidateId);
    try {
      const response = await resolveVariantDraftStopCandidate(draft._id, candidateId, payload);
      setDraft(response.data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to update this route-stop decision.");
    } finally {
      setPendingCandidateId(null);
    }
  };

  const applyAllExistingCandidates = async () => {
    if (!draft) return;
    setIsUsingAllExisting(true);
    try {
      const response = await applyAllMatchedVariantDraftStopCandidates(draft._id);
      setDraft(response.data);
      toast.success("All safe existing Stop matches are selected.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to select the existing Stop matches.");
    } finally {
      setIsUsingAllExisting(false);
    }
  };

  const addManualStop = async (stopId: string) => {
    if (!draft) return;
    setIsAddingManualStop(true);
    try {
      const response = await addExistingVariantDraftStop(draft._id, stopId);
      setDraft(response.data);
      toast.success("Stop added at its calculated position on the route.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to add this Stop to the route.");
    } finally {
      setIsAddingManualStop(false);
    }
  };

  const finalizeDraft = async () => {
    if (!draft || !draftName.trim()) return;
    setIsCommitting(true);
    try {
      await updateVariantDraftDetails(draft._id, { name: draftName.trim(), type: draftType });
      const response = await commitVariantDraft(draft._id);
      toast.success(`${response.data.code} is ready for activation after the route-stop review.`);
      onDraftCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to commit this route variant.");
    } finally {
      setIsCommitting(false);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────────

  // For new wizards: use preview options. For resumed drafts: use draft options.
  const displayOptions: RouteOption[] = draft?.routeOptions?.length
    ? draft.routeOptions
    : (preview?.routeOptions ?? []);

  const draftSelectedOption = draft?.routeOptions?.find((o) => o.id === draft?.selectedRouteOptionId) ?? null;
  // "Selected option" for display is the draft's selection (resumed path) or the
  // preview option the user chose (new path).
  const selectedOption: RouteOption | null = draftSelectedOption
    ?? preview?.routeOptions.find((o) => o.id === selectedPreviewOptionId)
    ?? null;

  const stopCandidates = draft?.stopCandidates || draft?.candidates || [];
  const routeStopCandidates = stopCandidates.filter(
    (candidate) => candidate.classification?.entityType !== "BOARDING_LOCATION"
  );
  const unresolvedCandidateCount = routeStopCandidates.filter((candidate) =>
    !candidate.isTerminal && candidate.reviewStatus === "UNREVIEWED"
  ).length;
  const includedRouteStopCount = routeStopCandidates.filter(
    (candidate) => candidate.reviewStatus !== "EXCLUDE"
  ).length;
  const canCommitDraft = includedRouteStopCount >= 2 && unresolvedCandidateCount === 0;
  const usableRouteStopCount = stopCandidates.filter((candidate) =>
    candidate.reviewStatus !== "EXCLUDE" && candidate.classification?.entityType !== "BOARDING_LOCATION"
  ).length;
  const canNameDraft = usableRouteStopCount >= 2;
  const nameSuggestions = routeNameSuggestions(sourceEndpoint, targetEndpoint, selectedOption, stopCandidates);
  const originTerminal = stops.find((stop) => stop._id === terminalId(draft?.originTerminal)) || sourceEndpoint;
  const destinationTerminal = stops.find((stop) => stop._id === terminalId(draft?.destinationTerminal)) || targetEndpoint;

  // Whether this is a resumed draft that already has route options loaded.
  const isDraftWithRoutes = Boolean(draft && draft.routeOptions?.length);

  if (!open) return null;

  return (
    <section className="min-h-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/70 text-white">
      <header className="border-b border-white/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Compass className="size-5 text-[#D3D925]" />
              Build route path
            </h3>
            <p className="mt-1 text-sm text-white/45">
              {corridor ? `${corridor.originId.name} ↔ ${corridor.destinationId.name} · ${corridor.code}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Back to corridor
          </Button>
        </div>
      </header>

      <div className="border-b border-white/10 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {(["route", "stops", "details"] as WizardStep[]).map((value, index) => (
            <div key={value} className={`flex shrink-0 items-center gap-2 text-xs font-semibold ${step === value ? "text-[#D3D925]" : "text-white/35"}`}>
              <span className={`flex size-5 items-center justify-center rounded-full text-[10px] ${step === value ? "bg-[#D3D925] text-black" : "bg-white/10 text-white/50"}`}>
                {index + 1}
              </span>
              {stepCopy(value)}
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[420px] p-6">
        {draft?.warnings?.map((warning) => (
          <div key={warning} className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80">
            {warning}
          </div>
        ))}
        {isLoadingDraft && <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-[#D3D925]" /></div>}
        {!isLoadingDraft && <>

          {/* ─── STEP 1: Road path selection ─────────────────────────────── */}
          {step === "route" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#D3D925]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D3D925]">
                      {direction} DIRECTION
                    </span>
                    {originTerminal && destinationTerminal && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-white/70">
                        <MapPin className="size-3 text-[#D3D925]" />
                        <span>{originTerminal.name} → {destinationTerminal.name}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold">
                    {sourceEndpoint?.name || "Origin"} → {targetEndpoint?.name || "Destination"}
                  </h3>
                  <p className="mt-1 text-sm text-white/45">
                    Google calculates road paths between the selected departure and arrival terminals. Choose the path buses actually operate; intermediate route stops are reviewed next.
                  </p>
                </div>
                {/* Refresh button — only shown when a resumed draft already has route options */}
                {isDraftWithRoutes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refreshRoutes()}
                    disabled={isLoadingRoutes}
                    className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    {isLoadingRoutes && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Refresh road paths
                  </Button>
                )}
              </div>

              {/* No paths loaded yet — show terminal pickers + Find button */}
              {displayOptions.length === 0 ? (
                <div className="space-y-6">
                  {hasAnyParentTerminal ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <MapPin className="size-4 text-[#D3D925]" />
                        <span>Departure &amp; Arrival Bus Parks</span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        Choose the starting or ending bus park for this route. Road paths and travel times will be calculated from these locations.
                      </p>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        {/* Origin terminal picker */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Starting Bus Park ({sourceEndpoint?.name || "Origin"})
                          </Label>
                          {originHasChildren ? (
                            <Select
                              value={selectedOriginTerminalId || sourceEndpoint?._id || ""}
                              onValueChange={setSelectedOriginTerminalId}
                            >
                              <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                                <SelectValue placeholder="Select starting bus park" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60 border-white/10 bg-[#171717] text-white">
                                {originTerminalOptions.map((term) => {
                                  const termKey = String(term._id || term.id || term.code);
                                  return (
                                    <SelectItem key={termKey} value={termKey} className="text-xs text-white hover:bg-white/10">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-white">{term.name}</span>
                                        <span className="text-[10px] text-white/40">
                                          {termKey === String(sourceEndpoint?._id || sourceEndpoint?.id) ? "(City Center)" : `(${term.code})`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.02] px-3 text-xs text-white/80">
                              <span className="font-semibold">{sourceEndpoint?.name}</span>
                              <span className="ml-2 text-[10px] text-white/40">(Main Stop)</span>
                            </div>
                          )}
                          <p className="text-[11px] text-white/30">The trip will start from this stop.</p>
                        </div>

                        {/* Destination terminal picker */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Ending Bus Park ({targetEndpoint?.name || "Destination"})
                          </Label>
                          {destinationHasChildren ? (
                            <Select
                              value={selectedDestinationTerminalId || targetEndpoint?._id || ""}
                              onValueChange={setSelectedDestinationTerminalId}
                            >
                              <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                                <SelectValue placeholder="Select ending bus park" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60 border-white/10 bg-[#171717] text-white">
                                {destinationTerminalOptions.map((term) => {
                                  const termKey = String(term._id || term.id || term.code);
                                  return (
                                    <SelectItem key={termKey} value={termKey} className="text-xs text-white hover:bg-white/10">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-white">{term.name}</span>
                                        <span className="text-[10px] text-white/40">
                                          {termKey === String(targetEndpoint?._id || targetEndpoint?.id) ? "(City Center)" : `(${term.code})`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.02] px-3 text-xs text-white/80">
                              <span className="font-semibold">{targetEndpoint?.name}</span>
                              <span className="ml-2 text-[10px] text-white/40">(Main Stop)</span>
                            </div>
                          )}
                          <p className="text-[11px] text-white/30">The trip will end at this stop.</p>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={() => void findRoadPaths()}
                          disabled={isFindingPaths}
                          className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
                        >
                          {isFindingPaths ? (
                            <><Loader2 className="mr-2 size-4 animate-spin" />Finding road paths…</>
                          ) : (
                            <>Show road paths<ArrowRight className="ml-2 size-4" /></>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                      {isFindingPaths ? <Loader2 className="mb-3 size-7 animate-spin text-[#D3D925]" /> : <MapPin className="mb-3 size-7 text-white/25" />}
                      <p className="font-semibold text-white/65">{isFindingPaths ? "Finding road paths…" : "No road paths loaded yet"}</p>
                      <p className="mt-1 max-w-md text-sm text-white/40">
                        Find highway bus routes connecting {sourceEndpoint?.name || "Origin"} and {targetEndpoint?.name || "Destination"}.
                      </p>
                      {!isFindingPaths && (
                        <Button onClick={() => void findRoadPaths()} className="mt-4 bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
                          Show road paths<ArrowRight className="ml-2 size-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Paths loaded — show map + option cards
                <div className="space-y-5">
                  {isDraftWithRoutes && (
                    <RouteGuidanceControl draftId={draft?._id || ""} busy={isLoadingRoutes} onFind={(ids) => void refreshRoutes(ids)} />
                  )}
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                    <div className="space-y-4">
                      <GoogleRouteAlternativesMap
                        options={displayOptions}
                        selectedOptionId={selectedOption?.id ?? null}
                        originTerminal={originTerminal}
                        destinationTerminal={destinationTerminal}
                        onSelect={(optionId) => {
                          if (isDraftWithRoutes && !isLoadingRouteOverview) void chooseRoute(optionId);
                          else setSelectedPreviewOptionId(optionId);
                        }}
                      />
                      {selectedOption && <SelectedRoutePathway option={selectedOption} source={sourceEndpoint} destination={targetEndpoint} />}
                    </div>
                    <div className="space-y-3">
                      {displayOptions.map((option) => (
                        <RouteOptionCard
                          key={option.id}
                          option={option}
                          selected={selectedOption?.id === option.id}
                          disabled={isDraftWithRoutes ? isLoadingRouteOverview : isFindingPaths}
                          onSelect={() => {
                            if (isDraftWithRoutes && !isLoadingRouteOverview) void chooseRoute(option.id);
                            else setSelectedPreviewOptionId(option.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: Stop review ──────────────────────────────────────── */}
          {step === "stops" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Review route stops on the selected path</h3>
                  <p className="mt-1 text-sm text-white/45">
                    The main sequence contains passenger-recognized Shuvmarg route stops. Google bus stands and bus parks are kept separately as optional boarding-location evidence.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {stopCandidates.length > 0 && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${unresolvedCandidateCount ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{unresolvedCandidateCount ? `${unresolvedCandidateCount} need review` : "All candidates reviewed"}</span>}
                  <Button type="button" variant="outline" size="sm" disabled={isPreparingCandidates} onClick={() => void prepareStopReview()} className="border-white/15 bg-transparent text-white/65 hover:bg-white/10 hover:text-white">
                    {isPreparingCandidates ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <RefreshCw className="mr-2 size-3.5" />}Rescan suggestions
                  </Button>
                </div>
              </div>
              <RouteStopReviewMap selectedRoute={selectedOption} candidates={stopCandidates} />
              <ManualRouteStopAdder stops={stops} candidates={stopCandidates} busy={isAddingManualStop} onAdd={addManualStop} />
              <VariantStopCandidateReview
                candidates={stopCandidates}
                pendingCandidateId={pendingCandidateId}
                isUsingAllExisting={isUsingAllExisting}
                onResolve={resolveCandidate}
                onUseAllExisting={applyAllExistingCandidates}
              />
            </div>
          )}

          {/* ─── STEP 3: Name & save ─────────────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold">Name this route path like transport people say it</h3>
                <p className="mt-1 text-sm text-white/45">
                  Use a recognizable route name such as "Via Bardibas / Lalbandi." System codes stay internal.
                </p>
              </div>
              {!canCommitDraft && <button type="button" onClick={() => setStep("stops")} className="w-full rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-left text-sm text-amber-100/80 hover:bg-amber-400/[0.1]">
                {unresolvedCandidateCount > 0
                  ? `${unresolvedCandidateCount} route-stop decision${unresolvedCandidateCount === 1 ? "" : "s"} still need review.`
                  : "A route path needs at least two included route stops."} You may name the path now, but return to stop review before saving it.
              </button>}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{selectedOption?.label || "Selected Google road suggestion"}</p>
                <p className="mt-1 text-xs text-white/40">{selectedOption ? `${selectedOption.distanceKm} km · ${selectedOption.durationMinutes} min estimated` : "Route details unavailable"}</p>
              </div>
              {nameSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Suggestions from the confirmed path</Label>
                  <div className="flex flex-wrap gap-2">
                    {nameSuggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => setDraftName(suggestion)} className="rounded-full border border-[#D3D925]/25 bg-[#D3D925]/8 px-3 py-1.5 text-xs text-[#D3D925] hover:bg-[#D3D925]/15">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Route path name</Label>
                  <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={transportNamePlaceholder(sourceEndpoint, targetEndpoint, selectedOption)} className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Road character</Label>
                  <Select value={draftType} onValueChange={(value) => setDraftType(value as VariantType)}>
                    <SelectTrigger className="border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{["STANDARD", "HIGHWAY", "EXPRESSWAY", "MOUNTAIN", "LOCAL"].map((type) => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLocaleLowerCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </>}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 p-6">
        <Button
          variant="outline"
          onClick={() => {
            if (step === "details") setStep("stops");
            else if (step === "stops") setStep("route");
            else onOpenChange(false);
          }}
          className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="mr-2 size-4" />
          {step === "route" ? "Cancel" : "Back"}
        </Button>

        {/* Step 1 footer CTA — varies by whether paths are loaded */}
        {step === "route" && displayOptions.length === 0 && !isFindingPaths && (
          <Button
            onClick={() => void findRoadPaths()}
            disabled={isFindingPaths}
            className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
          >
            Show road paths<ArrowRight className="ml-2 size-4" />
          </Button>
        )}
        {step === "route" && displayOptions.length > 0 && !isDraftWithRoutes && (
          <Button
            disabled={!selectedPreviewOptionId || isPreparingCandidates}
            onClick={() => void proceedToStopReview()}
            className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
          >
            {isPreparingCandidates && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isPreparingCandidates ? "Preparing stop review…" : "Review stops on selected path"}
            {!isPreparingCandidates && <ArrowRight className="ml-2 size-4" />}
          </Button>
        )}
        {step === "route" && isDraftWithRoutes && (
          <Button
            disabled={!draftSelectedOption || isPreparingCandidates}
            onClick={() => void prepareStopReview()}
            className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
          >
            {isPreparingCandidates && <Loader2 className="mr-2 size-4 animate-spin" />}
            Review stops on selected path<ArrowRight className="ml-2 size-4" />
          </Button>
        )}

        {step === "stops" && (
          <Button
            disabled={!canNameDraft}
            title={!canNameDraft ? "Keep at least two route stops in the path before naming it." : undefined}
            onClick={() => setStep("details")}
            className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
          >
            Name this route path<ArrowRight className="ml-2 size-4" />
          </Button>
        )}
        {step === "details" && (
          <Button
            disabled={!draftName.trim() || !canCommitDraft || isCommitting}
            title={!canCommitDraft ? "Complete every route-stop decision before saving." : undefined}
            onClick={() => void finalizeDraft()}
            className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
          >
            {isCommitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isCommitting ? "Saving route path…" : "Save route path"}
            {!isCommitting && <ArrowRight className="ml-2 size-4" />}
          </Button>
        )}
      </footer>
    </section>
  );
}
