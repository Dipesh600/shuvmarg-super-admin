import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, XCircle, Eye } from "lucide-react";

/* ─── Status Badge helpers ──────────────────────────────────────── */

// Bus Owner KYC uses lowercase strings from the KYC endpoint
const getOwnerStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black text-[10px] uppercase tracking-widest">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-black text-[10px] uppercase tracking-widest">Rejected</Badge>;
    case "under_review":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-black text-[10px] uppercase tracking-widest">Under Review</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-black text-[10px] uppercase tracking-widest">Pending</Badge>;
  }
};

// Fleet KYC uses UPPERCASE from approvalStatus field
const getFleetApprovalBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return (
        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
          <ShieldCheck className="h-3 w-3" />
          <span className="font-black text-[10px] uppercase tracking-widest">Approved</span>
        </div>
      );
    case "REJECTED":
      return (
        <div className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full w-fit">
          <XCircle className="h-3 w-3" />
          <span className="font-black text-[10px] uppercase tracking-widest">Rejected</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
          <Clock className="h-3 w-3" />
          <span className="font-black text-[10px] uppercase tracking-widest">Pending</span>
        </div>
      );
  }
};

/* ─── Date formatter ────────────────────────────────────────────── */
const fmtDate = (raw: string | undefined | null) => {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/* ================= BUS OWNER ================= */

export const busOwnerColumns: ColumnDef<any>[] = [
  {
    accessorKey: "busownerId",
    header: "KYC ID",
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-muted-foreground">{row.original.busownerId}</span>
    ),
  },
  {
    accessorKey: "companyname",
    header: "Company",
    cell: ({ row }) => <span className="font-bold text-sm">{row.original.companyname || "—"}</span>,
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="font-medium text-sm">{row.original.owner || "—"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded-md">
        {row.original.documents ?? 0} files
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getOwnerStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const status = row.original.status?.toLowerCase();

      if (status === "approved") {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 font-black text-[10px] uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate(`/admin/kyc/bus-owner/${row.original.ownerId}`)}
          >
            <ShieldCheck className="h-3 w-3" /> Approved
          </Button>
        );
      }
      if (status === "rejected") {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 font-black text-[10px] uppercase tracking-widest text-rose-700 hover:bg-rose-50"
            onClick={() => navigate(`/admin/kyc/bus-owner/${row.original.ownerId}`)}
          >
            <Eye className="h-3 w-3" /> View Decision
          </Button>
        );
      }
      return (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-black text-[10px] uppercase tracking-widest border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => navigate(`/admin/kyc/bus-owner/${row.original.ownerId}`)}
        >
          <Clock className="h-3 w-3" /> Review
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
    cell: ({ row }) => <span className="font-mono text-[10px] text-muted-foreground">{row.original.agentId}</span>,
  },
  {
    accessorKey: "companyname",
    header: "Agent Name",
    cell: ({ row }) => <span className="font-bold text-sm">{row.original.companyname || "—"}</span>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <span className="text-sm">{row.original.location ?? "Biratnagar"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded-md">
        {row.original.documents ?? 0} files
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getOwnerStatusBadge(row.original.status),
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
          className="font-black text-[10px] uppercase tracking-widest"
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
    header: "Fleet ID",
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-muted-foreground">{row.original.fleetId}</span>
    ),
  },
  {
    accessorKey: "busName",
    header: "Bus Name",
    cell: ({ row }) => <span className="font-bold text-sm">{row.original.busName || "—"}</span>,
  },
  {
    accessorKey: "busNumber",
    header: "Reg. Number",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold uppercase bg-muted/40 px-1.5 py-0.5 rounded">
        {row.original.busNumber || "—"}
      </span>
    ),
  },
  {
    accessorKey: "brandName",
    header: "Brand",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-muted-foreground">
        {row.original.brandName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="text-sm">{row.original.owner || "—"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded-md">
        {row.original.documents ?? 0} files
      </span>
    ),
  },
  {
    accessorKey: "approvalStatus",
    header: "KYC Status",
    cell: ({ row }) => getFleetApprovalBadge(row.original.approvalStatus),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const status = row.original.approvalStatus?.toUpperCase();

      if (status === "APPROVED") {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 font-black text-[10px] uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate(`/admin/kyc/fleet/${row.original.id}`)}
          >
            <ShieldCheck className="h-3 w-3" /> Approved
          </Button>
        );
      }
      if (status === "REJECTED") {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 font-black text-[10px] uppercase tracking-widest text-rose-700 hover:bg-rose-50"
            onClick={() => navigate(`/admin/kyc/fleet/${row.original.id}`)}
          >
            <Eye className="h-3 w-3" /> View Decision
          </Button>
        );
      }
      return (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-black text-[10px] uppercase tracking-widest border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => navigate(`/admin/kyc/fleet/${row.original.id}`)}
        >
          <Clock className="h-3 w-3" /> Review
        </Button>
      );
    },
  },
];
