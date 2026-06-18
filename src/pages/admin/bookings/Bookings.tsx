import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Ban, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getBookingStats, getAllBookings } from "@/api/bookingsApi";
import BookingsSkeleton from "@/components/Skeletion_Loading/BookingsSkeleton";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/data_tables/bookings/columns";

import { StatCard } from "@/components/dashboard/StatCard";

const Bookings = () => {
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["bookingStats"],
    queryFn: getBookingStats,
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["allBookings"],
    queryFn: getAllBookings,
  });

  if (isStatsLoading || isBookingsLoading) {
    return <BookingsSkeleton />;
  }

  const stats = statsData?.data || {
    totalBookings: 0,
    totalPassengers: 0,
    cancelledBookings: 0,
    confirmationRate: "0%"
  };

  const bookings = bookingsData?.data || [];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Booking Management</h2>
          <p className="text-sm text-white/60 mt-1 font-medium">Monitor and manage all platform bookings</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          icon={Calendar}
          subtitle="Lifetime total"
          changeType="neutral"
        />
        <StatCard
          title="Total Passengers"
          value={stats.totalPassengers.toLocaleString()}
          icon={Users}
          subtitle="Across all trips"
          changeType="neutral"
        />
        <StatCard
          title="Confirmation Rate"
          value={stats.confirmationRate}
          icon={TrendingUp}
          subtitle="Successful checkouts"
          changeType="positive"
        />
        <StatCard
          title="Cancelled Bookings"
          value={stats.cancelledBookings.toLocaleString()}
          icon={Ban}
          subtitle="User cancellations"
          changeType="negative"
        />
      </div>

      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">Booking History</CardTitle>
              <CardDescription className="text-white/50">Search and manage all bus bookings</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={bookings}
            pageSize={20}
            searchPlaceholder="Search by ticket ID, user, or route..."
          />
        </CardContent>
      </Card>
    </>
  );
};

export default Bookings;