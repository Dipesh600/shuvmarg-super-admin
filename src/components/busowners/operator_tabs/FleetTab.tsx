import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Plus, Eye, Edit, Trash2, Loader2, Search, ShieldCheck } from "lucide-react";
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
import { useFetchOwnerFleets, useDeleteOwnerFleet } from "@/hooks/useOwnerFleets";

// Modals
import CreateOwnerFleetModal from "./CreateOwnerFleetModal";
import UpdateOwnerFleetModal from "./UpdateOwnerFleetModal";
import ViewOwnerFleetModal from "./ViewOwnerFleetModal";

const FleetTab = ({ ownerId }: { ownerId: string }) => {
  const { data: response, isLoading, isError, refetch } = useFetchOwnerFleets(ownerId);
  const deleteMutation = useDeleteOwnerFleet();

  const fleets = response?.data || [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeFleetId, setActiveFleetId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredFleets = fleets.filter((fleet: any) =>
    fleet.busName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fleet.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fleet.fleetId.toLowerCase().includes(searchQuery.toLowerCase())
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
    setActiveFleetId(null);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" /> Fleet Directory
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage registered vehicles for this operator</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bus name or number..."
              className="pl-9 bg-background border-2 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 h-10 px-5 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Add Fleet
          </Button>
        </div>
      </div>

      <Card className="border-2 border-muted shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black tracking-tighter leading-none mb-1">Fleet Roster</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Total {fleets.length} vehicles registered</CardDescription>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              {filteredFleets.filter((f: any) => f.status === 'ACTIVE').length} Active
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Fleet Profiles</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-bold mb-4">Error loading fleet database</p>
              <Button variant="outline" onClick={() => refetch()} size="sm" className="font-bold">Retry Data Fetch</Button>
            </div>
          ) : filteredFleets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Bus className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-black tracking-tighter">No Fleets Registered</p>
              <p className="text-sm text-muted-foreground font-medium">This operator has no vehicles listed under their account.</p>
            </div>
          ) : (
            <div className="rounded-md overflow-x-auto min-h-[300px]">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Identity</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Class</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary hidden md:table-cell">Capacity & Layout</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary hidden lg:table-cell text-center">Reg. Year</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Status / Approval</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFleets.map((fleet: any) => (
                    <TableRow key={fleet._id} className="hover:bg-muted/5 font-medium transition-colors">
                      <TableCell className="align-top py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-black tracking-tight text-sm text-foreground">{fleet.busName}</span>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-80 border-l-2 border-primary/50 pl-1">{fleet.busNumber}</span>
                          <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest tooltip mt-0.5" title={fleet._id}>
                            ID: {fleet.fleetId}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4">
                        <div className="flex items-center">
                          <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest py-0.5 whitespace-nowrap">{fleet.busType}</Badge>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1.5 opacity-80 text-xs font-bold font-mono">
                          <p>{fleet.totalSeats} Seats</p>
                          <p className="text-muted-foreground text-[10px]">{fleet.seatLayout} Layout</p>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 hidden lg:table-cell text-center">
                        <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg border">
                          {fleet.registrationYear}
                        </span>
                      </TableCell>

                      <TableCell className="align-top py-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <Badge
                            variant={fleet.status === "ACTIVE" ? "default" : "outline"}
                            className={`uppercase text-[9px] font-black tracking-widest py-0.5 ${fleet.status === 'ACTIVE' ? 'bg-success hover:bg-success/90' : 'text-muted-foreground'}`}
                          >
                            {fleet.status || "Unknown"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          {fleet.approvalStatus === "APPROVED" ? (
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-success border-success/30 bg-success/5 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Approved
                            </Badge>
                          ) : fleet.approvalStatus === "PENDING" ? (
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-500 border-amber-500/30 bg-amber-500/5">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground">
                              {fleet.approvalStatus || "N/A"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2 h-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveFleetId(fleet._id);
                              setModalType("view");
                            }}
                            title="View Configuration Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveFleetId(fleet._id);
                              setModalType("edit");
                            }}
                            title="Edit Vehicle Attributes"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => openDeleteConfirm(fleet._id, fleet.busName)}
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
      <CreateOwnerFleetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        ownerId={ownerId}
      />

      <UpdateOwnerFleetModal
        id={activeFleetId}
        isOpen={modalType === "edit"}
        onClose={closeModals}
        ownerId={ownerId}
      />

      <ViewOwnerFleetModal
        id={activeFleetId}
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
              <Trash2 className="h-5 w-5" /> Confirm Fleet Purge
            </DialogTitle>
            <DialogDescription className="font-medium text-sm pt-4">
              Are you sure you want to permanently delete the assigned bus <span className="font-black text-foreground">{deleteModal.name}</span>?
              This action cannot be undone and will orphan route mappings.
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
                "Yes, Delete Fleet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FleetTab;
