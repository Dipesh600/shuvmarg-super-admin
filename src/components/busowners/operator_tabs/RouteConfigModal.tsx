import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Route, MapPin, Navigation, Clock, CheckCircle2, Pencil, RotateCcw, ArrowLeftRight, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAvailableVariants,
  getOperatorConfigs,
  getVariantStopsWithConfig,
  getReturnVariantStops,
  upsertOperatorConfig,
  updateConfig,
  type CreateOperatorRouteConfigPayload,
  type OperatorBoardingConfig,
  type OperatorRouteConfigEdit,
  type OperatorRouteConfigPayload,
  type OperatorRouteStop,
  type OperatorRouteTiming,
  type OperatorStopBehavior,
  type UpdateOperatorRouteConfigPayload,
} from "@/api/platformRegistryApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/error-message";

function calculateDeparture(arrival12h: string, haltMins: number): string {
  if (!arrival12h) return "";
  const match = arrival12h.match(/(\d{2}):(\d{2}) (AM|PM)/);
  if (!match) return "";
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const isPM = match[3] === "PM";
  if (h === 12) h = 0;
  const totalMins = h * 60 + m + (isPM ? 12 * 60 : 0) + haltMins;
  let newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  const newPM = newH >= 12;
  if (newH === 0) newH = 12; else if (newH > 12) newH -= 12;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')} ${newPM ? 'PM' : 'AM'}`;
}

function timeToMins(time12h: string): number {
  if (!time12h) return -1;
  const match = time12h.match(/(\d{2}):(\d{2}) (AM|PM)/);
  if (!match) return -1;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const isPM = match[3] === "PM";
  if (h === 12) h = 0;
  return (h + (isPM ? 12 : 0)) * 60 + m;
}

interface RouteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  fleetId?: string;
  fleetLabel?: string;
  onSaved?: () => void;
  editConfig?: OperatorRouteConfigEdit; // When provided, modal operates in EDIT mode
}

const SERVICE_TYPE_OPTIONS = ["Standard", "Deluxe", "Express", "Night Bus", "Local / All-stop"] as const;

const CustomTimePicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const match = value?.match(/(\d{2}):(\d{2}) (AM|PM)/);
  const h = match ? match[1] : "";
  const m = match ? match[2] : "";
  const a = match ? match[3] : "";
  const handleUpdate = (part: 'h' | 'm' | 'a', val: string) => {
    const newH = part === 'h' ? val : (h || '12');
    const newM = part === 'm' ? val : (m || '00');
    const newA = part === 'a' ? val : (a || 'AM');
    onChange(`${newH}:${newM} ${newA}`);
  };
  return (
    <div className="flex items-center gap-1 w-full">
       <Select value={h} onValueChange={(val) => handleUpdate('h', val)}>
         <SelectTrigger className="flex-1 h-9 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-mono bg-muted/30 border-input shadow-none">
           <SelectValue placeholder="HH" />
         </SelectTrigger>
         <SelectContent>
            {Array.from({length: 12}, (_, i) => { const str = String(i+1).padStart(2, '0'); return <SelectItem key={str} value={str}>{str}</SelectItem>; })}
         </SelectContent>
       </Select>
       <span className="font-black text-muted-foreground/50">:</span>
       <Select value={m} onValueChange={(val) => handleUpdate('m', val)}>
         <SelectTrigger className="flex-1 h-9 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-mono bg-muted/30 border-input shadow-none">
           <SelectValue placeholder="MM" />
         </SelectTrigger>
         <SelectContent className="max-h-[200px]">
            {Array.from({length: 12}, (_, i) => { const str = String(i * 5).padStart(2, '0'); return <SelectItem key={str} value={str}>{str}</SelectItem>; })}
         </SelectContent>
       </Select>
       <Select value={a} onValueChange={(val) => handleUpdate('a', val)}>
         <SelectTrigger className="flex-1 h-9 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-bold bg-muted/30 border-input shadow-none">
           <SelectValue placeholder="--" />
         </SelectTrigger>
         <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
         </SelectContent>
       </Select>
    </div>
  );
};

export default function RouteConfigModal(props: RouteConfigModalProps) {
  const instanceKey = props.isOpen ? `open-${props.fleetId || props.editConfig?._id || "create"}` : "closed";
  return <RouteConfigModalInstance key={instanceKey} {...props} />;
}

