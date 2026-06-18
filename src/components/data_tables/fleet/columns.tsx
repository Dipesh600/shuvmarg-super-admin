import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, MapPin, Users } from "lucide-react";
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

const FleetActionsCell = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
      onClick={() => navigate(`/admin/fleets/${id}/workstation`)}
      title="Open Workstation"
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Open Workstation</span>
    </Button>
  );
};

export const columns: ColumnDef<FleetRow>[] = [
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
    cell: ({ row }) => <FleetActionsCell id={row.original._id} />,
  },
];
