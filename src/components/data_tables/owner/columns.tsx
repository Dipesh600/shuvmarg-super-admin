import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BusOwner = {
  id: string,
  busOwnerKycId?: string,
  name: string,
  phone: string
  profileImg: string
  email: string
  verified: string
  status: string
}

const OwnerActionsCell = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
      onClick={() => navigate(`/admin/bus-owners/${id}`)}
      title="View Profile"
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">View Profile</span>
    </Button>
  );
};

export const columns: ColumnDef<BusOwner>[] = [
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
      return <Badge variant={status as BadgeProps["variant"]} className="font-bold">{status}</Badge>;
    },
  },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => {
      const { verified } = row.original;
      return <Badge variant={verified ? "Verified" : "Pending"} className="font-bold">{verified ? "verified" : "pending"}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <OwnerActionsCell id={row.original.id} />,
  },
];
