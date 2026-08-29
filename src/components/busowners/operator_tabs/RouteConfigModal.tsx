import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Route, MapPin, Navigation, Clock, CheckCircle2, Pencil, RotateCcw, ArrowLeftRight, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableVariants, getVariantStopsWithConfig, getReturnVariantStops, upsertOperatorConfig, updateConfig } from "@/api/platformRegistryApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

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
  editConfig?: any; // When provided, modal operates in EDIT mode
}

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

export default function RouteConfigModal({ isOpen, onClose, brandId, editConfig }: RouteConfigModalProps) {
  const qc = useQueryClient();
  const isEditMode = !!editConfig;

  // In create mode: user picks a variant. In edit mode: locked to editConfig's variantId.
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [patternName, setPatternName] = useState<string>("Standard");

  // direction tab: "outbound" | "return"
  const [direction, setDirection] = useState<"outbound" | "return">("outbound");

  const [activeStops, setActiveStops] = useState<string[]>([]);
  const [boardingConfig, setBoardingConfig] = useState<Array<{ stopId: string; boardingPointIds: string[] }>>([]);
  const [timingConfig, setTimingConfig] = useState<Array<{
    stopId: string; estimatedArrival: string; estimatedDeparture?: string;
    haltDuration?: number; dayOffset: number; stopBehavior: string;
  }>>();

  // Return direction state
  const [returnActiveStops, setReturnActiveStops] = useState<string[]>([]);
  const [returnBoardingConfig, setReturnBoardingConfig] = useState<Array<{ stopId: string; boardingPointIds: string[] }>>([]);
  const [returnTimingConfig, setReturnTimingConfig] = useState<Array<{
    stopId: string; estimatedArrival: string; estimatedDeparture?: string;
    haltDuration?: number; dayOffset: number; stopBehavior: string;
  }>>();
  const [returnOverridden, setReturnOverridden] = useState(false);

  // Set variant when edit mode activates
  useEffect(() => {
    if (isEditMode && editConfig?.variantId?._id) {
      setSelectedVariant(String(editConfig.variantId._id));
    }
  }, [isEditMode, editConfig]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant("");
      setPatternName("Standard");
      setDirection("outbound");
      setActiveStops([]);
      setBoardingConfig([]);
      setTimingConfig(undefined);
      setReturnActiveStops([]);
      setReturnBoardingConfig([]);
      setReturnTimingConfig(undefined);
      setReturnOverridden(false);
    } else if (isEditMode && editConfig) {
      setPatternName(editConfig.patternName || "Standard");
      setReturnOverridden(editConfig.returnOverridden || false);
    }
  }, [isOpen]);

  // Only fetch variant list in CREATE mode
  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ["available-variants", brandId],
    queryFn: () => getAvailableVariants(brandId),
    enabled: isOpen && !!brandId && !isEditMode,
  });

  const { data: stopsData, isLoading: loadingStops } = useQuery({
    queryKey: ["variant-stops-config", brandId, selectedVariant, editConfig?._id],
    queryFn: () => getVariantStopsWithConfig(brandId, selectedVariant, isEditMode ? editConfig?._id : undefined),
    enabled: !!selectedVariant && isOpen,
  });

  // Return direction stops — fetched from the paired return variant
  const { data: returnStopsData, isLoading: loadingReturnStops } = useQuery({
    queryKey: ["return-variant-stops", brandId, selectedVariant, editConfig?._id],
    queryFn: () => getReturnVariantStops(brandId, selectedVariant, isEditMode ? editConfig?._id : undefined),
    enabled: !!selectedVariant && isOpen,
  });

  const variants = variantsData?.data || [];
  const stops = stopsData?.data || [];
  const returnStopsResult = returnStopsData?.data;
  const returnStops: any[] = returnStopsResult?.stops || [];
  const hasReturnVariant: boolean = returnStopsResult?.hasReturnVariant ?? false;

  // Pre-fill OUTBOUND state when stops load
  useEffect(() => {
    if (stops.length > 0) {
      setActiveStops(stops.filter((s: any) => s.isActive).map((s: any) => s.stopId._id));
      setBoardingConfig(stops.map((s: any) => ({ stopId: s.stopId._id, boardingPointIds: s.boardingPoints?.map((bp: any) => bp._id) || [] })));
      setTimingConfig(stops.map((s: any) => ({
        stopId: s.stopId._id,
        estimatedArrival: s.timing?.estimatedArrival || "",
        estimatedDeparture: s.timing?.estimatedDeparture || "",
        haltDuration: s.timing?.haltDuration || 5,
        dayOffset: s.timing?.dayOffset || 0,
        stopBehavior: s.timing?.stopBehavior || "BOTH",
      })));
    }
  }, [stops]);

  // Pre-fill RETURN state when return stops load
  useEffect(() => {
    if (returnStops.length > 0) {
      setReturnActiveStops(returnStops.filter((s: any) => s.isActive).map((s: any) => s.stopId._id));
      setReturnBoardingConfig(returnStops.map((s: any) => ({ stopId: s.stopId._id, boardingPointIds: s.boardingPoints?.map((bp: any) => bp._id) || [] })));
      setReturnTimingConfig(returnStops.map((s: any) => ({
        stopId: s.stopId._id,
        estimatedArrival: s.timing?.estimatedArrival || "",
        estimatedDeparture: s.timing?.estimatedDeparture || "",
        haltDuration: s.timing?.haltDuration || 5,
        dayOffset: s.timing?.dayOffset || 0,
        stopBehavior: s.timing?.stopBehavior || "BOTH",
      })));
    }
  }, [returnStops]);

  // Re-derive return from current outbound — reverses stops and swaps arrival↔departure
  const handleRederive = () => {
    const activeList = stops.filter((s: any) => activeStops.includes(s.stopId._id)).reverse();
    setReturnActiveStops(activeList.map((s: any) => s.stopId._id));
    setReturnBoardingConfig(activeList.map((s: any) => ({ stopId: s.stopId._id, boardingPointIds: boardingConfig.find(b => b.stopId === s.stopId._id)?.boardingPointIds || [] })));
    const derived = activeList.map((s: any) => {
      const tc = (timingConfig || []).find((t: any) => t.stopId === s.stopId._id);
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
    mutationFn: (payload: any) => upsertOperatorConfig(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] }); toast.success("Route configuration saved."); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save route configuration"),
  });

  // EDIT mutation — calls PATCH /operator-config/:configId
  const editMutation = useMutation({
    mutationFn: (payload: any) => updateConfig(editConfig._id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] }); toast.success("Route configuration updated."); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update route configuration"),
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  // Build outbound payload (same as before)
  const buildPayload = () => {
    const filteredBoarding = boardingConfig.filter(bc => activeStops.includes(bc.stopId));
    const activeList = stops.filter((s: any) => activeStops.includes(s.stopId._id));
    const realFirst = activeList[0]?.stopId._id;
    const realLast = activeList[activeList.length - 1]?.stopId._id;
    let currentDayOffset = 0; let previousTimeMins = -1;
    const filteredTiming = activeList.map((s: any) => {
      const tc = (timingConfig || []).find((t: any) => t.stopId === s.stopId._id) || { stopId: s.stopId._id, estimatedArrival: "", estimatedDeparture: "", haltDuration: 5, stopBehavior: "BOTH" };
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
    const retPayload = returnTimingConfig && returnTimingConfig.length > 0 ? {
      returnActiveStops,
      returnBoardingConfig: returnBoardingConfig.filter(bc => returnActiveStops.includes(bc.stopId)),
      returnTimingConfig,
      returnOverridden,
    } : {};

    return { activeStops, boardingConfig: filteredBoarding, timingConfig: filteredTiming, ...retPayload };
  };

  const handleSave = () => {
    if (!selectedVariant) { toast.error("Please select a route variant first."); return; }
    if (!patternName.trim()) { toast.error("Pattern name is required."); return; }
    if (activeStops.length === 0) { toast.error("You must select at least one active stop."); return; }
    const payload = buildPayload();
    if (isEditMode) {
      editMutation.mutate(payload);

    } else {
      createMutation.mutate({ brandId, variantId: selectedVariant, patternName: patternName.trim(), ...payload });
    }
  };

  const handleStopToggle = (stopId: string, checked: boolean, ret = false) => {
    if (ret) setReturnActiveStops(checked ? [...returnActiveStops, stopId] : returnActiveStops.filter(id => id !== stopId));
    else setActiveStops(checked ? [...activeStops, stopId] : activeStops.filter(id => id !== stopId));
  };

  const handleBoardingPointToggle = (stopId: string, bpId: string, checked: boolean, ret = false) => {
    if (ret) setReturnBoardingConfig(prev => prev.map(bc => bc.stopId === stopId ? { ...bc, boardingPointIds: checked ? [...bc.boardingPointIds, bpId] : bc.boardingPointIds.filter(id => id !== bpId) } : bc));
    else setBoardingConfig(prev => prev.map(bc => bc.stopId === stopId ? { ...bc, boardingPointIds: checked ? [...bc.boardingPointIds, bpId] : bc.boardingPointIds.filter(id => id !== bpId) } : bc));
  };

  const handleTimingChange = (stopId: string, field: string, value: string | number, ret = false) => {
    if (ret) setReturnTimingConfig(prev => (prev || []).map(tc => tc.stopId === stopId ? { ...tc, [field]: value } : tc));
    else setTimingConfig(prev => (prev || []).map(tc => tc.stopId === stopId ? { ...tc, [field]: value } : tc));
  };

  // Renders the stop-card list — reused for both outbound and return tabs
  const renderStopList = (stopList: any[], activeList: string[], boardingCfg: any[], timingCfg: any[], ret = false) => {
    if (!stopList.length) return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-muted rounded-xl"><p className="text-sm font-black tracking-widest uppercase">No stops found</p></div>;
    const activeStopObjs = stopList.filter((s: any) => activeList.includes(s.stopId._id));
    const realFirst = activeStopObjs[0]?.stopId._id;
    const realLast = activeStopObjs[activeStopObjs.length - 1]?.stopId._id;
    return (
      <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-border before:-z-10">
        {stopList.map((stop: any) => {
          const realStopId = stop.stopId._id;
          const isActive = activeList.includes(realStopId);
          const isFirst = realStopId === realFirst;
          const isLast = realStopId === realLast;
          const stopBoarding = boardingCfg.find(bc => bc.stopId === realStopId);
          const stopTiming = (timingCfg || []).find((tc: any) => tc.stopId === realStopId);
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
                    <Label htmlFor={`${ret ? 'ret' : 'out'}-active-${realStopId}`} className="text-xs font-bold cursor-pointer">{isActive ? 'Active' : 'Inactive'}</Label>
                    <Checkbox id={`${ret ? 'ret' : 'out'}-active-${realStopId}`} checked={isActive} onCheckedChange={(checked) => handleStopToggle(realStopId, checked as boolean, ret)} className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                  </div>
                </div>
                {isActive && (
                  <div className="p-4 space-y-4 bg-background">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {!isFirst && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Arrival</Label><CustomTimePicker value={stopTiming?.estimatedArrival || ""} onChange={(val) => handleTimingChange(realStopId, 'estimatedArrival', val, ret)} /></div>)}
                      {isFirst && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Departure</Label><CustomTimePicker value={stopTiming?.estimatedDeparture || ""} onChange={(val) => handleTimingChange(realStopId, 'estimatedDeparture', val, ret)} /></div>)}
                      {!isFirst && !isLast && (<div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Halt Duration</Label><Select value={stopTiming?.haltDuration?.toString() || "5"} onValueChange={(val) => handleTimingChange(realStopId, 'haltDuration', parseInt(val), ret)}><SelectTrigger className="h-9 rounded-lg border-input bg-muted/30 text-sm font-bold"><SelectValue /></SelectTrigger><SelectContent>{["0","5","10","15","30","45","60"].map(v => <SelectItem key={v} value={v}>{v === "0" ? "No Halt" : v === "60" ? "1 Hour" : `${v} mins`}</SelectItem>)}</SelectContent></Select></div>)}
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stop Behavior</Label><Select value={isFirst ? "BOARDING_ONLY" : isLast ? "DROPPING_ONLY" : (stopTiming?.stopBehavior || "BOTH")} onValueChange={(val) => handleTimingChange(realStopId, 'stopBehavior', val, ret)} disabled={isFirst || isLast}><SelectTrigger className="h-9 rounded-lg border-input bg-muted/30 text-sm font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BOARDING_ONLY">Boarding Only</SelectItem><SelectItem value="DROPPING_ONLY">Dropping Only</SelectItem><SelectItem value="BOTH">Boarding & Dropping</SelectItem><SelectItem value="REST_STOP">Rest Stop (No Tickets)</SelectItem></SelectContent></Select></div>
                    </div>
                    {stop.boardingPoints && stop.boardingPoints.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Boarding Points</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {stop.boardingPoints.map((bp: any) => { const isBpActive = stopBoarding?.boardingPointIds.includes(bp._id); return (<label key={bp._id} className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isBpActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}><Checkbox checked={isBpActive} onCheckedChange={(checked) => handleBoardingPointToggle(realStopId, bp._id, checked as boolean, ret)} className="mt-0.5" /><div className="flex flex-col"><span className="text-xs font-bold leading-tight">{bp.name}</span>{bp.landmark && <span className="text-[9px] text-muted-foreground mt-0.5">{bp.landmark}</span>}</div></label>); })}
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              {isEditMode ? <Pencil className="w-5 h-5 text-amber-400" /> : <Route className="w-5 h-5 text-emerald-400" />}
              {isEditMode ? `Edit: ${editConfig?.variantId?.name || "Route Config"}` : "Add Route Service Configuration"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-slate-400 mt-2">
            {isEditMode
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
                    <Label className="text-sm font-black uppercase tracking-widest text-foreground">Pattern Name</Label>
                  </div>
                  <Input
                    value={patternName}
                    onChange={e => setPatternName(e.target.value)}
                    placeholder="e.g. Standard, Express, Night Service"
                    maxLength={40}
                    className="h-11 rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Each pattern is a distinct stop configuration. A variant can have <strong>Standard</strong> (8 stops, local) and <strong>Express</strong> (5 stops, fast) simultaneously.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs">2</div>
                    <Label className="text-sm font-black uppercase tracking-widest text-foreground">Select Route Variant</Label>
                  </div>
                  <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30">
                      <SelectValue placeholder="Select a platform route..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {loadingVariants ? (
                        <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                      ) : variants.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground font-medium">No available routes found.</div>
                      ) : (
                        variants.map((v: any) => (
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
            {selectedVariant && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Direction Tab Switcher */}
                <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border">
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
                </div>

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
          <Button variant="outline" onClick={onClose} className="font-bold rounded-xl h-12 px-6">Cancel</Button>
          <Button
            className={`h-12 rounded-xl font-black px-8 text-white ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            onClick={handleSave}
            disabled={!selectedVariant || activeStops.length === 0 || isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {isEditMode ? "Update Configuration" : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
