import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar, Users, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

const bookings = [
  { id: "BKG-001234", user: "Rajesh Kumar", route: "KTM-PKR", seats: "A4, A5", passengers: 2, amount: "Rs. 1,450", status: "Confirmed", travelDate: "2024-01-30", bookedOn: "2024-01-28 14:32" },
  { id: "BKG-001235", user: "Sita Sharma", route: "KTM-CHT", seats: "B2", passengers: 1, amount: "Rs. 2,100", status: "Confirmed", travelDate: "2024-01-31", bookedOn: "2024-01-28 14:28" },
  { id: "BKG-001236", user: "Mohan Thapa", route: "KTM-BTR", seats: "C1, C2, C3", passengers: 3, amount: "Rs. 3,200", status: "Pending", travelDate: "2024-02-01", bookedOn: "2024-01-28 14:15" },
  { id: "BKG-001237", user: "Gita Rai", route: "PKR-BTW", seats: "A1", passengers: 1, amount: "Rs. 1,850", status: "Completed", travelDate: "2024-01-25", bookedOn: "2024-01-24 10:10" },
  { id: "BKG-001238", user: "Krishna Gurung", route: "KTM-JNK", seats: "D5, D6", passengers: 2, amount: "Rs. 950", status: "Cancelled", travelDate: "2024-01-29", bookedOn: "2024-01-28 14:05" },
  { id: "BKG-001239", user: "Anita Poudel", route: "BTR-KTM", seats: "B3, B4", passengers: 2, amount: "Rs. 2,400", status: "Confirmed", travelDate: "2024-02-02", bookedOn: "2024-01-28 12:30" },
];

const Bookings = () => {
  const navigate = useNavigate();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "default";
      case "Completed":
        return "secondary";
      case "Pending":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage all platform bookings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,456</div>
            <p className="text-xs text-success">+156 today</p>
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
            <div className="text-2xl font-bold">28,943</div>
            <p className="text-xs text-muted-foreground">This month</p>
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
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-success">Above target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-warning">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Booking History</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by booking ID, user, or route..." className="pl-9" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Travel Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium font-mono">{booking.id}</TableCell>
                  <TableCell>{booking.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{booking.route}</Badge>
                  </TableCell>
                  <TableCell>{booking.seats}</TableCell>
                  <TableCell>{booking.passengers}</TableCell>
                  <TableCell className="font-semibold">{booking.amount}</TableCell>
                  <TableCell className="text-sm">{booking.travelDate}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default Bookings;