import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Image as ImageIcon, FileText, ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2, Route } from "lucide-react";
import { useCreateOwnerFleet } from "@/hooks/useOwnerFleets";
import { useFetchAllCorridors } from "@/hooks/usePlatformRegistry";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import SeatMapBuilder, { type SeatConfig } from "./SeatMapBuilder";
import { cn } from "@/lib/utils";

interface CreateOwnerFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  brandId?: string;
}

const CreateOwnerFleetModal: React.FC<CreateOwnerFleetModalProps> = ({
  isOpen,
  onClose,
  ownerId,
  brandId
}) => {
  const createMutation = useCreateOwnerFleet();
  const { data: corridorsData } = useFetchAllCorridors();
  const { data: globalAmenitiesData } = useQuery({
    queryKey: ["globalAmenities"],
    queryFn: async () => { const { data } = await api.get("/amenities/global"); return data; },
    staleTime: 60_000,
  });

  const globalAmenities: any[] = globalAmenitiesData?.data || [];
  const corridorsList: any[] = corridorsData?.data || [];

  const [step, setStep] = useState(1);

  // Step 1: Core Details
  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("DELUXE");
  const [vehicleType, setVehicleType] = useState("bus");
  const [registrationYear, setRegistrationYear] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Step 2: Seat Map
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);
  const [totalSeats, setTotalSeats] = useState(0);

  // Step 3: Images
  const [imageFront, setImageFront] = useState<File | null>(null);
  const [imageBack, setImageBack] = useState<File | null>(null);
  const [imageSide, setImageSide] = useState<File | null>(null);
  const [imageInside, setImageInside] = useState<File | null>(null);

  // Step 4: Documents
  const [fitnessCert, setFitnessCert] = useState<File | null>(null);
  const [fitnessCertValidTill, setFitnessCertValidTill] = useState("");
  const [insurance, setInsurance] = useState<File | null>(null);
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceValidTill, setInsuranceValidTill] = useState("");
  const [bluebook, setBluebook] = useState<File | null>(null);
  const [routePermit, setRoutePermit] = useState<File | null>(null);
  const [routePermitValidTill, setRoutePermitValidTill] = useState("");

  // Step 5: Route Assignment
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("");
  const [isRequestingRoute, setIsRequestingRoute] = useState(false);
  const [requestOriginCity, setRequestOriginCity] = useState("");
  const [requestDestinationCity, setRequestDestinationCity] = useState("");
  const [requestViaStops, setRequestViaStops] = useState("");

  const resetForm = () => {
    setStep(1);
    setBusName(""); setBusNumber(""); setBusType("DELUXE"); setVehicleType("bus"); setRegistrationYear(""); setSelectedAmenityIds([]);
    setSeatConfig(null); setTotalSeats(0);
    setImageFront(null); setImageBack(null); setImageSide(null); setImageInside(null);
    setFitnessCert(null); setFitnessCertValidTill("");
    setInsurance(null); setInsurancePolicyNumber(""); setInsuranceValidTill("");
    setBluebook(null); setRoutePermit(null); setRoutePermitValidTill("");
    setSelectedCorridorId("");
    setIsRequestingRoute(false);
    setRequestOriginCity("");
    setRequestDestinationCity("");
    setRequestViaStops("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!busName || !busNumber || !registrationYear) {
        toast.error("Please fill all required fields in Step 1.");
        return;
      }
    }
    if (step === 2) {
      if (!seatConfig || totalSeats === 0) {
        toast.error("Please configure the seat map before continuing.");
        return;
      }
    }
    if (step === 3) {
      if (!imageFront || !imageBack || !imageSide || !imageInside) {
        toast.error("Please upload all 4 required bus images.");
        return;
      }
    }
    if (step === 4) {
      if (!fitnessCert || !insurance || !bluebook || !routePermit) {
        toast.error("Please upload all 4 required legal documents.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fitnessCert || !insurance || !bluebook || !routePermit) {
      toast.error("Please upload all 4 required legal documents.");
      return;
    }

    const formData = new FormData();
    formData.append("busName", busName);
    formData.append("busNumber", busNumber);
    formData.append("busType", busType);
    formData.append("totalSeats", String(totalSeats));
    formData.append("seatConfig", JSON.stringify(seatConfig));
    formData.append("vehicleType", vehicleType);
    formData.append("registrationYear", registrationYear);
    formData.append("ownerId", ownerId);
    if (brandId) {
      formData.append("brandId", brandId);
    }
    if (selectedAmenityIds.length > 0) {
      formData.append("amenityIds", JSON.stringify(selectedAmenityIds));
    }
    
    if (isRequestingRoute && requestOriginCity && requestDestinationCity) {
      formData.append("requestOriginCity", requestOriginCity);
      formData.append("requestDestinationCity", requestDestinationCity);
      if (requestViaStops) formData.append("requestViaStops", requestViaStops);
    } else if (selectedCorridorId) {
      formData.append("corridorId", selectedCorridorId);
    }

    if (fitnessCertValidTill) formData.append("fitnessCertValidTill", fitnessCertValidTill);
    if (insurancePolicyNumber) formData.append("insurancePolicyNumber", insurancePolicyNumber);
    if (insuranceValidTill) formData.append("insuranceValidTill", insuranceValidTill);
    if (routePermitValidTill) formData.append("routePermitValidTill", routePermitValidTill);
    if (imageFront) formData.append("imageFront", imageFront);
    if (imageBack) formData.append("imageBack", imageBack);
    if (imageSide) formData.append("imageSide", imageSide);
    if (imageInside) formData.append("imageInside", imageInside);
    if (fitnessCert) formData.append("fitnessCert", fitnessCert);
    if (insurance) formData.append("insurance", insurance);
    if (bluebook) formData.append("bluebook", bluebook);
    if (routePermit) formData.append("routePermit", routePermit);

    try {
      await createMutation.mutateAsync(formData);
      resetForm();
      onClose();
    } catch (error) { /* handled by mutation */ }
  };

  const handleClose = () => { resetForm(); onClose(); };

  const STEPS = [
    { id: 1, label: "Details",   icon: Bus },
    { id: 2, label: "Seat Map",  icon: LayoutGridIcon },
    { id: 3, label: "Images",    icon: ImageIcon },
    { id: 4, label: "Documents", icon: FileText },
    { id: 5, label: "Route",     icon: Route },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-muted/10 border-b relative">
      <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-muted -z-10 -translate-y-1/2" />
      {STEPS.map((s) => (
        <div key={s.id} className="flex flex-col items-center gap-1.5 bg-background px-2 z-10">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors", step >= s.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-muted")}>
            {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= s.id ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
          "flex flex-col p-0 overflow-hidden border-2 shadow-2xl transition-all duration-300",
          step === 2
            ? "max-w-[95vw] w-[95vw] h-[95vh]"
            : "sm:max-w-[800px] h-[92vh]"
        )}>
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Register New Fleet</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Complete the 5-step onboarding process</p>
            </div>
          </div>
        </DialogHeader>

        {renderStepIndicator()}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0 px-6 pt-4 pb-2">
            <div className="pr-2 space-y-6 pb-6">

              {/* STEP 1: Core Bus Details */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="busName" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Name</Label>
                      <Input id="busName" placeholder="e.g. Himalayan Express" className="h-11 font-bold bg-muted/30 border-2" value={busName} onChange={(e) => setBusName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="busNumber" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Number Plate</Label>
                      <Input id="busNumber" placeholder="e.g. BA 3 KHA 1234" className="h-11 font-bold bg-muted/30 border-2 uppercase" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-muted/10 p-4 rounded-xl border border-muted">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Class</Label>
                      <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none" value={busType} onChange={(e) => setBusType(e.target.value)} required>
                        <option value="AC">AC</option><option value="NON_AC">NON_AC</option><option value="DELUXE">DELUXE</option><option value="SLEEPER">SLEEPER</option><option value="SEMI_SLEEPER">SEMI_SLEEPER</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Vehicle Type</Label>
                      <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
                        <option value="bus">Bus</option><option value="hiace">Hiace</option><option value="minibus">Minibus</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Reg. Year</Label>
                      <Input type="number" placeholder="2022" className="h-11 font-bold bg-background border-2" value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value)} required />
                    </div>
                  </div>

                  {/* Amenities Multi-Select */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                      Amenities
                      {selectedAmenityIds.length > 0 && (
                        <span className="ml-2 normal-case font-medium text-primary/60">{selectedAmenityIds.length} selected</span>
                      )}
                    </Label>
                    {globalAmenities.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-3 border-2 border-dashed rounded-xl">
                        No amenities in the catalog yet. Add some from the Amenities Catalog page first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-3 border-2 border-muted rounded-xl bg-muted/20 max-h-36 overflow-y-auto">
                        {globalAmenities.map((a: any) => {
                          const isSelected = selectedAmenityIds.includes(a._id);
                          return (
                            <button
                              key={a._id}
                              type="button"
                              onClick={() =>
                                setSelectedAmenityIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== a._id) : [...prev, a._id]
                                )
                              }
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-background text-muted-foreground border-muted hover:border-primary/40 hover:text-foreground"
                              )}
                            >
                              {isSelected && <span className="text-[10px]">✓</span>}
                              {a.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Seat Map Builder */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                      <LayoutGridIcon className="w-4 h-4" /> Visual Seat Layout Designer
                    </h4>
                    <p className="text-xs text-muted-foreground">Choose a template or build your own seat map from scratch. Click any seat on the canvas to change its type.</p>
                    {totalSeats > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <span className="text-xs font-black text-primary">{totalSeats} Seats Configured</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-muted border">
                          <span className="text-xs font-black text-muted-foreground">{seatConfig?.busShape?.replace("_", " ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <SeatMapBuilder
                    value={seatConfig}
                    onChange={(cfg, total) => { setSeatConfig(cfg); setTotalSeats(total); }}
                    busType={busType}
                  />
                </div>
              )}

              {/* STEP 3: Images */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1"><ImageIcon className="w-4 h-4" /> Exterior & Interior Verification</h4>
                    <p className="text-xs text-muted-foreground">Upload clear, recent images of the vehicle from all angles.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { id: "front", label: "Front View", state: imageFront, setter: setImageFront },
                      { id: "back", label: "Back View", state: imageBack, setter: setImageBack },
                      { id: "side", label: "Side View", state: imageSide, setter: setImageSide },
                      { id: "inside", label: "Interior View", state: imageInside, setter: setImageInside }
                    ].map((img) => (
                      <div key={img.id} className="space-y-2 p-4 bg-background border-2 border-dashed rounded-xl hover:bg-muted/50 transition-colors">
                        <Label htmlFor={`img_${img.id}`} className="text-[10px] font-black uppercase tracking-widest">{img.label}</Label>
                        <Input id={`img_${img.id}`} type="file" accept="image/*" onChange={(e) => img.setter(e.target.files?.[0] || null)} className="font-bold border-none h-auto p-0 file:bg-primary/10 file:text-primary file:font-black file:uppercase file:text-[10px] file:py-1 file:px-3 file:rounded-lg hover:file:bg-primary/20 cursor-pointer" required={!img.state} />
                        {img.state && <p className="text-xs text-emerald-600 font-bold truncate">✓ {img.state.name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Legal Documents */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> Legal Compliance</h4>
                    <p className="text-xs text-amber-700/80">All documents are required for platform compliance. Fleet will not be approved without valid documents.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/10 border rounded-xl grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Fitness Certificate</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setFitnessCert(e.target.files?.[0] || null)} required={!fitnessCert} />
                        {fitnessCert && <p className="text-xs text-emerald-600 font-bold truncate">✓ {fitnessCert.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Valid Till</Label>
                        <Input type="date" value={fitnessCertValidTill} onChange={(e) => setFitnessCertValidTill(e.target.value)} required />
                      </div>
                    </div>
                    <div className="p-4 bg-muted/10 border rounded-xl grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Insurance Doc</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setInsurance(e.target.files?.[0] || null)} required={!insurance} />
                        {insurance && <p className="text-xs text-emerald-600 font-bold truncate">✓ {insurance.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Policy Number</Label>
                        <Input placeholder="Policy #" value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Valid Till</Label>
                        <Input type="date" value={insuranceValidTill} onChange={(e) => setInsuranceValidTill(e.target.value)} required />
                      </div>
                    </div>
                    <div className="p-4 bg-muted/10 border rounded-xl grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Route Permit</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setRoutePermit(e.target.files?.[0] || null)} required={!routePermit} />
                        {routePermit && <p className="text-xs text-emerald-600 font-bold truncate">✓ {routePermit.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Valid Till</Label>
                        <Input type="date" value={routePermitValidTill} onChange={(e) => setRoutePermitValidTill(e.target.value)} required />
                      </div>
                    </div>
                    <div className="p-4 bg-muted/10 border rounded-xl">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Bluebook (Vehicle Registration)</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setBluebook(e.target.files?.[0] || null)} required={!bluebook} />
                        {bluebook && <p className="text-xs text-emerald-600 font-bold truncate">✓ {bluebook.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* STEP 5: Route Assignment */}
              {step === 5 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                      <Route className="w-4 h-4" /> Assign a Route
                    </h4>
                    <p className="text-xs text-muted-foreground">Select which platform corridor this bus will operate on, or request a new route if it doesn't exist.</p>
                  </div>

                  <div className="flex bg-muted/30 p-1 rounded-xl">
                    <button type="button" onClick={() => setIsRequestingRoute(false)}
                      className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-all", !isRequestingRoute ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                      Select Existing Route
                    </button>
                    <button type="button" onClick={() => setIsRequestingRoute(true)}
                      className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-all", isRequestingRoute ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                      Request New Route
                    </button>
                  </div>

                  {isRequestingRoute ? (
                    <div className="space-y-4 p-5 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="mb-2">
                        <p className="text-sm font-black text-primary">Request a New Corridor</p>
                        <p className="text-xs text-muted-foreground mt-0.5">We will review your request and set up the route in the platform registry. Your fleet will remain "Pending Route Assignment" until approved.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Origin City *</Label>
                          <Input placeholder="e.g. Kathmandu" value={requestOriginCity} onChange={(e) => setRequestOriginCity(e.target.value)} required={isRequestingRoute} className="font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination City *</Label>
                          <Input placeholder="e.g. Pokhara" value={requestDestinationCity} onChange={(e) => setRequestDestinationCity(e.target.value)} required={isRequestingRoute} className="font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Major Via Stops (Optional)</Label>
                        <Input placeholder="e.g. Muglin, Damauli" value={requestViaStops} onChange={(e) => setRequestViaStops(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground/60">Comma separated list of major towns along the way</p>
                      </div>
                    </div>
                  ) : (
                    corridorsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/10">
                        <Route className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-black text-muted-foreground">No Corridors Found</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">There are no routes available in the platform registry yet.</p>
                        <Button variant="link" onClick={() => setIsRequestingRoute(true)} className="text-[10px] font-bold text-primary mt-3 uppercase tracking-widest">Request a new route instead</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Skip option */}
                        <button type="button" onClick={() => setSelectedCorridorId("")}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                            selectedCorridorId === ""
                              ? "border-muted bg-muted/20 text-muted-foreground"
                              : "border-dashed border-muted hover:bg-muted/10 text-muted-foreground/60"
                          )}>
                          <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                            selectedCorridorId === "" ? "border-muted-foreground" : "border-muted")}>
                            {selectedCorridorId === "" && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                          </div>
                          <span className="text-xs font-bold">Skip — assign route later</span>
                        </button>

                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {corridorsList.map((corridor: any) => {
                            const isSelected = selectedCorridorId === corridor._id;
                            return (
                              <button key={corridor._id} type="button" onClick={() => setSelectedCorridorId(corridor._id)}
                                className={cn(
                                  "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all group",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                    : "border-muted hover:border-primary/30 hover:bg-muted/20"
                                )}>
                                <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                                  isSelected ? "border-primary" : "border-muted group-hover:border-primary/50")}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-in zoom-in duration-200" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn("font-black text-sm", isSelected ? "text-primary" : "text-foreground")}>
                                      {corridor.originId?.name} <span className="text-muted-foreground mx-1 font-normal">to</span> {corridor.destinationId?.name}
                                    </p>
                                  </div>
                                  <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase">{corridor.code}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 animate-in zoom-in duration-200" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-muted/20 border-t flex justify-between flex-shrink-0">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="font-bold h-11"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
            ) : (
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-bold h-11 text-muted-foreground hover:text-foreground">Cancel</Button>
              </DialogClose>
            )}
            {step < 5 ? (
              <Button type="submit" className="font-bold h-11 px-8">Next Step <ChevronRight className="w-4 h-4 ml-2" /></Button>
            ) : (
              <Button type="submit" className="font-black uppercase tracking-widest text-xs h-11 px-8 shadow-lg shadow-primary/20 hover:tracking-[0.1em] transition-all" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Processing..." : "Complete Registration"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Inline icon for step indicator (avoids extra import)
const LayoutGridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
  </svg>
);

export default CreateOwnerFleetModal;
