import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Loader2, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { createSchedule, updateSchedule } from "@/api/scheduleApi";
import { getFleetsByOwner } from "@/api/busOwnerFleetApi";
import { getBrandRouteServices } from "@/api/operatorBrandApi";
import { getDriversByBrand } from "@/api/driverApi";

interface CreateScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandId: string;
    ownerId: string;
    prefillBusId?: string;
    // When launched from the Fleet Wizard, restrict route list to this corridor
    prefillCorridorId?: string;
    isInline?: boolean;
    onSuccess?: () => void;
}

type Step = "service" | "timing" | "window" | "return";

const STEPS: { key: Step; label: string }[] = [
    { key: "service", label: "Service" },
    { key: "timing",  label: "Timing" },
    { key: "window",  label: "Booking Window" },
    { key: "return",  label: "Return Trip" },
];

const StepIndicator = ({ current }: { current: Step }) => {
    const idx = STEPS.findIndex(s => s.key === current);
    return (
        <div className="flex items-center gap-1 px-6 pt-4 pb-2">
            {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-black transition-all ${
                        i < idx ? "bg-primary text-primary-foreground" :
                        i === idx ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                        "bg-muted text-muted-foreground"
                    }`}>{i + 1}</div>
                    <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${i === idx ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < idx ? "bg-primary" : "bg-border"}`} />}
                </div>
            ))}
        </div>
    );
};

const FieldLabel = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
    <div className="space-y-0.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{children}</Label>
        {hint && <p className="text-[9px] text-muted-foreground">{hint}</p>}
    </div>
);

/**
 * Converts a 12-hour time string (e.g. "06:30 AM", "09:15 PM") to
 * a 24-hour HH:mm string required by <input type="time">.
 * Returns empty string if input is falsy or unparseable.
 */
const to24h = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "";
    // Already in HH:mm 24h format
    if (/^\d{2}:\d{2}$/.test(timeStr.trim())) return timeStr.trim();
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    const period = match[3].toUpperCase();
    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;
    return `${String(hours).padStart(2, "0")}:${mins}`;
};

const detectShift = (time24: string): "day" | "night" => {
    const hour = parseInt(time24.split(":")[0] || "12", 10);
    return (hour >= 16 || hour < 4) ? "night" : "day";
};

