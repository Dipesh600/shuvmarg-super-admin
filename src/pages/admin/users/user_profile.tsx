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
  CheckCircle,
  Wallet,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/api/userApi";
import { getUserBalance } from "@/api/walletApi";
import UserDetailSkeleton from "@/components/Skeletion_Loading/UserDetailSkeleton";
import { useUserBookings } from "@/hooks/useUserBookings";
import DeleteModel from "@/components/models/delete-model";
import { DataTable } from "@/components/DataTable";
import { UserBooking } from "@/components/data_tables/users/bookingColumns";
import { UserTranscation } from "@/components/data_tables/users/transactionColumns";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bookings } = useUserBookings(id ?? "");

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["userWallet", id],
    queryFn: () => getUserBalance(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <UserDetailSkeleton />;

  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "Something went wrong"}
      </div>
    );
  }

  // Enriched response from the new backend endpoint
  const enrichedData = data?.data;
  const profile = enrichedData?.profile;
  const userStatus = profile?.status || "";
  const metrics = enrichedData?.metrics;
  const security = enrichedData?.security;
  const referral = enrichedData?.referral;
  const auditLog = enrichedData?.auditLog;

  const userData = {
    id: profile?._id ?? "",
    name: profile?.name ?? "Unknown user",
    email: profile?.email,
    phone: profile?.phone,
    status: profile?.status,
    verified: profile?.isVerified,
    joined: profile?.createdAt?.split("T")[0],
    address: profile?.address || "Not provided",
    role: profile?.role,
    roles: profile?.roles || [],
    profileImg: profile?.profilePicture || "",
    gender: profile?.gender,
    lastLogin: security?.lastLoginAt
      ? new Date(security.lastLoginAt).toLocaleString()
      : "Never",
  };

  // Map bookings from the getBookingsByUser endpoint
  const userBookings = bookings?.data?.map((booking) => {
    const trip = booking?.tripId;
    const tripFrom = trip?.fromStopName || trip?.routeId?.from || "N/A";
    const tripTo = trip?.toStopName || trip?.routeId?.to || "N/A";

    const from =
      booking?.bookedFrom ||
      booking?.boardingPoint?.name ||
      tripFrom;
    const to =
      booking?.bookedTo ||
      booking?.droppingPoint?.name ||
      tripTo;

    return {
      id: booking._id,
      scheduleRoute: { from, to },
      tripRoute:
        (from !== tripFrom || to !== tripTo)
          ? { from: tripFrom, to: tripTo }
          : null,
      bookedAt: booking?.createdAt ?? "",
      amount: booking?.totalAmount ?? 0,
      status: (booking?.status === "cancelled" ? "cancelled" : "booked") as "booked" | "cancelled",
    };
  });

  // Map transactions from the bookings data (using correct field names)
  const userTransactions = bookings?.data?.map((booking) => ({
    id: booking?._id,
    transactionId: booking?.transactionId || "N/A",
    type: (booking?.status === "cancelled" ? "refund" : "none") as "refund" | "none",
    paymentDate: booking?.bookedAt || booking?.createdAt || "",
    amount: String(booking?.totalAmount ?? 0),
    method: ((booking?.paymentMethod || "card").toLowerCase() as "esewa" | "khalti" | "upi" | "card"),
  }));

  // Format role label
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      passenger: "Passenger",
      busOwner: "Bus Owner",
      agent: "Agent",
      conductor: "Conductor",
      driver: "Driver",
    };
    return labels[role] || role;
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          className="cursor-pointer"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
          <p className="text-muted-foreground">Overview of user account and activity</p>
        </div>
        <div className="flex gap-2">
          <DeleteModel entityId={userData.id} entityType="user" />
          <SuspendDialog
            entityType="user"
            entityName={`${userData.name}`}
            currentStatus={userStatus}
            entityId={userData.id}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Profile Card ── */}
        <Card className="lg:col-span-1 h-fit border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              Profile
              <Badge
                variant="outline"
                className={
                  userData.status === "active" 
                    ? "capitalize bg-[#D3D925]/10 text-[#D3D925] border-[#D3D925]/20 font-medium" 
                    : userData.status === "banned"
                    ? "capitalize bg-white/5 text-white border-white/10 font-medium"
                    : "capitalize bg-white/5 text-white/50 border-white/10 font-medium"
                }
              >
                {userData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {userData.profileImg ? (
                  <img
                    src={userData.profileImg}
                    alt="profile_img"
                    className="w-full rounded-full object-cover "
                  />
                ) : (
                  userData.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{userData.name}</h3>
              {userData.verified && (
                <div className="flex items-center justify-center gap-1 text-success text-sm mt-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                  Verified
                </div>
              )}
              {/* Roles badges */}
              <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                {userData.roles.map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs capitalize bg-white/5 text-white border-white/10">
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userData.email || "Not provided"}</span>
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
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last login: {userData.lastLogin}</span>
              </div>
            </div>

            {/* Suspension info if banned/inactive */}
            {(userData.status === "banned" || userData.status === "inactive") &&
              security?.suspensionReason && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Suspension Reason
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {security.suspensionReason}
                  </p>
                  {security.suspendedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Since {new Date(security.suspendedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

            {/* Security overview */}
            {security && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Security</h4>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-medium">{security.activeSessions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 flex justify-between">
                    <span>Failed Logins</span>
                    <span className="font-medium">{security.failedLoginAttempts}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 flex justify-between">
                    <span>Account Status</span>
                    <span className="font-medium">
                      {security.accountLocked ? "Locked" : security.forcePasswordChange ? "Reset Required" : "Normal"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Referral info */}
            {referral && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Referral</h4>
                <div className="flex justify-between text-sm">
                  <span>Code</span>
                  <Badge variant="outline" className="text-xs">
                    {referral.code || "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Referrals</span>
                  <span className="font-medium">{referral.totalReferrals}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Activity Card ── */}
        <Card className="lg:col-span-2 border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              User's booking metrics and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 border border-white/5 bg-[#121212]/50 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {metrics?.bookings?.total ?? bookings?.totalBookings ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </div>
              <div className="p-4 border border-white/5 bg-[#121212]/50 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  NPR.{(metrics?.bookings?.totalSpent ?? bookings?.totalBookingAmount ?? 0).toLocaleString("en-IN")}
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="p-4 rounded-lg text-center flex flex-col items-center justify-center relative group overflow-hidden border border-[#D3D925]/20 bg-[#D3D925]/5 hover:bg-[#D3D925]/10 hover:shadow-[0_0_20px_rgba(211,217,37,0.15)] transition-all duration-300">
                <div className="text-2xl font-bold relative z-10 text-[#D3D925]">
                  {walletLoading ? "..." : `Rs. ${walletData?.balance?.toLocaleString("en-IN") ?? 0}`}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1 relative z-10">
                  <Wallet className="h-3.5 w-3.5 text-[#D3D925]/70" /> SM Money
                </div>
                <div
                  className="text-[10px] text-[#D3D925] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-1.5 z-10 font-medium cursor-pointer flex items-center gap-0.5 hover:underline"
                  onClick={() => navigate(`/admin/wallet`)}
                >
                  Manage &rarr;
                </div>
              </div>
            </div>

            <Tabs defaultValue="bookings">
              <TabsList className="w-fit justify-start">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                {auditLog && auditLog.length > 0 && (
                  <TabsTrigger value="auditLog">Admin Actions</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="bookings" className="mt-4">
                <DataTable columns={UserBooking} data={userBookings ?? []} />
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <DataTable columns={UserTranscation} data={userTransactions ?? []} />
              </TabsContent>
              {auditLog && auditLog.length > 0 && (
                <TabsContent value="auditLog" className="mt-4">
                  <div className="space-y-3">
                    {auditLog.map((entry, i) => (
                      <div key={entry._id || i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{entry.action}</Badge>
                            <span className="text-muted-foreground text-xs">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="text-muted-foreground mt-1 truncate">
                              {entry.reason}
                            </p>
                          )}
                          {entry.adminId && (
                            <p className="text-muted-foreground text-xs mt-0.5">
                              by {entry.adminId.name || "Admin"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserDetail;
