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
import { Zap, Loader2, Info, Activity, Calendar, Eye, Image as ImageIcon } from "lucide-react";
import { useFetchAmenityById } from "@/hooks/useAmenities";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewAmenityModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewAmenityModal: React.FC<ViewAmenityModalProps> = ({
  id,
  isOpen,
  onClose
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchAmenityById(id || "");

  const data = response?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Amenity Overview</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Read-only configuration</p>
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
            <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Fetching amenity details...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 px-10 text-center">
            <Info className="h-12 w-12 text-destructive opacity-50" />
            <h3 className="font-black text-lg">Load Failed</h3>
            <p className="text-sm text-muted-foreground font-medium">We couldn&apos;t retrieve the amenity details.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4 font-bold h-10 px-6">Retry Load</Button>
          </div>
        ) : data ? (
          <div className="flex flex-col min-h-0 flex-1 pt-6">
            <ScrollArea className="flex-1 px-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              <div className="space-y-8 pb-8">
                {/* Meta Info Section */}
                <div className="grid grid-cols-2 gap-8 ring-1 ring-muted p-4 rounded-2xl bg-muted/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Created On</p>
                    <p className="text-xs font-bold">{new Date(data.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Config ID</p>
                    <p className="text-[10px] font-mono opacity-50 truncate">{data._id}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Included Amenities ({data.amenities?.length || 0})</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {data.amenities?.map((amenity: any, index: number) => (
                      <Card key={index} className="border-2 border-muted bg-muted/5 relative overflow-hidden group shadow-none transition-all hover:bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-2xl border border-primary/20 shadow-sm">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-black text-base tracking-tight">{amenity.name}</p>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter opacity-40">Grouped</Badge>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">{amenity.description || "No description provided."}</p>

                              {amenity.icon && (
                                <p className="text-[9px] font-mono text-muted-foreground/40 mt-1 truncate">Icon ID: {amenity.icon}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/20 border-t flex-shrink-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="font-black uppercase tracking-widest text-xs h-12 w-full hover:bg-primary hover:text-primary-foreground transition-all">Close Overview</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ViewAmenityModal;