const CreateScheduleModal = ({ open, onOpenChange, brandId, ownerId, prefillBusId, prefillCorridorId, isInline, onSuccess }: CreateScheduleModalProps) => {
    const qc = useQueryClient();

    const { data: fleets }    = useQuery({ queryKey: ["fleets", ownerId, brandId],        queryFn: () => getFleetsByOwner(ownerId, brandId),     enabled: open });
    const { data: configs }   = useQuery({ queryKey: ["brand-route-services", brandId],   queryFn: () => getBrandRouteServices(brandId),          enabled: open });
    const { data: drivers }   = useQuery({ queryKey: ["brand-drivers", brandId, "APPROVED"], queryFn: () => getDriversByBrand(brandId, { approvalStatus: "APPROVED" }), enabled: open });

    const [step, setStep] = useState<Step>("service");

    const [busId, setBusId]                     = useState(prefillBusId || "");
    const [variantId, setVariantId]             = useState("");
    const [startLocation, setStartLocation]     = useState<"ORIGIN" | "DESTINATION">("ORIGIN");
    const [routeName, setRouteName]             = useState("");
    const [originName, setOriginName]           = useState("");
    const [destName, setDestName]               = useState("");
    const [driverId, setDriverId]               = useState("none");

    const [departureTime, setDepartureTime]     = useState("");
    const [arrivalTime, setArrivalTime]         = useState("");
    const [shift, setShift]                     = useState<"day" | "night">("day");
    const [recurrence, setRecurrence]           = useState<"DAILY" | "WEEKLY">("DAILY");
    const [effectiveFrom, setEffectiveFrom]     = useState("");
    const [fareOverride, setFareOverride]       = useState("");

    const [advanceBookingDays, setAdvanceBookingDays]   = useState(60);
    const [bookingCutoffHours, setBookingCutoffHours]   = useState(2);

    const [hasReturn, setHasReturn]             = useState(false);
    const [operationalModel, setOperationalModel] = useState<"TURNAROUND" | "RELAY">("TURNAROUND");
    const [layoverMinutes, setLayoverMinutes]   = useState(60);
    const [returnDepartureTime, setReturnDepartureTime] = useState("");
    const [returnArrivalTime, setReturnArrivalTime]     = useState("");

    const reset = () => {
        setStep("service");
        setBusId(prefillBusId || "");
        setVariantId(""); setRouteName(""); setOriginName(""); setDestName(""); setDriverId(""); setStartLocation("ORIGIN");
        setDepartureTime(""); setArrivalTime(""); setShift("day"); setRecurrence("DAILY"); setEffectiveFrom(""); setFareOverride("");
        setAdvanceBookingDays(60); setBookingCutoffHours(2);
        setHasReturn(false); setOperationalModel("TURNAROUND"); setLayoverMinutes(60);
        setReturnDepartureTime(""); setReturnArrivalTime("");
    };

    useEffect(() => {
        if (open) {
            setBusId(prefillBusId || "");
        }
    }, [open, prefillBusId]);

    const handleRouteSelection = (configId: string, location: "ORIGIN" | "DESTINATION") => {
        setVariantId(configId); // Note: variantId state is now storing config._id for uniqueness
        setStartLocation(location);
        
        const config = configs?.data?.find((c: any) => String(c._id) === configId);
        if (config) {
            const oName = config.variantId?.corridorId?.originId?.name || "";
            const dName = config.variantId?.corridorId?.destinationId?.name || "";
            setOriginName(oName);
            setDestName(dName);
            setRouteName(oName && dName ? `${oName} ↔ ${dName}` : "");

    // Restore backward compatibility: If inline returnTimingConfig is empty (old route), fallback to the ghost second record
            const returnConfigObject = config.variantId?.returnVariantId 
                ? configs?.data?.find((c: any) => String(c.variantId?._id) === String(config.variantId.returnVariantId))
                : null;
            const resolvedReturnTimingConfig = (config.returnTimingConfig && config.returnTimingConfig.length > 0)
                ? config.returnTimingConfig
                : (returnConfigObject?.timingConfig || []);

            const outboundTimingConfig = location === "ORIGIN"
                ? config.timingConfig
                : resolvedReturnTimingConfig;
                
            if (outboundTimingConfig && outboundTimingConfig.length > 0) {
                const dep24 = to24h(outboundTimingConfig[0]?.estimatedDeparture);
                const arr24 = to24h(outboundTimingConfig[outboundTimingConfig.length - 1]?.estimatedArrival);
                if (dep24) { setDepartureTime(dep24); setShift(detectShift(dep24)); } else setDepartureTime("");
                if (arr24) { setArrivalTime(arr24); } else setArrivalTime("");
            } else {
                setDepartureTime(""); setArrivalTime("");
            }

            const returnTimingConfig = location === "ORIGIN"
                ? resolvedReturnTimingConfig
                : config.timingConfig;

            if (returnTimingConfig && returnTimingConfig.length > 0) {
                const retDep24 = to24h(returnTimingConfig[0]?.estimatedDeparture);
                const retArr24 = to24h(returnTimingConfig[returnTimingConfig.length - 1]?.estimatedArrival);
                if (retDep24) setReturnDepartureTime(retDep24); else setReturnDepartureTime("");
                if (retArr24) setReturnArrivalTime(retArr24); else setReturnArrivalTime("");
                if (retDep24) setOperationalModel(detectShift(retDep24) === "night" ? "RELAY" : "TURNAROUND");
            } else {
                setReturnDepartureTime(""); setReturnArrivalTime("");
            }
        } else {
            setRouteName("");
        }
    };

    const createMut = useMutation({
        mutationFn: async () => {
            const selectedConfig = configs?.data?.find((c: any) => String(c._id) === variantId);
            const actualVariantId = selectedConfig?.variantId?._id ? String(selectedConfig.variantId._id) : "";
            const resolvedReturnVariantId = selectedConfig?.variantId?.returnVariantId
                ? String(selectedConfig.variantId.returnVariantId)
                : actualVariantId;

            const outboundVariantId = startLocation === "ORIGIN" ? actualVariantId : resolvedReturnVariantId;
            const returnTripVariantId = startLocation === "ORIGIN" ? resolvedReturnVariantId : actualVariantId;

            const outbound = await createSchedule({
                brandId, busId, variantId: outboundVariantId,
                operatorRouteConfigId: variantId,
                driverId: driverId && driverId !== "none" ? driverId : undefined,
                departureTime, arrivalTime, shift,
                recurrence, effectiveFrom: new Date(effectiveFrom).toISOString(),
                fareOverride: fareOverride ? Number(fareOverride) : undefined,
                advanceBookingDays, bookingCutoffHours,
                operationalModel: hasReturn ? operationalModel : undefined,
                layoverMinutes: hasReturn ? layoverMinutes : undefined,
            });

            if (hasReturn && returnDepartureTime && returnArrivalTime) {
                const returnEffectiveFrom = (() => {
                    const base = new Date(effectiveFrom);
                    if (operationalModel === "RELAY") base.setUTCDate(base.getUTCDate() + 1);
                    return base.toISOString();
                })();

                const outboundId = outbound?.data?._id;

                const returnSchedule = await createSchedule({
                    brandId,
                    busId,
                    variantId: returnTripVariantId,
                    operatorRouteConfigId: variantId,
                    driverId: driverId && driverId !== "none" ? driverId : undefined,
                    departureTime: returnDepartureTime,
                    arrivalTime:   returnArrivalTime,
                    shift:         detectShift(returnDepartureTime),
                    recurrence,
                    effectiveFrom: returnEffectiveFrom,
                    fareOverride:  fareOverride ? Number(fareOverride) : undefined,
                    advanceBookingDays, bookingCutoffHours,
                    operationalModel,
                    layoverMinutes,
                    returnScheduleId: outboundId,
                });

                const returnId = returnSchedule?.data?._id;
                if (outboundId && returnId) {
                    await updateSchedule(outboundId, { returnScheduleId: returnId });
                }
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["brand-schedules", brandId] });
            toast.success(hasReturn
                ? "Outbound + return schedules created as DRAFT. Both are now bidirectionally linked."
                : "Schedule created as DRAFT. Activate to start generating trips."
            );
            if (onSuccess) onSuccess();
            reset();
            onOpenChange(false);
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create schedule"),
    });

    const step1Valid = busId;
    const step2Valid = departureTime && arrivalTime && effectiveFrom;
    const canSubmit  = step1Valid && step2Valid;

    const goNext = () => {
        const order: Step[] = ["service", "timing", "window", "return"];
        const i = order.indexOf(step);
        if (i < order.length - 1) setStep(order[i + 1]);
    };
    const goPrev = () => {
        const order: Step[] = ["service", "timing", "window", "return"];
        const i = order.indexOf(step);
        if (i > 0) setStep(order[i - 1]);
    };

    const content = (
        <>
                <div className={`bg-slate-900 p-6 pb-3 text-white ${isInline ? 'rounded-t-2xl' : ''}`}>
                    <div className="flex items-center gap-2 text-base font-black text-white">
                        <Calendar className="w-4 h-4" /> Create Master Schedule
                    </div>
                    <p className="text-slate-400 text-xs mt-1">Configure recurring service — trips auto-generated daily.</p>
                </div>

                <StepIndicator current={step} />

                <div className={`px-6 pb-2 overflow-y-auto space-y-4 ${isInline ? 'flex-1 custom-scrollbar min-h-[300px]' : 'max-h-[55vh]'}`}>

                    {step === "service" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>Bus (Fleet) *</FieldLabel>
                                    <Select value={busId} onValueChange={setBusId} disabled={!!prefillBusId}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select bus" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {fleets?.data?.map((f: any) => (
                                                <SelectItem key={f._id} value={f._id}>{f.busNumber} · {f.busName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Route & Pattern</FieldLabel>
                                    <Select value={variantId} onValueChange={(v) => handleRouteSelection(v, startLocation)}>
                                        <SelectTrigger className="h-auto min-h-[40px] py-2 rounded-xl [&>span]:w-full [&>span]:text-left overflow-hidden">
                                            <SelectValue placeholder="Select route" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                    {configs?.data
                        ?.filter((c: any) => {
                            if (c.variantId?.direction === "RETURN") return false;
                            // When launched from the wizard, restrict to the fleet's assigned corridor
                            if (prefillCorridorId && c.variantId?.corridorId) {
                                const cfgCorridorId = typeof c.variantId.corridorId === "object"
                                    ? String(c.variantId.corridorId._id)
                                    : String(c.variantId.corridorId);
                                if (cfgCorridorId !== String(prefillCorridorId)) return false;
                            }
                            return true;
                        })
                        .map((c: any) => {
                                                if (!c.variantId) return null;
                                                const corridor = c.variantId.corridorId;
                                                const routeLabel = corridor?.originId?.name && corridor?.destinationId?.name
                                                    ? `${corridor.originId.name} → ${corridor.destinationId.name}`
                                                    : (c.variantId.name || "Unknown Route");
                                                const stopCount = c.activeStops?.length || 0;
                                                const patternLabel = c.patternName || "Standard";

                                                return (
                                                    <SelectItem key={`${c._id}`} value={c._id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{routeLabel}</span>
                                                            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 flex items-center gap-1.5 uppercase tracking-wider">
                                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">{patternLabel}</span>
                                                                {stopCount > 0 && `· ${stopCount} stops`}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {variantId && (
                                <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <FieldLabel>Where does this bus start its journey?</FieldLabel>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleRouteSelection(variantId, "ORIGIN")}
                                            className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all ${
                                                startLocation === "ORIGIN" ? "border-primary bg-primary/5" : "border-muted bg-muted/30 hover:border-muted-foreground/40"
                                            }`}
                                        >
                                            <span className="text-xs font-black text-foreground">Starts at Origin</span>
                                            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 truncate max-w-full">
                                                {configs?.data?.find((c:any) => String(c._id) === variantId)?.variantId?.corridorId?.originId?.name || "Origin"}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRouteSelection(variantId, "DESTINATION")}
                                            className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all ${
                                                startLocation === "DESTINATION" ? "border-primary bg-primary/5" : "border-muted bg-muted/30 hover:border-muted-foreground/40"
                                            }`}
                                        >
                                            <span className="text-xs font-black text-foreground">Starts at Destination</span>
                                            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 truncate max-w-full">
                                                {configs?.data?.find((c:any) => String(c._id) === variantId)?.variantId?.corridorId?.destinationId?.name || "Destination"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5 mt-4">
                                <FieldLabel hint="Only approved drivers shown">Default Driver</FieldLabel>
                                <Select value={driverId} onValueChange={setDriverId}>
                                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Assign later" /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="none">No default driver</SelectItem>
                                        {drivers?.data?.map((d: any) => (
                                            <SelectItem key={d._id} value={d._id}>
                                                {d.fullName} · {d.licenseType}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: TIMING ─────────────────────────────────── */}
                    {step === "timing" && (
                        <>
                            {/* Route context banner — shown if a variant was selected */}
                            {routeName && (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/60 border border-border">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Route</span>
                                        <span className="text-sm font-bold truncate">{routeName}</span>
                                    </div>
                                    {departureTime && arrivalTime && (
                                        <div className="ml-auto flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-mono font-bold text-primary">{departureTime}</span>
                                            <span className="text-muted-foreground text-xs">→</span>
                                            <span className="text-xs font-mono font-bold text-primary">{arrivalTime}</span>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                                shift === "night" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                                            }`}>{shift}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {departureTime && arrivalTime ? (
                            <div className="bg-muted/30 border-2 border-dashed border-muted p-4 rounded-xl space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
                                    <Calendar className="w-4 h-4" /> Inherited from Route Service
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <FieldLabel hint={`From: ${startLocation === "ORIGIN" ? (routeName.split(" ↔ ")[0] || "Origin") : (routeName.split(" ↔ ")[1] || "Destination")}`}>Departure Time</FieldLabel>
                                        <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-3 text-sm font-mono font-bold text-foreground opacity-80 cursor-not-allowed">
                                            {departureTime}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel hint={`At: ${startLocation === "ORIGIN" ? (routeName.split(" ↔ ")[1] || "Destination") : (routeName.split(" ↔ ")[0] || "Origin")}`}>Arrival Time</FieldLabel>
                                        <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-3 text-sm font-mono font-bold text-foreground opacity-80 cursor-not-allowed">
                                            {arrivalTime}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                                    <p className="text-[11px] text-amber-700 font-medium">No timing config found for this direction. Enter times manually.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <FieldLabel hint={`From: ${startLocation === "ORIGIN" ? (routeName.split(" ↔ ")[0] || "Origin") : (routeName.split(" ↔ ")[1] || "Destination")}`}>Departure Time *</FieldLabel>
                                        <Input type="time" className="h-10 rounded-xl" value={departureTime}
                                            onChange={e => { setDepartureTime(e.target.value); if (e.target.value) setShift(detectShift(e.target.value)); }} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel hint={`At: ${startLocation === "ORIGIN" ? (routeName.split(" ↔ ")[1] || "Destination") : (routeName.split(" ↔ ")[0] || "Origin")}`}>Arrival Time *</FieldLabel>
                                        <Input type="time" className="h-10 rounded-xl" value={arrivalTime}
                                            onChange={e => setArrivalTime(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>Shift</FieldLabel>
                                    <Select value={shift} onValueChange={(v: "day"|"night") => setShift(v)}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="day">Day Shift</SelectItem>
                                            <SelectItem value="night">Night Shift</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Recurrence</FieldLabel>
                                    <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="DAILY">Every Day</SelectItem>
                                            <SelectItem value="WEEKLY">Once a Week</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>Service Starts From *</FieldLabel>
                                    <Input type="date" className="h-10 rounded-xl" value={effectiveFrom}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={e => setEffectiveFrom(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel hint="Leave blank to use route default">Fare Override (NPR)</FieldLabel>
                                    <Input type="number" min={0} className="h-10 rounded-xl" value={fareOverride} placeholder="e.g. 850" onChange={e => setFareOverride(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── STEP 3: BOOKING WINDOW ─────────────────────────── */}
                    {step === "window" && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
                                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                    When a schedule is activated, trips will be pre-generated for the next <strong>{advanceBookingDays} days</strong> immediately — passengers can book right away. Each day, 1 more day is added to maintain the rolling window.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel hint="Days passengers can book in advance">Booking Window (days)</FieldLabel>
                                    <Select value={String(advanceBookingDays)} onValueChange={v => setAdvanceBookingDays(Number(v))}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="30">30 days</SelectItem>
                                            <SelectItem value="45">45 days</SelectItem>
                                            <SelectItem value="60">60 days (recommended)</SelectItem>
                                            <SelectItem value="90">90 days</SelectItem>
                                            <SelectItem value="120">120 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel hint="Booking closes N hours before departure">Booking Cutoff (hours)</FieldLabel>
                                    <Select value={String(bookingCutoffHours)} onValueChange={v => setBookingCutoffHours(Number(v))}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="0">No cutoff</SelectItem>
                                            <SelectItem value="1">1 hour before</SelectItem>
                                            <SelectItem value="2">2 hours before (recommended)</SelectItem>
                                            <SelectItem value="4">4 hours before</SelectItem>
                                            <SelectItem value="12">12 hours before</SelectItem>
                                            <SelectItem value="24">24 hours before</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</p>
                                <p className="text-xs font-medium">Passengers can book up to <strong>{advanceBookingDays} days</strong> ahead.</p>
                                <p className="text-xs font-medium">Booking closes <strong>{bookingCutoffHours > 0 ? `${bookingCutoffHours} hour${bookingCutoffHours > 1 ? "s" : ""} before` : "at"} departure</strong>.</p>
                            </div>
                        </>
                    )}

                    {/* ── STEP 4: RETURN TRIP ────────────────────────────── */}
                    {step === "return" && (
                        <>
                            {(() => {
                                const actOrigin = startLocation === "ORIGIN" ? (originName || "Origin") : (destName || "Destination");
                                const actDest = startLocation === "ORIGIN" ? (destName || "Destination") : (originName || "Origin");

                                return (
                                    <>
                                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                                            <div>
                                                <p className="text-sm font-black">Add Return Schedule</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    Create a linked return schedule — every bus that goes must come back
                                                </p>
                                            </div>
                                            <Switch checked={hasReturn} onCheckedChange={setHasReturn} />
                                        </div>

                                        {hasReturn && (
                                            <>
                                    {/* Operational Model — with concrete examples */}
                                    <div className="space-y-2">
                                        <FieldLabel>How does this bus operate?</FieldLabel>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOperationalModel("RELAY")}
                                                className={`text-left p-3 rounded-xl border-2 transition-all ${
                                                    operationalModel === "RELAY"
                                                        ? "border-primary bg-primary/5"
                                                        : "border-muted bg-muted/30 hover:border-muted-foreground/40"
                                                }`}
                                            >
                                                <p className="text-xs font-black">🌙 Overnight / Relay</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                    Bus leaves KTM evening, arrives JNP next morning, parks there, departs JNP that evening.
                                                    <strong className="block mt-1 text-foreground">Return starts: Day +1</strong>
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOperationalModel("TURNAROUND")}
                                                className={`text-left p-3 rounded-xl border-2 transition-all ${
                                                    operationalModel === "TURNAROUND"
                                                        ? "border-primary bg-primary/5"
                                                        : "border-muted bg-muted/30 hover:border-muted-foreground/40"
                                                }`}
                                            >
                                                <p className="text-xs font-black">🔄 Same-Day Turnaround</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                    Bus departs, arrives, rests briefly, then returns same day. Common for shorter routes.
                                                    <strong className="block mt-1 text-foreground">Return starts: Same day</strong>
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                        {/* Operational Timeline Preview */}
                                        <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                Operational Timeline Preview
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium">
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold">{departureTime || "HH:MM"}</span>
                                                <span className="text-muted-foreground truncate max-w-[100px]">Departs {actOrigin}</span>
                                                <span className="mx-1 text-muted-foreground">→</span>
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold">{arrivalTime || "HH:MM"}</span>
                                                <span className="text-muted-foreground truncate max-w-[100px]">Arrives {actDest}</span>
                                                {operationalModel === "RELAY" && <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-black">+1 day</span>}
                                            </div>
                                            {returnDepartureTime && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono font-bold">{returnDepartureTime}</span>
                                                    <span className="text-muted-foreground truncate max-w-[100px]">Departs {actDest}</span>
                                                    <span className="mx-1 text-muted-foreground">→</span>
                                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono font-bold">{returnArrivalTime || "HH:MM"}</span>
                                                    <span className="text-muted-foreground truncate max-w-[100px]">Arrives {actOrigin}</span>
                                                    {operationalModel === "RELAY" && <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-black">+2 days</span>}
                                                </div>
                                            )}
                                            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                                                {operationalModel === "RELAY"
                                                    ? `Return schedule effective from ${effectiveFrom ? new Date(new Date(effectiveFrom).getTime() + 86400000).toLocaleDateString() : "Day+1"}. The CRON engine skips the return on Day 1 automatically.`
                                                    : `Both schedules start from ${effectiveFrom ? new Date(effectiveFrom).toLocaleDateString() : "selected date"}. Minimum ${layoverMinutes} min layover enforced at destination.`
                                                }
                                            </p>
                                        </div>

                                        {/* Return Times */}
                                        {returnDepartureTime && returnArrivalTime ? (
                                        <div className="bg-muted/30 border-2 border-dashed border-muted p-4 rounded-xl space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
                                                <Calendar className="w-4 h-4" /> Inherited from Return Route
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <FieldLabel>Return Departs {actDest}</FieldLabel>
                                                    <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-3 text-sm font-mono font-bold text-foreground opacity-80 cursor-not-allowed">
                                                        {returnDepartureTime}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <FieldLabel>Return Arrives {actOrigin}</FieldLabel>
                                                    <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-3 text-sm font-mono font-bold text-foreground opacity-80 cursor-not-allowed">
                                                        {returnArrivalTime}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        ) : (
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                                                <p className="text-[11px] text-amber-700 font-medium">No return timing found. Enter return times manually.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <FieldLabel>Return Departs {actDest} *</FieldLabel>
                                                    <Input type="time" className="h-10 rounded-xl" value={returnDepartureTime}
                                                        onChange={e => setReturnDepartureTime(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <FieldLabel>Return Arrives {actOrigin} *</FieldLabel>
                                                    <Input type="time" className="h-10 rounded-xl" value={returnArrivalTime}
                                                        onChange={e => setReturnArrivalTime(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        )}

                                        {operationalModel === "TURNAROUND" && (
                                            <div className="space-y-1.5">
                                                <FieldLabel hint="Minimum rest at destination before return departure">Layover at Destination</FieldLabel>
                                                <Select value={String(layoverMinutes)} onValueChange={v => setLayoverMinutes(Number(v))}>
                                                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="45">45 minutes</SelectItem>
                                                        <SelectItem value="60">1 hour (recommended)</SelectItem>
                                                        <SelectItem value="90">1.5 hours</SelectItem>
                                                        <SelectItem value="120">2 hours</SelectItem>
                                                        <SelectItem value="180">3 hours</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </>
                                )}
                                    </>
                                );
                            })()}
                        </>
                    )}
                </div>

                <div className={`p-6 pt-3 bg-background gap-2 border-t flex items-center ${isInline ? 'mt-auto' : ''}`}>
                    <Button variant="outline" onClick={goPrev} disabled={step === "service"} className="font-bold rounded-xl h-10 gap-1">
                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                    <div className="flex-1" />
                    {!isInline && <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} className="font-bold rounded-xl h-10 mr-2">Cancel</Button>}
                    {step !== "return" ? (
                        <Button
                            className="h-10 rounded-xl font-black gap-1"
                            disabled={(step === "service" && !step1Valid) || (step === "timing" && !step2Valid)}
                            onClick={goNext}
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    ) : (
                        <Button
                            className="h-10 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-6"
                            disabled={!canSubmit || createMut.isPending || (hasReturn && (!returnDepartureTime || !returnArrivalTime))}
                            onClick={() => createMut.mutate()}
                        >
                            {createMut.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
                            {hasReturn ? "Create Both Schedules" : "Create Schedule"}
                        </Button>
                    )}
                </div>
        </>
    );

    if (isInline) {
        return (
            <div className="flex flex-col h-full bg-background rounded-2xl border-2 border-muted shadow-sm overflow-hidden w-full">
                {content}
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); } onOpenChange(o); }}>
            <DialogContent className="sm:max-w-[580px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                {content}
            </DialogContent>
        </Dialog>
    );
};

export default CreateScheduleModal;
