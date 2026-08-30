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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Bus, MapPin, LayoutGrid, Info, CreditCard, Repeat } from "lucide-react";
import { useCreateTrip } from "@/hooks/useTrips";
import { useFetchOwnerFleets } from "@/hooks/useOwnerFleets";
import { useFetchBusRoutesByOwner } from "@/hooks/useBusRoutes";
import { getFleetSeatLayoutAssignment } from "@/api/seatLayoutV3Api";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  ownerId
}) => {
  const createMutation = useCreateTrip();

  // Fetch data for dropdowns
  const { data: fleetsData } = useFetchOwnerFleets(ownerId);
  const { data: routesData } = useFetchBusRoutesByOwner(ownerId);

  // Filter active fleets
  const activeFleets = fleetsData?.data?.filter((fleet) => fleet.status === "ACTIVE") || [];
  const routesRows = routesData?.data || [];

  // Form states
  const [busId, setBusId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [layoutAssignment, setLayoutAssignment] = useState<{ ready: boolean; label: string; places?: number }>({ ready: false, label: "Select a fleet first" });
  const [tripDate, setTripDate] = useState<Date | undefined>(undefined);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [shift, setShift] = useState("day");
  const [tripFare, setTripFare] = useState("");
  const [recurrence, setRecurrence] = useState("daily");
  const [autoGenerateUntil, setAutoGenerateUntil] = useState<Date | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    if (!busId) { setLayoutAssignment({ ready: false, label: "Select a fleet first" }); return () => { active = false; }; }
    setLayoutAssignment({ ready: false, label: "Checking fleet layout…" });
    void getFleetSeatLayoutAssignment(busId).then((value) => {
      if (!active) return;
      setLayoutAssignment(value.assignment
        ? { ready: true, label: value.assignment.template.name || "Published V3 fleet layout", places: value.assignment.activeRevision.totalPlaces }
        : { ready: false, label: "This fleet has no published V3 layout" });
    }).catch(() => { if (active) setLayoutAssignment({ ready: false, label: "Unable to verify the fleet layout" }); });
    return () => { active = false; };
  }, [busId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        busId,
        routeId,
        tripDate: tripDate ? format(tripDate, "yyyy-MM-dd") : "",
        departureTime,
        arrivalTime,
        shift,
        tripFare: Number(tripFare),
        recurrence,
        autoGenerateUntil: autoGenerateUntil ? format(autoGenerateUntil, "yyyy-MM-dd") : "",
        ownerId
      });
      onClose();
      // Reset form
      setBusId("");
      setRouteId("");
      setTripDate(undefined);
      setDepartureTime("");
      setArrivalTime("");
      setTripFare("");
      setAutoGenerateUntil(undefined);
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
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Schedule New Trip</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Define route timing and recurrence rules</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6 pr-2 mt-4">

              {/* Primary Associations */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="busId" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><Bus className="h-3 w-3" /> Assigned Fleet</Label>
                  <select
                    id="busId"
                    className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <Label htmlFor="routeId" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><MapPin className="h-3 w-3" /> Designated Route</Label>
                  <select
                    id="routeId"
                    className="flex h-11 w-full rounded-md border-2 border-muted bg-muted/30 px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <Label htmlFor="tripDate" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                  <DatePicker
                    date={tripDate}
                    setDate={setTripDate}
                    placeholder="Select Date"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="shift" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Shift</Label>
                  <select
                    id="shift"
                    className="flex h-11 w-full rounded-md border-2 border-muted bg-background px-3 py-2 text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="departureTime" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Departure</Label>
                  <Input
                    id="departureTime"
                    placeholder="e.g. 4PM"
                    className="h-11 font-bold bg-background border-2 uppercase"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="arrivalTime" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Arrival</Label>
                  <Input
                    id="arrivalTime"
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
                  <Label htmlFor="tripFare" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><CreditCard className="h-3 w-3" /> Ticket Fare (Rs.)</Label>
                  <Input
                    id="tripFare"
                    type="number"
                    placeholder="e.g. 1200"
                    className="h-11 font-bold bg-muted/30 border-2"
                    value={tripFare}
                    onChange={(e) => setTripFare(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Fleet seat layout</Label>
                  <div className={`flex min-h-11 items-center rounded-md border-2 px-3 text-sm font-bold ${layoutAssignment.ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                    {layoutAssignment.label}{layoutAssignment.places ? ` · ${layoutAssignment.places} places` : ""}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Trips inherit the selected fleet’s published V3 layout. A separate legacy template cannot be attached.</p>
                </div>
              </div>

              {/* Recurrence Settings */}
              <Card className="border-2 border-dashed border-primary/20 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Recurrence Rules</h4>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequency</Label>
                    <select
                      id="recurrence"
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
                    <Label htmlFor="autoGenerateUntil" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Repeat Until</Label>
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
              <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 hover:bg-destructive/5 hover:text-destructive transition-colors border-2 border-transparent">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              className="font-black uppercase tracking-widest text-xs h-12 flex-[2] shadow-lg shadow-primary/20 transition-all hover:tracking-[0.1em]"
              disabled={createMutation.isPending || !layoutAssignment.ready}
            >
              {createMutation.isPending ? "Generating Trips..." : "Finalize Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTripModal;
