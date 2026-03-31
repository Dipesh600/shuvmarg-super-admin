import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Users, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SeatTemplateTab = ({ ownerId }: { ownerId: string }) => {
  // Use ownerId for future API calls
  console.log("Fetching seat templates for owner:", ownerId);

  const mockTemplates = [
    {
      _id: "1",
      name: "Standard 2x2 Deluxe",
      totalSeats: 32,
      layout: "2x2",
      type: "DELUXE",
      isActive: true
    },
    {
      _id: "2",
      name: "Luxury 2x1 Sofa",
      totalSeats: 24,
      layout: "2x1",
      type: "LUXURY",
      isActive: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
        <div>
          <h3 className="text-xl font-black tracking-tighter">Seat Layout Templates</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage seating configurations for this operator's fleet</p>
        </div>
        <Button className="gap-2 h-11 px-6 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mockTemplates.map((template) => (
          <Card key={template._id} className="relative overflow-hidden border-2 border-muted hover:border-primary/50 transition-all group bg-card shadow-sm cursor-pointer">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tighter leading-none">{template.name}</CardTitle>
                </div>
              </div>
              <Badge variant={template.isActive ? "default" : "secondary"} className="uppercase text-[9px] tracking-widest font-black">
                {template.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-8 divide-x divide-muted-foreground/20">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Capacity</span>
                    <span className="font-black text-xl text-primary">{template.totalSeats}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><LayoutGrid className="h-4 w-4" /> Layout Mode</span>
                    <span className="font-bold text-lg uppercase tracking-tighter">{template.layout}</span>
                  </div>
                </div>
                
                <div className="pl-8 flex flex-col items-center justify-center min-w-[100px] text-center">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 mb-1">Coach Type</p>
                   <Badge variant="outline" className="font-black h-7 text-[10px] tracking-widest uppercase border-primary/40 text-primary">{template.type}</Badge>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t flex justify-between items-center group/btn">
                 <Button variant="link" className="p-0 h-auto text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-primary transition-all">
                    Visual Preview
                 </Button>
                 <Info className="h-4 w-4 text-muted-foreground opacity-30 group-hover/btn:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SeatTemplateTab;
