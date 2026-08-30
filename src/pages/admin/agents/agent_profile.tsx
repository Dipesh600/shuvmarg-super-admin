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
import AgentDetailSkeleton from "@/components/Skeletion_Loading/AgentDetailSkeleton";
import DeleteModel from "@/components/models/delete-model";



const AgentDetail = () => {
  const { id } = useParams();
  const {data,isLoading,error,isError} = useQuery({
     queryKey:["user",id],
     queryFn:()=>getAgentById(id as string),
     enabled:!!id,
     staleTime:5*60*1000,
 })
 const agentData = {
  id: data?.data?.agentDetails?.agentId ?? "N/A",
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
  const [agentStatus] = useState(agentData.status);
  if (isError) {
    return (
      <div>
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }
  if (isLoading) {
    return <AgentDetailSkeleton/>;
  }
  
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/agents")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {agentData.name || "Agent Details"}
            {agentData.status === "Verified" && <CheckCircle className="w-5 h-5 text-[#D3D925]" />}
          </h2>
          <p className="text-white/60 mt-1 font-medium text-sm">Agent ID: { agentData?.id}</p>
        </div>
        <div className="flex gap-2">
          <DeleteModel
          entityId={agentData.id}
          entityType="agent"
          />
          <Button  onClick={()=>onOpen("editAgent")} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="agent"
            entityName={agentData.name ?? "Unknown agent"}
            currentStatus={agentStatus}
            entityId={agentData.id}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              Profile
              <Badge variant="outline" className={agentData.status === "Verified" ? "text-white border-white/10 bg-white/5" : "text-white border-white/10 bg-white/5"}>
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
              <h3 className="text-xl font-semibold text-white">{agentData.name}</h3>
              <p className="text-sm text-white/60 mt-1">{agentData.agencyName}</p>
              {agentData.status === "Verified" && (
                <div className="flex items-center justify-center gap-1 text-[#D3D925] text-sm mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Verified Agent
                </div>
              )}
            </div>
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-white/60" />
                <span>{agentData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-white/60" />
                <span>{agentData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-white/60" />
                <span>{agentData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-white/60" />
                <span>Joined {agentData.joined}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="h-4 w-4 text-white/60" />
                <span>Commission: {agentData.commission}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="text-sm">
                <span className="text-white/60">PAN:</span> {agentData.panNumber}
              </div>
              <div className="text-sm">
                <span className="text-white/60">Bank:</span> {agentData.bankDetails}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Performance Overview</CardTitle>
            <CardDescription className="text-white/60">Agent's performance metrics and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-white/5 border border-white/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{agentData.totalApplications}</div>
                <div className="text-sm text-white/60">Total Applications</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#D3D925]">{agentData.totalEarnings}</div>
                <div className="text-sm text-white/60">Total Earnings</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{agentData.monthlyEarnings}</div>
                <div className="text-sm text-white/60">This Month</div>
              </div>
            </div>

            <Tabs defaultValue="applications">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/5 rounded-none h-auto p-0 mb-4 gap-4">
                <TabsTrigger value="applications" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:text-[#D3D925] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#D3D925] rounded-none">Applications</TabsTrigger>
                <TabsTrigger value="payouts" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:text-[#D3D925] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#D3D925] rounded-none">Payouts</TabsTrigger>
              </TabsList>
              <TabsContent value="applications" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-white/5">
                      <TableHead className="text-white/60">ID</TableHead>
                      <TableHead className="text-white/60">User</TableHead>
                      <TableHead className="text-white/60">Route</TableHead>
                      <TableHead className="text-white/60">Date</TableHead>
                      <TableHead className="text-white/60">Commission</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.recentApplications.map((app) => (
                      <TableRow key={app.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium">{app.id}</TableCell>
                        <TableCell className="text-white/80">{app.user}</TableCell>
                        <TableCell className="text-white/80">{app.route}</TableCell>
                        <TableCell className="text-white/80">{app.date}</TableCell>
                        <TableCell className="text-[#D3D925] font-medium">{app.commission}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={app.status === "Confirmed" ? "text-white border-white/10 bg-white/5" : "text-white border-white/10 bg-white/5"}>
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
                    <TableRow className="border-white/5 hover:bg-white/5">
                      <TableHead className="text-white/60">Payout ID</TableHead>
                      <TableHead className="text-white/60">Amount</TableHead>
                      <TableHead className="text-white/60">Date</TableHead>
                      <TableHead className="text-white/60">Method</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.payouts.map((payout) => (
                      <TableRow key={payout.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium">{payout.id}</TableCell>
                        <TableCell className="text-[#D3D925] font-medium">{payout.amount}</TableCell>
                        <TableCell className="text-white/80">{payout.date}</TableCell>
                        <TableCell className="text-white/80">{payout.method}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white border-white/10 bg-white/5">{payout.status}</Badge>
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
