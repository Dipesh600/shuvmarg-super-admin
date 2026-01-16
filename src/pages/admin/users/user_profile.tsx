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

import { useModal } from "@/hooks/use-model-store";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/api/userApi";
import UserDetailSkeleton from "@/components/Skeletion_Loading/UserDetailSkeleton";
import { useUserBookings } from "@/hooks/useUserBookings";
import DeleteModel from "@/components/models/delete-model";
import { DataTable } from "@/components/DataTable";
import { UserBooking } from "@/components/data_tables/users/bookingColumns";
import { UserTranscation } from "@/components/data_tables/users/transactionColumns";

const UserDetail = () => {
  const { id } = useParams();
  const { onOpen } = useModal();
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState("");
  const { data: bookings } = useUserBookings(id ?? "");
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    setUserStatus(data?.data.status);
  }, [data?.data.status, id]);
  if (isLoading) return <UserDetailSkeleton />;

  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "Something went wrong"}
      </div>
    );
  }
  const user = data?.data;

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    verified: user.isVerified,
    joined: user.createdAt?.split("T")[0],
    address: user.address || "Kathmandu, Nepal",
    role: user.role,
    profileImg: user.profilePicture || "",
    lastLogin: "2024-01-28 10:30 AM",
  };
  const userBookings = bookings?.data?.map((booking: any) => ({
    id: booking._id,
    scheduleRoute: {
      from: booking?.scheduleInfo.route.from,
      to: booking?.scheduleInfo.route.to,
    },
    bookedAt: booking?.createdAt,
    amount: booking?.totalAmount,
    status: booking?.status,
  }));
  const userTranscations = bookings?.data?.map((booking: any) => ({
    id: booking._id,
    transactionId: booking?.transactionId,
    type: booking?.refundStatus,
    paymentDate:booking.bookedAt,
    amount: booking?.totalAmount,
    method: booking?.gateway,
  }));

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
          <p className="text-muted-foreground">User ID: {id || userData.id}</p>
        </div>
        <div className="flex gap-2">
          <DeleteModel entityId={userData.id} entityType="user" />

          <Button
            onClick={() => onOpen("editUser", { data: userData })}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="user"
            entityName={`${userData.name}`}
            currentStatus={userStatus}
            entityId={userData.id}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile
              <Badge
                variant={
                  userData.status === "active" ? "default" : "destructive"
                }
              >
                {userData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {/* {userData.name[0]} */}
                <img
                  src={userData.profileImg}
                  alt="profile_img"
                  className="w-full rounded-full object-cover "
                />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{userData.name}</h3>
              {userData.verified && (
                <div className="flex items-center justify-center gap-1 text-success text-sm mt-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Verified {userData.role}
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
                  {bookings?.totalBookings ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  NPR.{bookings?.totalBookingAmount ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-sm font-medium">{userData.lastLogin}</div>
                <div className="text-sm text-muted-foreground">Last Login</div>
              </div>
            </div>

            <Tabs defaultValue="bookings">
              <TabsList className="w-fit justify-start">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="bookings" className="mt-4">
                <DataTable columns={UserBooking} data={userBookings ?? []} />
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <DataTable columns={UserTranscation} data={userTranscations ?? []} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserDetail;
