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
import { Bus, MapPin, Users, Info, Settings, Image as ImageIcon, Loader2 } from "lucide-react";
import { useFetchFleetDetail, useUpdateOwnerFleet } from "@/hooks/useOwnerFleets";
import { useFetchAmenitiesByOwner } from "@/hooks/useAmenities";
import { useFetchBoardingPointsByOwner } from "@/hooks/useBoardingPoints";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  const { data: response, isLoading, isError, refetch } = useFetchFleetDetail(id || "");
  const updateMutation = useUpdateOwnerFleet(id || "");

  const { data: amenitiesData } = useFetchAmenitiesByOwner(ownerId);
  const { data: boardingData } = useFetchBoardingPointsByOwner(ownerId);
  
  const amenitiesList = amenitiesData?.data || [];
  const boardingPointsList = boardingData?.data || [];

  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("DELUXE");
  const [totalSeats, setTotalSeats] = useState("");
  const [seatLayout, setSeatLayout] = useState("2x2");
  const [vehicleType, setVehicleType] = useState("bus");
  const [registrationYear, setRegistrationYear] = useState("");
  const [amenitiesId, setAmenitiesId] = useState("");
  const [boardingPointId, setBoardingPointId] = useState("");
  const [fleetImages, setFleetImages] = useState<FileList | null>(null);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  useEffect(() => {
    if (response?.data && isOpen) {
      const data = response.data;
      setBusName(data.busName || "");
      setBusNumber(data.busNumber || "");
      setBusType(data.busType || "DELUXE");
      setTotalSeats(data.totalSeats?.toString() || "");
      setSeatLayout(data.seatLayout || "2x2");
      setVehicleType(data.vehicleType || "bus");
      setRegistrationYear(data.registrationYear?.toString() || "");
      
      // Handle populated IDs vs string IDs safely
      setAmenitiesId(data.amenitiesId?._id || data.amenitiesId || "");
      setBoardingPointId(data.boardingPointId?._id || data.boardingPointId || "");
      
      setStatus(data.status === "ACTIVE");
      setFleetImages(null);
    }
  }, [response, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const formData = new FormData();
    formData.append("busName", busName);
    formData.append("busNumber", busNumber);
    formData.append("busType", busType);
    formData.append("totalSeats", totalSeats);
    formData.append("seatLayout", seatLayout);
    formData.append("vehicleType", vehicleType);
    formData.append("registrationYear", registrationYear);
    formData.append("status", status ? "ACTIVE" : "INACTIVE");
    
    if (amenitiesId) formData.append("amenitiesId", amenitiesId);
    if (boardingPointId) formData.append("boardingPointId", boardingPointId);

    // Only append images if new ones are selected
    if (fleetImages && fleetImages.length > 0) {
      for (let i = 0; i < fleetImages.length; i++) {
        formData.append("fleetImages", fleetImages[i]);
      }
    }

    try {
      await updateMutation.mutateAsync(formData);
      onClose();
    } catch (error) {
       // Handled by hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFleetImages(e.target.files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
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
              />
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
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
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pt-4">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6 pr-2">
                
                {/* Primary Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="busNameUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Name</Label>
                    <Input 
                      id="busNameUp"
                      placeholder="e.g. Sakira AC Bus" 
                      className="h-11 font-bold bg-muted/30 border-2" 
                      value={busName}
                      onChange={(e) => setBusName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="busNumberUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Bus Number</Label>
                    <Input 
                      id="busNumberUp"
                      placeholder="e.g. KO 89 PA 83736" 
                      className="h-11 font-bold bg-muted/30 border-2 uppercase" 
                      value={busNumber}
                      onChange={(e) => setBusNumber(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/10 p-4 rounded-xl border border-muted">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="busTypeUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Settings className="h-3 w-3" /> Class</Label>
                    <select 
                      id="busTypeUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      value={busType}
                      onChange={(e) => setBusType(e.target.value)}
                      required
                    >
                      <option value="AC">AC</option>
                      <option value="NON_AC">NON_AC</option>
                      <option value="DELUXE">DELUXE</option>
                      <option value="SLEEPER">SLEEPER</option>
                      <option value="SEMI_SLEEPER">SEMI_SLEEPER</option>
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="vehicleTypeUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Bus className="h-3 w-3" /> Vehicle</Label>
                    <select 
                      id="vehicleTypeUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-nowrap" 
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      required
                    >
                      <option value="bus">Bus</option>
                      <option value="hiace">Hiace</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalSeatsUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Seats</Label>
                    <Input 
                      id="totalSeatsUp"
                      type="number"
                      placeholder="32" 
                      className="h-11 font-bold bg-background border-2" 
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seatLayoutUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Layout</Label>
                    <select 
                      id="seatLayoutUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      value={seatLayout}
                      onChange={(e) => setSeatLayout(e.target.value)}
                      required
                    >
                      <option value="2x2">2x2</option>
                      <option value="2x1">2x1</option>
                      <option value="1x1">1x1</option>
                      <option value="3x2">3x2</option>
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="registrationYearUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1">Reg. Year</Label>
                    <Input 
                      id="registrationYearUp"
                      type="number"
                      placeholder="2022" 
                      className="h-11 font-bold bg-background border-2" 
                      value={registrationYear}
                      onChange={(e) => setRegistrationYear(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {/* Associations */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amenitiesIdUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Assigned Amenities Bundle</Label>
                    <select 
                      id="amenitiesIdUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      value={amenitiesId}
                      onChange={(e) => setAmenitiesId(e.target.value)}
                    >
                      <option value="">Select an Amenities Config...</option>
                      {amenitiesList.map((item: any) => (
                        <option key={item._id} value={item._id}>
                          {item._id.slice(-6)} - {item.amenities?.length || 0} Facilities Assigned
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boardingPointIdUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><MapPin className="h-3 w-3" /> Boarding Points Route Config</Label>
                    <select 
                      id="boardingPointIdUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                      value={boardingPointId}
                      onChange={(e) => setBoardingPointId(e.target.value)}
                    >
                      <option value="">Select a Boarding Group...</option>
                      {boardingPointsList.map((item: any) => (
                        <option key={item._id} value={item._id}>
                          {item.city} - {item.description || item._id.slice(-6)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* File Upload Region */}
                <div className="space-y-3 p-5 bg-background border-2 border-dashed border-primary/30 rounded-xl relative hover:bg-primary/5 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="fleetImagesUp" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Replace Fleet Images</Label>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">Optional override</span>
                  </div>
                  
                  {response?.data?.fleetImages && response.data.fleetImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3 pb-3 border-b border-primary/10">
                       {response.data.fleetImages.map((img: string, i: number) => (
                         <div key={i} className="h-10 w-16 bg-muted/50 rounded overflow-hidden shadow border border-muted">
                           <img src={img} alt={`Fleet ${i}`} className="w-full h-full object-cover" />
                         </div>
                       ))}
                       <span className="text-[9px] font-black text-muted-foreground/60 uppercase self-center pl-2">Current</span>
                    </div>
                  )}

                  <Input 
                    id="fleetImagesUp"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="font-bold border-none h-auto p-0 file:bg-primary/10 file:text-primary file:font-black file:uppercase file:tracking-wider file:text-[10px] file:py-2 file:px-4 file:rounded-xl hover:file:bg-primary/20 file:transition-colors file:border-none cursor-pointer" 
                  />
                  <p className="text-[10px] font-medium text-muted-foreground">Uploading files will override the existing image gallery.</p>
                </div>

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
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateOwnerFleetModal;
