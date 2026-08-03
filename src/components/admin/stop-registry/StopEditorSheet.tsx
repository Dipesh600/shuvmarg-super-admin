import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Pencil } from "lucide-react";
import { getStopId } from "./stopRegistryTypes";
import type { AdminStop, StopFormState } from "./stopRegistryTypes";
import { StopForm } from "./StopForm";

interface StopEditorSheetProps {
  open: boolean;
  onClose: () => void;
  formState: StopFormState;
  onFormChange: (updater: (prev: StopFormState) => StopFormState) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  editingStop: AdminStop | null;
  allStops: AdminStop[];
}

export const StopEditorSheet: React.FC<StopEditorSheetProps> = ({
  open,
  onClose,
  formState,
  onFormChange,
  onSubmit,
  isSubmitting,
  editingStop,
  allStops,
}) => {
  const isEditMode = !!editingStop;
  const editingStopId = isEditMode ? getStopId(editingStop) : null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[1120px] max-h-[92vh] rounded-2xl border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-[#0a0a0a]"
      >
        {/* Sheet Header */}
        <div className="bg-[#121212] p-6 border-b border-white/5 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg">
                {isEditMode ? <Pencil className="w-4 h-4 text-[#D3D925]" /> : <MapPin className="w-4 h-4 text-white" />}
              </div>
              {isEditMode ? `Edit Stop: ${editingStop.name}` : "Register New Stop Node"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/50 text-xs mt-1 ml-8">
            {isEditMode
              ? "Update stop attributes, geographic details, parent link, and operational capabilities."
              : "Add a new city, junction, town, or terminal to the global stop registry."}
          </p>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <StopForm
            form={formState}
            onChange={onFormChange}
            allStops={allStops}
            editingStopId={editingStopId}
            isEditMode={isEditMode}
          />
        </div>

        {/* Sheet Footer */}
        <DialogFooter className="p-5 border-t border-white/5 bg-[#0a0a0a] gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-bold rounded-xl h-10 px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formState.name.trim() || !formState.mapSelection}
            className="h-10 rounded-xl font-bold bg-[#D3D925] text-black hover:bg-[#D9CD25] px-6 gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting
              ? isEditMode ? "Saving..." : "Registering..."
              : isEditMode ? "Save Changes" : "Register Stop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
