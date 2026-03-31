import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Navigation, Clock, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const BusRouteTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching routes for owner:", ownerId);

  const mockRoutes = [
    {
      _id: "1",
      routeName: "Kathmandu to Pokhara",
      from: "Kathmandu",
      to: "Pokhara",
      distance: "145Km",
      duration: "8hr",
      basePrice: 900,
      status: "ACTIVE"
    },
    {
      _id: "2",
      routeName: "Pokhara to Butwal",
      from: "Pokhara",
      to: "Butwal",
      distance: "160Km",
      duration: "6hr",
      basePrice: 850,
      status: "INACTIVE"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Assigned Routes</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage service routes for this operator</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Bus Route
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mockRoutes.map((route) => (
          <Card key={route._id} className="relative overflow-hidden border-2 border-muted hover:border-primary/50 transition-all group">
            <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Route className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg font-black tracking-tighter">{route.routeName}</CardTitle>
              </div>
              <Badge variant={route.status === "ACTIVE" ? "default" : "secondary"} className="uppercase text-[10px] tracking-widest font-black">
                {route.status}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between gap-4 px-2">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">From</p>
                  <p className="font-bold text-lg leading-none">{route.from}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-0.5 bg-muted-foreground/20 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3">
                      <Navigation className="h-3 w-3 text-primary rotate-90" />
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 leading-none h-4">
                    {route.distance}
                  </Badge>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">To</p>
                  <p className="font-bold text-lg leading-none">{route.to}</p>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Duration</span>
                    <span className="text-sm font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> {route.duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Base Price</span>
                    <span className="text-sm font-bold text-primary">Rs. {route.basePrice}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 transition-transform group-hover:translate-x-1">
                   <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -rotate-45 translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BusRouteTab;
