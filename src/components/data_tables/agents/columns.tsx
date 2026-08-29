import { Badge } from "@/components/ui/badge";
import { TableNavigateAction } from "@/components/data_tables/TableNavigateAction";
import type { ColumnDef } from "@tanstack/react-table";

type Agent = {
  id: string;
  name: string;
  location: string;
  status: string;
  commission: string;
  performance: string;
  applications: number;
  profileImg: string;
};

export const columns: ColumnDef<Agent>[] = [
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
    header: "Name",
    cell: ({ row }) => <span className="font-medium text-white/90">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <span className="text-white/80">{row.getValue("location")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return <Badge variant="outline" className={status ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10 font-bold" : "text-rose-500 border-rose-500/20 bg-rose-500/10 font-bold"}>{status ? "Verified" : "Rejected"}</Badge>;
    },
  },
  {
    accessorKey: "commission",
    header: "Commission",
    cell: ({ row }) => <span className="text-[#D3D925] font-medium">{row.getValue("commission")}</span>,
  },
  {
    accessorKey: "performance",
    header: "Performance",
    cell: ({ row }) => <span className="text-white/80">{row.getValue("performance")}</span>,
  },
  {
    accessorKey: "applications",
    header: "Applications",
    cell: ({ row }) => <span className="text-white/80">{row.getValue("applications")}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <TableNavigateAction to={`/admin/agents/${row.original.id}`} label="View agent profile" title="View Profile" muted />,
  },
];
