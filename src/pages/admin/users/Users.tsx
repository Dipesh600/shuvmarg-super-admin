import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Download } from "lucide-react";
import { columns } from "@/components/data_tables/users/columns";
import { DataTable } from "@/components/DataTable";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers, getUserDashboardData } from "@/api/userApi";
import { useAuth } from "@/providers/AuthProvider";
import { useMemo } from "react";
import UsersSkeleton from "@/components/Skeletion_Loading/UserSkeletion";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["userDashboard"],
    queryFn: getUserDashboardData,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const userDashboard = dashboardData?.data?.summary;

  // Map API response to table data — all real data, no hardcoded values
  const userTableData = useMemo(() => {
    return data?.data?.map((user: any) => ({
      id: user._id,
      name: user.name,
      phone: user.phone,
      profileImg: user.profilePicture,
      email: user.email,
      status: user.status,
      verified: user.isVerified,
      bookings: user.bookingCount ?? 0,
      totalSpent: user.totalSpent ?? 0,
      joined: user.createdAt,
      role: user.role,
      roles: user.roles,
      lastLoginAt: user.lastLoginAt,
    }));
  }, [data]);

  // Verified count from real isVerified field
  const verifiedUsers = useMemo(() => {
    return userTableData?.filter((user: any) => user.verified === true).length ?? 0;
  }, [userTableData]);

  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }
  if (isLoading || isDashboardLoading) {
    return <UsersSkeleton />;
  }

  return (
    <>
      {/* Header — Admin is observer/enforcer, no Add User */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all registered users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userDashboard?.totalUsers?.total || 0}
            </div>
            {userDashboard?.totalUsers?.thisMonthIncrease > 0 && (
              <p className="text-xs text-muted-foreground">
                +{userDashboard.totalUsers.thisMonthIncrease} this month
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userDashboard?.activeUsers?.last30Days || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userDashboard?.newUsers?.today || 0}
            </div>
            {userDashboard?.newUsers?.today > 0 && (
              <p className="text-xs text-success">
                {userDashboard.newUsers.growthVsYesterdayPercent >= 0 ? "+" : ""}
                {userDashboard.newUsers.growthVsYesterdayPercent}% vs yesterday
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedUsers}</div>
            {(userDashboard?.totalUsers?.total ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {((verifiedUsers / userDashboard.totalUsers.total) * 100).toFixed(0)}% verified
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Search and manage user accounts</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <DataTable columns={columns as any} data={userTableData ?? []} />
          </div>

          {/* Mobile Cards — uses real data, not placeholder array */}
          <div className="md:hidden flex flex-col gap-3">
            {(userTableData ?? []).map((user: any) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 shadow-sm bg-background space-y-2 cursor-pointer"
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={user.profileImg}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <Badge
                    variant={user.status === "active" ? "default" : "destructive"}
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Phone: {user.phone}</div>
                  <div>Email: {user.email || "Not provided"}</div>
                  <div>Bookings: {user.bookings}</div>
                  <div>Joined: {new Date(user.joined).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Users;
