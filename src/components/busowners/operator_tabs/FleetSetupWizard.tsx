import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ChevronRight, Route, Bus, Users, Calendar, Power, ArrowRight, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFleetSetupStatus } from "@/api/busOwnerFleetApi";
import { activateSchedule, goLiveSchedule } from "@/api/scheduleApi";
import { getDriversByBrand, assignBusToDriver } from "@/api/driverApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { FleetSetupStepKey } from "@/api/busOwnerFleetApi";

// Modals to support inline actions
import UpdateOwnerFleetModal from "./UpdateOwnerFleetModal";
import DriverFormModal from "./CreateDriverModal";
import CreateScheduleModal from "./CreateScheduleModal";

interface FleetSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  fleetId: string;
  brandId: string;
  ownerId?: string;
}

const SETUP_STEPS = [
  { id: "routeAssigned", label: "Route Assignment", icon: Route, description: "Fleet mapped to a platform corridor" },
  { id: "routeConfigured", label: "Route Validation", icon: Route, description: "Verify brand-specific stops exist" },
  { id: "driverAssigned", label: "Crew Assignment", icon: Users, description: "Assign primary driver & crew" },
  { id: "scheduleCreated", label: "Service Scheduling", icon: Calendar, description: "Create operational timeline" },
  { id: "activated", label: "Dispatch Overview", icon: Power, description: "Final review & activation" },
] as const satisfies ReadonlyArray<{ id: FleetSetupStepKey; label: string; icon: typeof Route; description: string }>;

function apiErrorMessage(error: unknown, fallback: string) {
  const typed = error as AxiosError<{ message?: string }>;
  return typed.response?.data?.message || typed.message || fallback;
}

