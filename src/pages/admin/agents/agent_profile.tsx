import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, CheckCircle, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useState } from "react";
import { useModal } from "@/hooks/use-model-store";
import { useQuery } from "@tanstack/react-query";
import { getAgentById } from "@/api/agentApi";



const AgentDetail = () => {
  const { id } = useParams();
  const {data,isLoading,error,isError} = useQuery({
     queryKey:["user",id],
     queryFn:()=>getAgentById(id as string),
     enabled:!!id,
     staleTime:5*60*1000,
 })
 const agentData = {
  id: data?.data?.agentDetails.agentId,
  name: data?.data?.profile.name,
  email: data?.data?.profile.email,
  phone: data?.data?.profile.phone,
  agencyName: "Nepal Travels Agency",
  profileImg:data?.data?.profile.profilePicture,
  location: data?.data?.profile.address,
  status: "Verified",
  commission: "5.2%",
  performance: "Excellent",
  joined: data?.data?.profile.createdAt?.split("T")[0],
  panNumber: "123456789",
  bankDetails: "Nepal Bank - 1234567890",
  totalApplications: 234,
  totalEarnings: "NPR 156,000",
  monthlyEarnings: "NPR 24,500",
  recentApplications: [
    { id: "APP-001", user: "Sita Sharma", route: "Kathmandu - Pokhara", date: "2024-01-28", commission: "NPR 60", status: "Confirmed" },
    { id: "APP-002", user: "Mohan Thapa", route: "Kathmandu - Chitwan", date: "2024-01-27", commission: "NPR 45", status: "Confirmed" },
    { id: "APP-003", user: "Gita Rai", route: "Pokhara - Butwal", date: "2024-01-27", commission: "NPR 55", status: "Pending" },
  ],
  payouts: [
    { id: "PAY-001", amount: "NPR 12,500", date: "2024-01-25", status: "Completed", method: "Bank Transfer" },
    { id: "PAY-002", amount: "NPR 8,300", date: "2024-01-18", status: "Completed", method: "Bank Transfer" },
    { id: "PAY-003", amount: "NPR 15,200", date: "2024-01-11", status: "Completed", method: "Bank Transfer" },
  ],
};
  const {onOpen} = useModal();
  const navigate = useNavigate();
  const [agentStatus, setAgentStatus] = useState(agentData.status);
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/agents")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Agent Details</h2>
          <p className="text-muted-foreground">Agent ID: { agentData.id}</p>
        </div>
        <div className="flex gap-2">
          <Button  onClick={()=>onOpen("editAgent")} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="agent"
            entityName={agentData.name}
            currentStatus={agentStatus}
            onStatusChange={setAgentStatus}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile
              <Badge variant={agentData.status === "Verified" ? "default" : "secondary"}>
                {agentData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
               <div className="w-24 h-24 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                <img src={agentData.profileImg} alt="profile_img" className="w-full rounded-full object-cover " />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{agentData.name}</h3>
              <p className="text-sm text-muted-foreground">{agentData.agencyName}</p>
              {agentData.status === "Verified" && (
                <div className="flex items-center justify-center gap-1 text-success text-sm mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Verified Agent
                </div>
              )}
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{agentData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{agentData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{agentData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {agentData.joined}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>Commission: {agentData.commission}</span>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">PAN:</span> {agentData.panNumber}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Bank:</span> {agentData.bankDetails}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Agent's performance metrics and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">{agentData.totalApplications}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">{agentData.totalEarnings}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold">{agentData.monthlyEarnings}</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>

            <Tabs defaultValue="applications">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>
              <TabsContent value="applications" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.recentApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.id}</TableCell>
                        <TableCell>{app.user}</TableCell>
                        <TableCell>{app.route}</TableCell>
                        <TableCell>{app.date}</TableCell>
                        <TableCell>{app.commission}</TableCell>
                        <TableCell>
                          <Badge variant={app.status === "Confirmed" ? "default" : "secondary"}>
                            {app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="payouts" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.id}</TableCell>
                        <TableCell>{payout.amount}</TableCell>
                        <TableCell>{payout.date}</TableCell>
                        <TableCell>{payout.method}</TableCell>
                        <TableCell>
                          <Badge variant="default">{payout.status}</Badge>
                        </TableCell>
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

export default AgentDetail;
