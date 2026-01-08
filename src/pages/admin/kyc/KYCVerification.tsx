import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Users, Bus, Search, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const busOwnerKYC = [
  { id: "KYC001", company: "Nepal Express", owner: "Ram Bahadur", submittedAt: "2026-01-02", status: "pending", documents: 4 },
  { id: "KYC002", company: "Mountain Tours", owner: "Hari Prasad", submittedAt: "2026-01-01", status: "approved", documents: 4 },
  { id: "KYC003", company: "Valley Transport", owner: "Shyam Kumar", submittedAt: "2025-12-28", status: "rejected", documents: 3 },
  { id: "KYC004", company: "Highway Travels", owner: "Krishna Sharma", submittedAt: "2026-01-03", status: "pending", documents: 4 },
];

const agentKYC = [
  { id: "AGT001", name: "Rajesh Thapa", location: "Kathmandu", submittedAt: "2026-01-02", status: "pending", documents: 4 },
  { id: "AGT002", name: "Sita Devi", location: "Pokhara", submittedAt: "2026-01-01", status: "approved", documents: 4 },
  { id: "AGT003", name: "Bikram Shah", location: "Chitwan", submittedAt: "2025-12-30", status: "under_review", documents: 4 },
];

const fleetKYC = [
  { id: "FLT001", busNumber: "BA 1 KHA 1234", owner: "Nepal Express", submittedAt: "2026-01-03", status: "pending", documents: 5 },
  { id: "FLT002", busNumber: "BA 2 KHA 5678", owner: "Mountain Tours", submittedAt: "2026-01-02", status: "approved", documents: 5 },
  { id: "FLT003", busNumber: "GA 1 KHA 9012", owner: "Valley Transport", submittedAt: "2025-12-29", status: "rejected", documents: 4 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "under_review":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Under Review</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "rejected":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "under_review":
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-600" />;
  }
};

export default function KYCVerification() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const pendingOwners = busOwnerKYC.filter(k => k.status === "pending").length;
  const pendingAgents = agentKYC.filter(k => k.status === "pending" || k.status === "under_review").length;
  const pendingFleet = fleetKYC.filter(k => k.status === "pending").length;

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
          <p className="text-muted-foreground">Manage and verify KYC documents for bus owners, agents, and fleet</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bus Owner KYC</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOwners}</div>
              <p className="text-xs text-muted-foreground">Pending verifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agent KYC</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAgents}</div>
              <p className="text-xs text-muted-foreground">Pending verifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fleet KYC</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFleet}</div>
              <p className="text-xs text-muted-foreground">Pending verifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bus-owners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bus-owners" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bus Owners
              {pendingOwners > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingOwners}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Users className="h-4 w-4" />
              Agents
              {pendingAgents > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingAgents}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fleet" className="gap-2">
              <Bus className="h-4 w-4" />
              Fleet
              {pendingFleet > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingFleet}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Bus Owners Tab */}
          <TabsContent value="bus-owners">
            <Card>
              <CardHeader>
                <CardTitle>Bus Owner Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KYC ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busOwnerKYC.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell className="font-medium">{kyc.id}</TableCell>
                        <TableCell>{kyc.company}</TableCell>
                        <TableCell>{kyc.owner}</TableCell>
                        <TableCell>{kyc.submittedAt}</TableCell>
                        <TableCell>{kyc.documents} docs</TableCell>
                        <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/kyc/bus-owner/${kyc.id}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KYC ID</TableHead>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentKYC.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell className="font-medium">{kyc.id}</TableCell>
                        <TableCell>{kyc.name}</TableCell>
                        <TableCell>{kyc.location}</TableCell>
                        <TableCell>{kyc.submittedAt}</TableCell>
                        <TableCell>{kyc.documents} docs</TableCell>
                        <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/kyc/agent/${kyc.id}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KYC ID</TableHead>
                      <TableHead>Bus Number</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleetKYC.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell className="font-medium">{kyc.id}</TableCell>
                        <TableCell>{kyc.busNumber}</TableCell>
                        <TableCell>{kyc.owner}</TableCell>
                        <TableCell>{kyc.submittedAt}</TableCell>
                        <TableCell>{kyc.documents} docs</TableCell>
                        <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/kyc/fleet/${kyc.id}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
