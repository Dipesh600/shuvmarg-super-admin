import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MapPinned, Clock, Phone, Loader2, Info, Activity, Calendar } from "lucide-react";
import { useFetchBoardingPointById } from "@/hooks/useBoardingPoints";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface ViewBoardingPointModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewBoardingPointModal: React.FC<ViewBoardingPointModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchBoardingPointById(id || "");
  
  const data = response?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Eye className="h-5 w-5" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Configuration Details</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Read-only overview</p>
               </div>
            </div>
            
            {data && (
                <Badge variant={data.status ? "default" : "outline"} className="uppercase text-[10px] font-black tracking-widest py-1 px-3">
                  {data.status ? "Active" : "Inactive"}
                </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
             <Loader2 className="h-12 w-12 text-primary animate-spin" />
             <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Fetching configuration...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 px-10 text-center">
             <Info className="h-12 w-12 text-destructive opacity-50" />
             <h3 className="font-black text-lg">Load Failed</h3>
             <p className="text-sm text-muted-foreground font-medium">We couldn&apos;t retrieve the configuration details.</p>
             <Button onClick={() => refetch()} variant="outline" className="mt-4 font-bold h-10 px-6">Retry Load</Button>
          </div>
        ) : data ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-8 pb-8">
                {/* Basic Info Section */}
                <div className="grid grid-cols-2 gap-8 ring-1 ring-muted p-4 rounded-2xl bg-muted/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> City</p>
                    <p className="text-lg font-black tracking-tight">{data.city}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Description</p>
                    <p className="text-sm font-bold text-muted-foreground italic line-clamp-2">{data.description || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Created On</p>
                    <p className="text-xs font-bold">{new Date(data.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Group ID</p>
                    <p className="text-[10px] font-mono opacity-50 truncate">{data._id}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Pickup Locations ({data.boardingPoints?.length || 0})</h4>
                  </div>

                  <div className="space-y-4">
                    {data.boardingPoints?.map((point: any, index: number) => (
                      <Card key={index} className="border-2 border-muted bg-muted/5 relative overflow-hidden group shadow-none">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase opacity-40">Point Name</p>
                                    <p className="font-black text-base tracking-tight">{point.pointName}</p>
                                </div>
                                <div className="bg-primary/10 text-primary p-2 rounded-xl border border-primary/20">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase opacity-40">Landmark</p>
                                    <p className="text-sm font-bold opacity-70">{point.landmark}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase opacity-40">Scheduled Time</p>
                                    <p className="text-sm font-black text-primary">{point.time}</p>
                                </div>
                            </div>

                            <Separator className="opacity-40" />

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <p className="text-xs font-bold tracking-widest">{point.contactNumber}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/20 border-t mt-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="font-black uppercase tracking-widest text-xs h-12 w-full hover:bg-primary hover:text-primary-foreground transition-all">Close Overview</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// Re-using Eye icon from Lucide sinceEye was mentioned in component but not imported above (it's actually 'Eye' in lucide-react)
import { Eye } from "lucide-react";

export default ViewBoardingPointModal;
