import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type User = {
  id: string;
  profileImg: string;
  name: string;
  phone: string;
  bookings: number;
  totalSpent: number;
  joined: string;
  status: "active" | "inactive" | "banned";
  email: string;
  role?: string;
  roles?: string[];
  verified?: boolean;
};

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "profileImg",
    header: "Profile",
    cell: ({ row }) => {
      const { profileImg, name } = row.original;
      return (
        <div className="flex justify-center items-center">
          {profileImg ? (
            <img
              src={profileImg}
              alt={name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { phone, email } = row.original;
      return (
        <div className="text-sm">
          <div>{email || "—"}</div>
          <div className="text-muted-foreground">{phone}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Registered As",
    cell: ({ row }) => {
      const { role } = row.original;
      const label =
        role === "busOwner"
          ? "Bus Owner"
          : role === "agent"
          ? "Agent"
          : role === "conductor"
          ? "Conductor"
          : role === "driver"
          ? "Driver"
          : "Passenger";
      return (
        <Badge variant={role !== "passenger" ? "secondary" : "outline"} className="capitalize">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      const variant =
        status === "active"
          ? "default"
          : status === "banned"
          ? "destructive"
          : "secondary"; // inactive = muted
      return (
        <Badge variant={variant} className="capitalize">
          {status === "inactive" ? "Suspended" : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "bookings",
    header: "Bookings",
    cell: ({ row }) => {
      const { bookings } = row.original;
      return <span className="font-medium">{bookings}</span>;
    },
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ row }) => {
      const { joined } = row.original;
      const date = new Date(joined);
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { id } = row.original;
      const navigate = useNavigate();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/admin/users/${id}`)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
