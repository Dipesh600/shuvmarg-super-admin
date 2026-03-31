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
import { Plus, Trash2, Zap, Image as ImageIcon, Info, Loader2, Bookmark } from "lucide-react";
import { useFetchAmenityById, useUpdateAmenity } from "@/hooks/useAmenities";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface UpdateAmenityModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateAmenityModal: React.FC<UpdateAmenityModalProps> = ({
  id,
  isOpen,
  onClose
}) => {
  const { data: response, isLoading, isError, refetch } = useFetchAmenityById(id || "");
  const updateMutation = useUpdateAmenity(id || "");

  const [status, setStatus] = useState(true);
  const [amenities, setAmenities] = useState<any[]>([]);

  // Force refetch and reset local state when id changes or modal opens
  useEffect(() => {
    if (isOpen && id) {
      refetch();
    }
  }, [isOpen, id, refetch]);

  // Synchronize state with fetched data
  useEffect(() => {
    if (response?.data && isOpen) {
      const { status, amenities } = response.data;
      setStatus(status !== undefined ? status : true);
      setAmenities(amenities || []);
    }
  }, [response, isOpen]);

  const addAmenity = () => {
    setAmenities([...amenities, { name: "", description: "", icon: "wifi-icon-url-or-class" }]);
  };

  const removeAmenity = (index: number) => {
    if (amenities.length > 1) {
      setAmenities(amenities.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    setAmenities(amenities.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const payload = {
      status,
      amenities: amenities.map(({ _id, ...rest }) => rest)
    };

    try {
      await updateMutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-transform group-hover:rotate-12">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Modify Configuration</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Updating existing group</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border shadow-inner">
              <span className={`text-[10px] font-black uppercase tracking-widest ${status ? "text-primary" : "text-muted-foreground"}`}>
                {status ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={status}
                onCheckedChange={setStatus}
              />
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
            <p className="font-extrabold uppercase tracking-widest text-[10px] text-muted-foreground">Synchronizing data...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-10">
            <p className="text-destructive font-bold mb-4 opacity-70 italic tracking-tighter text-lg">Load failed</p>
            <Button variant="outline" onClick={() => refetch()} className="font-black uppercase tracking-widest h-11 px-10 border-destructive text-destructive hover:bg-destructive/5 transition-all">Retry Synchronization</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6 scroll-smooth">
                <div className="flex justify-between items-center bg-background sticky top-0 z-10 py-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary italic">Included Items ({amenities.length})</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAmenity}
                    className="h-8 gap-1.5 font-black uppercase text-[9px] tracking-widest border-2 hover:bg-primary/5 border-primary/20 text-primary transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {amenities.map((amenity, index) => (
                    <Card key={index} className="border-2 border-muted bg-muted/5 relative overflow-hidden group shadow-none transition-all hover:border-primary/20">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><Zap className="h-2.5 w-2.5" /> Amenity Name</Label>
                            <Input
                              placeholder="e.g. WiFi"
                              className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10 transition-all focus:bg-primary/[0.02]"
                              value={amenity.name}
                              onChange={(e) => updateItem(index, "name", e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><ImageIcon className="h-2.5 w-2.5" /> Icon ID / Class</Label>
                            <Input
                              placeholder="wifi-icon"
                              className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10 transition-all focus:bg-primary/[0.02]"
                              value={amenity.icon}
                              onChange={(e) => updateItem(index, "icon", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold uppercase opacity-50 ml-1 flex items-center gap-1"><Info className="h-2.5 w-2.5" /> Description</Label>
                          <Input
                            placeholder="Free high-speed internet"
                            className="h-10 font-bold bg-background border-2 focus-visible:ring-primary/10 transition-all focus:bg-primary/[0.02]"
                            value={amenity.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                          />
                        </div>

                        {amenities.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAmenity(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/20 border-t gap-3 mt-auto shadow-2xl">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="font-black uppercase tracking-widest text-xs h-12 flex-1 hover:bg-destructive/5 hover:text-destructive transition-colors border-2 border-transparent hover:border-destructive/10">Discard Changes</Button>
              </DialogClose>
              <Button
                type="submit"
                className="font-black uppercase tracking-widest text-xs h-12 flex-[2] shadow-lg shadow-primary/20 transition-all hover:tracking-[0.2em] hover:shadow-primary/30"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Applying Updates..." : "Save Modifications"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAmenityModal;
