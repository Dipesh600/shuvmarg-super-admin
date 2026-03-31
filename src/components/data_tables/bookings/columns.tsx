import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type BookingRow = {
  _id: string;
  ticketId: string;
  whoBooked: string;
  route: string;
  seats: string;
  passengers: number;
  amount: number;
  date: string;
  status: string;
};

export const columns: ColumnDef<BookingRow>[] = [
  {
    accessorKey: "ticketId",
    header: "Ticket ID",
    cell: ({ row }) => <span className="font-mono font-medium">{row.getValue("ticketId")}</span>,
  },
  {
    accessorKey: "whoBooked",
    header: "User",
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue("route")}
      </Badge>
    ),
  },
  {
    accessorKey: "seats",
    header: "Seats",
  },
  {
    accessorKey: "passengers",
    header: "Passengers",
    cell: ({ row }) => <span className="text-center block">{row.getValue("passengers")}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <span className="font-semibold">Rs. {amount.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "date",
    header: "Travel Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string).toLowerCase();
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      
      if (status === "booked" || status === "confirmed") variant = "default";
      if (status === "completed") variant = "secondary";
      if (status === "cancelled") variant = "destructive";

      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const booking = row.original;

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
              className="cursor-pointer"
              onClick={() => navigate(`/admin/bookings/${booking._id}`)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
