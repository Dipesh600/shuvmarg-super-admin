import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export type BusOwnerTableRow = {
  id: string;
  ownerCode: string | null;
  companyName: string;
  name: string;
  phone: string;
  profileImg: string | null;
  email: string;
  verificationStatus: "pending" | "approved" | "rejected";
  fleetCount: number;
  status: string;
};

export const columns: ColumnDef<BusOwnerTableRow>[] = [
  {
    accessorKey: "profileImg",
    header: "Profile Image",
    cell: ({ row }) => {
      const { profileImg } = row.original;
      return profileImg ? (
        <div className="flex justify-center items-center">
          <img
            src={profileImg}
            alt={`${row.original.name} profile`}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      ) : (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/80">
          {row.original.name.slice(0, 1).toUpperCase() || "O"}
        </div>
      );
    },
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-white/90">{row.original.companyName}</div>
        <div className="text-xs text-white/40">{row.original.ownerCode || "Code pending"}</div>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Bus Owner",
    cell: ({ row }) => <span className="font-medium text-white/90">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { phone, email } = row.original;
      const isInternal = email && email.includes("@shuvmarg.internal");
      return (
        <div className="text-sm">
          <div>{isInternal ? <span className="text-white/40 italic">No email provided</span> : <span className="text-white/80">{email}</span>}</div>
          <div className="text-white/60 font-medium">{phone}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return <Badge variant={status === "active" ? "active" : "destructive"} className="font-bold capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: "verificationStatus",
    header: "Verification",
    cell: ({ row }) => {
      const { verificationStatus } = row.original;
      const variant = verificationStatus === "approved"
        ? "Verified"
        : verificationStatus === "rejected"
          ? "Rejected"
          : "Pending";
      return <Badge variant={variant} className="font-bold capitalize">{verificationStatus}</Badge>;
    },
  },
  {
    accessorKey: "fleetCount",
    header: "Fleet",
    cell: ({ row }) => <span className="font-semibold text-white/80">{row.original.fleetCount}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
      >
        <Link to={`/admin/bus-owners/${row.original.id}`} title="View Profile">
          <ArrowRight className="h-4 w-4" />
          <span className="sr-only">View Profile</span>
        </Link>
      </Button>
    ),
  },
];
