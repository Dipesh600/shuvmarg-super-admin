import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Plus, Eye, Edit, Trash2, Loader2, MapPin, Clock, Search, Navigation } from "lucide-react";
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
import { useFetchBusRoutesByOwner, useDeleteBusRoute } from "@/hooks/useBusRoutes";

// Modals
import CreateBusRouteModal from "./CreateBusRouteModal";
import UpdateBusRouteModal from "./UpdateBusRouteModal";
import ViewBusRouteModal from "./ViewBusRouteModal";

const BusRouteTab = ({ ownerId }: { ownerId: string }) => {
  const { data: response, isLoading, isError, refetch } = useFetchBusRoutesByOwner(ownerId);
  const deleteMutation = useDeleteBusRoute();

  const routes = response?.data || [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutes = routes.filter((route: any) =>
    route.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.to.toLowerCase().includes(searchQuery.toLowerCase())
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
    setActiveRouteId(null);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" /> Assigned Routes
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage operational travel routes for this operator</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search origin, destination..."
              className="pl-9 bg-background border-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 h-10 px-5 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Add Route
          </Button>
        </div>
      </div>

      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white overflow-hidden">
        <CardHeader className="bg-white/5 pb-4 border-b border-white/5">
          <CardTitle className="text-lg font-black tracking-tighter leading-none text-white">Route Configurations</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total {routes.length} active configurations found</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Routes Database</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-bold mb-4">Error loading route configurations</p>
              <Button variant="outline" onClick={() => refetch()} size="sm" className="font-bold">Retry Data Fetch</Button>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Route className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-black tracking-tighter">No Routes Configured</p>
              <p className="text-sm text-muted-foreground font-medium">This operator has no configured travel routes yet.</p>
            </div>
          ) : (
            <div className="rounded-md overflow-x-auto min-h-[300px]">
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/10">
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60">Route Details</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60 hidden md:table-cell">Locations</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60 hidden lg:table-cell">Distance / Duration</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60 text-right">Base Price</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60 text-center">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-white/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route: any) => (
                    <TableRow key={route._id} className="hover:bg-white/5 font-medium transition-colors border-white/5">
                      <TableCell className="align-top py-4">
                        <div className="flex flex-col">
                          <span className="font-black tracking-tight text-sm text-white/90">{route.routeName}</span>
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest tooltip mt-1" title={route._id}>
                            ID: {route._id.slice(-8)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5 opacity-80 text-white/70">
                            <MapPin className="h-3 w-3 text-white/40" /> {route.from}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/90">
                            <MapPin className="h-3 w-3 text-[#D3D925]" /> <span className="font-bold">{route.to}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold bg-white/5 w-fit px-2 py-0.5 rounded-md flex items-center gap-1.5 text-white/80">
                            <Navigation className="h-3 w-3" /> {route.distance}
                          </span>
                          <span className="text-xs font-bold text-white/60 flex items-center gap-1.5 ml-1">
                            <Clock className="h-3 w-3" /> {route.duration}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 text-right">
                        <div className="inline-flex items-center justify-end px-2.5 py-1 rounded-lg bg-[#D3D925]/10 border border-[#D3D925]/20 text-[#D3D925] font-black text-sm">
                          Rs. {route.basePrice}
                        </div>
                        {route.isRoundTrip && (
                          <div className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50 flex justify-end text-white/60">Round Trip</div>
                        )}
                      </TableCell>

                      <TableCell className="align-top py-4 text-center">
                        <Badge
                          variant={route.status === "ACTIVE" ? "default" : "outline"}
                          className="uppercase text-[9px] font-black tracking-widest py-0.5"
                        >
                          {route.status || "Unknown"}
                        </Badge>
                      </TableCell>

                      <TableCell className="align-top py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveRouteId(route._id);
                              setModalType("view");
                            }}
                            title="View Configuration"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveRouteId(route._id);
                              setModalType("edit");
                            }}
                            title="Edit Configuration"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => openDeleteConfirm(route._id, route.routeName)}
                            title="Delete Configuration"
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

      {/* Modals */}
      <CreateBusRouteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        ownerId={ownerId}
      />

      <UpdateBusRouteModal
        id={activeRouteId}
        isOpen={modalType === "edit"}
        onClose={closeModals}
      />

      <ViewBusRouteModal
        id={activeRouteId}
        isOpen={modalType === "view"}
        onClose={closeModals}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && setDeleteModal({ isOpen: false, id: null, name: "" })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-destructive tracking-tighter flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="font-medium text-sm pt-4">
              Are you sure you want to formally delete the route <span className="font-black text-foreground">{deleteModal.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="font-bold flex-1">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="font-bold shadow-lg shadow-destructive/20 flex-1"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusRouteTab;
