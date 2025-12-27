import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/use-model-store";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useState } from "react";
   const userData = {
  id: "USR-001",
  firstName: "Rajesh",
  lastName: "Kumar",
  email: "rajesh@example.com",
  phone: "+977-9841234567",
  status: "Active",
  verified: true,
  joined: "2024-01-15",
  address: "Kathmandu, Nepal",
  totalBookings: 12,
  totalSpent: "NPR 24,500",
  lastLogin: "2024-01-28 10:30 AM",
  bookings: [
    { id: "BK-001", route: "Kathmandu - Pokhara", date: "2024-01-20", amount: "NPR 1,200", status: "Completed" },
    { id: "BK-002", route: "Pokhara - Chitwan", date: "2024-01-25", amount: "NPR 800", status: "Completed" },
    { id: "BK-003", route: "Kathmandu - Biratnagar", date: "2024-02-01", amount: "NPR 1,500", status: "Upcoming" },
  ],
  transactions: [
    { id: "TXN-001", type: "Payment", amount: "NPR 1,200", date: "2024-01-20", method: "Khalti" },
    { id: "TXN-002", type: "Payment", amount: "NPR 800", date: "2024-01-25", method: "eSewa" },
    { id: "TXN-003", type: "Refund", amount: "NPR 500", date: "2024-01-22", method: "Wallet" },
  ],
};
// const userData = {
//   id: "USR-001",
//   firstName: "Rajesh",
//   lastName: "Kumar",
//   email: "rajesh@example.com",
//   phone: "+977-9841234567",
//   status: "Active",
//   verified: true,
//   joined: "2024-01-15",
//   address: "Kathmandu, Nepal",
//   totalBookings: 12,
//   totalSpent: "NPR 24,500",
//   lastLogin: "2024-01-28 10:30 AM",
//   bookings: [
//     {
//       id: "BK-001",
//       route: "Kathmandu - Pokhara",
//       date: "2024-01-20",
//       amount: "NPR 1,200",
//       status: "Completed",
//     },
//     {
//       id: "BK-002",
//       route: "Pokhara - Chitwan",
//       date: "2024-01-25",
//       amount: "NPR 800",
//       status: "Completed",
//     },
//     {
//       id: "BK-003",
//       route: "Kathmandu - Biratnagar",
//       date: "2024-02-01",
//       amount: "NPR 1,500",
//       status: "Upcoming",
//     },
//   ],
//   transactions: [
//     {
//       id: "TXN-001",
//       type: "Payment",
//       amount: "NPR 1,200",
//       date: "2024-01-20",
//       method: "Khalti",
//     },
//     {
//       id: "TXN-002",
//       type: "Payment",
//       amount: "NPR 800",
//       date: "2024-01-25",
//       method: "eSewa",
//     },
//     {
//       id: "TXN-003",
//       type: "Refund",
//       amount: "NPR 500",
//       date: "2024-01-22",
//       method: "Wallet",
//     },
//   ],
// };

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState(userData.status);
    const {onOpen}= useModal();
 
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
          <p className="text-muted-foreground">User ID: {id || userData.id}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={()=>onOpen("editUser")} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="user"
            entityName={`${userData.firstName} ${userData.lastName}`}
            currentStatus={userStatus}
            onStatusChange={setUserStatus}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile
              <Badge
                variant={
                  userData.status === "Active" ? "default" : "destructive"
                }
              >
                {userData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {userData.firstName[0]}
                {userData.lastName[0]}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {userData.firstName} {userData.lastName}
              </h3>
              {userData.verified && (
                <div className="flex items-center justify-center gap-1 text-success text-sm mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Verified User
                </div>
              )}
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userData.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {userData.joined}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              User's recent activity and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {userData.totalBookings}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">{userData.totalSpent}</div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-sm font-medium">{userData.lastLogin}</div>
                <div className="text-sm text-muted-foreground">Last Login</div>
              </div>
            </div>

            <Tabs defaultValue="bookings">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="bookings" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.id}
                        </TableCell>
                        <TableCell>{booking.route}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>{booking.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "Completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.id}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txn.type === "Payment" ? "default" : "outline"
                            }
                          >
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{txn.amount}</TableCell>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell>{txn.method}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserDetail;
