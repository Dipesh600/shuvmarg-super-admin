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
import { columns, type User } from "@/components/data_tables/users/columns";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users as UsersIcon, CheckCircle, TrendingUp, Activity } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers, getUserDashboardData } from "@/api/userApi";
import { useAuth } from "@/providers/auth-context";
import { useMemo } from "react";
import UsersSkeleton from "@/components/Skeletion_Loading/UserSkeletion";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["userDashboard"],
    queryFn: () => getUserDashboardData(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const userDashboard = dashboardData?.data?.summary;

  // Map API response to table data — all real data, no hardcoded values
  const userTableData = useMemo(() => {
    return data?.data?.map((user): User => ({
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
    }));
  }, [data]);

  // Verified count from real isVerified field
  const verifiedUsers = useMemo(() => {
    return userTableData?.filter((user) => user.verified === true).length ?? 0;
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
          <h2 className="text-2xl font-bold tracking-tight text-white">User Management</h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Monitor and manage all registered users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={(userDashboard?.totalUsers?.total || 0).toString()}
          change={userDashboard?.totalUsers?.thisMonthIncrease > 0 ? `+${userDashboard.totalUsers.thisMonthIncrease} this month` : undefined}
          changeType="positive"
          icon={UsersIcon}
        />
        <StatCard
          title="Active Users"
          value={(userDashboard?.activeUsers?.last30Days || 0).toString()}
          subtitle="Last 30 days"
          icon={Activity}
        />
        <StatCard
          title="New Today"
          value={(userDashboard?.newUsers?.today || 0).toString()}
          change={userDashboard?.newUsers?.today > 0 ? `${userDashboard.newUsers.growthVsYesterdayPercent >= 0 ? "+" : ""}${userDashboard.newUsers.growthVsYesterdayPercent}% vs yesterday` : undefined}
          changeType={userDashboard?.newUsers?.growthVsYesterdayPercent >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
        />
        <StatCard
          title="Verified"
          value={verifiedUsers.toString()}
          subtitle={(userDashboard?.totalUsers?.total ?? 0) > 0 ? `${((verifiedUsers / userDashboard.totalUsers.total) * 100).toFixed(0)}% verified` : undefined}
          icon={CheckCircle}
        />
      </div>

      {/* User Directory */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">User Directory</CardTitle>
              <CardDescription className="text-white/60">Search and manage user accounts</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <DataTable columns={columns} data={userTableData ?? []} />
          </div>

          {/* Mobile Cards — uses real data, not placeholder array */}
          <div className="md:hidden flex flex-col gap-3">
            {(userTableData ?? []).map((user) => (
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
                    <span className="font-medium text-white/90">{user.name}</span>
                  </div>
                  <Badge
                    variant={user.status === "active" ? "default" : "destructive"}
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="text-sm text-white/60 space-y-1">
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
