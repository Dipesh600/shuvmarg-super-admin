import { Card, CardContent } from "@/components/ui/card";
import { Wifi, Snowflake, Usb, Coffee, Zap, Disc, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AmenitiesTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching amenities for owner:", ownerId);

  const mockAmenities = [
    { name: "WiFi", description: "Free high-speed internet", icon: <Wifi className="h-4 w-4" /> },
    { name: "AC", description: "Full interior climate control", icon: <Snowflake className="h-4 w-4" /> },
    { name: "Charging Port", description: "USB points at every seat", icon: <Usb className="h-4 w-4" /> },
    { name: "Water Bottle", description: "Complimentary mineral water", icon: <Coffee className="h-4 w-4" /> },
    { name: "Entertainment", description: "Personal TV screens", icon: <Disc className="h-4 w-4" /> },
    { name: "Blanket", description: "Freshly laundered blankets", icon: <Zap className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Standard Amenities</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Global amenities offered across all trips by this operator</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Amenity
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {mockAmenities.map((amenity) => (
          <Card key={amenity.name} className="hover:border-primary/50 transition-all cursor-default group border-muted/60 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors shadow-inner border border-primary/5">
                  <div className="text-primary">{amenity.icon}</div>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-lg tracking-tight leading-none">{amenity.name}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Service Included</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                {amenity.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center opacity-40 bg-muted/20">
        <div className="h-10 w-10 border-t-2 border-primary rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest italic tracking-tighter">Syncing with Fleet Management...</p>
      </div>
    </div>
  );
};

export default AmenitiesTab;
