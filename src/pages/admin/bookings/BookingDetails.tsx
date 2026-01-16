import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, RefreshCw, XCircle, CheckCircle, Clock, AlertTriangle, User, MapPin, Calendar, Bus, CreditCard, Ticket } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock booking data
  const booking = {
    id: id || "BKG-001234",
    status: "Confirmed",
    createdAt: "2024-01-28 14:32:45",
    user: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+977-9841234567",
      userId: "USR-001"
    },
    passengers: [
      { name: "Rajesh Kumar", age: 32, gender: "Male", seatNo: "A4" },
      { name: "Sunita Kumar", age: 28, gender: "Female", seatNo: "A5" }
    ],
    route: {
      from: "Kathmandu",
      to: "Pokhara",
      code: "KTM-PKR",
      distance: "200 km",
      duration: "6 hours"
    },
    travel: {
      date: "2024-01-30",
      departureTime: "06:00 AM",
      arrivalTime: "12:00 PM",
      boardingPoint: "Kalanki Bus Park, Kathmandu",
      droppingPoint: "Prithvi Chowk, Pokhara"
    },
    bus: {
      name: "Deluxe Express",
      number: "Ba 2 Kha 3456",
      operator: "Nepal Transport Pvt. Ltd.",
      busId: "BUS-001",
      type: "AC Deluxe",
      amenities: ["AC", "WiFi", "Charging Port", "Water Bottle"]
    },
    payment: {
      subtotal: "Rs. 1,400",
      serviceFee: "Rs. 50",
      total: "Rs. 1,450",
      method: "eSewa",
      transactionId: "TXN-001234",
      paidAt: "2024-01-28 14:32:45"
    },
    timeline: [
      { event: "Booking Created", time: "2024-01-28 14:30:00", status: "completed" },
      { event: "Payment Received", time: "2024-01-28 14:32:45", status: "completed" },
      { event: "Booking Confirmed", time: "2024-01-28 14:33:00", status: "completed" },
      { event: "Ticket Sent", time: "2024-01-28 14:33:15", status: "completed" },
      { event: "Journey Started", time: null, status: "pending" },
      { event: "Journey Completed", time: null, status: "pending" }
    ]
  };

  const handleCancelBooking = () => {
    toast.success("Booking cancellation initiated");
  };

  const handleResendTicket = () => {
    toast.success("Ticket resent to user");
  };

  const handlePrintTicket = () => {
    toast.success("Printing ticket...");
  };

  const handleDownloadTicket = () => {
    toast.success("Ticket downloaded");
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Booking Details</h2>
          <p className="text-muted-foreground mt-1">Booking ID: {booking.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleDownloadTicket}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrintTicket}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleResendTicket}>
            <RefreshCw className="h-4 w-4" />
            Resend Ticket
          </Button>
          {booking.status === "Confirmed" && (
            <Button variant="destructive" className="gap-2" onClick={handleCancelBooking}>
              <XCircle className="h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Booking Status Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon(booking.status)}
              Booking Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <Badge variant={getStatusColor(booking.status)} className="text-lg px-4 py-2">
                {booking.status}
              </Badge>
              <p className="text-3xl font-bold mt-4">{booking.payment.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Booked on {booking.createdAt}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Travel Date</span>
                <span className="font-medium">{booking.travel.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Departure</span>
                <span className="font-medium">{booking.travel.departureTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Passengers</span>
                <span className="font-medium">{booking.passengers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{booking.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{booking.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.user.phone}</p>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => navigate(`/users/${booking.user.userId}`)}
                  >
                    View User Profile →
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Passenger Details</h4>
                <div className="space-y-3">
                  {booking.passengers.map((passenger, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{passenger.name}</p>
                          <p className="text-sm text-muted-foreground">{passenger.age} yrs, {passenger.gender}</p>
                        </div>
                        <Badge variant="outline">Seat {passenger.seatNo}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Route & Travel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route & Travel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="font-bold text-lg">{booking.route.from}</p>
                <p className="text-xs text-muted-foreground">{booking.travel.departureTime}</p>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30 relative">
                <Badge className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {booking.route.duration}
                </Badge>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{booking.route.to}</p>
                <p className="text-xs text-muted-foreground">{booking.travel.arrivalTime}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{booking.route.distance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boarding Point</span>
                <span className="font-medium text-right text-sm">{booking.travel.boardingPoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dropping Point</span>
                <span className="font-medium text-right text-sm">{booking.travel.droppingPoint}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bus Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Bus Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Name</span>
                <span className="font-medium">{booking.bus.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Number</span>
                <span className="font-medium">{booking.bus.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Type</span>
                <Badge variant="outline">{booking.bus.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium">{booking.bus.operator}</span>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {booking.bus.amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary">{amenity}</Badge>
                ))}
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary"
              onClick={() => navigate(`/fleet/${booking.bus.busId}`)}
            >
              View Bus Details →
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Price ({booking.passengers.length} seats)</span>
                <span>{booking.payment.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span>{booking.payment.serviceFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>{booking.payment.total}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="outline">{booking.payment.method}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{booking.payment.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid At</span>
                <span>{booking.payment.paidAt}</span>
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate(`/transactions/${booking.payment.transactionId}`)}
              >
                View Transaction Details →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {booking.timeline.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${item.status === "completed" ? "bg-success" : "bg-muted"}`} />
                    {index < booking.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-medium">{item.event}</p>
                    <p className="text-sm text-muted-foreground">{item.time || "Pending"}</p>
                  </div>
                  <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                    {item.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BookingDetail;