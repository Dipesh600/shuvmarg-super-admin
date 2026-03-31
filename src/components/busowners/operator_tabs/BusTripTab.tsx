import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Bus, MapPin, TrendingUp, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const BusTripTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching trips for owner:", ownerId);

  const mockTrips = [
    {
      _id: "1",
      tripId: "TRIP-1773493291698-307",
      busName: "Everest Night Deluxe",
      busNumber: "KO 3 KA 33419",
      route: "Kathmandu to Pokhara",
      tripDate: "2026-03-22",
      departureTime: "5PM",
      arrivalTime: "9AM",
      tripFare: 1200,
      status: "scheduled",
      occupancy: 85
    },
    {
      _id: "2",
      tripId: "TRIP-1773493291700-112",
      busName: "Sakira AC Bus",
      busNumber: "KO 89 PA 83736",
      route: "Pokhara to Butwal",
      tripDate: "2026-03-23",
      departureTime: "10AM",
      arrivalTime: "4PM",
      tripFare: 900,
      status: "completed",
      occupancy: 92
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Active Trips</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Monitor and manage scheduled journeys for this operator</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Create Trip
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {mockTrips.map((trip) => (
          <Card key={trip._id} className="relative overflow-hidden border-2 border-muted hover:border-primary/50 transition-all bg-card shadow-sm h-fit">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black tracking-widest uppercase opacity-70">
                    {trip.tripId}
                  </CardTitle>
                </div>
              </div>
              <Badge variant={trip.status === "scheduled" ? "default" : "secondary"} className="uppercase text-[9px] tracking-widest font-black">
                {trip.status}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center border shadow-inner">
                       <Bus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                       <p className="font-black text-lg tracking-tighter leading-none">{trip.busName}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">{trip.busNumber}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-1">Fare Amount</p>
                    <p className="text-xl font-black text-primary leading-none tracking-tighter">Rs. {trip.tripFare}</p>
                 </div>
              </div>

              <Separator className="opacity-40" />

              <div className="grid grid-cols-2 gap-8 divide-x divide-muted-foreground/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                       <Calendar className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Date</span>
                       <span className="text-xs font-bold">{new Date(trip.tripDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                       <Clock className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Times</span>
                       <span className="text-xs font-bold text-foreground">{trip.departureTime} - {trip.arrivalTime}</span>
                    </div>
                  </div>
                </div>

                <div className="pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                       <MapPin className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Route</span>
                       <span className="text-xs font-bold truncate max-w-[150px]">{trip.route}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                       <Users className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">Occupancy</span>
                       <span className="text-xs font-bold">{trip.occupancy}% Booked</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between items-center group">
                 <Button variant="link" className="p-0 h-auto text-xs font-black uppercase text-primary tracking-widest transition-all group-hover:tracking-[0.15em]">
                    Manage Reservations →
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BusTripTab;
