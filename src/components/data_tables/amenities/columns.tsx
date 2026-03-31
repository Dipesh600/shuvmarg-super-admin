import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit3, Trash2, Zap } from "lucide-react";

export const getColumns = (
  onView: (id: string) => void,
  onUpdate: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "_id",
    header: "Config ID",
    cell: ({ row }) => <span className="font-mono text-xs opacity-50">#{row.getValue("_id")?.toString().slice(-6)}</span>,
  },
  {
    accessorKey: "amenities",
    header: "Amenities",
    cell: ({ row }) => {
      const amenities = row.getValue("amenities") as any[];
      return (
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Zap className="h-3 w-3" />
            </div>
            <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                {amenities?.length || 0} Items
            </Badge>
            <span className="text-xs font-bold truncate max-w-[150px] opacity-70 italic">
                {amenities?.[0]?.name}{amenities?.length > 1 ? `, ${amenities[1].name}...` : ""}
            </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as boolean;
      return (
        <Badge 
           variant={status ? "default" : "outline"} 
           className={`uppercase text-[10px] font-black tracking-widest ${status ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" : "opacity-40"}`}
        >
          {status ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => {
      return (
        <span className="text-xs font-bold opacity-60">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const id = row.original._id;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-1">Configuration</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onView(id)}
                className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer font-bold"
              >
                <Eye className="h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onUpdate(id)}
                className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer font-bold"
              >
                <Edit3 className="h-4 w-4" /> Update Config
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(id)}
                className="gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold"
              >
                <Trash2 className="h-4 w-4" /> Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
