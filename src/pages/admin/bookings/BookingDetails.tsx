import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, RefreshCw, XCircle, CheckCircle, Clock, User, MapPin, Calendar, Bus, ExternalLink, Ticket } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getBookingById } from "@/api/bookingsApi";
import BookingDetailSkeleton from "@/components/Skeletion_Loading/BookingDetailSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: bookingResponse, isLoading, isError, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id as string),
    enabled: !!id,
  });

  if (isLoading) return <BookingDetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Failed to load booking</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button onClick={() => navigate("/admin/bookings")}>Back to Bookings</Button>
      </div>
    );
  }

  const booking = bookingResponse?.data;

  const handleCancelBooking = () => {
    toast.success("Booking cancellation initiated");
  };

  const handleResendTicket = () => {
    toast.success("Ticket resent to user");
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "booked":
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "booked":
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bookings")} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight truncate">Booking Details</h2>
            <Badge variant={getStatusColor(booking.status)} className="capitalize">
              {booking.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Ticket ID: <span className="font-mono font-medium">{booking.ticketId}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="gap-2 flex-1 md:flex-none" onClick={handlePrintTicket}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2 flex-1 md:flex-none" onClick={handleResendTicket}>
            <RefreshCw className="h-4 w-4" />
            Resend Ticket
          </Button>
          {(booking.status.toLowerCase() === "booked" || booking.status.toLowerCase() === "confirmed") && (
            <Button variant="destructive" size="sm" className="gap-2 flex-1 md:flex-none" onClick={handleCancelBooking}>
              <XCircle className="h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment & Summary Card */}
        <Card className="lg:col-span-1 shadow-sm border-t-4 border-t-primary h-fit">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg text-muted-foreground uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
              {getStatusIcon(booking.status)}
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-2">
              <p className="text-4xl font-black text-primary tracking-tight">Rs. {booking.totalAmount.toLocaleString()}</p>
              {booking.discountAmount > 0 && (
                <p className="text-sm text-destructive line-through mt-1">
                  Rs. {booking.originalAmount.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Booked on {new Date(booking.bookedAt).toLocaleString()}
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Travel Date</span>
                <span className="font-bold">{new Date(booking.tripId.tripDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> From</span>
                <span className="font-bold">{booking.tripId.departureTime}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Seats</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {booking.seats.map((seat: string) => (
                    <Badge key={seat} variant="secondary" className="text-[10px] uppercase">{seat}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Breakdown</h4>
              <div className="flex justify-between text-sm">
                <span>Base Fare</span>
                <span>Rs. {booking.originalAmount.toLocaleString()}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-destructive font-medium">
                  <span>Coupon Discount</span>
                  <span>-Rs. {booking.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {booking.yatraPointsUsed > 0 && (
                <div className="flex justify-between text-sm text-primary font-medium">
                  <span>Yatra Points Used ({booking.yatraPointsUsed})</span>
                  <span>-Rs. {booking.yatraPointsDiscount.toLocaleString()}</span>
                </div>
              )}
              <Separator className="bg-primary/20" />
              <div className="flex justify-between font-black text-lg text-primary">
                <span>Total Paid</span>
                <span>Rs. {booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Cards Container */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="shadow-sm border-l-4 border-l-primary/60">
            <CardHeader className="pb-3 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <Avatar className="h-20 w-20 border-4 border-muted">
                  <AvatarImage src={booking.userId.profilePicture} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {booking.userId.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 flex-1">
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-1">Full Name</h5>
                    <p className="font-bold text-lg">{booking.userId.name}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-1">Phone Number</h5>
                    <p className="font-bold text-lg underline underline-offset-4 decoration-primary/30">{booking.userId.phone}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-1">Email Address</h5>
                    <p className="font-medium text-muted-foreground">{booking.userId.email}</p>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary font-bold hover:no-underline group"
                      onClick={() => navigate(`/admin/users/${booking.userId._id}`)}
                    >
                      View Full Profile <ExternalLink className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip & Bus Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Travel Info */}
            <Card className="shadow-sm border-l-4 border-l-primary/60">
              <CardHeader className="pb-3 px-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="space-y-4 p-4 bg-muted/40 rounded-xl border border-muted/60">
                    <div className="flex justify-between items-center pr-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 px-1">Source</p>
                        <p className="font-black text-xl">{booking.tripId.routeId.from}</p>
                      </div>
                      <div className="flex flex-col items-center flex-1 px-4">
                        <Badge variant="outline" className="text-[9px] mb-1 font-bold">{booking.tripId.routeId.duration}</Badge>
                        <div className="w-full h-[2px] bg-primary relative">
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-[9px] mt-1 text-muted-foreground">{booking.tripId.routeId.distance}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Destination</p>
                        <p className="font-black text-xl">{booking.tripId.routeId.to}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg border border-dashed">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Departure</p>
                       <p className="font-bold">{booking.tripId.departureTime}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg border border-dashed">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Arrival</p>
                       <p className="font-bold">{booking.tripId.arrivalTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bus Info */}
            <Card className="shadow-sm border-l-4 border-l-primary/60">
              <CardHeader className="pb-3 px-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 space-y-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/admin/fleets/${booking.tripId.busId._id}`)}>
                    <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-0.5">Bus Name</p>
                      <p className="font-black text-lg group-hover:text-primary transition-colors">{booking.tripId.busId.busName}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold uppercase tracking-tighter text-[10px]">VEHICLE REG</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-0.5">Plate Number</p>
                      <p className="font-bold font-mono text-sm bg-muted/60 w-fit px-2 py-0.5 rounded">{booking.tripId.busId.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-0.5">Service Type</p>
                      <Badge variant="outline" className="font-black text-[10px] border-primary/40 text-primary">{booking.tripId.busId.busType}</Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />

                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Shift Mode</p>
                   <Badge className="font-black h-5 text-[9px] uppercase">{booking.tripId.shift}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingDetail;