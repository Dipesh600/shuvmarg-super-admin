import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const BoardingPointsTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching boarding points for owner:", ownerId);

  const mockBoardingPoints = [
    {
      _id: "1",
      city: "Kathmandu",
      pointName: "Kalanki Bus Stop",
      landmark: "Near Petrol Pump",
      time: "4:45 PM",
      contactNumber: "9812345678",
      coordinates: { lat: 27.693, lng: 85.281 }
    },
    {
      _id: "2",
      city: "Kathmandu",
      pointName: "New Bus Park",
      landmark: "Ticket Counter 4",
      time: "5:30 PM",
      contactNumber: "9800000000",
      coordinates: { lat: 27.734, lng: 85.312 }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Boarding Points</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage pickup locations for this operator</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Boarding Point
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mockBoardingPoints.map((point) => (
          <Card key={point._id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-muted/20">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold tracking-tight">{point.pointName}</CardTitle>
                <Badge variant="outline" className="font-mono">{point.time}</Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {point.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 divide-x">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Landmark</p>
                  <p className="text-sm font-medium">{point.landmark}</p>
                </div>
                <div className="pl-4 space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Contact</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary/70" /> {point.contactNumber}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-tighter">Coordinates</span>
                  <span className="font-mono text-[10px] text-primary">{point.coordinates.lat}N, {point.coordinates.lng}E</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase text-primary transition-all hover:tracking-widest">
                  Edit Point
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary opacity-60 mt-0.5" />
        <p className="text-xs font-medium text-muted-foreground italic">
          These boarding points are globally accessible to all buses belonging to this operator. 
          Individual trips can select specific points from this list.
        </p>
      </div>
    </div>
  );
};

export default BoardingPointsTab;
