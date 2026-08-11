import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Compass, Loader2, MapPinned } from "lucide-react";
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
  refreshVariantDraftRoutes,
  resolveVariantDraftStopCandidate,
  selectVariantDraftRoute,
  updateVariantDraftDetails,
  applyAllMatchedVariantDraftStopCandidates,
  type CorridorStop,
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

type WizardStep = "route" | "details" | "stops";

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
    case "route":
      return "Select road path";
    case "details":
      return "Name the route path";
    case "stops":
      return "Review stops on map";
  }
}

function terminalId(terminal?: { stopId?: string; id?: string; _id?: string } | null) {
  return terminal?.stopId || terminal?.id || terminal?._id || "";
}

function stepForDraft(draft: VariantDraft): WizardStep {
  if (draft.nextAction === "REVIEW_STOPS") return draft.workflowStatus === "ROUTE_SELECTED" ? "route" : "stops";
  if (draft.nextAction === "NAME_PATH" || draft.nextAction === "READY_TO_SAVE") return "details";
  return "route";
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
  const [draft, setDraft] = useState<VariantDraft | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<VariantType>("STANDARD");
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

  useEffect(() => {
    if (!open || !corridor) return;
    setStep("route");
    setDirection(initialDirection);
    setDraft(null);
    setDraftName("");
    setDraftType("STANDARD");
    setPendingCandidateId(null);
    setIsUsingAllExisting(false);
    setIsPreparingCandidates(false);
    setIsCommitting(false);
    setIsLoadingDraft(false);
    setIsLoadingRoutes(false);
    setIsLoadingRouteOverview(false);
  }, [corridor, initialDirection, open]);

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
      setStep(stepForDraft(existingDraft));
    }).catch((error: unknown) => {
      if (!discarded) toast.error(error instanceof Error ? error.message : "Unable to resume this variant draft.");
    }).finally(() => {
      if (!discarded) setIsLoadingDraft(false);
    });
    return () => { discarded = true; };
  }, [initialDraftId, open]);

  const createDraft = async () => {
    if (!corridor) return;
    setIsLoadingRoutes(true);
    try {
      const response = await createVariantDraft(corridor._id, { direction, createCompanion: true });
      setDraft(response.data);
      setStep("route");
      onDraftCreated();
      if (response.data.companionVariantId) toast.success("Forward and return setup drafts were created as one route family.");
      try {
        const routeResponse = await refreshVariantDraftRoutes(response.data._id);
        setDraft(routeResponse.data);
      } catch {
        toast.error("The draft was created, but route options could not be loaded yet. You can retry from the next step.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare route options.");
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const refreshRoutes = async (viaPlaceIds: string[] = []) => {
    if (!draft) return;
    setIsLoadingRoutes(true);
    try { const response = await refreshVariantDraftRoutes(draft._id, { viaPlaceIds }); setDraft(response.data); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Unable to refresh route options."); } finally { setIsLoadingRoutes(false); }
  };
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
  const prepareStopReview = async () => {
    if (!draft || !selectedOption) return;
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
  const options = draft?.routeOptions || [];
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
  const selectedOption = options.find((option) => option.id === draft?.selectedRouteOptionId) || null;
  const nameSuggestions = routeNameSuggestions(sourceEndpoint, targetEndpoint, selectedOption, stopCandidates);
  const originTerminal = stops.find((stop) => stop._id === terminalId(draft?.originTerminal)) || sourceEndpoint;
  const destinationTerminal = stops.find((stop) => stop._id === terminalId(draft?.destinationTerminal)) || targetEndpoint;

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
          {step === "route" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex rounded-full bg-[#D3D925]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D3D925]">
                    Direction locked from the corridor
                  </p>
                  <h3 className="mt-3 text-base font-bold">
                    {sourceEndpoint?.name || "Origin"} → {targetEndpoint?.name || "Destination"}
                  </h3>
                  <p className="mt-1 text-sm text-white/45">
                    Google suggests road paths between the selected corridor endpoints. Choose the path buses actually operate; exact route stops are reviewed after this.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => draft ? void refreshRoutes() : void createDraft()}
                  disabled={isLoadingRoutes}
                  className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  {isLoadingRoutes && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {draft ? "Refresh road suggestions" : "Load Google road paths"}
                </Button>
              </div>
              {options.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                  {isLoadingRoutes ? <Loader2 className="mb-3 size-7 animate-spin text-[#D3D925]" /> : <MapPinned className="mb-3 size-7 text-white/25" />}
                  <p className="font-semibold text-white/65">{isLoadingRoutes ? "Loading Google road paths" : "No road paths loaded yet"}</p>
                  <p className="mt-1 max-w-md text-sm text-white/40">Use the corridor endpoints first. Route stops and terminals are confirmed during stop review.</p>
                  {!isLoadingRoutes && <Button onClick={() => draft ? void refreshRoutes() : void createDraft()} className="mt-4 bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">Show Google road paths<ArrowRight className="ml-2 size-4" /></Button>}
                </div>
              ) : (
                <div className="space-y-5">
                <RouteGuidanceControl draftId={draft?._id || ""} busy={isLoadingRoutes} onFind={(ids) => void refreshRoutes(ids)} />
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                  <div className="space-y-4">
                    <GoogleRouteAlternativesMap options={options} selectedOptionId={selectedOption?.id || null} originTerminal={originTerminal} destinationTerminal={destinationTerminal} onSelect={(optionId) => { if (!isLoadingRouteOverview) void chooseRoute(optionId); }} />
                    {selectedOption && <SelectedRoutePathway option={selectedOption} source={sourceEndpoint} destination={targetEndpoint} />}
                  </div>
                  <div className="space-y-3">{options.map((option) => <RouteOptionCard key={option.id} option={option} selected={selectedOption?.id === option.id} disabled={isLoadingRouteOverview} onSelect={() => void chooseRoute(option.id)} />)}</div>
                </div></div>
              )}
            </div>
          )}

          {step === "details" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold">Name this route path like transport people say it</h3>
                <p className="mt-1 text-sm text-white/45">
                  Use a recognizable route name such as “Via Bardibas / Lalbandi.” System codes stay internal.
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

          {step === "stops" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Review route stops on the selected path</h3>
                  <p className="mt-1 text-sm text-white/45">
                    The main sequence contains passenger-recognized Shuvmarg route stops. Google bus stands and bus parks are kept separately as optional boarding-location evidence.
                  </p>
                </div>
                {stopCandidates.length > 0 && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${unresolvedCandidateCount ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{unresolvedCandidateCount ? `${unresolvedCandidateCount} need review` : "All candidates reviewed"}</span>}
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
          </>}
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 p-6">
          <Button variant="outline" onClick={() => { if (step === "details") setStep("stops"); else if (step === "stops") setStep("route"); else onOpenChange(false); }} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-2 size-4" />
            {step === "route" ? "Cancel" : "Back"}
          </Button>
          {step === "route" && <Button disabled={!selectedOption || isPreparingCandidates} onClick={() => void prepareStopReview()} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">{isPreparingCandidates && <Loader2 className="mr-2 size-4 animate-spin" />}Review stops on selected path<ArrowRight className="ml-2 size-4" /></Button>}
          {step === "stops" && <Button disabled={!canNameDraft} title={!canNameDraft ? "Keep at least two route stops in the path before naming it." : undefined} onClick={() => setStep("details")} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">Name this route path<ArrowRight className="ml-2 size-4" /></Button>}
          {step === "details" && <Button disabled={!draftName.trim() || !canCommitDraft || isCommitting} title={!canCommitDraft ? "Complete every route-stop decision before saving." : undefined} onClick={() => void finalizeDraft()} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">{isCommitting && <Loader2 className="mr-2 size-4 animate-spin" />}{isCommitting ? "Saving route path…" : "Save route path"}<ArrowRight className="ml-2 size-4" /></Button>}
        </footer>
    </section>
  );
}
