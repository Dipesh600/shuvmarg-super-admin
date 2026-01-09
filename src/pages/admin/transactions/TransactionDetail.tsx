import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Receipt, RefreshCw, AlertTriangle, CheckCircle, Clock, CreditCard, User, MapPin, Calendar } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const TransactionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock transaction data based on ID
  const transaction = {
    id: id || "TXN-001234",
    user: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+977-9841234567",
      userId: "USR-001"
    },
    amount: "Rs. 1,450",
    method: "eSewa",
    status: "Success",
    date: "2024-01-28 14:32:45",
    route: {
      from: "Kathmandu",
      to: "Pokhara",
      code: "KTM-PKR"
    },
    bus: {
      name: "Deluxe Express",
      number: "Ba 2 Kha 3456",
      operator: "Nepal Transport Pvt. Ltd.",
      busId: "BUS-001"
    },
    booking: {
      seats: ["A4", "A5"],
      passengers: 2,
      bookingId: "BKG-789012",
      travelDate: "2024-01-30",
      departureTime: "06:00 AM"
    },
    payment: {
      subtotal: "Rs. 1,400",
      serviceFee: "Rs. 50",
      total: "Rs. 1,450",
      paymentId: "PAY-ESW-123456",
      gateway: "eSewa",
      gatewayRef: "ESW-2024012814324567"
    },
    timeline: [
      { event: "Booking Initiated", time: "2024-01-28 14:30:00", status: "completed" },
      { event: "Payment Processing", time: "2024-01-28 14:31:30", status: "completed" },
      { event: "Payment Verified", time: "2024-01-28 14:32:15", status: "completed" },
      { event: "Ticket Generated", time: "2024-01-28 14:32:45", status: "completed" },
      { event: "Confirmation Sent", time: "2024-01-28 14:33:00", status: "completed" }
    ]
  };

  const handleRefund = () => {
    toast.success("Refund request initiated");
  };

  const handleResend = () => {
    toast.success("Ticket confirmation resent to user");
  };

  const handleDownloadReceipt = () => {
    toast.success("Receipt downloaded");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "default";
      case "Pending":
        return "secondary";
      case "Failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "Failed":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/transactions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Transaction Details</h2>
          <p className="text-muted-foreground mt-1">Transaction ID: {transaction.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleDownloadReceipt}>
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleResend}>
            <Receipt className="h-4 w-4" />
            Resend Confirmation
          </Button>
          {transaction.status === "Success" && (
            <Button variant="destructive" className="gap-2" onClick={handleRefund}>
              <RefreshCw className="h-4 w-4" />
              Initiate Refund
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Transaction Status Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon(transaction.status)}
              Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <Badge variant={getStatusColor(transaction.status)} className="text-lg px-4 py-2">
                {transaction.status}
              </Badge>
              <p className="text-3xl font-bold mt-4">{transaction.amount}</p>
              <p className="text-sm text-muted-foreground mt-1">{transaction.date}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="outline">{transaction.method}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway Ref</span>
                <span className="font-mono text-xs">{transaction.payment.gatewayRef}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User & Booking Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              User & Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Customer Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{transaction.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{transaction.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{transaction.user.phone}</p>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => navigate(`/admin/users/${transaction.user.userId}`)}
                  >
                    View User Profile →
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Booking Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-medium font-mono">{transaction.booking.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">{transaction.booking.seats.join(", ")} ({transaction.booking.passengers} passengers)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Travel Date</p>
                    <p className="font-medium">{transaction.booking.travelDate} at {transaction.booking.departureTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Route & Bus Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route & Bus Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="font-bold text-lg">{transaction.route.from}</p>
                <p className="text-xs text-muted-foreground">Origin</p>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30 relative">
                <Badge className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {transaction.route.code}
                </Badge>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{transaction.route.to}</p>
                <p className="text-xs text-muted-foreground">Destination</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Name</span>
                <span className="font-medium">{transaction.bus.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Number</span>
                <span className="font-medium">{transaction.bus.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium">{transaction.bus.operator}</span>
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate(`/fleet/${transaction.bus.busId}`)}
              >
                View Bus Details →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Price (2 seats)</span>
                <span>{transaction.payment.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span>{transaction.payment.serviceFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>{transaction.payment.total}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Gateway</span>
                <Badge variant="outline">{transaction.payment.gateway}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs">{transaction.payment.paymentId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {transaction.timeline.map((item, index) => (
              <div key={index} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${item.status === "completed" ? "bg-success" : "bg-muted"}`} />
                  {index < transaction.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="font-medium">{item.event}</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
                <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                  {item.status === "completed" ? "Completed" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TransactionDetail;
