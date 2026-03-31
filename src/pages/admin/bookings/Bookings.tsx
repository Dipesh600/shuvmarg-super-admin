import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Ban, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getBookingStats, getAllBookings } from "@/api/bookingsApi";
import BookingsSkeleton from "@/components/Skeletion_Loading/BookingsSkeleton";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/data_tables/bookings/columns";

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
          <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
          <p className="text-muted-foreground mt-1">Monitor and manage all platform bookings</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Passengers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPassengers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Confirmation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmationRate}</div>
            <p className="text-xs text-success">Successful checkouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Cancelled Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledBookings.toLocaleString()}</div>
            <p className="text-xs text-destructive">User cancellations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Search and manage all bus bookings</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
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