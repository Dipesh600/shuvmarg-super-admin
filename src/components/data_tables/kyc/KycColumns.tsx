import { Badge } from "@/components/ui/badge";
import { TableNavigateAction } from "@/components/data_tables/TableNavigateAction";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck, Clock, XCircle } from "lucide-react";

/* ─── Status Badge helpers ──────────────────────────────────────── */

// Bus Owner KYC uses lowercase strings from the KYC endpoint
const getOwnerStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-black text-[10px] uppercase tracking-widest">Rejected</Badge>;
    case "under_review":
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black text-[10px] uppercase tracking-widest">Under Review</Badge>;
    default:
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black text-[10px] uppercase tracking-widest">Pending</Badge>;
  }
};

// Fleet KYC uses UPPERCASE from approvalStatus field
const getFleetApprovalBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return (
        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
          <ShieldCheck className="h-3 w-3" />
          <span className="font-black text-[10px] uppercase tracking-widest">Approved</span>
        </div>
      );
    case "REJECTED":
      return (
        <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full w-fit">
          <XCircle className="h-3 w-3" />
          <span className="font-black text-[10px] uppercase tracking-widest">Rejected</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
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
      <span className="font-mono text-[10px] text-white/60">{row.original.busownerId}</span>
    ),
  },
  {
    accessorKey: "companyname",
    header: "Company",
    cell: ({ row }) => <span className="font-bold text-sm text-white">{row.original.companyname || "—"}</span>,
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="font-medium text-sm text-white">{row.original.owner || "—"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-white/60">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
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
    cell: ({ row }) => (
      <TableNavigateAction
        to={`/admin/kyc/bus-owner/${row.original.ownerId}`}
        label="Review bus owner KYC"
        muted
      />
    ),
  },
];

/* ================= AGENT ================= */

export const agentColumns: ColumnDef<any>[] = [
  {
    accessorKey: "agentId",
    header: "KYC ID",
    cell: ({ row }) => <span className="font-mono text-[10px] text-white/60">{row.original.agentId}</span>,
  },
  {
    accessorKey: "owner",
    header: "Agent Name",
    cell: ({ row }) => <span className="font-bold text-sm text-white">{row.original.owner || "—"}</span>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <span className="text-sm text-white">{row.original.location || "—"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-white/60">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
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
    cell: ({ row }) => (
      <TableNavigateAction
        to={`/admin/kyc/agent/${row.original.id}`}
        label="Review agent KYC"
        muted
      />
    ),
  },
];

/* ================= FLEET ================= */

export const fleetColumns: ColumnDef<any>[] = [
  {
    accessorKey: "fleetId",
    header: "Fleet ID",
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-white/60">{row.original.fleetId}</span>
    ),
  },
  {
    accessorKey: "busName",
    header: "Bus Name",
    cell: ({ row }) => <span className="font-bold text-sm text-white">{row.original.busName || "—"}</span>,
  },
  {
    accessorKey: "busNumber",
    header: "Reg. Number",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold uppercase bg-white/5 text-white border border-white/10 px-1.5 py-0.5 rounded">
        {row.original.busNumber || "—"}
      </span>
    ),
  },
  {
    accessorKey: "brandName",
    header: "Brand",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-white/60">
        {row.original.brandName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="text-sm text-white">{row.original.owner || "—"}</span>,
  },
  {
    accessorKey: "submitdate",
    header: "Submitted",
    cell: ({ row }) => <span className="text-xs text-white/60">{fmtDate(row.original.submitdate)}</span>,
  },
  {
    accessorKey: "documents",
    header: "Docs",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
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
    cell: ({ row }) => (
      <TableNavigateAction
        to={`/admin/kyc/fleet/${row.original.id}`}
        label="Review fleet KYC"
        muted
      />
    ),
  },
];
