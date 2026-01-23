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
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Owner = {
  id:string;
  fleetId: string;
  operator: string;
  route: string;
  status: string;
  capacity: number;
  busType: string;
  approvedAt: string;
};

export const columns: ColumnDef<Owner>[] = [
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
    header: "Bus Id",
  },
  {
    accessorKey: "operator",
    header: "Operator",
  },
  {
    accessorKey: "route",
    header: "Route",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return <Badge variant={status.toLowerCase() as BadgeProps["variant"]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    accessorKey: "busType",
    header: "Bus Type",
    cell: ({ row }) => {
      const { busType } = row.original;
      return (
        <Badge variant={"Success"}>
          {busType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "approvedAt",
    header: "Approved At",
    cell:({row})=>{
      const {approvedAt}=row.original;
      return(
        <span>{new Date(approvedAt)?.toDateString()}</span>
      )
    }
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
              onClick={() => navigate(`${window.location}/${id}`)}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
