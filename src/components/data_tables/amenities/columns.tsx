import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit3, Eye, MoreHorizontal, Trash2 } from "lucide-react";

export interface AmenityRow { _id: string; name: string; description?: string; icon?: string; status: boolean; createdAt?: string; }

export const getColumns = (onView: (id: string) => void, onUpdate: (id: string) => void, onDelete: (id: string) => void): ColumnDef<AmenityRow>[] => [
  { accessorKey: "name", header: "Amenity", cell: ({ row }) => <div><p className="font-bold">{row.original.name}</p><p className="max-w-[360px] truncate text-xs text-muted-foreground">{row.original.description || "No passenger-facing description"}</p></div> },
  { accessorKey: "icon", header: "Icon key", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.icon || "sparkles"}</span> },
  { accessorKey: "status", header: "Availability", cell: ({ row }) => <Badge variant={row.original.status ? "default" : "outline"}>{row.original.status ? "Active" : "Inactive"}</Badge> },
  { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}</span> },
  { id: "actions", cell: ({ row }) => <div className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Amenity actions</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onView(row.original._id)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem><DropdownMenuItem onClick={() => onUpdate(row.original._id)}><Edit3 className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original._id)}><Trash2 className="mr-2 h-4 w-4" />Delete if unused</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div> },
];