function RouteConfigModalInstance({ isOpen, onClose, brandId, fleetId, fleetLabel, onSaved, editConfig }: RouteConfigModalProps) {
  const qc = useQueryClient();
  const isEditMode = !!editConfig;
  const isFleetSetup = Boolean(fleetId);

  // In create mode: user picks a variant. In edit mode: locked to editConfig's variantId.
  const [selectedVariant, setSelectedVariant] = useState<string>(() => String(editConfig?.variantId?._id || ""));
  const [patternName, setPatternName] = useState<string>(() => editConfig?.patternName || "");

  // direction tab: "outbound" | "return"
  const [direction, setDirection] = useState<"outbound" | "return">("outbound");

  const [activeStops, setActiveStops] = useState<string[]>([]);
  const [boardingConfig, setBoardingConfig] = useState<OperatorBoardingConfig[]>([]);
  const [timingConfig, setTimingConfig] = useState<OperatorRouteTiming[]>();

  // Return direction state
  const [returnActiveStops, setReturnActiveStops] = useState<string[]>([]);
  const [returnBoardingConfig, setReturnBoardingConfig] = useState<OperatorBoardingConfig[]>([]);
  const [returnTimingConfig, setReturnTimingConfig] = useState<OperatorRouteTiming[]>();
  const [returnOverridden, setReturnOverridden] = useState(() => editConfig?.returnOverridden || false);
  const [initializedStops, setInitializedStops] = useState<unknown>(null);
  const [initializedReturnStops, setInitializedReturnStops] = useState<unknown>(null);
  const [draftConfigId, setDraftConfigId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Only fetch variant list in CREATE mode
  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ["available-variants", brandId, fleetId],
    queryFn: () => getAvailableVariants(brandId, fleetId),
    enabled: isOpen && !!brandId && !isEditMode,
  });

  const { data: configsData } = useQuery({
    queryKey: ["operator-configs", brandId, fleetId],
    queryFn: () => getOperatorConfigs(brandId, fleetId),
    enabled: isOpen && isFleetSetup && !!brandId,
  });

  const variants = variantsData?.data || [];
  const fleetConfigs = (configsData?.data || []) as OperatorRouteConfigEdit[];
  const effectiveSelectedVariant = selectedVariant || String(fleetConfigs[0]?.variantId?._id || variants[0]?._id || "");
  const selectedFleetConfig = fleetConfigs.find((config) => String(config.variantId?._id || "") === effectiveSelectedVariant);
  const configId = editConfig?._id || draftConfigId || selectedFleetConfig?._id;
  const effectivePatternName = patternName || selectedFleetConfig?.patternName || "Standard";

  const { data: stopsData, isLoading: loadingStops } = useQuery({
    queryKey: ["variant-stops-config", brandId, effectiveSelectedVariant, configId, fleetId],
    queryFn: () => getVariantStopsWithConfig(brandId, effectiveSelectedVariant, configId, fleetId),
    enabled: !!effectiveSelectedVariant && isOpen,
  });

  // Return direction stops — fetched from the paired return variant
  const { data: returnStopsData, isLoading: loadingReturnStops } = useQuery({
    queryKey: ["return-variant-stops", brandId, effectiveSelectedVariant, configId, fleetId],
    queryFn: () => getReturnVariantStops(brandId, effectiveSelectedVariant, configId, fleetId),
    enabled: !!effectiveSelectedVariant && isOpen && !isFleetSetup,
  });

  const stops = useMemo(() => stopsData?.data || [], [stopsData?.data]);
  const returnStopsResult = returnStopsData?.data;
  const returnStops = returnStopsResult?.stops || [];
  const hasReturnVariant: boolean = returnStopsResult?.hasReturnVariant ?? false;

  // Initialize each server snapshot once; subsequent changes are user edits.
  if (stops.length > 0 && initializedStops !== stops) {
      setInitializedStops(stops);
      setActiveStops(stops.filter((s) => s.isActive).map((s) => s.stopId._id));
      setBoardingConfig(stops.map((s) => ({ stopId: s.stopId._id, boardingPointIds: s.boardingPoints?.map((bp) => bp._id) || [] })));
      setTimingConfig(stops.map((s) => ({
        stopId: s.stopId._id,
        estimatedArrival: s.timing?.estimatedArrival || "",
        estimatedDeparture: s.timing?.estimatedDeparture || "",
        haltDuration: s.timing?.haltDuration || 5,
        dayOffset: s.timing?.dayOffset || 0,
        stopBehavior: s.timing?.stopBehavior || "BOTH",
      })));
  }

  if (returnStops.length > 0 && initializedReturnStops !== returnStops) {
      setInitializedReturnStops(returnStops);
      setReturnActiveStops(returnStops.filter((s) => s.isActive).map((s) => s.stopId._id));
      setReturnBoardingConfig(returnStops.map((s) => ({ stopId: s.stopId._id, boardingPointIds: s.boardingPoints?.map((bp) => bp._id) || [] })));
      setReturnTimingConfig(returnStops.map((s) => ({
        stopId: s.stopId._id,
        estimatedArrival: s.timing?.estimatedArrival || "",
        estimatedDeparture: s.timing?.estimatedDeparture || "",
        haltDuration: s.timing?.haltDuration || 5,
        dayOffset: s.timing?.dayOffset || 0,
        stopBehavior: s.timing?.stopBehavior || "BOTH",
      })));
  }

  // Re-derive return from current outbound — reverses stops and swaps arrival↔departure
  const handleRederive = () => {
    const activeList = stops.filter((s) => activeStops.includes(s.stopId._id)).reverse();
    setReturnActiveStops(activeList.map((s) => s.stopId._id));
    setReturnBoardingConfig(activeList.map((s) => ({ stopId: s.stopId._id, boardingPointIds: boardingConfig.find(b => b.stopId === s.stopId._id)?.boardingPointIds || [] })));
    const derived = activeList.map((s): OperatorRouteTiming => {
      const tc = (timingConfig || []).find((t) => t.stopId === s.stopId._id);
      return {
        stopId: s.stopId._id,
        estimatedArrival: tc?.estimatedDeparture || tc?.estimatedArrival || "",
        estimatedDeparture: tc?.estimatedArrival || tc?.estimatedDeparture || "",
        haltDuration: tc?.haltDuration || 5,
        dayOffset: 0,
        stopBehavior: tc?.stopBehavior || "BOTH",
      };
    });
    setReturnTimingConfig(derived);
    setReturnOverridden(false);
    toast.success("Return direction re-derived from outbound.");
  };


  // CREATE mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateOperatorRouteConfigPayload) => upsertOperatorConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] });
      qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
      toast.success(isFleetSetup ? "Stops and timings saved for this bus." : "Route configuration saved.");
      onSaved?.();
      onClose();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to save route configuration")),
  });

  // EDIT mutation — calls PATCH /operator-config/:configId
  const editMutation = useMutation({
    mutationFn: (payload: UpdateOperatorRouteConfigPayload) => {
      if (!configId) throw new Error("Route configuration is unavailable.");
      return updateConfig(configId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] });
      qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
      toast.success(isFleetSetup ? "Stops and timings saved for this bus." : "Route configuration updated.");
      onSaved?.();
      onClose();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to update route configuration")),
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  // Build outbound payload (same as before)
  const buildPayload = useCallback((): OperatorRouteConfigPayload => {
    const filteredBoarding = boardingConfig.filter(bc => activeStops.includes(bc.stopId));
    const activeList = stops.filter((s) => activeStops.includes(s.stopId._id));
    const realFirst = activeList[0]?.stopId._id;
    const realLast = activeList[activeList.length - 1]?.stopId._id;
    let currentDayOffset = 0; let previousTimeMins = -1;
    const filteredTiming = activeList.map((s): OperatorRouteTiming => {
      const tc = (timingConfig || []).find((t) => t.stopId === s.stopId._id) || { stopId: s.stopId._id, estimatedArrival: "", estimatedDeparture: "", haltDuration: 5, dayOffset: 0, stopBehavior: "BOTH" };
      const isFirst = tc.stopId === realFirst; const isLast = tc.stopId === realLast;
      let computedArrival = tc.estimatedArrival; let computedDeparture = tc.estimatedDeparture;
      if (isFirst) { computedArrival = ""; } else if (isLast) { computedDeparture = ""; } else { computedDeparture = calculateDeparture(tc.estimatedArrival, tc.haltDuration || 5); }
      let currentDayOffsetForStop = currentDayOffset;
      if (isFirst) { previousTimeMins = timeToMins(computedDeparture || ""); }
      else {
        const arrivalMins = timeToMins(computedArrival || "");
        if (previousTimeMins !== -1 && arrivalMins < previousTimeMins) currentDayOffset += 1;
        currentDayOffsetForStop = currentDayOffset;
        if (!isLast) { const departureMins = timeToMins(computedDeparture || ""); if (departureMins < arrivalMins) currentDayOffset += 1; previousTimeMins = departureMins; }
      }
      return { stopId: tc.stopId, estimatedArrival: computedArrival, estimatedDeparture: computedDeparture, haltDuration: tc.haltDuration || 5, dayOffset: currentDayOffsetForStop, stopBehavior: isFirst ? "BOARDING_ONLY" : isLast ? "DROPPING_ONLY" : tc.stopBehavior };
    });

    // Build return payload if operator has configured it
    const retPayload = !isFleetSetup && returnTimingConfig && returnTimingConfig.length > 0 ? {
      returnActiveStops,
      returnBoardingConfig: returnBoardingConfig.filter(bc => returnActiveStops.includes(bc.stopId)),
      returnTimingConfig,
      returnOverridden,
    } : {};

    return { activeStops, boardingConfig: filteredBoarding, timingConfig: filteredTiming, ...retPayload };
  }, [activeStops, boardingConfig, isFleetSetup, returnActiveStops, returnBoardingConfig, returnOverridden, returnTimingConfig, stops, timingConfig]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!isFleetSetup || selectedFleetConfig?.status === "ACTIVE" || !fleetId || !effectiveSelectedVariant || stops.length === 0) return true;
    setDraftSaveState("saving");
    try {
      const payload = { ...buildPayload(), fleetId, patternName: effectivePatternName.trim(), status: "DRAFT" as const };
      const response = configId
        ? await updateConfig(configId, payload)
        : await upsertOperatorConfig({ brandId, variantId: effectiveSelectedVariant, ...payload });
      const savedId = response?.data?._id;
      if (savedId) setDraftConfigId(String(savedId));
      setHasUnsavedChanges(false);
      setDraftSaveState("saved");
      return true;
    } catch (error) {
      setDraftSaveState("error");
      toast.error(getErrorMessage(error, "Draft could not be saved. Keep this window open and retry."));
      return false;
    }
  }, [brandId, buildPayload, configId, effectivePatternName, effectiveSelectedVariant, fleetId, isFleetSetup, selectedFleetConfig?.status, stops.length]);

  useEffect(() => {
    if (!isFleetSetup || !hasUnsavedChanges || isPending || selectedFleetConfig?.status === "ACTIVE"
      || !fleetId || !effectiveSelectedVariant || stops.length === 0) return;
    const timer = window.setTimeout(() => {
      void saveDraft();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [effectiveSelectedVariant, fleetId, hasUnsavedChanges, isFleetSetup, isPending, saveDraft, selectedFleetConfig?.status, stops.length]);

  const handleClose = async () => {
    if (draftSaveState === "saving") return;
    if (hasUnsavedChanges && !(await saveDraft())) return;
    onClose();
  };

  const handleSave = () => {
    if (!effectiveSelectedVariant) { toast.error("Please select a route variant first."); return; }
    if (!effectivePatternName.trim()) { toast.error("Choose a service type."); return; }
    if (activeStops.length < (isFleetSetup ? 2 : 1)) { toast.error(isFleetSetup ? "Keep at least the starting and ending stops." : "You must select at least one active stop."); return; }
    if (isFleetSetup) {
      const firstStopId = stops[0]?.stopId._id;
      const lastStopId = stops[stops.length - 1]?.stopId._id;
      if (!firstStopId || !lastStopId || !activeStops.includes(firstStopId) || !activeStops.includes(lastStopId)) {
        toast.error("The starting and ending stops are required.");
        return;
      }
      const activeTiming = (timingConfig || []).filter((item) => activeStops.includes(item.stopId));
      const missingTiming = activeTiming.some((item) =>
        item.stopId === firstStopId ? !item.estimatedDeparture : item.stopId === lastStopId ? !item.estimatedArrival : !item.estimatedArrival
      );
      if (missingTiming) { toast.error("Add the departure and arrival times for every served stop."); return; }
    }
    const payload = buildPayload();
    if (isEditMode || configId) {
      editMutation.mutate({
        ...payload,
        ...(isFleetSetup ? { fleetId, patternName: effectivePatternName, status: "ACTIVE" as const } : {}),
      });

    } else {
      createMutation.mutate({
        brandId,
        variantId: effectiveSelectedVariant,
        patternName: effectivePatternName.trim(),
        ...(isFleetSetup ? { fleetId, status: "ACTIVE" as const } : {}),
        ...payload,
      });
    }
  };

  const handleStopToggle = (stopId: string, checked: boolean, ret = false) => {
    if (isFleetSetup && !ret && (stopId === stops[0]?.stopId._id || stopId === stops[stops.length - 1]?.stopId._id)) return;
    if (isFleetSetup) { setHasUnsavedChanges(true); setDraftSaveState("idle"); }
    if (ret) setReturnActiveStops(checked ? [...returnActiveStops, stopId] : returnActiveStops.filter(id => id !== stopId));
    else setActiveStops(checked ? [...activeStops, stopId] : activeStops.filter(id => id !== stopId));
  };

  const handleBoardingPointToggle = (stopId: string, bpId: string, checked: boolean, ret = false) => {
    if (isFleetSetup) { setHasUnsavedChanges(true); setDraftSaveState("idle"); }
    if (ret) setReturnBoardingConfig(prev => prev.map(bc => bc.stopId === stopId ? { ...bc, boardingPointIds: checked ? [...bc.boardingPointIds, bpId] : bc.boardingPointIds.filter(id => id !== bpId) } : bc));
    else setBoardingConfig(prev => prev.map(bc => bc.stopId === stopId ? { ...bc, boardingPointIds: checked ? [...bc.boardingPointIds, bpId] : bc.boardingPointIds.filter(id => id !== bpId) } : bc));
  };

  const handleTimingChange = (stopId: string, field: "estimatedArrival" | "estimatedDeparture" | "haltDuration" | "stopBehavior", value: string | number, ret = false) => {
    if (isFleetSetup) { setHasUnsavedChanges(true); setDraftSaveState("idle"); }
    if (ret) setReturnTimingConfig(prev => (prev || []).map(tc => tc.stopId === stopId ? { ...tc, [field]: value } : tc));
    else setTimingConfig(prev => (prev || []).map(tc => tc.stopId === stopId ? { ...tc, [field]: value } : tc));
  };

  // Renders the stop-card list — reused for both outbound and return tabs
  const renderStopList = (stopList: OperatorRouteStop[], activeList: string[], boardingCfg: OperatorBoardingConfig[], timingCfg: OperatorRouteTiming[], ret = false) => {
    if (!stopList.length) return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-muted rounded-xl"><p className="text-sm font-black tracking-widest uppercase">No stops found</p></div>;
    const activeStopObjs = stopList.filter((s) => activeList.includes(s.stopId._id));
    const realFirst = activeStopObjs[0]?.stopId._id;
    const realLast = activeStopObjs[activeStopObjs.length - 1]?.stopId._id;
    return (
      <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-border before:-z-10">
        {stopList.map((stop, stopIndex) => {
          const realStopId = stop.stopId._id;
          const isActive = activeList.includes(realStopId);
          const isFirst = realStopId === realFirst;
          const isLast = realStopId === realLast;
          const isRequiredEndpoint = isFleetSetup && !ret && (stopIndex === 0 || stopIndex === stopList.length - 1);
          const stopBoarding = boardingCfg.find(bc => bc.stopId === realStopId);
          const stopTiming = (timingCfg || []).find((tc) => tc.stopId === realStopId);
          return (
            <div key={stop._id} className={`flex gap-4 transition-opacity ${!isActive ? 'opacity-50 grayscale' : ''}`}>
              <div className="mt-1 flex flex-col items-center shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background z-10 transition-colors ${isActive ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                  <Navigation className={`w-4 h-4 ${isLast ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <div className="flex-1 bg-muted/20 border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/50 bg-background/50 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base">{stop.stopId?.name || "Unknown Stop"}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 uppercase tracking-widest"><MapPin className="w-3 h-3" /> {stop.stopId?.code} • {stop.stopId?.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${ret ? 'ret' : 'out'}-active-${realStopId}`} className="text-xs font-bold cursor-pointer">{isRequiredEndpoint ? "Required" : isActive ? "Served" : "Skipped"}</Label>
                    <Checkbox id={`${ret ? 'ret' : 'out'}-active-${realStopId}`} checked={isActive} disabled={isRequiredEndpoint} onCheckedChange={(checked) => handleStopToggle(realStopId, checked as boolean, ret)} className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                  </div>
                </div>
                {isActive && (
                  <div className="p-4 space-y-4 bg-background">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {!isFirst && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Arrival</Label><CustomTimePicker value={stopTiming?.estimatedArrival || ""} onChange={(val) => handleTimingChange(realStopId, 'estimatedArrival', val, ret)} /></div>)}
                      {isFirst && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Departure</Label><CustomTimePicker value={stopTiming?.estimatedDeparture || ""} onChange={(val) => handleTimingChange(realStopId, 'estimatedDeparture', val, ret)} /></div>)}
                      {!isFirst && !isLast && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Halt Duration</Label><Select value={stopTiming?.haltDuration?.toString() || "5"} onValueChange={(val) => handleTimingChange(realStopId, 'haltDuration', parseInt(val), ret)}><SelectTrigger className="h-9 rounded-lg border-input bg-muted/30 text-sm font-bold"><SelectValue /></SelectTrigger><SelectContent>{["0","5","10","15","30","45","60"].map(v => <SelectItem key={v} value={v}>{v === "0" ? "No Halt" : v === "60" ? "1 Hour" : `${v} mins`}</SelectItem>)}</SelectContent></Select></div>)}
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stop Behavior</Label><Select value={isFirst ? "BOARDING_ONLY" : isLast ? "DROPPING_ONLY" : (stopTiming?.stopBehavior || "BOTH")} onValueChange={(val) => handleTimingChange(realStopId, 'stopBehavior', val as OperatorStopBehavior, ret)} disabled={isFirst || isLast}><SelectTrigger className="h-9 rounded-lg border-input bg-muted/30 text-sm font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BOARDING_ONLY">Boarding Only</SelectItem><SelectItem value="DROPPING_ONLY">Dropping Only</SelectItem><SelectItem value="BOTH">Boarding & Dropping</SelectItem><SelectItem value="REST_STOP">Rest Stop (No Tickets)</SelectItem></SelectContent></Select></div>
                    </div>
                    {stop.boardingPoints && stop.boardingPoints.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Boarding Points</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {stop.boardingPoints.map((bp) => { const isBpActive = stopBoarding?.boardingPointIds.includes(bp._id); return (<label key={bp._id} className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isBpActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}><Checkbox checked={isBpActive} onCheckedChange={(checked) => handleBoardingPointToggle(realStopId, bp._id, checked as boolean, ret)} className="mt-0.5" /><div className="flex flex-col"><span className="text-xs font-bold leading-tight">{bp.name}</span>{bp.landmark && <span className="text-[9px] text-muted-foreground mt-0.5">{bp.landmark}</span>}</div></label>); })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) void handleClose(); }}>
      <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              {isEditMode ? <Pencil className="w-5 h-5 text-amber-400" /> : <Route className="w-5 h-5 text-emerald-400" />}
              {isFleetSetup ? "Choose stops & timings" : isEditMode ? `Edit: ${editConfig?.variantId?.name || "Route Config"}` : "Add Route Service Configuration"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-slate-400 mt-2">
            {isFleetSetup
              ? `Set the service type and timings for ${fleetLabel || "this bus"}. The return journey follows the approved path automatically.`
              : isEditMode
              ? "Update the active stops, boarding points, and estimated timings. Edits are blocked if active schedules exist."
              : "Select a platform route and configure the active stops, boarding points, and estimated timings for this brand."}
          </DialogDescription>
        </div>

        <div className="flex-1 p-6 bg-background overflow-y-auto min-h-0">
          <div className="space-y-8 pb-4">

            {/* Step 1: Pattern Name + Select Route Variant (CREATE mode only) */}
            {!isEditMode && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs">1</div>
                    <Label className="text-sm font-black uppercase tracking-widest text-foreground">{isFleetSetup ? "Service type" : "Pattern Name"}</Label>
                  </div>
                  {isFleetSetup ? (
                    <Select value={effectivePatternName} onValueChange={(value) => {
                      setPatternName(value);
                      setHasUnsavedChanges(true);
                      setDraftSaveState("idle");
                    }}>
                      <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPE_OPTIONS.map((serviceType) => <SelectItem key={serviceType} value={serviceType}>{serviceType}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={effectivePatternName}
                      onChange={e => setPatternName(e.target.value)}
                      placeholder="e.g. Standard, Express, Night Service"
                      maxLength={40}
                      className="h-11 rounded-xl font-bold"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {isFleetSetup ? "Use the same service choices shown to the bus owner." : <>Each pattern is a distinct stop configuration. A variant can have <strong>Standard</strong> (8 stops, local) and <strong>Express</strong> (5 stops, fast) simultaneously.</>}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs">2</div>
                    <Label className="text-sm font-black uppercase tracking-widest text-foreground">{isFleetSetup ? "Approved path" : "Select Route Variant"}</Label>
                  </div>
                  <Select value={effectiveSelectedVariant} onValueChange={(value) => {
                    setSelectedVariant(value);
                    setDraftConfigId(null);
                    if (isFleetSetup) { setHasUnsavedChanges(true); setDraftSaveState("idle"); }
                  }}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30">
                      <SelectValue placeholder="Select a platform route..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {loadingVariants ? (
                        <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                      ) : variants.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground font-medium">No available routes found.</div>
                      ) : (
                        variants.map((v) => (
                          <SelectItem key={v._id} value={v._id} className="py-3">
                            <div className="flex flex-col">
                              <span className="font-bold">{v.name}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {v.corridorId?.originId?.name || "Unknown"} → {v.corridorId?.destinationId?.name || "Unknown"}
                                {v.direction && ` • ${v.direction}`}
                                {v.patternCount > 0 && (
                                  <span className="ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                    {v.patternCount} pattern{v.patternCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Direction Tabs + Configure Stops */}
            {effectiveSelectedVariant && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Direction Tab Switcher */}
                {!isFleetSetup && <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border">
                  <button
                    onClick={() => setDirection("outbound")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-black transition-all ${
                      direction === "outbound" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Outbound (A → B)
                    {activeStops.length > 0 && <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black">{activeStops.length} stops</span>}
                  </button>
                  <button
                    onClick={() => setDirection("return")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-black transition-all ${
                      direction === "return" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 rotate-180" />
                    Return (B → A)
                    {returnOverridden
                      ? <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black">Manual</span>
                      : returnActiveStops.length > 0
                        ? <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Auto</span>
                        : null
                    }
                  </button>
                </div>}

                {direction === "outbound" && (
                  <div className="space-y-4">
                    {loadingStops
                      ? <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl"><Loader2 className="h-8 w-8 text-primary animate-spin mb-4" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Route Stops</p></div>
                      : renderStopList(stops, activeStops, boardingConfig, timingConfig || [], false)
                    }
                  </div>
                )}

                {direction === "return" && (
                  <div className="space-y-4">
                    {/* Return toolbar */}
                    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div>
                        <p className="text-xs font-black text-amber-800">
                          {returnOverridden ? "✓ Manually configured" : "⚡ Auto-derived from outbound"}
                        </p>
                        <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                          {returnOverridden ? "Changes saved. Use Re-derive to reset to auto." : "Edit any stop timing below to override. Changes are saved with the config."}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 text-amber-700 border-amber-300 hover:bg-amber-100 shrink-0" onClick={handleRederive}>
                        <RotateCcw className="w-3.5 h-3.5" /> Re-derive
                      </Button>
                    </div>

                    {!hasReturnVariant
                      ? <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl text-muted-foreground"><p className="text-sm font-black uppercase tracking-widest">No return variant in platform registry</p><p className="text-xs mt-1">Ask the platform admin to add a paired return variant.</p></div>
                      : loadingReturnStops
                        ? <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl"><Loader2 className="h-8 w-8 text-primary animate-spin mb-4" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Return Stops</p></div>
                        : renderStopList(returnStops, returnActiveStops, returnBoardingConfig, returnTimingConfig || [], true)
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        <DialogFooter className="p-6 bg-background border-t shrink-0">
          {isFleetSetup && <span className="mr-auto self-center text-xs font-medium text-muted-foreground">
            {selectedFleetConfig?.status === "ACTIVE"
              ? "Complete the step to apply changes"
              : draftSaveState === "saving" ? "Saving draft…" : draftSaveState === "saved" ? "Draft saved" : draftSaveState === "error" ? "Draft not saved" : "Changes save automatically"}
          </span>}
          <Button variant="outline" onClick={() => void handleClose()} disabled={draftSaveState === "saving"} className="font-bold rounded-xl h-12 px-6">Close</Button>
          <Button
            className={`h-12 rounded-xl font-black px-8 text-white ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            onClick={handleSave}
            disabled={!effectiveSelectedVariant || activeStops.length === 0 || isPending || draftSaveState === "saving"}
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {isFleetSetup ? "Complete stops & timings" : isEditMode ? "Update Configuration" : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
