import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Users, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const FleetTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching fleet for owner:", ownerId);

  const mockFleets = [
    {
      _id: "1",
      fleetId: "SUV-MARG-FLEET-RZE-952",
      busNumber: "KO 89 PA 83736",
      busName: "Sakira AC Bus",
      route: "Kathmandu to Pokhara",
      seatCapacity: 32,
      busType: "DELUXE",
      status: "ACTIVE",
      approvalStatus: "APPROVED"
    },
    {
      _id: "2",
      fleetId: "SUV-MARG-FLEET-GGP-095",
      busNumber: "KO 3 KA 83736",
      busName: "Everest Night Deluxe",
      route: "Not Assigned",
      seatCapacity: 35,
      busType: "LUXURY",
      status: "INACTIVE",
      approvalStatus: "PENDING"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Fleet Directory</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Registered buses for this operator</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Fleet
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mockFleets.map((fleet) => (
          <Card key={fleet._id} className="relative overflow-hidden border-2 border-muted hover:border-primary/40 transition-all group bg-card shadow-sm">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Bus className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <CardTitle className="text-sm font-black tracking-widest uppercase opacity-70 leading-none mb-1">{fleet.fleetId}</CardTitle>
                   <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{fleet.busType}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                 <Badge variant={fleet.status === "ACTIVE" ? "default" : "destructive"} className="uppercase text-[9px] tracking-widest font-black h-5">
                    {fleet.status}
                 </Badge>
                 {fleet.approvalStatus === "APPROVED" && (
                     <ShieldCheck className="h-5 w-5 text-success" />
                 )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="flex items-start justify-between">
                  <div>
                     <p className="font-black text-2xl tracking-tighter leading-none mb-1">{fleet.busName}</p>
                     <p className="text-xs font-mono font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> {fleet.busNumber}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                     <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest mb-1">Route</p>
                     <p className="text-xs font-bold flex items-center gap-1 truncate"><MapPin className="h-3 w-3 text-primary" /> {fleet.route}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                     <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest mb-1">Capacity</p>
                     <p className="text-xs font-bold flex items-center gap-1"><Users className="h-3 w-3 text-primary" /> {fleet.seatCapacity} Seats</p>
                  </div>
               </div>

               <div className="pt-4 border-t flex justify-between items-center group/btn">
                  <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest hover:bg-primary/10 p-0 h-auto">
                     View Details →
                  </Button>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-30 italic">Fleet ID: {fleet._id}</p>
               </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>
      
      {mockFleets.length === 0 && (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl opacity-30">
              <Bus className="h-16 w-16 mb-4" />
              <p className="font-black uppercase tracking-widest">No fleet registered yet</p>
          </div>
      )}
    </div>
  );
};

export default FleetTab;
