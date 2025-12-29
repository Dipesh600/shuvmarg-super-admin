import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Filter, Download } from "lucide-react";
import { useModal } from "@/hooks/use-model-store";
import { columns } from "@/components/data_tables/users/columns";
import { DataTable } from "@/components/DataTable";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/api/userApi";
import { useAuth } from "@/providers/AuthProvider";
import { useMemo } from "react";

type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  bookings: number;
  joined: string;
};

const users: User[] = [
  {
    id: "USR-001",
    name: "Rajesh Kumar",
    phone: "+977-9841234567",
    email: "rajesh@example.com",
    status: "Active",
    bookings: 12,
    joined: "2024-01-15",
  },
  {
    id: "USR-002",
    name: "Sita Sharma",
    phone: "+977-9851234568",
    email: "sita@example.com",
    status: "Active",
    bookings: 8,
    joined: "2024-02-20",
  },
  {
    id: "USR-003",
    name: "Mohan Thapa",
    phone: "+977-9861234569",
    email: "mohan@example.com",
    status: "Suspended",
    bookings: 3,
    joined: "2024-03-10",
  },
  {
    id: "USR-004",
    name: "Gita Rai",
    phone: "+977-9871234570",
    email: "gita@example.com",
    status: "Active",
    bookings: 15,
    joined: "2024-01-05",
  },
  {
    id: "USR-005",
    name: "Krishna Gurung",
    phone: "+977-9881234571",
    email: "krishna@example.com",
    status: "Active",
    bookings: 6,
    joined: "2024-04-12",
  },
];

const Users = () => {
  const { onOpen } = useModal();
  const { token } = useAuth();
  // useQuery to fetch users can be added here
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
  console.log("Fetched Users:", data);
  const userTableData = data?.data.map((user: any) => {
    return {
      id: user._id,
      name: user.name,
      phone: user.phone,
      profileImg: user.profilePicture,
      email: user.email,
      status: user.status,
      verified: user.verified,
      bookings: 15,
      joined: user.createdAt,
    };
  });
  const ActiveUserCount = useMemo(() => {
    return userTableData?.filter(
      (user: any) => user.status?.toLowerCase() === "active"
    ).length;
  }, [userTableData]);
  const VerifiedUsers = useMemo(() => {
    return userTableData?.filter((user: any) => user.verified === true).length;
  }, [userTableData]);
  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all registered users
          </p>
        </div>
        <Button
          onClick={() => onOpen("addUser")}
          className="gap-2 cursor-pointer active:bg-blue-900 w-full md:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTableData?.length}</div>
            <p className="text-xs text-muted-foreground">+234 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ActiveUserCount}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-success">+12% vs yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{VerifiedUsers}</div>
            <p className="text-xs text-muted-foreground">90.96%</p>
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
            <DataTable columns={columns as any} data={userTableData} />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{user.id}</span>
                  <Badge
                    variant={
                      user.status === "Active" ? "default" : "destructive"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Name: {user.name}</div>
                  <div>Phone: {user.phone}</div>
                  <div>Email: {user.email}</div>
                  <div>Bookings: {user.bookings}</div>
                  <div>Joined: {user.joined}</div>
                </div>
                <Button variant="ghost" size="sm" className="w-full">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Users;
