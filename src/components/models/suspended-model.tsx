"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ban, CheckCircle } from "lucide-react";
// import { toast } from "@/hooks/use-toast";
import { useSuspendEntity } from "@/hooks/useSuspenedEntity";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SuspendDialogProps {
  entityType: "user" | "agent" | "bus owner" | "bus";
  entityId: string;
  entityName: string;
  currentStatus: string;
}

export function SuspendDialog({
  entityType,
  entityId,
  entityName,
  currentStatus,
}: SuspendDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("indefinite");
const queryClient = useQueryClient();
  const isSuspended =
    currentStatus === "banned" || currentStatus === "inactive";

  const suspendMutation = useSuspendEntity();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    suspendMutation.mutate(
      {
        id:entityId,
        status: isSuspended ? "active" : "banned",
      },
      {
        onSuccess: () => {
          toast.success("User Update Successfully")
          queryClient.invalidateQueries({queryKey:["user",entityId]})
          // toast({
          //   title: isSuspended ? "Reactivated" : "Suspended",
          //   description: `${entityName} has been ${
          //     isSuspended ? "reactivated" : "suspended"
          //   } successfully.`,
          //   variant: isSuspended ? "default" : "destructive",
          // });
          setOpen(false);
          setReason("");
        },
        onError: (err: any) => {
          console.log(err)
          // toast({
          //   title: "Error",
          //   description: err.message || "Something went wrong",
          //   variant: "destructive",
          // });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isSuspended ? "default" : "destructive"}
          className="gap-2"
        >
          {isSuspended ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {isSuspended ? "Reactivate" : "Suspend"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {isSuspended ? "Reactivate" : "Suspend"}{" "}
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {isSuspended
              ? `Restore ${entityName}'s access`
              : `Block ${entityName} from the platform`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSuspended && (
            <>
              <div className="space-y-2">
                <Label>Suspension Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for suspension"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isSuspended ? "default" : "destructive"}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending
                ? "Processing..."
                : isSuspended
                ? "Reactivate"
                : "Suspend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
