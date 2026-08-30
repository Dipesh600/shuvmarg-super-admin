import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Route, MapPin, Navigation, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, Plus, Trash2, GripVertical, ArrowDown, DollarSign, Info
} from "lucide-react";
import { useCreateBusRoute } from "@/hooks/useBusRoutes";
import { useFetchBoardingPointsByOwner } from "@/hooks/useBoardingPoints";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BoardingPointGroup } from "@/api/boardingPointsApi";

interface CreateBusRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

interface Stop {
  id: string;
  name: string;
  estimatedMinutes: number; // minutes from origin
  fareOffset: number;       // +/- Rs from base price
}

const STEPS = [
  { id: 1, label: "Route Info",  icon: Route },
  { id: 2, label: "Stops",       icon: MapPin },
  { id: 3, label: "Review",      icon: CheckCircle2 },
];

const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center justify-between px-6 py-4 bg-muted/10 border-b relative flex-shrink-0">
    <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-muted -z-0 -translate-y-1/2" />
    {STEPS.map((s) => (
      <div key={s.id} className="flex flex-col items-center gap-1.5 bg-background px-2 z-10">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
          step >= s.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-muted"
        )}>
          {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= s.id ? "text-primary" : "text-muted-foreground")}>
          {s.label}
        </span>
      </div>
    ))}
  </div>
);

