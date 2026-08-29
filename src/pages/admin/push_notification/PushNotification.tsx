import { useState } from "react";
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
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white">Active</Badge>;
    case "banned":
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white">Banned</Badge>;
    default:
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{status}</Badge>;
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white">Admin</Badge>;
    case "busOwner":
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white">Bus Owner</Badge>;
    case "agent":
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white">Agent</Badge>;
    case "passenger":
      return <Badge variant="outline" className="bg-white/10 border-white/20 text-white/80">Passenger</Badge>;
    default:
      return <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{role}</Badge>;
  }
};

export default function PushNotifications() {
   const {data,isLoading} =   useUsersFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const users: User[] = data || [];

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
  );

  // const totalUsers = users.length;
  // const activeUsers = users.filter((u) => u.status === "active").length;
  // const bannedUsers = users.filter((u) => u.status === "banned").length;


if(isLoading) {
    return (
        <PushNotificationsSkeleton/>
    )
}
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Push Notifications</h2>
            <p className="text-white/60 mt-1 font-medium text-sm">
              Send push notifications to users
            </p>
          </div>
          <SendAllNotificationDialog />
        </div>

        {/* Stats Cards */}
        {/* <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-white" />
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium text-white/80">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-white" />
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{bannedUsers}</div>
            </CardContent>
          </Card>
        </div> */}

        {/* Users Table */}
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">All Users</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-white/5">
                  <TableHead className="text-white/60">User</TableHead>
                  <TableHead className="text-white/60">Contact</TableHead>
                  <TableHead className="text-white/60">Role</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">SM Money</TableHead>
                  <TableHead className="text-white/60">Referrals</TableHead>
                  <TableHead className="text-white/60">Joined</TableHead>
                  <TableHead className="text-white/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={user.profilePicture} alt={user.name} />
                          <AvatarFallback className="bg-white/10 text-white">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white/90">{user.name || "N/A"}</p>
                          <p className="text-sm text-white/60">{user.address || "N/A"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-white/80">{user.email || "N/A"}</p>
                        <p className="text-sm text-white/60">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium text-[#D3D925]">{(user.yatrapoints ?? 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-white/80">{user.totalReferrals}</TableCell>
                    <TableCell className="text-white/80">
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
