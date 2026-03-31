import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {  Search } from "lucide-react";
import { SendUserNotificationDialog } from "@/components/models/send-user_notification-model";
import { SendAllNotificationDialog } from "@/components/models/send-all_notification-model";
import useUsersFetch from "@/hooks/useUseFetch";
import PushNotificationsSkeleton from "@/components/Skeletion_Loading/PushNotificationSkeleton";

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone: string;
  address?: string;
  gender?: string;
  role: string;
  status: string;
  profilePicture: string;
  referralCode: string;
  totalReferrals: number;
  yatrapoints: number;
  createdAt: string;
}



const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "banned":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Banned</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
    case "busOwner":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Bus Owner</Badge>;
    case "agent":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Agent</Badge>;
    case "passenger":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Passenger</Badge>;
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
};

export default function PushNotifications() {
   const {data,isLoading} =   useUsersFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [users,setUsers] = useState<User[]>([]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
  );

  // const totalUsers = users.length;
  // const activeUsers = users.filter((u) => u.status === "active").length;
  // const bannedUsers = users.filter((u) => u.status === "banned").length;


  useEffect(()=>{
    if(data){
        setUsers(data)
    }
},[data])
if(isLoading) {
    return (
        <PushNotificationsSkeleton/>
    )
}
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Push Notifications</h1>
            <p className="text-muted-foreground">
              Send push notifications to users
            </p>
          </div>
          <SendAllNotificationDialog />
        </div>

        {/* Stats Cards */}
        {/* <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Ban className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{bannedUsers}</div>
            </CardContent>
          </Card>
        </div> */}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Yatra Points</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profilePicture} alt={user.name} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{user.address || "N/A"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{user.email || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{user.yatrapoints.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>{user.totalReferrals}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <SendUserNotificationDialog user={user} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
