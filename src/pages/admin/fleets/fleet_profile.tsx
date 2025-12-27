import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, MapPin, Calendar, Bus, Wrench, Wifi, Snowflake, Usb, Building } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useModal } from "@/hooks/use-model-store";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useState } from "react";

const busData = {
  id: "NP-BA-1234",
  type: "Deluxe",
  operator: "Nepal Express Pvt. Ltd.",
  operatorId: "OWN-001",
  route: "Kathmandu - Pokhara",
  status: "Active",
  gps: "Online",
  capacity: 42,
  occupancy: 85,
  manufacturingYear: 2022,
  chassisNumber: "CH-2022-123456",
  engineNumber: "EN-2022-789012",
  gpsDeviceId: "GPS-001234",
  insuranceExpiry: "2025-06-15",
  fitnessExpiry: "2024-12-31",
  lastService: "2024-01-10",
  nextService: "2024-04-10",
  amenities: ["AC", "WiFi", "USB Charging", "Reclining Seats", "Blankets"],
  recentTrips: [
    { id: "TRP-001", date: "2024-01-28", route: "Kathmandu - Pokhara", passengers: 38, revenue: "NPR 45,600", status: "Completed" },
    { id: "TRP-002", date: "2024-01-27", route: "Pokhara - Kathmandu", passengers: 42, revenue: "NPR 50,400", status: "Completed" },
    { id: "TRP-003", date: "2024-01-26", route: "Kathmandu - Pokhara", passengers: 35, revenue: "NPR 42,000", status: "Completed" },
  ],
  maintenanceHistory: [
    { id: "MNT-001", date: "2024-01-10", type: "Regular Service", cost: "NPR 15,000", description: "Oil change, brake check, tire rotation" },
    { id: "MNT-002", date: "2023-10-15", type: "Repair", cost: "NPR 25,000", description: "AC compressor replacement" },
    { id: "MNT-003", date: "2023-07-20", type: "Regular Service", cost: "NPR 12,000", description: "Full inspection and minor repairs" },
  ],
};

const BusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const amenityIcons: Record<string, React.ReactNode> = {
    "AC": <Snowflake className="h-4 w-4" />,
    "WiFi": <Wifi className="h-4 w-4" />,
    "USB Charging": <Usb className="h-4 w-4" />,
  };
  const {onOpen} = useModal();
    const [busStatus, setBusStatus] = useState(busData.status);

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/fleets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Bus Details</h2>
          <p className="text-muted-foreground">Bus Number: {id || busData.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>navigate(`/admin/fleets/tracking`)} className="gap-2">
            <MapPin className="h-4 w-4" />
            Track Live
          </Button>
          <Button onClick={()=>onOpen("editBus")} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <SuspendDialog
            entityType="bus"
            entityName={busData.id}
            currentStatus={busStatus}
            onStatusChange={setBusStatus}
          />
          <Button onClick={()=>navigate(`/admin/fleets/${id}/maintenance`)} variant="secondary" className="gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Vehicle Info
              <Badge variant={busData.status === "Active" ? "default" : "secondary"}>
                {busData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bus className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{busData.id}</h3>
              <p className="text-sm text-muted-foreground">{busData.type} Bus</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant={busData.gps === "Online" ? "default" : "destructive"}>
                  GPS {busData.gps}
                </Badge>
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{busData.operator}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{busData.route}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Year: {busData.manufacturingYear}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>Occupancy Rate</span>
                <span className="font-medium">{busData.occupancy}%</span>
              </div>
              <Progress value={busData.occupancy} className="h-2" />
            </div>
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span>{busData.capacity} seats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chassis:</span>
                <span>{busData.chassisNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine:</span>
                <span>{busData.engineNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPS ID:</span>
                <span>{busData.gpsDeviceId}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {busData.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline" className="gap-1">
                    {amenityIcons[amenity]}
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Operations & Maintenance</CardTitle>
            <CardDescription>Trip history and service records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold text-success">{busData.lastService}</div>
                <div className="text-xs text-muted-foreground">Last Service</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold">{busData.nextService}</div>
                <div className="text-xs text-muted-foreground">Next Service</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold">{busData.insuranceExpiry}</div>
                <div className="text-xs text-muted-foreground">Insurance Expiry</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold">{busData.fitnessExpiry}</div>
                <div className="text-xs text-muted-foreground">Fitness Expiry</div>
              </div>
            </div>

            <Tabs defaultValue="trips">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="trips">Recent Trips</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              </TabsList>
              <TabsContent value="trips" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busData.recentTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>{trip.date}</TableCell>
                        <TableCell>{trip.route}</TableCell>
                        <TableCell>{trip.passengers}</TableCell>
                        <TableCell>{trip.revenue}</TableCell>
                        <TableCell>
                          <Badge variant="default">{trip.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="maintenance" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busData.maintenanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === "Regular Service" ? "default" : "secondary"}>
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                        <TableCell>{record.cost}</TableCell>
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

export default BusDetail;
