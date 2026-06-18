import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type User = {
  id: string;
  profileImg: string;
  name: string;
  phone: string;
  bookings: number;
  totalSpent: number;
  joined: string;
  status: "active" | "inactive" | "banned";
  email: string;
  verified?: boolean;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "profileImg",
    header: "Profile",
    cell: ({ row }) => {
      const { profileImg, name } = row.original;
      return (
        <div className="flex justify-center items-center">
          {profileImg ? (
            <img
              src={profileImg}
              alt={name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { phone, email } = row.original;
      return (
        <div className="text-sm">
          <div>{email || "—"}</div>
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
      return (
        <Badge 
          variant="outline" 
          className={
            status === "active" 
              ? "capitalize bg-[#D3D925]/10 text-[#D3D925] border-[#D3D925]/20 font-medium" 
              : status === "banned"
              ? "capitalize bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium"
              : "capitalize bg-white/5 text-white/50 border-white/10 font-medium"
          }
        >
          {status === "inactive" ? "Suspended" : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "bookings",
    header: "Bookings",
    cell: ({ row }) => {
      const { bookings } = row.original;
      return <span className="font-medium">{bookings}</span>;
    },
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ row }) => {
      const { joined } = row.original;
      const date = new Date(joined);
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { id } = row.original;
      const navigate = useNavigate();
      return (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-white hover:bg-white/10"
          onClick={() => navigate(`/admin/users/${id}`)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      );
    },
  },
];