const CreateBusRouteModal: React.FC<CreateBusRouteModalProps> = ({ isOpen, onClose, ownerId }) => {
  const createMutation = useCreateBusRoute();
  const { data: boardingData } = useFetchBoardingPointsByOwner(ownerId);
  const boardingPoints: BoardingPointGroup[] = boardingData?.data || [];

  const [step, setStep] = useState(1);

  // Step 1 fields
  const [routeName, setRouteName]   = useState("");
  const [from, setFrom]             = useState("");
  const [to, setTo]                 = useState("");
  const [distance, setDistance]     = useState("");
  const [duration, setDuration]     = useState("");
  const [basePrice, setBasePrice]   = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Step 2 fields — stops
  const [stops, setStops] = useState<Stop[]>([]);
  const [newStopName, setNewStopName] = useState("");
  const [newStopMinutes, setNewStopMinutes] = useState("");
  const [newStopFare, setNewStopFare] = useState("");

  const resetForm = () => {
    setStep(1);
    setRouteName(""); setFrom(""); setTo(""); setDistance(""); setDuration(""); setBasePrice(""); setIsRoundTrip(false);
    setStops([]); setNewStopName(""); setNewStopMinutes(""); setNewStopFare("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!routeName || !from || !to || !distance || !duration || !basePrice) {
        toast.error("Please fill all required fields.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const addStop = () => {
    if (!newStopName.trim() || !newStopMinutes) {
      toast.error("Stop name and estimated time are required.");
      return;
    }
    const mins = parseInt(newStopMinutes, 10);
    if (isNaN(mins) || mins <= 0) { toast.error("Enter a valid time in minutes."); return; }

    setStops(prev => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        name: newStopName.trim(),
        estimatedMinutes: mins,
        fareOffset: parseFloat(newStopFare) || 0,
      }
    ]);
    setNewStopName(""); setNewStopMinutes(""); setNewStopFare("");
  };

  const removeStop = (id: string) => setStops(prev => prev.filter(s => s.id !== id));

  const moveStop = (idx: number, dir: 1 | -1) => {
    setStops(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSubmit = async () => {
    const payload = {
      routeName,
      from,
      to,
      distance,
      duration,
      basePrice: Number(basePrice),
      isRoundTrip,
      returnRouteId: null,
      stops: stops.map(s => ({ name: s.name, estimatedMinutes: s.estimatedMinutes, fareOffset: s.fareOffset })),
      ownerId,
    };
    try {
      await createMutation.mutateAsync(payload);
      resetForm();
      onClose();
    } catch { /* handled by hook */ }
  };

  const fmtTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && (resetForm(), onClose())}>
      <DialogContent className="sm:max-w-[680px] flex flex-col p-0 overflow-hidden border-2 shadow-2xl max-h-[92vh]">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Add Bus Route</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Define a new travel path in 3 steps</p>
            </div>
          </div>
        </DialogHeader>

        <StepIndicator step={step} />

        <div className="flex flex-col overflow-hidden" style={{ flex: "1 1 0", minHeight: 0 }}>
          <ScrollArea className="flex-1 px-6 pt-4" style={{ minHeight: 0 }}>
            <div className="space-y-5 pb-6">

              {/* ── STEP 1: Route Identity ───────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Route Name</Label>
                    <Input placeholder="e.g. Kathmandu – Pokhara Express" className="h-11 font-bold bg-muted/30 border-2"
                      value={routeName} onChange={e => setRouteName(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500" /> Origin
                      </Label>
                      {boardingPoints.length > 0 ? (
                        <select className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold focus-visible:outline-none"
                          value={from} onChange={e => setFrom(e.target.value)}>
                          <option value="">Select origin...</option>
                          {boardingPoints.map((bp) => (
                            <option key={bp._id} value={bp.city}>{bp.city}</option>
                          ))}
                        </select>
                      ) : (
                        <Input placeholder="e.g. Kathmandu" className="h-11 font-bold bg-muted/30 border-2"
                          value={from} onChange={e => setFrom(e.target.value)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" /> Destination
                      </Label>
                      {boardingPoints.length > 0 ? (
                        <select className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold focus-visible:outline-none"
                          value={to} onChange={e => setTo(e.target.value)}>
                          <option value="">Select destination...</option>
                          {boardingPoints.map((bp) => (
                            <option key={bp._id} value={bp.city}>{bp.city}</option>
                          ))}
                        </select>
                      ) : (
                        <Input placeholder="e.g. Pokhara" className="h-11 font-bold bg-muted/30 border-2"
                          value={to} onChange={e => setTo(e.target.value)} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-muted/10 p-4 rounded-xl border">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Navigation className="h-3 w-3" /> Distance
                      </Label>
                      <Input placeholder="145 km" className="h-10 font-bold border-2"
                        value={distance} onChange={e => setDistance(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Duration
                      </Label>
                      <Input placeholder="8 hrs" className="h-10 font-bold border-2"
                        value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Base Price (Rs)
                      </Label>
                      <Input type="number" placeholder="900" className="h-10 font-bold border-2"
                        value={basePrice} onChange={e => setBasePrice(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border-2 border-dashed border-muted">
                    <div>
                      <p className="text-sm font-black tracking-tight">Round Trip Config</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enable reverse booking direction</p>
                    </div>
                    <Switch checked={isRoundTrip} onCheckedChange={setIsRoundTrip} />
                  </div>
                </div>
              )}

              {/* ── STEP 2: Intermediate Stops ───────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-primary">Intermediate Stops</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Add stops between <strong>{from}</strong> and <strong>{to}</strong>. Passengers can board or alight at any stop. Stops are ordered by time from origin.</p>
                    </div>
                  </div>

                  {/* Add stop row */}
                  <div className="bg-background border-2 border-dashed border-muted rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Add a Stop</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 sm:col-span-1">
                        {boardingPoints.length > 0 ? (
                          <select className="flex h-10 w-full rounded-md border-2 border-muted bg-background px-3 text-sm font-bold focus-visible:outline-none"
                            value={newStopName} onChange={e => setNewStopName(e.target.value)}>
                            <option value="">Select stop...</option>
                            {boardingPoints
                              .filter((bp) => bp.city !== from && bp.city !== to)
                              .map((bp) => (
                                <option key={bp._id} value={bp.city}>{bp.city}</option>
                              ))}
                          </select>
                        ) : (
                          <Input placeholder="Stop name" className="h-10 font-bold border-2"
                            value={newStopName} onChange={e => setNewStopName(e.target.value)} />
                        )}
                      </div>
                      <div>
                        <Input type="number" placeholder="Minutes from origin" className="h-10 font-bold border-2"
                          value={newStopMinutes} onChange={e => setNewStopMinutes(e.target.value)} />
                      </div>
                      <div>
                        <Input type="number" placeholder="±Fare offset (Rs)" className="h-10 font-bold border-2"
                          value={newStopFare} onChange={e => setNewStopFare(e.target.value)} />
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5" onClick={addStop}>
                      <Plus className="w-3.5 h-3.5" /> Add Stop
                    </Button>
                  </div>

                  {/* Stop list */}
                  <div className="space-y-2">
                    {/* Origin terminal */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-black text-emerald-800">{from || "Origin"}</span>
                      <Badge variant="outline" className="ml-auto text-[9px] font-bold border-emerald-300 text-emerald-700">Start · 0 min</Badge>
                    </div>

                    {stops.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4 italic">No intermediate stops added. You can continue without stops.</p>
                    )}

                    {stops
                      .slice()
                      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
                      .map((stop, idx) => (
                        <div key={stop.id} className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button type="button" disabled={idx === 0} onClick={() => moveStop(idx, -1)}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5">
                              <GripVertical className="w-3 h-3 rotate-90" />
                            </button>
                          </div>
                          <div className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-muted hover:bg-muted/50 transition-colors">
                            <ArrowDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-bold flex-1">{stop.name}</span>
                            <Badge variant="secondary" className="text-[9px] font-bold">{fmtTime(stop.estimatedMinutes)}</Badge>
                            {stop.fareOffset !== 0 && (
                              <Badge variant="outline" className={cn("text-[9px] font-bold", stop.fareOffset > 0 ? "text-primary border-primary/30" : "text-destructive border-destructive/30")}>
                                {stop.fareOffset > 0 ? "+" : ""}{stop.fareOffset} Rs
                              </Badge>
                            )}
                          </div>
                          <button type="button" onClick={() => removeStop(stop.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                    {/* Destination terminal */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm font-black text-primary">{to || "Destination"}</span>
                      <Badge variant="outline" className="ml-auto text-[9px] font-bold border-primary/30 text-primary">{duration || "End"}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Review & Confirm ─────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Route summary card */}
                  <div className="bg-muted/10 border-2 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Route Summary</p>
                      {isRoundTrip && <Badge variant="secondary" className="text-[9px] font-black uppercase">Round Trip</Badge>}
                    </div>

                    <h3 className="text-xl font-black tracking-tighter">{routeName}</h3>

                    {/* Origin → Destination visual */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-black text-emerald-800 text-sm">{from}</span>
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Origin</span>
                      </div>

                      {stops
                        .slice()
                        .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
                        .map(stop => (
                          <div key={stop.id} className="ml-4 flex items-center gap-3 py-2 px-4 rounded-lg bg-muted/30 border">
                            <ArrowDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-bold flex-1">{stop.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground">{fmtTime(stop.estimatedMinutes)} from start</span>
                            {stop.fareOffset !== 0 && (
                              <span className={cn("text-[9px] font-bold ml-2", stop.fareOffset > 0 ? "text-primary" : "text-destructive")}>
                                {stop.fareOffset > 0 ? "+" : ""}{stop.fareOffset} Rs
                              </span>
                            )}
                          </div>
                        ))}

                      <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="font-black text-primary text-sm">{to}</span>
                        <span className="ml-auto text-[10px] font-bold text-primary/70 uppercase tracking-wide">Destination</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Distance", value: distance, icon: Navigation },
                      { label: "Duration", value: duration, icon: Clock },
                      { label: "Base Price", value: `Rs ${basePrice}`, icon: DollarSign },
                    ].map(stat => (
                      <div key={stat.label} className="bg-background border-2 rounded-xl p-3 text-center space-y-1">
                        <stat.icon className="w-4 h-4 text-muted-foreground mx-auto" />
                        <p className="text-base font-black">{stat.value}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border">
                    {stops.length} intermediate stop{stops.length !== 1 ? "s" : ""} configured · Route will be saved and available for trip assignment
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-6 bg-muted/20 border-t flex justify-between gap-3 flex-shrink-0">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} className="font-bold h-11 gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-bold h-11 text-muted-foreground hover:text-foreground">Cancel</Button>
              </DialogClose>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="font-bold h-11 px-8 gap-2">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending}
                className="font-black uppercase tracking-widest text-xs h-11 px-8 shadow-lg shadow-primary/20 gap-2">
                {createMutation.isPending ? "Saving Route..." : "Confirm & Save Route"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusRouteModal;
