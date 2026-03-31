import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Bus, MapPin, Plus, Eye, Edit, Trash2, Loader2, Search, TrendingUp, CreditCard, ShipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { useFetchTripsByOwner, useDeleteTrip } from "@/hooks/useTrips";

// Modals
import CreateTripModal from "./CreateTripModal";
import UpdateTripModal from "./UpdateTripModal";
import ViewTripModal from "./ViewTripModal";

const BusTripTab = ({ ownerId }: { ownerId: string }) => {
  const { data: response, isLoading, isError, refetch } = useFetchTripsByOwner(ownerId);
  const deleteMutation = useDeleteTrip();

  const trips = response?.data || [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrips = trips.filter((t: any) => 
    t.tripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.busId?.busName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.routeId?.routeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDeleteConfirm = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const closeModals = () => {
    setActiveTripId(null);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 text-primary uppercase">
            <TrendingUp className="h-5 w-5" /> Trip Logistics Control
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Monitor departure schedules and route occupancy</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ID, Bus or Route..." 
              className="pl-9 bg-background border-2 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 h-10 px-5 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Schedule Trip
          </Button>
        </div>
      </div>

      <Card className="border-2 border-muted shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black tracking-tighter leading-none mb-1">Active Trip Ledger</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Managing {trips.length} scheduled journeys</CardDescription>
            </div>
            <ShipIcon className="h-5 w-5 text-primary opacity-20" />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aggregating manifest data...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-bold mb-4 opacity-70 italic tracking-tighter text-lg">System communication failure</p>
              <Button variant="outline" onClick={() => refetch()} size="sm" className="font-bold border-destructive text-destructive">Reconnect Database</Button>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-dashed border-muted-foreground/30">
                <Calendar className="h-8 w-8 text-muted-foreground opacity-30" />
              </div>
              <p className="text-lg font-black tracking-tighter text-primary uppercase">No Trip Data Found</p>
              <p className="text-sm text-muted-foreground font-medium italic opacity-60">Adjust your parameters or schedule a new trip.</p>
            </div>
          ) : (
            <div className="rounded-md overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Trip Manifest ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Fleet & Detail</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Route Path</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Schedule</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Fare</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-right pr-6">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((t: any) => (
                    <TableRow key={t._id} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0 group">
                      <TableCell className="align-middle py-6">
                        <div className="flex flex-col gap-1">
                           <span className="font-black tracking-tight text-sm text-foreground uppercase">{t.tripId}</span>
                           <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase opacity-40">Shift: {t.shift}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <Bus className="h-3 w-3 text-primary opacity-60" />
                              <span className="font-black tracking-tight text-sm text-primary">{t.busId?.busName || "N/A"}</span>
                           </div>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest ml-5">{t.busId?.busNumber || "N/A"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                           <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-orange-500 opacity-60" />
                              <span className="font-bold text-sm tracking-tight truncate">{t.routeId?.routeName || "N/A"}</span>
                           </div>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 ml-5">{t.routeId?.distance || "Variable"} Dist.</span>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           <div className="flex items-center gap-1.5 text-xs font-bold bg-muted/40 px-2 py-1 rounded-lg border shadow-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{t.tripDate}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary/60">
                              <Clock className="h-3 w-3" />
                              <span>{t.departureTime} - {t.arrivalTime}</span>
                           </div>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle text-center">
                         <div className="inline-flex flex-col items-center">
                            <span className="font-black text-sm text-primary">Rs. {t.tripFare}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted rounded-full px-2 py-0.5 mt-1 border">Standard</span>
                         </div>
                      </TableCell>

                      <TableCell className="align-middle text-center">
                        <Badge 
                          variant={t.status === "scheduled" ? "default" : "secondary"} 
                          className={`uppercase text-[9px] font-black tracking-widest py-0.5 px-3 transition-all
                                     ${t.status === 'scheduled' ? 'shadow-sm shadow-primary/20' : 'bg-muted/50 opacity-60'}`}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="align-middle text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
                            onClick={() => {
                              setActiveTripId(t._id);
                              setModalType("view");
                            }}
                            title="Trip Manifest Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
                            onClick={() => {
                              setActiveTripId(t._id);
                              setModalType("edit");
                            }}
                            title="Reschedule / Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-all rounded-xl"
                            onClick={() => openDeleteConfirm(t._id, t.tripId)}
                            title="Cancel / Purge Trip"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modals */}
      <CreateTripModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        ownerId={ownerId} 
      />
      
      <UpdateTripModal 
        id={activeTripId} 
        isOpen={modalType === "edit"} 
        onClose={closeModals} 
        ownerId={ownerId}
      />
      
      <ViewTripModal 
        id={activeTripId} 
        isOpen={modalType === "view"} 
        onClose={closeModals} 
      />

      {/* Delete Confirmation Popup */}
      <Dialog 
        open={deleteModal.isOpen} 
        onOpenChange={(open) => !open && setDeleteModal({ isOpen: false, id: null, name: "" })}
      >
        <DialogContent className="sm:max-w-[425px] border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-destructive tracking-tighter flex items-center gap-2 uppercase">
              <Trash2 className="h-5 w-5" /> Cancel Manifest?
            </DialogTitle>
            <DialogDescription className="font-bold text-sm pt-4 text-muted-foreground italic leading-relaxed">
              Caution: You are about to wipe trip <span className="text-foreground font-black underline">{deleteModal.name}</span> from the roster. 
              This will nullify all recursive schedules linked to this ID.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10 mt-2">
             <p className="text-[10px] font-black uppercase text-destructive text-center tracking-[0.2em] opacity-80">Permanent Operatonal Purge</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-6 border-t font-black">
            <DialogClose asChild>
              <Button variant="outline" className="font-bold flex-1 uppercase tracking-widest text-xs h-11 border-2 hover:bg-muted/50 transition-colors">Abort</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="font-bold shadow-lg shadow-destructive/20 flex-1 uppercase tracking-widest text-xs h-11 transition-all hover:tracking-[0.1em]"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Purging...</>
              ) : (
                "Yes, Cancel Trip"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusTripTab;
