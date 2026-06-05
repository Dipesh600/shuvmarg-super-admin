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

export type UserBooking = {
  id: string;
  scheduleRoute: {
    from: string;
    to: string;
  };
  tripRoute?: {
    from: string;
    to: string;
  } | null;
  amount: number;

  bookedAt: string;
  status: "booked" | "cancelled";
};

export const UserBooking: ColumnDef<UserBooking>[] = [
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
    accessorKey: "id",
    header: "BookingId",
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const { scheduleRoute, tripRoute } = row.original;
      return (
        <div>
          <div className="font-medium">
            {scheduleRoute.from} → {scheduleRoute.to}
          </div>
          {tripRoute && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Trip: {tripRoute.from} → {tripRoute.to}
            </div>
          )}
        </div>
      );
    },
  },


  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return (
        <Badge
          className="capitalize"
          variant={status === "booked" ? "default" : "destructive"}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const { amount } = row.original;
      return <span>Rs.{amount}</span>;
    },
  },
  {
    accessorKey: "bookedAt",
    header: "BookingDate",
    cell: ({ row }) => {
      const { bookedAt } = row.original;
      const date = new Date(bookedAt);
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
            <DropdownMenuItem
              onClick={() =>
                navigate(`${window.location}/booking/details/${id}`)
              }
            >
              View Booking Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
