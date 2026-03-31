import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, MapPin, Edit3 } from "lucide-react";

export type BoardingPointGroup = {
  _id: string;
  city: string;
  description: string;
  status: boolean;
  boardingPoints: any[];
  createdAt: string;
};

interface ColumnProps {
  onView: (id: string) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({ onView, onUpdate, onDelete }: ColumnProps): ColumnDef<BoardingPointGroup>[] => [
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary/60" />
        <span className="font-bold">{row.original.city}</span>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
        {row.original.description || "No description"}
      </span>
    ),
  },
  {
    accessorKey: "boardingPoints",
    header: "Locations",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-[10px] tracking-tight">
        {row.original.boardingPoints?.length || 0} Points
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status ? "default" : "outline"} className="uppercase text-[9px] font-black tracking-widest">
        {row.original.status ? "ACTIVE" : "INACTIVE"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => (
      <span className="text-xs font-medium opacity-60">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { _id } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-40">Operations</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(_id)} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate(_id)} className="cursor-pointer">
              <Edit3 className="mr-2 h-4 w-4" />
              Update Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(_id)} 
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
