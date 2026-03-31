import { useState } from "react";
import { 
  Zap, 
  Plus, 
  Loader2, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { getColumns } from "@/components/data_tables/amenities/columns";
import { useFetchAmenitiesByOwner, useDeleteAmenity } from "@/hooks/useAmenities";
import CreateAmenityModal from "./CreateAmenityModal";
import UpdateAmenityModal from "./UpdateAmenityModal";
import ViewAmenityModal from "./ViewAmenityModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const AmenitiesTab = ({ ownerId }: { ownerId: string }) => {
  const { data: amenitiesResponse, isLoading, isError, refetch } = useFetchAmenitiesByOwner(ownerId);
  const deleteMutation = useDeleteAmenity();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleViewDetail = (id: string) => {
    setViewId(id);
    setIsViewModalOpen(true);
  };

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setIsUpdateModalOpen(true);
  };

  const columns = getColumns(handleViewDetail, handleUpdate, handleOpenDelete);
  const amenitiesData = amenitiesResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Synchronizing Amenities...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center px-10">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive border-2 border-destructive/20 shadow-lg">
            <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tighter">Connection Interrupted</h3>
            <p className="text-sm text-muted-foreground font-medium italic opacity-70">We encountered an issue while retrieving amenity records.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="h-12 px-12 font-black uppercase tracking-widest border-2 hover:bg-primary/5">Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="group relative flex justify-between items-center bg-gradient-to-br from-muted/30 to-background p-6 rounded-[2.5rem] border-2 border-dashed border-primary/10 overflow-hidden transition-all hover:border-primary/20">
        <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-5 relative z-10">
           <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-inner">
              <Zap className="h-6 w-6 text-primary" />
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tighter">Amenity Configurations</h3>
              <p className="text-sm text-muted-foreground font-medium italic opacity-70">Define and manage sets of services offered across your fleet</p>
           </div>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="relative z-10 gap-3 h-14 px-8 font-black uppercase text-xs tracking-widest transition-all hover:tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 rounded-2xl"
        >
          <Plus className="h-5 w-5" /> New Configuration
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-background rounded-[2.5rem] border-2 border-muted overflow-hidden shadow-sm">
        <DataTable columns={columns} data={amenitiesData} searchPlaceholder="Search amenities..." />
      </div>

      {/* Modals */}
      <CreateAmenityModal 
        ownerId={ownerId} 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <UpdateAmenityModal
        id={updateId}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setUpdateId(null);
        }}
      />

      <ViewAmenityModal
        id={viewId}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewId(null);
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-2 rounded-[2rem] shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="p-4 rounded-3xl bg-destructive/10 text-destructive border-2 border-destructive/10 animate-bounce">
                  <AlertTriangle className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black tracking-tighter">Remove Configuration?</DialogTitle>
                  <DialogDescription className="text-muted-foreground font-medium italic">
                    This action is permanent. All amenities within this group will be detached from your fleet records.
                  </DialogDescription>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <Button onClick={() => setDeleteId(null)} variant="ghost" className="h-12 font-black uppercase tracking-widest text-[10px] rounded-xl">Discard</Button>
               <Button 
                  onClick={handleConfirmDelete} 
                  variant="destructive" 
                  disabled={deleteMutation.isPending}
                  className="h-12 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-destructive/20"
               >
                  {deleteMutation.isPending ? "Removing..." : "Delete Permanently"}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AmenitiesTab;
