import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Bus, Users, Settings, Image as ImageIcon, Loader2, Route, CheckCircle2, LayoutGrid } from "lucide-react";
import { useFetchFleetDetail, useUpdateOwnerFleet } from "@/hooks/useOwnerFleets";
import { useFetchAllCorridors } from "@/hooks/usePlatformRegistry";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getFleetSeatLayoutAssignment } from "@/api/seatLayoutV3Api";

interface UpdateOwnerFleetModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

const UpdateOwnerFleetModal: React.FC<UpdateOwnerFleetModalProps> = ({ 
  id, 
  isOpen, 
  onClose,
  ownerId
}) => {
  const { data: response, isLoading: isFleetLoading, isError, refetch } = useFetchFleetDetail(id || "");
  const updateMutation = useUpdateOwnerFleet(id || "");

  const { data: corridorsData } = useFetchAllCorridors();
  const { data: availableAmenitiesData } = useQuery({
    queryKey: ["amenities", "available", ownerId],
    queryFn: async () => { const { data } = await api.get(`/amenities/owner/${ownerId}`); return data; },
    enabled: isOpen && !!ownerId,
    staleTime: 60_000,
  });

  const availableAmenities: any[] = Array.isArray(availableAmenitiesData?.data) ? availableAmenitiesData.data : [];
  const currentAmenityRecords: any[] = Array.isArray(response?.data?.vehicle?.features)
    ? response.data.vehicle.features
    : Array.isArray(response?.data?.features)
      ? response.data.features
      : Array.isArray(response?.data?.amenityIds) ? response.data.amenityIds.filter((item: unknown) => typeof item === "object" && item !== null) : [];
  const amenityOptions = [...availableAmenities, ...currentAmenityRecords.filter((current) =>
    !availableAmenities.some((item) => String(item._id || item.id) === String(current._id || current.id))
  )];
  const corridorsList: any[] = Array.isArray(corridorsData?.data) ? corridorsData.data : [];

  const [activeTab, setActiveTab] = useState("identity");

  // State
  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("DELUXE");
  const [vehicleType, setVehicleType] = useState("bus");
  const [registrationYear, setRegistrationYear] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [totalSeats, setTotalSeats] = useState(0);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("");
  const [fleetImages, setFleetImages] = useState<FileList | null>(null);
  const [status, setStatus] = useState(true);
  const { data: seatAssignment, isLoading: isSeatAssignmentLoading } = useQuery({
    queryKey: ["seat-layout-v3", "fleet-assignment", id],
    queryFn: () => getFleetSeatLayoutAssignment(id!),
    enabled: isOpen && !!id,
  });

  useEffect(() => {
    if (isOpen && id) {
      refetch();
      setActiveTab("identity");
    }
  }, [isOpen, id, refetch]);

  useEffect(() => {
    if (response?.data && isOpen) {
      const data = response.data;
      setBusName(data.busName || "");
      setBusNumber(data.busNumber || "");
      setBusType(data.busType || "DELUXE");
      setVehicleType(data.vehicleType || "bus");
      setRegistrationYear(data.registrationYear?.toString() || "");
      let parsedAmenities: any[] = [];
      const rawAmenities = data.amenityIds || data.vehicle?.features || data.features;
      if (rawAmenities) {
        try {
          parsedAmenities = typeof rawAmenities === "string" ? JSON.parse(rawAmenities) : rawAmenities;
        } catch (e) { console.error("Failed to parse amenityIds", e); }
      }

      // Ensure amenities is an array of strings, not populated objects
      const normalizedAmenities = Array.isArray(parsedAmenities) 
        ? parsedAmenities.map((a: any) => typeof a === 'object' && a !== null ? (a._id || a.id) : a)
        : [];

      setSelectedAmenityIds(normalizedAmenities);
      setTotalSeats(data.totalSeats || 0);
      setSelectedCorridorId(data.corridorId?._id || data.corridorId || "");
      setStatus(data.status === "ACTIVE");
      setFleetImages(null);
    }
  }, [response, isOpen]);

  const isApproved = response?.data?.approvalStatus === "APPROVED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const formData = new FormData();
    formData.append("busName", busName);
    formData.append("busNumber", busNumber);
    formData.append("busType", busType);
    formData.append("vehicleType", vehicleType);
    formData.append("registrationYear", registrationYear);
    formData.append("status", status ? "ACTIVE" : "INACTIVE");
    
    if (selectedAmenityIds.length > 0) {
      formData.append("amenityIds", JSON.stringify(selectedAmenityIds));
    } else {
      formData.append("amenityIds", JSON.stringify([])); // clear them
    }
    
    if (selectedCorridorId) {
      formData.append("corridorId", selectedCorridorId);
    }

    if (fleetImages && fleetImages.length > 0) {
      for (let i = 0; i < fleetImages.length; i++) {
        formData.append("fleetImages", fleetImages[i]);
      }
    }

    try {
      await updateMutation.mutateAsync(formData);
      onClose();
    } catch {
       // Handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
          "flex flex-col p-0 overflow-hidden border-2 shadow-2xl transition-all duration-300",
          activeTab === "seats"
            ? "max-w-[95vw] w-[95vw] h-[95vh]"
            : "sm:max-w-[800px] h-[92vh]"
        )}>
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                  <Bus className="h-5 w-5 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Modify Fleet Profile</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: {response?.data?.fleetId || "N/A"}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border shadow-inner">
              <span className={`text-[10px] font-black uppercase tracking-widest ${status ? "text-primary" : "text-muted-foreground"}`}>
                {status ? "Active" : "Inactive"}
              </span>
              <Switch 
                checked={status} 
                onCheckedChange={setStatus} 
                disabled={!isApproved}
              />
            </div>
          </div>
          {!isApproved && (
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
              Fleet must be APPROVED to toggle Active status
            </p>
          )}
        </DialogHeader>

        {isFleetLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
            <p className="font-extrabold uppercase tracking-widest text-[10px] text-muted-foreground">Synchronizing data...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-10">
            <p className="text-destructive font-bold mb-4 opacity-70 italic tracking-tighter text-lg">Load failed</p>
            <Button variant="outline" onClick={() => refetch()} className="font-black uppercase tracking-widest h-11 px-10 border-destructive text-destructive hover:bg-destructive/5 transition-all">Retry Synchronization</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 border-b">
                <TabsList className="w-full justify-start h-12 bg-transparent space-x-2">
                  <TabsTrigger value="identity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold px-4"><Bus className="w-4 h-4 mr-2"/> Identity</TabsTrigger>
                  <TabsTrigger value="seats" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold px-4"><LayoutGrid className="w-4 h-4 mr-2"/> Seat Map</TabsTrigger>
                  <TabsTrigger value="amenities" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold px-4"><Users className="w-4 h-4 mr-2"/> Amenities</TabsTrigger>
                  <TabsTrigger value="route" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold px-4"><Route className="w-4 h-4 mr-2"/> Route</TabsTrigger>
                  <TabsTrigger value="gallery" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold px-4"><ImageIcon className="w-4 h-4 mr-2"/> Gallery</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 pt-4 pb-2">
                <div className="pr-2 pb-6">
                  
                  {/* IDENTITY TAB */}
                  <TabsContent value="identity" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                    {isApproved && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                        <p className="text-xs font-bold text-blue-800">Structural details are locked.</p>
                        <p className="text-[10px] text-blue-700 mt-0.5">Because this fleet is approved, structural modifications require a delta-KYC review. Contact support to initiate a modification request.</p>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="busNameUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Name</Label>
                        <Input id="busNameUp" placeholder="e.g. Sakira AC Bus" className="h-11 font-bold bg-muted/30 border-2" value={busName} onChange={(e) => setBusName(e.target.value)} required disabled={isApproved} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="busNumberUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Number</Label>
                        <Input id="busNumberUp" placeholder="e.g. KO 89 PA 83736" className="h-11 font-bold bg-muted/30 border-2 uppercase" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required disabled={isApproved} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-muted/10 p-4 rounded-xl border border-muted">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Settings className="h-3 w-3" /> Class</Label>
                        <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none disabled:opacity-50" value={busType} onChange={(e) => setBusType(e.target.value)} required disabled={isApproved}>
                          <option value="AC">AC</option><option value="NON_AC">NON_AC</option><option value="DELUXE">DELUXE</option><option value="SLEEPER">SLEEPER</option><option value="SEMI_SLEEPER">SEMI_SLEEPER</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Bus className="h-3 w-3" /> Vehicle</Label>
                        <select className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none disabled:opacity-50" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required disabled={isApproved}>
                          <option value="bus">Bus</option><option value="hiace">Hiace</option><option value="minibus">Minibus</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Reg. Year</Label>
                        <Input type="number" placeholder="2022" className="h-11 font-bold bg-background border-2" value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value)} required disabled={isApproved} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* SEATS TAB */}
                  <TabsContent value="seats" className="mt-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1"><LayoutGrid className="w-4 h-4" /> Canonical seat layout</h4>
                      <p className="text-xs text-muted-foreground">Seat geometry is versioned separately from fleet details. Live layouts are never overwritten from this form.</p>
                      {(seatAssignment?.assignment?.activeRevision?.totalPlaces || totalSeats) > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <span className="text-xs font-black text-primary">{seatAssignment?.assignment?.activeRevision?.totalPlaces || totalSeats} passenger places</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border-2 border-dashed p-8 text-center">
                      <p className="font-bold">{isSeatAssignmentLoading ? "Loading seat layout…" : seatAssignment?.assignment ? "V3 layout assigned" : "No V3 layout assigned"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Layout changes use a reviewed revision so existing trips keep their original seat map.</p>
                    </div>
                  </TabsContent>

                  {/* AMENITIES TAB */}
                  <TabsContent value="amenities" className="mt-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                        Selected Amenities
                        {selectedAmenityIds.length > 0 && (
                          <span className="ml-2 normal-case font-medium text-primary/60">{selectedAmenityIds.length} active</span>
                        )}
                      </Label>
                      {amenityOptions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-3 border-2 border-dashed rounded-xl">
                          No amenities in the catalog. Add some from the Amenities Catalog page first.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 p-4 border-2 border-muted rounded-xl bg-muted/10 min-h-36 content-start">
                          {amenityOptions.map((a: any) => {
                            const amenityId = a._id || a.id;
                            const isSelected = selectedAmenityIds.includes(amenityId);
                            return (
                              <button
                                key={amenityId}
                                type="button"
                                onClick={() =>
                                  setSelectedAmenityIds((prev) =>
                                    isSelected ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
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
                                {a.status === false && <span className="opacity-60">(inactive)</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ROUTE TAB */}
                  <TabsContent value="route" className="mt-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                     <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                        <Route className="w-4 h-4" /> Platform Route Assignment
                      </h4>
                      {isApproved ? (
                        <p className="text-xs text-rose-600 font-bold">Route reassignment is locked because this fleet is already APPROVED.</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Select which platform corridor this bus will operate on.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button type="button" onClick={() => !isApproved && setSelectedCorridorId("")}
                        disabled={isApproved}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          selectedCorridorId === ""
                            ? "border-muted bg-muted/20 text-muted-foreground"
                            : "border-dashed border-muted hover:bg-muted/10 text-muted-foreground/60",
                          isApproved && "opacity-60 cursor-not-allowed"
                        )}>
                        <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                          selectedCorridorId === "" ? "border-muted-foreground" : "border-muted")}>
                          {selectedCorridorId === "" && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                        </div>
                        <span className="text-xs font-bold">No Corridor Assigned</span>
                      </button>

                      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {corridorsList.map((corridor: any) => {
                          const isSelected = selectedCorridorId === corridor._id;
                          return (
                            <button key={corridor._id} type="button" onClick={() => !isApproved && setSelectedCorridorId(corridor._id)}
                              disabled={isApproved}
                              className={cn(
                                "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all group",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                  : "border-muted hover:border-primary/30 hover:bg-muted/20",
                                isApproved && "opacity-60 cursor-not-allowed"
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
                  </TabsContent>

                  {/* GALLERY TAB */}
                  <TabsContent value="gallery" className="mt-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 outline-none">
                    <div className="space-y-3 p-5 bg-background border-2 border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="fleetImagesUp" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Replace Fleet Images</Label>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">Override Current</span>
                      </div>
                      
                      {Array.isArray(response?.data?.fleetImages) && response.data.fleetImages.length > 0 && (
                        <div className="flex gap-3 flex-wrap mb-4 pb-4 border-b border-primary/10">
                           {response.data.fleetImages.map((img: string, i: number) => (
                             <div key={i} className="h-20 w-32 bg-muted/50 rounded-lg overflow-hidden shadow-sm border-2 border-muted relative group">
                               <img src={img} alt={`Fleet ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             </div>
                           ))}
                           <span className="text-[10px] font-black text-muted-foreground/60 uppercase self-center pl-2">Current Gallery</span>
                        </div>
                      )}

                      <Input 
                        id="fleetImagesUp"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setFleetImages(e.target.files)}
                        className="font-bold border-none h-auto p-0 file:bg-primary/10 file:text-primary file:font-black file:uppercase file:tracking-wider file:text-[10px] file:py-2 file:px-4 file:rounded-xl hover:file:bg-primary/20 file:transition-colors file:border-none cursor-pointer" 
                      />
                      <p className="text-[10px] font-medium text-muted-foreground">Uploading files will permanently override the existing image gallery.</p>
                    </div>
                  </TabsContent>

                </div>
              </ScrollArea>

              <DialogFooter className="p-6 bg-muted/20 border-t gap-3 flex-shrink-0 mt-auto">
                <DialogClose asChild>
                   <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 hover:bg-destructive/5 hover:text-destructive transition-colors border-2 border-transparent hover:border-destructive/10">Discard Changes</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="font-black uppercase tracking-widest text-xs h-12 flex-[2] shadow-lg shadow-primary/20 transition-all hover:tracking-[0.1em]"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Applying Updates..." : "Save Fleet Details"}
                </Button>
              </DialogFooter>
            </Tabs>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateOwnerFleetModal;
