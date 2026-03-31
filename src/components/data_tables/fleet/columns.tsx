import { Badge, type BadgeProps } from "@/components/ui/badge";
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
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type FleetRow = {
  _id: string;
  fleetId: string;
  busNumber: string;
  busName: string;
  operator: string;
  route: string;
  seatCapacity: number;
  busType: string;
  status: string;
  approvalStatus: string;
};

export const columns: ColumnDef<FleetRow>[] = [
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
    accessorKey: "fleetId",
    header: "Fleet ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.fleetId}</span>,
  },
  {
    accessorKey: "busName",
    header: "Bus Details",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold">{row.original.busName}</span>
        <span className="text-xs text-muted-foreground uppercase">{row.original.busNumber}</span>
      </div>
    ),
  },
  {
    accessorKey: "operator",
    header: "Operator",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.operator}</span>
    ),
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs">{row.original.route}</span>
      </div>
    ),
  },
  {
    accessorKey: "seatCapacity",
    header: "Capacity",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.seatCapacity}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status.toUpperCase();
      const variant = status === "ACTIVE" ? "default" : "destructive";
      return <Badge variant={variant as BadgeProps["variant"]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => {
      const status = row.original.approvalStatus;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      
      if (status === "APPROVED") variant = "default";
      if (status === "PENDING") variant = "secondary";
      if (status === "REJECTED") variant = "destructive";

      return (
        <Badge variant={variant} className="capitalize">
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { _id } = row.original;
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
              className="cursor-pointer"
              onClick={() => navigate(`/admin/fleets/${_id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
