import { Badge } from "@/components/ui/badge";
import { TableNavigateAction } from "@/components/data_tables/TableNavigateAction";
import { type ColumnDef } from "@tanstack/react-table";

export type BookingRow = {
  _id: string;
  ticketId: string;
  whoBooked: string;
  route: string;
  seats: string;
  passengers: number;
  amount: number;
  date: string;
  status: string;
};

export const columns: ColumnDef<BookingRow>[] = [
  {
    accessorKey: "ticketId",
    header: "Ticket ID",
    cell: ({ row }) => (
      <span className="font-mono text-[11px] font-semibold text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
        #{row.getValue<string>("ticketId").slice(-8)}
      </span>
    ),
  },
  {
    accessorKey: "whoBooked",
    header: "User",
    cell: ({ row }) => <span className="font-medium text-white/90">{row.getValue("whoBooked")}</span>,
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const routeStr = row.getValue<string>("route");
      const [from, to] = routeStr.split(" - ");
      return (
        <div className="flex items-center gap-1.5 font-medium text-white/80 text-sm">
          {from ? from : routeStr} {to && <span className="text-white/30 mx-1">→</span>} {to && to}
        </div>
      );
    },
  },
  {
    accessorKey: "seats",
    header: "Seats",
    cell: ({ row }) => {
      const seats = row.getValue<string>("seats");
      if (!seats) return <span className="text-white/30">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {seats.split(", ").map(seat => (
            <Badge key={seat} variant="outline" className="font-mono text-[10px] bg-white/5 border-white/10 text-white/70 px-1 py-0">{seat}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "passengers",
    header: "Passengers",
    cell: ({ row }) => (
      <span className="font-medium text-white/80">{row.getValue("passengers")}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <span className="font-bold text-white tracking-tight">Rs. {amount.toLocaleString("en-IN")}</span>;
    },
  },
  {
    accessorKey: "date",
    header: "Booking Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <span className="text-sm font-medium text-white/60">
           {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string).toLowerCase();
      
      const isBooked = status === "booked" || status === "confirmed";
      const isCancelled = status === "cancelled";

      return (
        <Badge 
          className="capitalize px-2 py-0.5 font-bold"
          variant="outline"
          style={{
            backgroundColor: isBooked ? "rgba(211, 217, 37, 0.1)" : isCancelled ? "rgba(244, 63, 94, 0.1)" : "rgba(255, 255, 255, 0.05)",
            color: isBooked ? "#D3D925" : isCancelled ? "#f43f5e" : "#fff",
            borderColor: isBooked ? "rgba(211, 217, 37, 0.2)" : isCancelled ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
          }}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <TableNavigateAction to={`/admin/bookings/${row.original._id}`} label="View booking details" title="View Details" muted />,
  },
];
