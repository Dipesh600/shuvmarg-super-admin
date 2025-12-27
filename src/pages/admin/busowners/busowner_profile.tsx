import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Building, Bus, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useModal } from "@/hooks/use-model-store";
import { useState } from "react";
import { SuspendDialog } from "@/components/models/suspended-model";
// const ownerData = {
//   id: "OWN-001",
//   company: "Nepal Express Pvt. Ltd.",
//   owner: "Hari Prasad",
//   email: "hari@nepalexpress.com",
//   phone: "+977-9841234567",
//   address: "New Road, Kathmandu",
//   type: "Private Limited",
//   status: "Active",
//   joined: "2022-03-15",
//   panNumber: "987654321",
//   registrationNumber: "REG-2022-12345",
//   bankDetails: "Himalayan Bank - 9876543210",
//   fleetSize: 12,
//   activeRoutes: 8,
//   monthlyRevenue: "NPR 2,450,000",
//   totalRevenue: "NPR 28,500,000",
//   buses: [
//     { id: "NP-BA-1234", type: "Deluxe", route: "Kathmandu - Pokhara", status: "Active", capacity: 42 },
//     { id: "NP-BA-2345", type: "AC", route: "Kathmandu - Chitwan", status: "Active", capacity: 36 },
//     { id: "NP-BA-3456", type: "Standard", route: "Pokhara - Butwal", status: "Maintenance", capacity: 48 },
//   ],
//   recentPayments: [
//     { id: "SET-001", amount: "NPR 450,000", date: "2024-01-25", status: "Completed", period: "Jan Week 4" },
//     { id: "SET-002", amount: "NPR 380,000", date: "2024-01-18", status: "Completed", period: "Jan Week 3" },
//     { id: "SET-003", amount: "NPR 520,000", date: "2024-01-11", status: "Completed", period: "Jan Week 2" },
//   ],
// };
const ownerData = {
  id: "OWN-001",
  company: "Nepal Express Pvt. Ltd.",
  owner: "Hari Prasad",
  email: "hari@nepalexpress.com",
  phone: "+977-9841234567",
  address: "New Road, Kathmandu",
  type: "Private Limited",
  status: "Active",
  joined: "2022-03-15",
  panNumber: "987654321",
  registrationNumber: "REG-2022-12345",
  bankDetails: "Himalayan Bank - 9876543210",
  fleetSize: 12,
  activeRoutes: 8,
  monthlyRevenue: "NPR 2,450,000",
  totalRevenue: "NPR 28,500,000",
  buses: [
    { id: "NP-BA-1234", type: "Deluxe", route: "Kathmandu - Pokhara", status: "Active", capacity: 42 },
    { id: "NP-BA-2345", type: "AC", route: "Kathmandu - Chitwan", status: "Active", capacity: 36 },
    { id: "NP-BA-3456", type: "Standard", route: "Pokhara - Butwal", status: "Maintenance", capacity: 48 },
  ],
  recentPayments: [
    { id: "SET-001", amount: "NPR 450,000", date: "2024-01-25", status: "Completed", period: "Jan Week 4" },
    { id: "SET-002", amount: "NPR 380,000", date: "2024-01-18", status: "Completed", period: "Jan Week 3" },
    { id: "SET-003", amount: "NPR 520,000", date: "2024-01-11", status: "Completed", period: "Jan Week 2" },
  ],
};

const BusOwnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
   const [ownerStatus, setOwnerStatus] = useState(ownerData.status);
  const {onOpen} = useModal();
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bus-owners")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Bus Owner Details</h2>
          <p className="text-muted-foreground">Owner ID: {id || ownerData.id}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={()=>onOpen("editBusOwner")} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="bus owner"
            entityName={ownerData.company}
            currentStatus={ownerStatus}
            onStatusChange={setOwnerStatus}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Company Profile
              <Badge variant={ownerData.status === "Active" ? "default" : "destructive"}>
                {ownerData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{ownerData.company}</h3>
              <p className="text-sm text-muted-foreground">{ownerData.type}</p>
              <p className="text-sm text-muted-foreground mt-1">Owner: {ownerData.owner}</p>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{ownerData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{ownerData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{ownerData.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Since {ownerData.joined}</span>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">PAN:</span> {ownerData.panNumber}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Registration:</span> {ownerData.registrationNumber}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Bank:</span> {ownerData.bankDetails}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
            <CardDescription>Fleet and financial summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Bus className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold">{ownerData.fleetSize}</div>
                <div className="text-xs text-muted-foreground">Total Buses</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold">{ownerData.activeRoutes}</div>
                <div className="text-xs text-muted-foreground">Active Routes</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <CreditCard className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">{ownerData.monthlyRevenue}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <CreditCard className="h-5 w-5 mx-auto mb-1 text-success" />
                <div className="text-lg font-bold">{ownerData.totalRevenue}</div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </div>
            </div>

            <Tabs defaultValue="buses">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="buses">Fleet</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
              </TabsList>
              <TabsContent value="buses" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bus Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerData.buses.map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">{bus.id}</TableCell>
                        <TableCell>{bus.type}</TableCell>
                        <TableCell>{bus.route}</TableCell>
                        <TableCell>{bus.capacity} seats</TableCell>
                        <TableCell>
                          <Badge variant={bus.status === "Active" ? "default" : "secondary"}>
                            {bus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="settlements" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Settlement ID</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerData.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{payment.amount}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <Badge variant="default">{payment.status}</Badge>
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

export default BusOwnerDetail;
