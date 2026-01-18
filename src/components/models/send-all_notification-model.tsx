import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Send } from "lucide-react";
import { useSendAllNotification } from "@/hooks/usePushNotification";
import { toast } from "sonner";

export function SendAllNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const { mutate, isPending } = useSendAllNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all fields");

      return;
    }
    mutate(
      { title: formData.title, description: formData.description },
      {
        onSuccess: () => {
          toast.success(
            "Push notification has been sent to all users successfully!",
          );

          setFormData({ title: "", description: "" });
          setOpen(false);
        },
        onError: () => {
          toast.error("Something went wrong!");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Bell className="mr-2 h-4 w-4" />
          Send to All Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification to All Users
          </DialogTitle>
          <DialogDescription>
            This notification will be sent to all registered users.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="e.g., Maintenance Notice"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Message</Label>
              <Textarea
                id="description"
                placeholder="e.g., The system will be down from 12AM to 1AM."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isPending}
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
             { isPending ?<Loader2 className="animate-spin w-5 h-5"/> :
             <>
             <Send className="mr-2 h-4 w-4" />
              Send Notification
              </>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
