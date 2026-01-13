import { Dialog } from "@radix-ui/react-dialog";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Trash } from "lucide-react";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
 interface DeleteModelProps {
    entityId:string;
    entityType:string;
}

const DeleteModel = ({entityId,entityType}:DeleteModelProps) => {
    const [open,setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
    const {mutate:deleteEntity,isPending} = useDeleteEntity();
    const handleSubmit = (e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
deleteEntity({
  entityId
},
{
  onSuccess:()=>{
    toast.success("Successfully deleted...!");
    navigate("/admin/users",{replace:true})
    queryClient.invalidateQueries({queryKey:["user",entityId]});
    queryClient.invalidateQueries({queryKey:["users"]});
    
  },
  onError:()=>{
    toast.error("Something went wrong !")
  }
}
)
    }
  return (
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2 cursor-pointer">
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] w-full bg-white/90 p-6  dark:bg-background rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Are you sure you want to delete { entityType}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <DialogFooter className="flex justify-end gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteModel