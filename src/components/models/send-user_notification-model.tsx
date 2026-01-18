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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Loader2, Send } from "lucide-react";
import { useSendUserNotification } from "@/hooks/usePushNotification";
import { toast } from "sonner";

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone: string;
  profilePicture: string;
}

interface SendUserNotificationDialogProps {
  user: User;
}

export function SendUserNotificationDialog({
  user,
}: SendUserNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const { mutate, isPending } = useSendUserNotification(user._id);
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
            "Push notification has been sent to a user successfully!",
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
        <Button variant="outline" size="sm">
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a push notification to this user.
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name || "Unknown User"}</p>
            <p className="text-sm text-muted-foreground">
              {user.email || user.phone}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="e.g., Special Offer"
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
                placeholder="e.g., You have a special discount waiting for you!"
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
