import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BoardingLocation } from "./boardingLocationTypes";

export function DeactivateBoardingLocationDialog({
  location,
  pending,
  onClose,
  onConfirm,
}: {
  location: BoardingLocation | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(location)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#0a0a0a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate boarding location?</DialogTitle>
          <DialogDescription>
            {location?.name} will stop appearing as a canonical option. Active
            operator assignments must be disabled first.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
