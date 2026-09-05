import React, { useEffect, useMemo, useState } from "react";
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
import { Bus, Image as ImageIcon, FileText, ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2, Route, Loader2, ClipboardCheck } from "lucide-react";
import { useCreateOwnerFleet } from "@/hooks/useOwnerFleets";
import { useFetchAllCorridors } from "@/hooks/usePlatformRegistry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { getBrandsByOwner } from "@/api/operatorBrandApi";
import { notifyAdminCreatedFleet, saveFleetRouteSetupByAdmin, updateFleetByAdmin, uploadFleetDocumentByAdmin } from "@/api/busOwnerFleetApi";
import { getAvailableVariants, getVariantStopsWithConfig, type AvailableOperatorVariant, type OperatorRouteStop } from "@/api/platformRegistryApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import AdminFleetSeatLayoutStep from "@/features/admin-fleet-seat-layout/AdminFleetSeatLayoutStep";
import { persistFleetLayoutChoice } from "@/features/admin-fleet-seat-layout/persistFleetLayoutChoice";
import type { AdminFleetLayoutChoice } from "@/features/admin-fleet-seat-layout/types";
import {
  deleteAdminFleetDraft,
  hasMeaningfulAdminFleetDraft,
  loadAdminFleetDraft,
  saveAdminFleetDraft,
  type AdminFleetDraft,
} from "@/features/admin-fleet-drafts/adminFleetDraftStorage";

interface CreateOwnerFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  brandId?: string;
}

interface AmenityOption {
  _id: string;
  name: string;
}

interface CorridorOption {
  _id: string;
  code: string;
  originId?: { name?: string };
  destinationId?: { name?: string };
}

interface OperatorBrandOption {
  _id: string;
  brandName: string;
  brandCode?: string;
  isDefault?: boolean;
  status: string;
}

function getFleetErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === "string") return response.data.message;
  }
  return error instanceof Error ? error.message : "Fleet seat layout could not be saved.";
}

function isCurrentOrFutureDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const selected = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(selected.getTime()) && selected >= today;
}

function routeRequestStops(value: string): string[] {
  return value.split(",").map((stop) => stop.trim()).filter(Boolean);
}

