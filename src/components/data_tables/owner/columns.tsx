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
import {  MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BusOwner = {
  id: string,
      name: string,
      phone:string
      profileImg: string
      email:string
      verified:string  
        status:string}
 export const columns: ColumnDef<BusOwner>[] = [
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
    header: "Profile Image",
    cell: ({ row }) => {
      const { profileImg } = row.original;
      return (
        <div className="flex justify-center items-center">
          <img
            src={profileImg}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      );
    },
  },
  {
    accessorKey:"name",
    header:"Bus Owner"
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { phone, email } = row.original;
      return (
        <div className="text-sm">
          <div>{email}</div>
          <div className="text-muted-foreground">{phone}</div>
        </div>
      );
    },
  },
  
  
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return <Badge variant={status as BadgeProps["variant"]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => {
      const { verified } = row.original;
      return <Badge variant={verified ? "Verified" :"Pending" }>{ verified ? "verified" :"pending"}</Badge>;
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
            <DropdownMenuItem onClick={() => navigate(`${window.location}/${id}`)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>View customer</DropdownMenuItem> */}
            {/* <DropdownMenuItem>View payment details</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
