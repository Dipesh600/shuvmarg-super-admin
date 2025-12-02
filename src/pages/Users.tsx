import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Filter, Download } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

const users = [
  { id: "USR-001", name: "Rajesh Kumar", phone: "+977-9841234567", email: "rajesh@example.com", status: "Active", bookings: 12, joined: "2024-01-15" },
  { id: "USR-002", name: "Sita Sharma", phone: "+977-9851234568", email: "sita@example.com", status: "Active", bookings: 8, joined: "2024-02-20" },
  { id: "USR-003", name: "Mohan Thapa", phone: "+977-9861234569", email: "mohan@example.com", status: "Suspended", bookings: 3, joined: "2024-03-10" },
  { id: "USR-004", name: "Gita Rai", phone: "+977-9871234570", email: "gita@example.com", status: "Active", bookings: 15, joined: "2024-01-05" },
  { id: "USR-005", name: "Krishna Gurung", phone: "+977-9881234571", email: "krishna@example.com", status: "Active", bookings: 6, joined: "2024-04-12" },
];

const Users = () => {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground mt-1">Manage and monitor all registered users</p>
          </div>
          <Button className="gap-2 w-full md:w-auto">
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
              <div className="text-2xl font-bold">12,450</div>
              <p className="text-xs text-muted-foreground">+234 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,967</div>
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
              <div className="text-2xl font-bold">11,234</div>
              <p className="text-xs text-muted-foreground">90.2%</p>
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
            <div className="mb-4 w-full sm:max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, phone, email, or ID..." className="pl-9 w-full" />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="text-left p-2">User ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Bookings</th>
                    <th className="text-left p-2">Joined</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2 font-medium">{user.id}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{user.phone}</div>
                          <div className="text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-2">{user.bookings}</td>
                      <td className="p-2">{user.joined}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-3 shadow-sm bg-background space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{user.id}</span>
                    <Badge variant={user.status === "Active" ? "default" : "destructive"}>
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
                  <Button variant="ghost" size="sm" className="w-full">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </SidebarProvider>
  );
};

export default Users;
