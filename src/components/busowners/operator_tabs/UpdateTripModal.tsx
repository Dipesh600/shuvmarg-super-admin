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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Bus, MapPin, LayoutGrid, Info, CreditCard, Repeat, Edit, Loader2 } from "lucide-react";
import { useFetchTripById, useUpdateTrip } from "@/hooks/useTrips";
import { useFetchOwnerFleets } from "@/hooks/useOwnerFleets";
import { useFetchBusRoutesByOwner } from "@/hooks/useBusRoutes";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";

interface UpdateTripModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

const UpdateTripModal: React.FC<UpdateTripModalProps> = (props) => (
  <UpdateTripModalInstance key={props.isOpen ? `open-${props.id || "new"}` : "closed"} {...props} />
);

const UpdateTripModalInstance: React.FC<UpdateTripModalProps> = ({
  id, 
  isOpen, 
  onClose, 
  ownerId 
}) => {
  const { data: tripResponse, isLoading, refetch } = useFetchTripById(id || "");
  const updateMutation = useUpdateTrip(id || "");
  
  // Fetch data for dropdowns
  const { data: fleetsData } = useFetchOwnerFleets(ownerId);
  const { data: routesData } = useFetchBusRoutesByOwner(ownerId);

  const activeFleets = fleetsData?.data?.filter((fleet) => fleet.status === "ACTIVE") || [];
  const routesRows = routesData?.data || [];

  // Form states
  const [busId, setBusId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [tripDate, setTripDate] = useState<Date | undefined>(undefined);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [shift, setShift] = useState("day");
  const [tripFare, setTripFare] = useState("");
  const [recurrence, setRecurrence] = useState("daily");
  const [autoGenerateUntil, setAutoGenerateUntil] = useState<Date | undefined>(undefined);
  const [syncedData, setSyncedData] = useState<unknown>(null);

  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  if (tripResponse?.data && isOpen && syncedData !== tripResponse.data) {
      setSyncedData(tripResponse.data);
      const d = tripResponse.data;
      setBusId(d.busId?._id || d.busId || "");
      setRouteId(d.routeId?._id || d.routeId || "");
      setTripDate(d.tripDate ? parseISO(d.tripDate) : undefined);
      setDepartureTime(d.departureTime || "");
      setArrivalTime(d.arrivalTime || "");
      setShift(d.shift || "day");
      setTripFare(d.tripFare?.toString() || "");
      setRecurrence(d.recurrence || "daily");
      setAutoGenerateUntil(d.autoGenerateUntil ? parseISO(d.autoGenerateUntil) : undefined);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        busId,
        routeId,
        tripDate: tripDate ? format(tripDate, "yyyy-MM-dd") : "",
        departureTime,
        arrivalTime,
        shift,
        tripFare: Number(tripFare),
        recurrence,
        autoGenerateUntil: autoGenerateUntil ? format(autoGenerateUntil, "yyyy-MM-dd") : ""
      });
      onClose();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <Edit className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Modify Trip Schedule</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Update existing departure and fleet assignments</p>
             </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 flex-1">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">Restructuring Trip Context...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6 pr-2 mt-4">
                
                {/* Primary Associations */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="busIdUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><Bus className="h-3 w-3" /> Assigned Fleet</Label>
                    <select 
                      id="busIdUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold" 
                      value={busId}
                      onChange={(e) => setBusId(e.target.value)}
                      required
                    >
                      <option value="">Select ACTIVE Fleet</option>
                      {activeFleets.map((fleet) => (
                        <option key={fleet._id} value={fleet._id}>{fleet.busName} ({fleet.busNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeIdUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><MapPin className="h-3 w-3" /> Designated Route</Label>
                    <select 
                      id="routeIdUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold" 
                      value={routeId}
                      onChange={(e) => setRouteId(e.target.value)}
                      required
                    >
                      <option value="">Select Route</option>
                      {routesRows.map((route) => (
                        <option key={route._id} value={route._id}>{route.routeName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timing & Shift */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/10 p-4 rounded-xl border border-muted">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="tripDateUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                    <DatePicker 
                      date={tripDate}
                      setDate={setTripDate}
                      placeholder="Select Date"
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="shiftUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Shift</Label>
                    <select 
                      id="shiftUp"
                      className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold" 
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                    >
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="departureTimeUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Departure</Label>
                    <Input 
                      id="departureTimeUp"
                      placeholder="e.g. 4PM" 
                      className="h-11 font-bold bg-background border-2 uppercase" 
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="arrivalTimeUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Arrival</Label>
                    <Input 
                      id="arrivalTimeUp"
                      placeholder="e.g. 7AM" 
                      className="h-11 font-bold bg-background border-2 uppercase" 
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {/* Fare & Template */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tripFareUp" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><CreditCard className="h-3 w-3" /> Ticket Fare (Rs.)</Label>
                    <Input 
                      id="tripFareUp"
                      type="number"
                      placeholder="e.g. 1200" 
                      className="h-11 font-bold bg-muted/30 border-2" 
                      value={tripFare}
                      onChange={(e) => setTripFare(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Trip seat layout</Label>
                    <div className="flex min-h-11 items-center rounded-md border-2 border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-800">Captured from the fleet when this trip was created</div>
                    <p className="text-[10px] text-muted-foreground">The physical map is an immutable trip snapshot. Changing the fleet later does not rewrite this trip.</p>
                  </div>
                </div>

                {/* Recurrence Settings */}
                <Card className="border-2 border-dashed border-primary/20 bg-primary/5 p-4 space-y-4 shadow-none">
                   <div className="flex items-center gap-2 mb-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary">Recurrence Rules</h4>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceUp" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequency</Label>
                        <select 
                          id="recurrenceUp"
                          className="flex h-11 w-full rounded-md border-2 border-primary/10 bg-background px-3 py-2 text-sm font-bold" 
                          value={recurrence}
                          onChange={(e) => setRecurrence(e.target.value)}
                        >
                          <option value="none">One Time</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoGenerateUntilUp" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Repeat Until</Label>
                        <DatePicker 
                          date={autoGenerateUntil}
                          setDate={setAutoGenerateUntil}
                          placeholder="End Date"
                        />
                      </div>
                   </div>
                </Card>

              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-muted/20 gap-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 border-2 border-transparent hover:bg-destructive/5 hover:text-destructive">Discard</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="font-black uppercase tracking-widest text-xs h-12 flex-[2] transition-all hover:tracking-[0.1em]"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Applying Changes..." : "Update Schedule"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTripModal;