function dateInputValue(value: string): Date | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateStorageValue(value?: Date): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CreateOwnerFleetModal: React.FC<CreateOwnerFleetModalProps> = ({
  isOpen,
  onClose,
  ownerId,
  brandId
}) => {
  const createMutation = useCreateOwnerFleet();
  const queryClient = useQueryClient();
  const { data: corridorsData } = useFetchAllCorridors();
  const { data: globalAmenitiesData } = useQuery({
    queryKey: ["availableAmenities", ownerId],
    queryFn: async () => { const { data } = await api.get(`/amenities/owner/${ownerId}`); return data; },
    enabled: Boolean(isOpen && ownerId),
    staleTime: 60_000,
  });

  const {
    data: brandsData,
    isLoading: isLoadingBrands,
    isError: isBrandsError,
    refetch: refetchBrands,
  } = useQuery({
    queryKey: ["ownerBrands", ownerId],
    queryFn: async () => {
      const res = await getBrandsByOwner(ownerId);
      return (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])) as OperatorBrandOption[];
    },
    enabled: Boolean(isOpen && ownerId),
    staleTime: 30_000,
  });

  const globalAmenities = (Array.isArray(globalAmenitiesData?.data) ? globalAmenitiesData.data : []) as AmenityOption[];
  const corridorsList = (Array.isArray(corridorsData?.data) ? corridorsData.data : []) as CorridorOption[];
  const ownerBrands = useMemo(() => brandsData || [], [brandsData]);

  const [step, setStep] = useState(1);

  // Step 1: Core Details
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brandId || "");
  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("DELUXE");
  const [vehicleType, setVehicleType] = useState("bus");
  const [registrationYear, setRegistrationYear] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Step 2: Seat Map
  const [seatLayoutChoice, setSeatLayoutChoice] = useState<AdminFleetLayoutChoice | null>(null);
  const totalSeats = seatLayoutChoice?.totalPlaces || 0;
  const [createdFleetId, setCreatedFleetId] = useState<string | null>(null);

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
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [servedStopIds, setServedStopIds] = useState<string[]>([]);
  const [isRequestingRoute, setIsRequestingRoute] = useState(false);
  const [requestOriginCity, setRequestOriginCity] = useState("");
  const [requestDestinationCity, setRequestDestinationCity] = useState("");
  const [requestViaStops, setRequestViaStops] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: routeVariantsData, isLoading: isLoadingRouteVariants } = useQuery({
    queryKey: ["admin-fleet-route-variants", selectedBrandId, selectedCorridorId],
    queryFn: () => getAvailableVariants(selectedBrandId, undefined, selectedCorridorId),
    enabled: Boolean(isOpen && selectedBrandId && selectedCorridorId && !isRequestingRoute),
  });
  const routeVariants = (routeVariantsData?.data || []) as AvailableOperatorVariant[];
  const effectiveVariantId = selectedVariantId || routeVariants[0]?._id || "";
  const selectedVariant = routeVariants.find((variant) => variant._id === effectiveVariantId);
  const { data: routeStopsData, isLoading: isLoadingRouteStops } = useQuery({
    queryKey: ["admin-fleet-route-stops", selectedBrandId, effectiveVariantId],
    queryFn: () => getVariantStopsWithConfig(selectedBrandId, effectiveVariantId),
    enabled: Boolean(isOpen && effectiveVariantId && !isRequestingRoute),
  });
  const routeStops = (routeStopsData?.data || []) as OperatorRouteStop[];
  const serverSelectedStopIds = routeStops.filter((stop) => stop.isActive).map((stop) => stop.stopId._id);
  const effectiveServedStopIds = servedStopIds.length
    ? servedStopIds
    : serverSelectedStopIds.length >= 2
      ? serverSelectedStopIds
      : routeStops.length >= 2
        ? [routeStops[0].stopId._id, routeStops[routeStops.length - 1].stopId._id]
        : [];

  useEffect(() => {
    if (!isOpen) {
      setDraftHydrated(false);
      return;
    }
    let active = true;
    void loadAdminFleetDraft(ownerId, brandId).then((saved) => {
      if (!active) return;
      if (saved) {
        setStep(saved.step);
        setSelectedBrandId(saved.brandId || brandId || "");
        setBusName(saved.busName); setBusNumber(saved.busNumber);
        setBusType(saved.busType); setVehicleType(saved.vehicleType); setRegistrationYear(saved.registrationYear);
        setSelectedAmenityIds(saved.selectedAmenityIds); setSeatLayoutChoice(saved.seatLayoutChoice);
        setCreatedFleetId(saved.createdFleetId); setImageFront(saved.files.imageFront); setImageBack(saved.files.imageBack);
        setImageSide(saved.files.imageSide); setImageInside(saved.files.imageInside);
        setFitnessCert(saved.files.fitnessCert); setFitnessCertValidTill(saved.fitnessCertValidTill);
        setInsurance(saved.files.insurance); setInsurancePolicyNumber(saved.insurancePolicyNumber);
        setInsuranceValidTill(saved.insuranceValidTill); setBluebook(saved.files.bluebook);
        setRoutePermit(saved.files.routePermit); setRoutePermitValidTill(saved.routePermitValidTill);
        setSelectedCorridorId(saved.selectedCorridorId); setIsRequestingRoute(saved.isRequestingRoute);
        setSelectedVariantId(saved.selectedVariantId || ""); setServedStopIds(saved.servedStopIds || []);
        setRequestOriginCity(saved.requestOriginCity); setRequestDestinationCity(saved.requestDestinationCity);
        setRequestViaStops(saved.requestViaStops); setDraftSaved(true);
      }
      setDraftHydrated(true);
    }).catch(() => {
      if (active) setDraftHydrated(true);
    });
    return () => { active = false; };
  }, [isOpen, ownerId, brandId]);

  useEffect(() => {
    if (!selectedBrandId && ownerBrands.length > 0) {
      const defaultActive = ownerBrands.find((b) => b.isDefault && b.status === "ACTIVE");
      const firstActive = ownerBrands.find((b) => b.status === "ACTIVE");
      const target = defaultActive || firstActive;
      if (target) {
        setSelectedBrandId(target._id);
      }
    }
  }, [selectedBrandId, ownerBrands]);

  useEffect(() => {
    if (!isOpen || !draftHydrated) return;
    const value: AdminFleetDraft = {
      step, brandId: selectedBrandId, busName, busNumber, busType, vehicleType, registrationYear, selectedAmenityIds,
      seatLayoutChoice, createdFleetId, fitnessCertValidTill, insurancePolicyNumber,
      insuranceValidTill, routePermitValidTill, selectedCorridorId, selectedVariantId, servedStopIds, isRequestingRoute,
      requestOriginCity, requestDestinationCity, requestViaStops,
      files: { imageFront, imageBack, imageSide, imageInside, fitnessCert, insurance, bluebook, routePermit },
    };
    const timer = window.setTimeout(() => {
      if (hasMeaningfulAdminFleetDraft(value)) {
        void saveAdminFleetDraft(ownerId, brandId, value).then(() => setDraftSaved(true));
      } else {
        void deleteAdminFleetDraft(ownerId, brandId).then(() => setDraftSaved(false));
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isOpen, draftHydrated, ownerId, brandId, step, selectedBrandId, busName, busNumber, busType,
    vehicleType, registrationYear, selectedAmenityIds, seatLayoutChoice, createdFleetId,
    imageFront, imageBack, imageSide, imageInside, fitnessCert, fitnessCertValidTill,
    insurance, insurancePolicyNumber, insuranceValidTill, bluebook, routePermit,
    routePermitValidTill, selectedCorridorId, selectedVariantId, servedStopIds, isRequestingRoute,
    requestOriginCity, requestDestinationCity, requestViaStops]);

  const resetForm = () => {
    setDraftSaved(false);
    setStep(1);
    setSelectedBrandId(brandId || "");
    setBusName(""); setBusNumber(""); setBusType("DELUXE"); setVehicleType("bus"); setRegistrationYear(""); setSelectedAmenityIds([]);
    setSeatLayoutChoice(null); setCreatedFleetId(null);
    setImageFront(null); setImageBack(null); setImageSide(null); setImageInside(null);
    setFitnessCert(null); setFitnessCertValidTill("");
    setInsurance(null); setInsurancePolicyNumber(""); setInsuranceValidTill("");
    setBluebook(null); setRoutePermit(null); setRoutePermitValidTill("");
    setSelectedCorridorId("");
    setSelectedVariantId("");
    setServedStopIds([]);
    setIsRequestingRoute(false);
    setRequestOriginCity("");
    setRequestDestinationCity("");
    setRequestViaStops("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedBrandId) {
        toast.error("Select an active operator brand.");
        return;
      }
      const chosenBrand = ownerBrands.find((b) => b._id === selectedBrandId);
      if (!chosenBrand || chosenBrand.status !== "ACTIVE") {
        toast.error("Select a valid, active operator brand.");
        return;
      }
      if (!busName || !busNumber || !registrationYear) {
        toast.error("Please fill all required fields in Step 1.");
        return;
      }
      const year = Number(registrationYear);
      if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) {
        toast.error("Enter a valid registration year.");
        return;
      }
    }
    if (step === 2) {
      if (!seatLayoutChoice || totalSeats === 0) {
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
      if (insurancePolicyNumber.trim().length < 3) {
        toast.error("Add the insurance policy number.");
        return;
      }
      if (![fitnessCertValidTill, insuranceValidTill, routePermitValidTill].every(isCurrentOrFutureDate)) {
        toast.error("Choose a valid current or future expiry date for fitness, insurance and route permit.");
        return;
      }
    }
    if (step === 5) {
      if (isRequestingRoute && (!requestOriginCity.trim() || !requestDestinationCity.trim())) {
        toast.error("Add both cities for the new route request.");
        return;
      }
      if (!isRequestingRoute) {
        const firstStopId = routeStops[0]?.stopId._id;
        const lastStopId = routeStops[routeStops.length - 1]?.stopId._id;
        if (!selectedCorridorId || !effectiveVariantId || !firstStopId || !lastStopId
          || effectiveServedStopIds.length < 2 || !effectiveServedStopIds.includes(firstStopId)
          || !effectiveServedStopIds.includes(lastStopId)) {
          toast.error("Choose an approved path and keep its starting and ending stops.");
          return;
        }
      }
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handleSubmit = async () => {
    if (!selectedBrandId) {
      toast.error("Select an active operator brand.");
      return;
    }
    const chosenBrand = ownerBrands.find((b) => b._id === selectedBrandId);
    if (!chosenBrand || chosenBrand.status !== "ACTIVE") {
      toast.error("Select a valid, active operator brand.");
      return;
    }
    if (!fitnessCert || !insurance || !bluebook || !routePermit) {
      toast.error("Please upload all 4 required legal documents.");
      return;
    }
    if (insurancePolicyNumber.trim().length < 3) {
      toast.error("Add the insurance policy number.");
      return;
    }
    if (![fitnessCertValidTill, insuranceValidTill, routePermitValidTill].every(isCurrentOrFutureDate)) {
      toast.error("Choose a valid current or future expiry date for fitness, insurance and route permit.");
      return;
    }
    if (isRequestingRoute && (!requestOriginCity.trim() || !requestDestinationCity.trim())) {
      toast.error("Add both cities for the new route request.");
      return;
    }
    if (!isRequestingRoute) {
      if (!selectedCorridorId || !effectiveVariantId) {
        toast.error("Choose the approved route and road path for this bus.");
        return;
      }
      const firstStopId = routeStops[0]?.stopId._id;
      const lastStopId = routeStops[routeStops.length - 1]?.stopId._id;
      if (!firstStopId || !lastStopId || effectiveServedStopIds.length < 2 || !effectiveServedStopIds.includes(firstStopId) || !effectiveServedStopIds.includes(lastStopId)) {
        toast.error("Keep the starting and ending stops in this bus service.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("brandId", selectedBrandId);
    formData.append("busName", busName);
    formData.append("busNumber", busNumber);
    formData.append("busType", busType);
    formData.append("totalSeats", String(totalSeats));
    formData.append("vehicleType", vehicleType);
    formData.append("registrationYear", registrationYear);
    formData.append("ownerId", ownerId);
    if (selectedAmenityIds.length > 0) {
      formData.append("amenityIds", JSON.stringify(selectedAmenityIds));
    }
    
    if (isRequestingRoute && requestOriginCity && requestDestinationCity) {
      formData.append("requestOriginCity", requestOriginCity);
      formData.append("requestDestinationCity", requestDestinationCity);
      const viaStops = routeRequestStops(requestViaStops);
      if (viaStops.length > 0) formData.append("requestViaStops", JSON.stringify(viaStops));
    } else if (selectedCorridorId) {
      formData.append("corridorId", selectedCorridorId);
    }

    try {
      setIsSubmitting(true);
      let fleetId = createdFleetId;
      if (!fleetId) {
        const created = await createMutation.mutateAsync(formData);
        fleetId = created?.data?._id || created?.data?.id || null;
        if (!fleetId) throw new Error("Fleet was created but its identifier was not returned.");
        setCreatedFleetId(fleetId);
      } else {
        // A previous attempt may have created the server draft before a later
        // document/layout step failed. Persist any edits made before retrying.
        await updateFleetByAdmin(fleetId, formData);
      }
      if (!isRequestingRoute && selectedCorridorId && effectiveVariantId && selectedVariant && routeStops.length >= 2) {
        const selectedStopSet = new Set(effectiveServedStopIds);
        await saveFleetRouteSetupByAdmin(fleetId, {
          brandId: selectedBrandId,
          originStopId: routeStops[0].stopId._id,
          destinationStopId: routeStops[routeStops.length - 1].stopId._id,
          corridorId: selectedCorridorId,
          variantId: effectiveVariantId,
          direction: selectedVariant.direction === "RETURN" ? "RETURN" : "FORWARD",
          servedStops: routeStops
            .filter((stop) => selectedStopSet.has(stop.stopId._id))
            .map((stop, index, selectedStops) => ({
              stopId: stop.stopId._id,
              sequence: stop.sequence ?? index + 1,
              usage: index === 0 ? "PICKUP" as const : index === selectedStops.length - 1 ? "DROP" as const : "BOTH" as const,
              boardingMode: "STOP_FALLBACK" as const,
              boardingLocationIds: [],
              customBoardingPoints: [] as [],
            })),
          returnEnabled: true,
          resolutionStatus: "AVAILABLE",
          unresolvedPlaces: [],
        });
      }
      if (!imageFront || !imageSide || !imageBack || !imageInside) {
        throw new Error("Front, side, back and inside photos are required.");
      }
      await uploadFleetDocumentByAdmin(fleetId, "fleetImages", {
        imageFront, imageSide, imageBack, imageInside,
      });
      await uploadFleetDocumentByAdmin(fleetId, "fitnessCert", { fitnessCert }, {
        validTill: fitnessCertValidTill,
      });
      await uploadFleetDocumentByAdmin(fleetId, "insurance", { insurance }, {
        policyNumber: insurancePolicyNumber,
        validTill: insuranceValidTill,
      });
      await uploadFleetDocumentByAdmin(fleetId, "bluebook", { bluebook });
      await uploadFleetDocumentByAdmin(fleetId, "routePermit", { routePermit }, {
        validTill: routePermitValidTill,
      });
      if (!seatLayoutChoice) throw new Error("A seat layout is required.");
      await persistFleetLayoutChoice({ fleetId, ownerId, busName, choice: seatLayoutChoice });
      try {
        const result = await notifyAdminCreatedFleet(fleetId);
        if (result.notification.status === "DELIVERED") {
          toast.success("Fleet created. The bus owner was informed by SMS.");
        } else {
          toast.warning("Fleet created, but the owner SMS was not delivered.");
        }
      } catch {
        toast.warning("Fleet created, but the owner notification could not be confirmed.");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ownerFleets"] }),
        queryClient.invalidateQueries({ queryKey: ["fleets"] }),
      ]);
      await deleteAdminFleetDraft(ownerId, brandId);
      resetForm();
      onClose();
    } catch (error: unknown) {
      toast.error(getFleetErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { onClose(); };

  const STEPS = [
    { id: 1, label: "Details",   icon: Bus },
    { id: 2, label: "Seats",     icon: LayoutGridIcon },
    { id: 3, label: "Photos",    icon: ImageIcon },
    { id: 4, label: "Documents", icon: FileText },
    { id: 5, label: "Route",     icon: Route },
    { id: 6, label: "Review",    icon: ClipboardCheck },
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
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Add a bus</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{draftSaved ? "Draft saved on this device" : "Add the same details the bus owner would provide"}</p>
            </div>
          </div>
        </DialogHeader>

        {renderStepIndicator()}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 6) {
              void handleSubmit();
            } else {
              handleNext();
            }
          }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <ScrollArea className="flex-1 min-h-0 px-6 pt-4 pb-2">
            <div className="pr-2 space-y-6 pb-6">

              {/* STEP 1: Core Bus Details */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Operator Brand Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="brandId" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                      Operator Brand *
                    </Label>
                    <p className="text-xs text-muted-foreground -mt-1 ml-1">This is the travel brand passengers will see.</p>
                    {isLoadingBrands ? (
                      <div className="flex h-11 items-center rounded-md border-2 border-muted bg-muted/20 px-3 text-xs text-muted-foreground font-bold">
                        Loading operator brands...
                      </div>
                    ) : isBrandsError ? (
                      <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-bold">
                        <span>Failed to load operator brands.</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => refetchBrands()} className="h-7 text-xs">
                          Retry
                        </Button>
                      </div>
                    ) : ownerBrands.filter((b) => b.status === "ACTIVE").length === 0 ? (
                      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 font-bold">
                        No active operator brand is available for this owner. Approve a brand first.
                      </div>
                    ) : (
                      <select
                        id="brandId"
                        className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none"
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        required
                      >
                        <option value="">Select an active operator brand...</option>
                        {ownerBrands.map((b) => (
                          <option key={b._id} value={b._id} disabled={b.status !== "ACTIVE"}>
                            {b.brandName} {b.isDefault ? "(Default)" : ""} {b.status !== "ACTIVE" ? `(${b.status})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

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
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Service Type</Label>
                      <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none" value={busType} onChange={(e) => setBusType(e.target.value)} required>
                        <option value="AC">AC</option><option value="NON_AC">NON_AC</option><option value="DELUXE">DELUXE</option><option value="SLEEPER">SLEEPER</option><option value="SEMI_SLEEPER">SEMI_SLEEPER</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Bus Type</Label>
                      <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
                        <option value="bus">Bus</option><option value="hiace">Hiace</option><option value="minibus">Minibus</option><option value="jeep">Jeep</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Reg. Year</Label>
                      <Input type="number" min="1980" max={new Date().getFullYear() + 1} placeholder="2022" className="h-11 font-bold bg-background border-2" value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value)} required />
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
                        {globalAmenities.map((a) => {
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
                          <span className="text-xs font-black text-muted-foreground">V3 canonical layout</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <AdminFleetSeatLayoutStep
                    value={seatLayoutChoice}
                    onChange={setSeatLayoutChoice}
                    busName={busName}
                    vehicleCategory={vehicleType.toUpperCase() as "BUS" | "MINIBUS" | "HIACE"}
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
                        <DatePicker date={dateInputValue(fitnessCertValidTill)} setDate={(date) => setFitnessCertValidTill(dateStorageValue(date))} placeholder="Choose expiry date" disablePast />
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
                        <DatePicker date={dateInputValue(insuranceValidTill)} setDate={(date) => setInsuranceValidTill(dateStorageValue(date))} placeholder="Choose expiry date" disablePast />
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
                        <DatePicker date={dateInputValue(routePermitValidTill)} setDate={(date) => setRoutePermitValidTill(dateStorageValue(date))} placeholder="Choose expiry date" disablePast />
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
                      <div className="space-y-4">
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {corridorsList.map((corridor) => {
                            const isSelected = selectedCorridorId === corridor._id;
                            return (
                              <button key={corridor._id} type="button" onClick={() => {
                                setSelectedCorridorId(corridor._id);
                                setSelectedVariantId("");
                                setServedStopIds([]);
                              }}
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

                        {selectedCorridorId && (
                          <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Approved road path</Label>
                              <select
                                className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none"
                                value={effectiveVariantId}
                                onChange={(event) => { setSelectedVariantId(event.target.value); setServedStopIds([]); }}
                                disabled={isLoadingRouteVariants}
                              >
                                {routeVariants.length === 0 && <option value="">No approved path available</option>}
                                {routeVariants.map((variant) => <option key={variant._id} value={variant._id}>{variant.name}</option>)}
                              </select>
                            </div>

                            {isLoadingRouteStops ? (
                              <div className="flex items-center gap-2 py-4 text-xs font-bold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading reviewed stops…</div>
                            ) : routeStops.length > 0 ? (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-black">Stops this bus will serve</p>
                                  <p className="text-[10px] text-muted-foreground">The starting and ending stops stay selected. The same selection will appear later in bus setup.</p>
                                </div>
                                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                  {routeStops.map((stop, index) => {
                                    const stopId = stop.stopId._id;
                                    const required = index === 0 || index === routeStops.length - 1;
                                    const selected = effectiveServedStopIds.includes(stopId);
                                    return (
                                      <label key={stop._id} className={cn("flex items-center gap-3 rounded-lg border p-3", selected ? "border-primary/30 bg-background" : "border-muted bg-muted/20", required ? "cursor-default" : "cursor-pointer")}>
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          disabled={required}
                                          onChange={(event) => {
                                            const baseline = new Set(effectiveServedStopIds);
                                            if (event.target.checked) baseline.add(stopId); else baseline.delete(stopId);
                                            setServedStopIds([...baseline]);
                                          }}
                                        />
                                        <span className="flex-1 text-xs font-bold">{stop.stopId.name || "Unnamed stop"}</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground">{required ? "Required" : selected ? "Served" : "Skipped"}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : effectiveVariantId ? (
                              <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs font-bold text-destructive">This approved path has no reviewed stops yet.</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* STEP 6: Review before creating the same fleet record the operator submits */}
              {step === 6 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary"><ClipboardCheck className="h-4 w-4" /> Review bus details</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Check the same information the bus owner would review before submission.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bus</p>
                      <p className="mt-2 font-black">{busName} · {busNumber}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{registrationYear} · {vehicleType} · {busType}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seats & facilities</p>
                      <p className="mt-2 font-black">{totalSeats} passenger seats</p>
                      <p className="mt-1 text-xs text-muted-foreground">{selectedAmenityIds.length} facilities selected</p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Files</p>
                      <p className="mt-2 font-black">4 photos · 4 documents</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">Insurance {insurancePolicyNumber} · valid to {insuranceValidTill}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Route</p>
                      <p className="mt-2 font-black">{isRequestingRoute ? `${requestOriginCity} → ${requestDestinationCity}` : selectedVariant?.name || "Approved path"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{isRequestingRoute ? "New route requested" : `${effectiveServedStopIds.length} served stops selected`}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Nothing is sent until you choose <strong>Add bus</strong>. You can go back to correct any section.</p>
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
            {step < 6 ? (
              <Button type="submit" className="font-bold h-11 px-8">Next Step <ChevronRight className="w-4 h-4 ml-2" /></Button>
            ) : (
              <Button type="submit" className="font-black uppercase tracking-widest text-xs h-11 px-8 shadow-lg shadow-primary/20 hover:tracking-[0.1em] transition-all" disabled={isSubmitting || createMutation.isPending}>
                {isSubmitting || createMutation.isPending ? "Saving bus…" : "Add bus"}
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
