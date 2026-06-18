import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight, MapPin, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type UserBooking = {
  id: string;
  scheduleRoute: {
    from: string;
    to: string;
  };
  tripRoute?: {
    from: string;
    to: string;
  } | null;
  amount: number;
  bookedAt: string;
  status: "booked" | "cancelled";
};

export const UserBooking: ColumnDef<UserBooking>[] = [
  {
    accessorKey: "id",
    header: "Booking ID",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <span className="font-mono text-xs text-muted-foreground uppercase bg-white/5 px-2 py-1 rounded">
          #{id.slice(-8)}
        </span>
      );
    },
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const { scheduleRoute, tripRoute } = row.original;
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-medium text-white/90">
            <MapPin className="h-3.5 w-3.5 text-[#D3D925]" />
            {scheduleRoute.from} <span className="text-muted-foreground mx-1">→</span> {scheduleRoute.to}
          </div>
          {tripRoute && (
            <div className="text-[10px] text-muted-foreground pl-5 uppercase tracking-wide">
              Trip: {tripRoute.from} → {tripRoute.to}
            </div>
          )}
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
          className="capitalize px-2 py-0.5"
          variant="outline"
          style={{
            backgroundColor: status === "booked" ? "rgba(211, 217, 37, 0.1)" : "rgba(244, 63, 94, 0.1)",
            color: status === "booked" ? "#D3D925" : "#f43f5e",
            borderColor: status === "booked" ? "rgba(211, 217, 37, 0.2)" : "rgba(244, 63, 94, 0.2)",
          }}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const { amount } = row.original;
      return <span className="font-semibold text-white/90">Rs. {amount.toLocaleString("en-IN")}</span>;
    },
  },
  {
    accessorKey: "bookedAt",
    header: "Date",
    cell: ({ row }) => {
      const { bookedAt } = row.original;
      const date = new Date(bookedAt);
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
           <CalendarClock className="h-3.5 w-3.5" />
           {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      );
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
          onClick={() => navigate(`/admin/bookings/${id}`)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      );
    },
  },
];
