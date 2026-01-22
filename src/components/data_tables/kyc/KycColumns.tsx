import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "under_review":
      return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  }
};

/* ================= BUS OWNER ================= */

export const busOwnerColumns: ColumnDef<any>[] = [
  {
    accessorKey: "busownerId",
    header: "KYC ID",
  },
  {
    accessorKey: "companyname",
    header: "Company",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => row.original.submitdate?.split("T")[0],
  },
  {
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => `${row.original.documents ?? 0} docs`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/admin/kyc/bus-owner/${row.original.ownerId}`)
          }
        >
          Review
        </Button>
      );
    },
  },
];

/* ================= AGENT ================= */

export const agentColumns: ColumnDef<any>[] = [
  {
    accessorKey: "agentId",
    header: "KYC ID",
  },
  {
    accessorKey: "companyname",
    header: "Agent Name",
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => row.original.location ?? "Biratnagar",
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => row.original.submitdate?.split("T")[0],
  },
  {
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => `${row.original.documents ?? 0} docs`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/kyc/agent/${row.original.id}`)}
        >
          Review
        </Button>
      );
    },
  },
];

/* ================= FLEET ================= */

export const fleetColumns: ColumnDef<any>[] = [
  {
    accessorKey: "fleetId",
    header: "KYC ID",
  },
  {
    accessorKey: "busNumber",
    header: "Bus Number",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => row.original.submitdate?.split("T")[0],
  },
  {
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => `${row.original.documents ?? 0} docs`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/kyc/fleet/${row.original.id}`)}
        >
          Review
        </Button>
      );
    },
  },
];