export default function FleetSetupWizard({ isOpen, onClose, fleetId, brandId, ownerId }: FleetSetupWizardProps) {
  const qc = useQueryClient();
  const [actionState, setActionState] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [initializedFleetId, setInitializedFleetId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fleet-setup-status", fleetId],
    queryFn: () => getFleetSetupStatus(fleetId),
    enabled: isOpen && !!fleetId,
    staleTime: 0,        // always fetch fresh when wizard opens
    gcTime: 0,           // don't retain in cache after component unmounts
  });

  const status = data?.data;

  // Fetch available drivers when on driver step
  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ["brand-drivers", brandId, "APPROVED"],
    queryFn: () => getDriversByBrand(brandId, { approvalStatus: "APPROVED" }),
    enabled: isOpen && !!brandId && actionState === null,
  });
  const availableDrivers = driversData?.data || [];

  const assignDriverMut = useMutation({
    mutationFn: (driverId: string) => assignBusToDriver(driverId, fleetId),
    onSuccess: () => {
      toast.success("Driver assigned to fleet!");
      qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
      qc.invalidateQueries({ queryKey: ["brand-drivers", brandId] });
    },
    onError: (err: unknown) => {
      toast.error(apiErrorMessage(err, "Failed to assign driver"));
    }
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      if (!status?.scheduleId) throw new Error("No primary schedule ID found");
      // Activating the primary schedule also activates its linked return.
      await activateSchedule(status.scheduleId);
      // Phase 2: Trigger trip burst generation
      await goLiveSchedule(status.scheduleId);
    },
    onSuccess: () => {
      toast.success("Fleet is now LIVE! Trips are being generated — passengers can start booking.");
      qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
      qc.invalidateQueries({ queryKey: ["ownerFleets"] });
      qc.invalidateQueries({ queryKey: ["fleets"] });
      qc.invalidateQueries({ queryKey: ["fleetWorkstation", fleetId] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(apiErrorMessage(err, "Failed to activate fleet"));
    }
  });

  const navigate = useNavigate();

  const steps = SETUP_STEPS;

  useEffect(() => {
    if (status && initializedFleetId !== fleetId) {
      const firstIncomplete = steps.findIndex(s => !status?.steps?.[s.id]);
      const timer = window.setTimeout(() => {
        setActiveIndex(firstIncomplete === -1 ? steps.length - 1 : firstIncomplete);
        setInitializedFleetId(fleetId);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [status, initializedFleetId, fleetId, steps]);

  // ── GATE: Wizard is for first-time setup only ──────────────────────────────
  // If a schedule exists (ACTIVE, SUSPENDED, or INACTIVE), do NOT show the wizard.
  // - ACTIVE / SUSPENDED → go to Workstation to manage
  // - INACTIVE → schedule permanently stopped; must create a new one from Workstation
  // Only DRAFT schedules that were NEVER activated pass through to the wizard.
  const scheduleStatus = status?.outboundScheduleData?.status;
  const hasBeenLive = !!status?.scheduleId && (
    scheduleStatus === "ACTIVE" ||
    scheduleStatus === "SUSPENDED" ||
    scheduleStatus === "INACTIVE" ||
    status?.isFullyOperational
  );

  if (!isLoading && hasBeenLive) {
    const isSuspended = scheduleStatus === "SUSPENDED";
    const isInactive  = scheduleStatus === "INACTIVE";

    // Config per state
    const headerBg   = isSuspended ? "bg-amber-700" : isInactive ? "bg-red-900" : "bg-slate-900";
    const headerIcon = isSuspended
      ? <AlertTriangle className="w-5 h-5 text-amber-200" />
      : isInactive
        ? <AlertTriangle className="w-5 h-5 text-red-300" />
        : <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    const headerTitle = isSuspended
      ? "Service Currently Suspended"
      : isInactive
        ? "Schedule Permanently Deactivated"
        : "Fleet is Already Live";
    const headerDesc  = isSuspended
      ? "This fleet's schedule is suspended. Use the Fleet Workstation to resume operations."
      : isInactive
        ? "This schedule has been permanently stopped and cannot be reactivated."
        : "This fleet has completed setup and is actively generating trips.";
    const cardBorder  = isSuspended ? "border-amber-500/20 bg-amber-500/5"
                      : isInactive  ? "border-red-500/20 bg-red-500/5"
                      : "border-emerald-500/20 bg-emerald-500/5";
    const cardTitle   = isSuspended ? "text-amber-700" : isInactive ? "text-red-700" : "text-emerald-700";
    const cardIcon    = isSuspended
      ? <AlertTriangle className="w-4 h-4" />
      : isInactive
        ? <AlertTriangle className="w-4 h-4" />
        : <CheckCircle2 className="w-4 h-4" />;
    const cardHeading = isSuspended ? "Action Required in Workstation"
                      : isInactive  ? "Create a New Schedule"
                      : "Operational";
    const cardBody    = isSuspended
      ? <>The Setup Wizard is for first-time onboarding only. To <strong className="text-foreground">resume service</strong>, use the Fleet Workstation.</>
      : isInactive
        ? <>This schedule was permanently deactivated. To restore service, <strong className="text-foreground">create a new schedule</strong> from the Fleet Workstation → Schedules tab.</>
        : <>The Setup Wizard is only for first-time fleet onboarding. To manage schedules, suspend service, or resume operations, use the <strong className="text-foreground">Fleet Workstation</strong>.</>
    const btnBg       = isSuspended ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : isInactive  ? "bg-red-700 hover:bg-red-800 text-white"
                      : "bg-primary";
    const btnLabel    = isSuspended ? "Resume in Workstation"
                      : isInactive  ? "Open Workstation"
                      : "Open Workstation";

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className={`p-6 text-white ${headerBg}`}>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                {headerIcon} {headerTitle}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-2 text-white/60">
              {headerDesc}
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className={`rounded-xl border p-4 text-sm ${cardBorder}`}>
              <p className={`font-black mb-1 flex items-center gap-1.5 ${cardTitle}`}>
                {cardIcon} {cardHeading}
              </p>
              <p className="text-muted-foreground">{cardBody}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 font-bold rounded-xl">
                Close
              </Button>
              <Button
                className={`flex-1 font-bold rounded-xl ${btnBg}`}
                onClick={() => { onClose(); navigate(`/admin/fleets/${fleetId}/workstation`); }}
              >
                {btnLabel} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-emerald-400" /> 
              Fleet Activation Wizard
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-slate-400 mt-2">
            Complete the operational setup to activate this bus and start receiving bookings.
          </DialogDescription>
        </div>

        <div className="flex bg-background h-[75vh] min-h-[500px] max-h-[750px]">
          {/* Sidebar Steps */}
          <div className="w-1/3 border-r bg-muted/10 p-4 space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              steps.map((step, idx) => {
                const isCompleted = status?.steps?.[step.id];
                const isActive = idx === activeIndex;
                
                return (
                  <div 
                    key={step.id} 
                    onClick={() => setActiveIndex(idx)}
                    className={`flex gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-muted/50 ${
                      isActive ? "bg-primary/10 border border-primary/20" : 
                      isCompleted ? "opacity-70" : "opacity-40 hover:opacity-80"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${isActive ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}`}>
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isActive ? 'text-primary' : ''}`}>{step.label}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-tight">{step.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Main Content Area */}
          <div className="w-2/3 p-6 flex flex-col overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Checking setup status</p>
              </div>
            ) : activeIndex === steps.length ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-emerald-700">Fleet is Fully Configured!</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">This fleet is active and operational. Trips are being generated.</p>
              </div>
            ) : actionState ? (
              <div className="flex-1 flex flex-col min-h-0 bg-background rounded-2xl shadow-sm border border-muted/50 overflow-hidden relative">
                {actionState === "scheduleCreated" && ownerId && (
                  <CreateScheduleModal
                    brandId={brandId}
                    ownerId={ownerId}
                    open={true}
                    isInline={true}
                    prefillBusId={fleetId}
                    prefillCorridorId={status?.assignedCorridor?._id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setActionState(null);
                        qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
                      }
                    }}
                    onSuccess={() => {
                        setActionState(null);
                        qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
                    }}
                  />
                )}
                {/* Fallback close button if not natively handled */}
                <Button variant="outline" size="sm" className="absolute top-4 right-4 z-50 h-8 font-bold" onClick={() => setActionState(null)}>Cancel Action</Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-black mb-1">{steps[activeIndex].label}</h3>
                <p className="text-sm text-muted-foreground mb-6">{steps[activeIndex].description}</p>
                
                {/* Direction-aware city names: swap when outbound runs on a RETURN variant */}
                {(() => {
                  const isReversed = status?.outboundScheduleData?.variantId?.direction === "RETURN";
                  const fromCity = isReversed ? status?.assignedCorridor?.destinationId?.name : status?.assignedCorridor?.originId?.name;
                  const toCity = isReversed ? status?.assignedCorridor?.originId?.name : status?.assignedCorridor?.destinationId?.name;
                  return (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl bg-muted/5 p-6 text-center">
                  {steps[activeIndex].id === "routeAssigned" && (
                    <>
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Route className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">
                        {status?.steps?.routeAssigned ? "Route Mapped" : "No Route Assigned"}
                      </h4>
                      {status?.steps?.routeAssigned && status?.assignedCorridor ? (
                        <div className="mb-6 w-full max-w-sm text-left border border-primary/20 rounded-xl p-4 bg-background shadow-sm">
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Assigned Platform Corridor</p>
                          <p className="text-base font-black flex items-center gap-2">
                            {status.assignedCorridor.originId?.name} <span className="text-muted-foreground/50">↔</span> {status.assignedCorridor.destinationId?.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold">{status.assignedCorridor.code}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                          This bus is not mapped to any specific route corridor. Please edit the fleet details to assign a platform route.
                        </p>
                      )}
                      <Button onClick={() => setActionState("routeAssigned")} className="font-bold rounded-xl h-10">
                        {status?.steps?.routeAssigned ? "Edit Route Assignment" : "Map Route to Fleet"}
                      </Button>
                    </>
                  )}
                  {steps[activeIndex].id === "routeConfigured" && (
                    <>
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Route className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">
                        {status?.steps?.routeConfigured ? "Route Validated" : "Route Not Configured"}
                      </h4>
                      {status?.steps?.routeConfigured && (status?.assignedRouteConfigs?.length ?? 0) > 0 ? (
                        <div className="mb-6 w-full max-w-md text-left space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {(status.assignedRouteConfigs ?? []).map((cfg) => {
                            const isReturn = cfg.variantId?.direction === "RETURN";
                            const origin = isReturn ? status.assignedCorridor?.destinationId?.name : status.assignedCorridor?.originId?.name;
                            const dest = isReturn ? status.assignedCorridor?.originId?.name : status.assignedCorridor?.destinationId?.name;
                            return (
                                <div key={cfg._id} className="border border-primary/20 rounded-xl p-3.5 bg-background shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{isReturn ? "Return Route" : "Outbound Route"}</p>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Route className="w-3 h-3" /> {cfg.activeStops?.length || 0} Stops</span>
                                  </div>
                                  <p className="text-sm font-black flex items-center gap-2">
                                    {origin} <span className="text-muted-foreground/50">→</span> {dest}
                                  </p>
                                </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 mb-6 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive font-semibold max-w-sm">
                          Your brand has not configured boarding/dropping stops for this corridor. Please exit this wizard and establish the Route Service in the master registry first.
                        </div>
                      )}
                    </>
                  )}
                  {steps[activeIndex].id === "driverAssigned" && (
                    <>
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">
                        {status?.steps?.driverAssigned ? "Primary Crew Assigned" : "Assign Primary Crew"}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        {status?.steps?.driverAssigned
                          ? "This bus has a primary crew assigned. You can change the assignment below."
                          : "This bus needs a dedicated primary driver. Select an existing approved driver or create a new one."}
                      </p>

                      {status?.steps?.driverAssigned && status.assignedDriver && (
                          <div className="mb-4 w-full max-w-md text-left border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5 shadow-sm">
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Currently Assigned</p>
                              <div className="flex justify-between items-center">
                                  <p className="text-sm font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {status.assignedDriver.fullName}</p>
                                  <p className="text-xs font-bold text-muted-foreground">{status.assignedDriver.licenseType}</p>
                              </div>
                          </div>
                      )}
                      
                      {loadingDrivers ? (
                        <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                      ) : availableDrivers.length > 0 ? (
                        <div className="w-full max-w-md max-h-40 overflow-y-auto space-y-2 mb-4 pr-2 text-left">
                          {availableDrivers.map(d => {
                            const isThisFleet = (typeof d.assignedBusId === 'object' && d.assignedBusId !== null ? d.assignedBusId._id : d.assignedBusId) === fleetId;
                            return (
                              <div key={d._id} className="flex items-center justify-between p-3 rounded-xl border border-muted bg-background hover:border-primary/30 transition-all">
                                <div>
                                  <p className="text-sm font-black">{d.fullName} {isThisFleet && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">CURRENT</span>}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{d.licenseType} · Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant={isThisFleet ? "outline" : "default"}
                                  className="h-8 rounded-lg font-bold text-xs" 
                                  disabled={assignDriverMut.isPending || isThisFleet}
                                  onClick={() => assignDriverMut.mutate(d._id)}
                                >
                                  {isThisFleet ? "Assigned" : "Assign"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 mb-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 text-xs text-muted-foreground font-bold">
                          No approved drivers available for this brand.
                        </div>
                      )}

                      <Button variant="outline" onClick={() => setActionState("driverAssigned")} className="font-bold rounded-xl h-10 w-full max-w-md">
                        + Add New Driver
                      </Button>
                    </>
                  )}
                  {steps[activeIndex].id === "scheduleCreated" && (
                    <>
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">
                        {status?.steps?.scheduleCreated ? "Service Timeline Created" : "Missing Service Timeline"}
                      </h4>
                      {status?.steps?.scheduleCreated && status?.outboundScheduleData ? (
                        <div className="mb-6 w-full max-w-sm text-left border border-primary/20 rounded-xl p-4 bg-background shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Outbound Service</p>
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black">{status.outboundScheduleData.status}</span>
                          </div>
                          
                          {/* Outbound Leg */}
                          <div className="flex items-center gap-4">
                            <div className="w-1/3">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5 truncate" title={fromCity}>Departs • {fromCity?.split(" ")[0]}</p>
                                <p className="text-lg font-black">{status.outboundScheduleData.departureTime}</p>
                            </div>
                            <div className="flex-1 border-t border-dashed border-border my-auto relative">
                                <ChevronRight className="absolute -top-2 -right-1.5 w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="w-1/3 text-right">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5 truncate" title={toCity}>Arrives • {toCity?.split(" ")[0]}</p>
                                <p className="text-lg font-black">{status.outboundScheduleData.arrivalTime}</p>
                            </div>
                          </div>
                          
                          {/* Return Leg */}
                          {status?.returnScheduleData && (
                            <div className="mt-3 pt-3 border-t border-muted/50 border-dashed">
                              <div className="flex items-center gap-4">
                                <div className="w-1/3">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5 truncate" title={toCity}>Return • {toCity?.split(" ")[0]}</p>
                                    <p className="text-lg font-black">{status.returnScheduleData.departureTime}</p>
                                </div>
                                <div className="flex-1 border-t border-dashed border-border my-auto relative">
                                    <ChevronRight className="absolute -top-2 -right-1.5 w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="w-1/3 text-right">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5 truncate" title={fromCity}>Arrives • {fromCity?.split(" ")[0]}</p>
                                    <p className="text-lg font-black">{status.returnScheduleData.arrivalTime}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono font-bold mt-3 uppercase text-center bg-muted/50 py-1 rounded">Model: {status.outboundScheduleData.operationalModel}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                          No active or draft schedule exists for this bus. You must create an initial schedule timeline (outbound + optional return).
                        </p>
                      )}
                      <Button onClick={() => setActionState("scheduleCreated")} className="font-bold rounded-xl h-10">
                        {status?.steps?.scheduleCreated ? "Edit Service Schedule" : "Create Service Schedule"}
                      </Button>
                    </>
                  )}
                  {steps[activeIndex].id === "activated" && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Power className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">Ready for Dispatch</h4>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Review the generated operational loop below. Activating will instantly generate the initial batch of live trips.
                      </p>
                      
                      {/* Visual Dispatch Graph */}
                      {status && (
                          <div className="w-full max-w-lg mb-6 bg-background rounded-xl border-2 border-emerald-500/20 shadow-sm p-5 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
                              
                              <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-2">
                                      <Bus className="w-4 h-4 text-emerald-600" />
                                      <span className="font-black text-sm">{status.fleetData?.busNumber || "Fleet Assigned"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                      <Users className="w-3 h-3" />
                                      Crew: {status.assignedDriver?.fullName || "Assigned"}
                                  </div>
                              </div>

                              <div className="relative border-l-2 border-dashed border-muted-foreground/30 ml-4 py-2 space-y-6">
                                  {/* Outbound Node */}
                                  <div className="relative pl-6">
                                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
                                      <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-0.5">Outbound Departure</p>
                                      <div className="flex items-baseline gap-2">
                                          <p className="text-xl font-black">{status.outboundScheduleData?.departureTime}</p>
                                          <p className="text-xs font-bold text-muted-foreground">{fromCity}</p>
                                      </div>
                                  </div>

                                  {/* Destination / Turnaround Node */}
                                  <div className="relative pl-6">
                                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-background" />
                                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-0.5">Destination Arrival</p>
                                      <div className="flex items-baseline gap-2">
                                          <p className="text-xl font-black">{status.outboundScheduleData?.arrivalTime}</p>
                                          <p className="text-xs font-bold text-muted-foreground">{toCity}</p>
                                      </div>
                                  </div>

                                  {/* Return Node */}
                                  {status.returnScheduleData && (
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-background" />
                                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-0.5">Return Departure</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-xl font-black">{status.returnScheduleData.departureTime}</p>
                                            <p className="text-xs font-bold text-muted-foreground">{toCity}</p>
                                        </div>
                                    </div>
                                  )}
                                  
                                  {/* Home Arrival */}
                                  {status.returnScheduleData && (
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-0.5">Home Arrival</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-xl font-black">{status.returnScheduleData.arrivalTime}</p>
                                            <p className="text-xs font-bold text-muted-foreground">{fromCity}</p>
                                        </div>
                                    </div>
                                  )}
                              </div>
                          </div>
                      )}

                      <Button 
                        className="font-black rounded-xl h-12 px-8 w-full max-w-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                        onClick={() => activateMutation.mutate()}
                        disabled={activateMutation.isPending}
                      >
                        {activateMutation.isPending ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Power className="w-5 h-5 mr-2" />
                        )}
                        Activate Fleet & Go Live
                      </Button>
                    </div>
                  )}
                </div>
                  ); /* end direction-aware IIFE */
                })()}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between pt-6 border-t border-border/50">
              <Button 
                variant="outline" 
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} 
                disabled={activeIndex === 0} 
                className="font-bold"
              >
                Previous Step
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose} className="font-bold">Close</Button>
                {activeIndex < steps.length && (
                  <Button 
                    onClick={() => setActiveIndex(activeIndex + 1)} 
                    className="font-bold bg-primary text-primary-foreground"
                    disabled={!status?.steps?.[steps[activeIndex].id]}
                  >
                    Next Step <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Note: UpdateOwnerFleetModal and DriverFormModal are still using Modals, but they are relatively minor popups and ok for now */}
      {actionState === "routeAssigned" && ownerId && (
        <UpdateOwnerFleetModal
          id={fleetId}
          isOpen={true}
          onClose={() => {
            setActionState(null);
            qc.invalidateQueries({ queryKey: ["fleet-setup-status", fleetId] });
          }}
          ownerId={ownerId}
        />
      )}
      {actionState === "driverAssigned" && (
        <DriverFormModal
          brandId={brandId}
          brandName="Active Brand"
          isOpen={true}
          onClose={() => setActionState(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["brand-drivers", brandId] }); setActionState(null); }}
        />
      )}
    </Dialog>
  );
}
