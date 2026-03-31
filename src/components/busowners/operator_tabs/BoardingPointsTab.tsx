import { useState } from "react";
import { Plus, MapPinned, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFetchBoardingPointsByOwner, useDeleteBoardingPoint } from "@/hooks/useBoardingPoints";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/DataTable";
import { getColumns } from "@/components/data_tables/boarding-point/columns";
import CreateBoardingPointModal from "./CreateBoardingPointModal";
import UpdateBoardingPointModal from "./UpdateBoardingPointModal";
import ViewBoardingPointModal from "./ViewBoardingPointModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const BoardingPointsTab = ({ ownerId }: { ownerId: string }) => {
  const { data: response, isLoading } = useFetchBoardingPointsByOwner(ownerId);
  const deleteMutation = useDeleteBoardingPoint();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleAsyncDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const boardingPointGroups = response?.data || [];
  const columns = getColumns({
    onView: handleViewDetail,
    onUpdate: handleUpdate,
    onDelete: handleOpenDelete
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-muted/20 p-6 rounded-3xl border-2 border-dashed border-muted-foreground/10 gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <MapPinned className="h-6 w-6 text-primary" /> Boarding Point Directory
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Manage pickup locations and grouped shifts for this operator</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 h-12 px-8 font-black uppercase transition-all hover:tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground group"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" /> Boarding Point
        </Button>
      </div>

      <div className="bg-background rounded-2xl border-2 border-muted overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={boardingPointGroups}
          searchPlaceholder="Search by city or configuration..."
          pageSize={10}
        />
        <p className="p-4 text-sm text-muted-foreground border-t">
          Boarding points are organized by city and shift. You can manage multiple points within a single group.
        </p>
      </div>

      <CreateBoardingPointModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        ownerId={ownerId}
      />

      <UpdateBoardingPointModal
        id={updateId}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setUpdateId(null);
        }}
      />

      <ViewBoardingPointModal
        id={viewId}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewId(null);
        }}
      />

      {boardingPointGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl opacity-20">
          <MapPinned className="h-16 w-16 mb-4" />
          <p className="font-black uppercase tracking-widest">Empty Directory</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="font-medium pt-2">
              This will permanently delete this <span className="font-bold text-foreground">Boarding Point Configuration</span>. Any trips using these points may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="font-bold uppercase tracking-widest text-xs h-11">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAsyncDelete}
              variant="destructive"
              className="font-bold uppercase tracking-widest text-xs h-11"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardingPointsTab;
